import { useState, useRef, useCallback } from 'react';
import { Vector3 } from 'three';
import { Group } from 'three';

interface UsePyroclastProps {
  parentRef: React.RefObject<Group>;
  onHit: (targetId: string, damage: number) => void;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  setDamageNumbers: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isPyroclast?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isPyroclast?: boolean;
  }>) => void;
  nextDamageNumberId: { current: number };
}

const PYROCLAST_BASE_DAMAGE = 150;
const PYROCLAST_HIT_RADIUS = 1.5;

function calculatePyroclastDamage(power: number): { damage: number; isCritical: boolean } {
  const baseDamage = PYROCLAST_BASE_DAMAGE * (power * 4);
  const damage = Math.floor(baseDamage);
  const isCritical = power >= 0.99;
  return { damage, isCritical };
}

export function usePyroclast({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId
}: UsePyroclastProps) {
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const chargeStartTime = useRef<number | null>(null);
  const [activeMissiles, setActiveMissiles] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    power: number;
    hitEnemies?: Set<string>; // Track enemies that have been hit
  }>>([]);
  const nextMissileId = useRef(0);

  const startCharging = useCallback(() => {
    setIsCharging(true);
    chargeStartTime.current = Date.now();
  }, []);

  const releaseCharge = useCallback(() => {
    if (!parentRef.current || !chargeStartTime.current) return;

    const chargeTime = Math.min((Date.now() - chargeStartTime.current) / 1000, 4);
    const power = Math.max(chargeTime / 4, 0.25); // Minimum 25% power for 1 second charge

    const position = parentRef.current.position.clone();
    position.y += 1;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    setActiveMissiles(prev => [...prev, {
      id: nextMissileId.current++,
      position,
      direction,
      power,
      hitEnemies: new Set<string>() // Initialize empty set to track hit enemies
    }]);

    setIsCharging(false);
    setChargeProgress(0);
    chargeStartTime.current = null;
  }, [parentRef]);

  const handleMissileImpact = useCallback((missileId: number) => {
    setActiveMissiles(prev => prev.filter(missile => missile.id !== missileId));
  }, []);

  const checkMissileCollisions = useCallback((missileId: number, currentPosition: Vector3) => {
    // Find the missile in our active missiles array
    setActiveMissiles(prev => {
      const missileIndex = prev.findIndex(m => m.id === missileId);
      if (missileIndex === -1) return prev; // Missile not found
      
      const missile = prev[missileIndex];
      
      // Update missile position
      const updatedMissile = {
        ...missile,
        position: currentPosition.clone()
      };
      
      // Check for collisions with enemies
      let hasCollided = false;
      
      for (const enemy of enemyData) {
        if (enemy.health <= 0) continue; // Skip dead enemies
        
        // Skip enemies we've already hit with this missile
        if (missile.hitEnemies?.has(enemy.id)) continue;
        
        const distance = currentPosition.distanceTo(enemy.position);
        if (distance < PYROCLAST_HIT_RADIUS) {
          // Calculate damage
          const { damage, isCritical } = calculatePyroclastDamage(missile.power);
          
          // Apply damage
          onHit(enemy.id, damage);
          
          // Show damage number
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: enemy.position.clone(),
            isCritical,
            isPyroclast: true
          }]);
          
          // Mark this enemy as hit
          updatedMissile.hitEnemies?.add(enemy.id);
          
          // Flag that we've had a collision
          hasCollided = true;
          
          // Don't break here - allow the missile to potentially hit multiple enemies
        }
      }
      
      // If we had a collision, remove the missile after processing all potential hits
      if (hasCollided) {
        // Remove this missile from the array
        return prev.filter(m => m.id !== missileId);
      }
      
      // Otherwise update the missile position and return the updated array
      const newMissiles = [...prev];
      newMissiles[missileIndex] = updatedMissile;
      return newMissiles;
    });
  }, [enemyData, onHit, setDamageNumbers, nextDamageNumberId]);

  return {
    isCharging,
    chargeProgress,
    activeMissiles,
    startCharging,
    releaseCharge,
    handleMissileImpact,
    checkMissileCollisions,
    setChargeProgress,
    chargeStartTime
  };
}