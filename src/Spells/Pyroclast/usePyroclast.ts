import { useState, useRef, useCallback, useEffect } from 'react';
import { Vector3 } from 'three';
import { Group } from 'three';
import { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';
import { ReigniteRef } from '../Reignite/Reignite';

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
  onImpact?: (missileId: number, impactPosition?: Vector3) => void;
  charges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;
  reigniteRef?: React.RefObject<ReigniteRef>;
}

const PYROCLAST_DAMAGE_PER_SECOND = 277;
const PYROCLAST_MAX_CHARGE_TIME = 4;
const PYROCLAST_HIT_RADIUS = 3.25;
const CHARGE_CONSUME_INTERVAL = 500;

function calculatePyroclastDamage(chargeTimeSeconds: number): { damage: number; isCritical: boolean } {
  // Clamp charge time between 0.5 and MAX_CHARGE_TIME seconds
  const clampedChargeTime = Math.max(0.5, Math.min(PYROCLAST_MAX_CHARGE_TIME, chargeTimeSeconds));
  
  // Calculate damage linearly: 277 damage per second
  const damage = Math.floor(clampedChargeTime * PYROCLAST_DAMAGE_PER_SECOND);
  
  // Critical if fully charged (4 seconds)
  const isCritical = clampedChargeTime >= PYROCLAST_MAX_CHARGE_TIME;
  
  console.log('Pyroclast damage calculation:', { chargeTimeSeconds, damage, isCritical });
  
  return { damage, isCritical };
}

export function usePyroclast({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  onImpact,
  charges,
  setCharges,
  reigniteRef
}: UsePyroclastProps) {
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const chargeStartTime = useRef<number | null>(null);
  const [activeMissiles, setActiveMissiles] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    chargeTime: number; // Changed from power to chargeTime
    hitEnemies?: Set<string>; // Track enemies that have been hit
  }>>([]);
  const nextMissileId = useRef(0);
  const lastChargeConsumeTime = useRef<number>(0);

  // Add health tracker for kill detection
  const enemyHealthTracker = useRef<Record<string, number>>({});
  
  // Update health tracker when enemy data changes
  useEffect(() => {
    if (enemyData) {
      enemyData.forEach(enemy => {
        if (!(enemy.id in enemyHealthTracker.current)) {
          enemyHealthTracker.current[enemy.id] = enemy.health;
        }
      });
    }
  }, [enemyData]);

  const startCharging = useCallback(() => {
    setIsCharging(true);
    chargeStartTime.current = Date.now();
  }, []);

  const releaseCharge = useCallback(() => {
    if (!parentRef.current || !chargeStartTime.current) return;

    const chargeTime = (Date.now() - chargeStartTime.current) / 1000;
    
    // Only fire if charged for at least 0.5 seconds
    if (chargeTime < 0.05) {
      setIsCharging(false);
      setChargeProgress(0);
      chargeStartTime.current = null;
      return;
    }

    const position = parentRef.current.position.clone();
    position.y += 1;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    setActiveMissiles(prev => [...prev, {
      id: nextMissileId.current++,
      position,
      direction,
      chargeTime, // Store the actual charge time in seconds
      hitEnemies: new Set<string>() // Initialize empty set to track hit enemies
    }]);

    setIsCharging(false);
    setChargeProgress(0);
    chargeStartTime.current = null;
  }, [parentRef]);

  const handleMissileImpact = useCallback((missileId: number, impactPosition?: Vector3) => {
    if (onImpact) {
      onImpact(missileId, impactPosition);
    }
    setActiveMissiles(prev => prev.filter(missile => missile.id !== missileId));
  }, [onImpact]);

  const checkMissileCollisions = useCallback((missileId: number, currentPosition: Vector3, previousPosition?: Vector3): boolean => {
    let collisionOccurred = false;
    const missile = activeMissiles.find(m => m.id === missileId);

    if (!missile) return false;

    for (const enemy of enemyData) {
      if (enemy.health <= 0 || missile.hitEnemies?.has(enemy.id)) continue;

      // Check current position
      const distance = currentPosition.distanceTo(enemy.position);
      if (distance < PYROCLAST_HIT_RADIUS) {
        const { damage, isCritical } = calculatePyroclastDamage(missile.chargeTime);
        
        // Store previous health before applying damage
        const previousHealth = enemyHealthTracker.current[enemy.id] || enemy.health;
        
        // Apply damage
        onHit(enemy.id, damage);
        
        // Check if the enemy was killed by this hit
        if (previousHealth > 0 && enemy.health <= 0) {
          // Enemy was killed by Pyroclast, trigger Reignite
          if (reigniteRef?.current) {
            reigniteRef.current.processKill();
          }
        }
        
        // Update tracked health
        enemyHealthTracker.current[enemy.id] = enemy.health;
        
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: enemy.position.clone(),
          isCritical,
          isPyroclast: true
        }]);
        missile.hitEnemies?.add(enemy.id);
        collisionOccurred = true;
        console.log(`Pyroclast hit enemy ${enemy.id} for ${damage} damage (charge time: ${missile.chargeTime}s)`);
        break;
      }

      // If we have a previous position, also check points along the path
      if (previousPosition) {
        const direction = currentPosition.clone().sub(previousPosition);
        const length = direction.length();
        const steps = Math.ceil(length / (PYROCLAST_HIT_RADIUS * 0.5));
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const interpolatedPosition = previousPosition.clone().lerp(currentPosition, t);
          const interpolatedDistance = interpolatedPosition.distanceTo(enemy.position);
          
          if (interpolatedDistance < PYROCLAST_HIT_RADIUS) {
            const { damage, isCritical } = calculatePyroclastDamage(missile.chargeTime);
            
            // Store previous health before applying damage
            const previousHealth = enemyHealthTracker.current[enemy.id] || enemy.health;
            
            // Apply damage
            onHit(enemy.id, damage);
            
            // Check if the enemy was killed by this hit
            if (previousHealth > 0 && enemy.health <= 0) {
              // Enemy was killed by Pyroclast, trigger Reignite
              if (reigniteRef?.current) {
                reigniteRef.current.processKill();
              }
            }
            
            // Update tracked health
            enemyHealthTracker.current[enemy.id] = enemy.health;
            
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage,
              position: enemy.position.clone(),
              isCritical,
              isPyroclast: true
            }]);
            missile.hitEnemies?.add(enemy.id);
            collisionOccurred = true;
            console.log(`Pyroclast hit enemy ${enemy.id} for ${damage} damage (charge time: ${missile.chargeTime}s)`);
            break;
          }
        }
      }
    }

    return collisionOccurred;
  }, [activeMissiles, enemyData, onHit, setDamageNumbers, nextDamageNumberId, reigniteRef]);

  const consumeCharge = useCallback(() => {
    const now = Date.now();
    if (now - lastChargeConsumeTime.current < CHARGE_CONSUME_INTERVAL) {
      return false;
    }

    const availableChargeIndex = charges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) {
      // Force release and reset charging state
      releaseCharge();
      setIsCharging(false);
      setChargeProgress(0);
      chargeStartTime.current = null;
      return false;
    }

    lastChargeConsumeTime.current = now;

    setCharges(prev => {
      const newCharges = [...prev];
      newCharges[availableChargeIndex] = {
        ...newCharges[availableChargeIndex],
        available: false,
        cooldownStartTime: now
      };
      return newCharges;
    });

    setTimeout(() => {
      setCharges(prev => {
        const newCharges = [...prev];
        newCharges[availableChargeIndex] = {
          ...newCharges[availableChargeIndex],
          available: true,
          cooldownStartTime: null
        };
        return newCharges;
      });
    }, ORBITAL_COOLDOWN);

    return true;
  }, [charges, setCharges, releaseCharge]);

  useEffect(() => {
    if (isCharging) {
      const hasAvailableCharges = charges.some(charge => charge.available);
      if (!hasAvailableCharges) {
        // Force release if no charges available
        releaseCharge();
        setIsCharging(false);
        setChargeProgress(0);
        chargeStartTime.current = null;
      }
    }
  }, [isCharging, charges, releaseCharge]);

  useEffect(() => {
    if (isCharging) {
      // Check if we have any charges available
      const hasAvailableCharges = charges.some(charge => charge.available);
      if (!hasAvailableCharges) {
        releaseCharge();
        return;
      }

      // Consume first charge immediately
      consumeCharge();
      
      // Set up interval for subsequent charges
      const interval = setInterval(consumeCharge, CHARGE_CONSUME_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isCharging, consumeCharge, charges, releaseCharge]);

  return {
    isCharging,
    chargeProgress,
    activeMissiles,
    startCharging,
    releaseCharge,
    handleMissileImpact,
    checkMissileCollisions,
    setChargeProgress,
    chargeStartTime,
    charges,
    setCharges
  };
}