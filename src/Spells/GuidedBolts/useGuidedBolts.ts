import { useCallback, useRef, useState } from 'react';
import { Vector3, Group } from 'three';
import { ChargeStatus } from '../../color/ChargedOrbitals';

interface GuidedBoltMissile {
  id: number;
  position: Vector3;
  targetId: string;
  startTime: number;
  damage: number;
  hasCollided: boolean;
  direction: Vector3;
  initialDirection: Vector3;
  homingStartTime: number;
}

interface DamageNumber {
  id: number;
  damage: number;
  position: Vector3;
  isCritical: boolean;
  isGuidedBolt?: boolean;
}

interface UseGuidedBoltsProps {
  parentRef: React.RefObject<Group>;
  charges: ChargeStatus[];
  setCharges: React.Dispatch<React.SetStateAction<ChargeStatus[]>>;
  onHit: (targetId: string, damage: number) => void;
  enemyData: Array<{ id: string; position: Vector3; health: number }>;
  setDamageNumbers: React.Dispatch<React.SetStateAction<DamageNumber[]>>;
  nextDamageNumberId: React.MutableRefObject<number>;
}

const MISSILE_SPEED = 6;
const MISSILE_DAMAGE = 120;
const CRIT_CHANCE = 0.2;

// Mapping of orb count to missile count (updated to match new design)
const ORB_TO_MISSILE_MAP: Record<number, number> = {
  6: 10,
  5: 8,
  4: 7,
  3: 6,
  2: 5,
  1: 3
};

export function useGuidedBolts({
  parentRef,
  charges,
  setCharges,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId
}: UseGuidedBoltsProps) {
  const [activeMissiles, setActiveMissiles] = useState<GuidedBoltMissile[]>([]);
  const nextMissileId = useRef(1);

  const calculateDamage = useCallback((baseDamage: number) => {
    const isCritical = Math.random() < CRIT_CHANCE;
    const damage = isCritical ? Math.floor(baseDamage * 1.8) : baseDamage;
    return { damage, isCritical };
  }, []);

  const castGuidedBolts = useCallback((targetId: string) => {
    if (!parentRef.current) return false;

    // Validate that we have a valid target (must exist and be alive)
    const target = enemyData.find(enemy => enemy.id === targetId && enemy.health > 0);
    if (!target) return false;

    // Count available charges
    const availableCharges = charges.filter(charge => charge.available).length;
    if (availableCharges === 0) return false;

    // Get missile count based on available charges
    const missileCount = ORB_TO_MISSILE_MAP[availableCharges] || 2;

    // Consume ALL available charges
    setCharges(prev => prev.map(charge => 
      charge.available 
        ? { ...charge, available: false, cooldownStartTime: Date.now() }
        : charge
    ));

    // Create missiles with staggered timing
    for (let i = 0; i < missileCount; i++) {
      setTimeout(() => {
        // Get fresh unit position for each missile when it's actually fired
        if (!parentRef.current) return;
        const unitPosition = parentRef.current.position.clone();
        unitPosition.y += 1;
        
        // Calculate initial direction towards target with slight randomization
        const targetCenter = target.position.clone().add(new Vector3(0, 1, 0));
        const baseDirection = targetCenter.clone().sub(unitPosition).normalize();
        
        // Add slight random spread to make missiles look more natural
        const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.3; // 30 degree spread
        const spreadPitch = (Math.random() - 0.5) * Math.PI * 0.2; // 20 degree pitch spread
        
        const initialDirection = baseDirection.clone();
        // Apply small random rotation to base direction
        initialDirection.x += Math.sin(spreadAngle) * 0.7;
        initialDirection.y += Math.sin(spreadPitch) * 0.7;
        initialDirection.normalize();

        const newMissile: GuidedBoltMissile = {
          id: nextMissileId.current++,
          position: unitPosition.clone(),
          targetId,
          startTime: Date.now(),
          damage: MISSILE_DAMAGE,
          hasCollided: false,
          direction: initialDirection.clone(),
          initialDirection: initialDirection.clone(),
          homingStartTime: Date.now() + 200 // Start homing after 0.2 seconds
        };

        setActiveMissiles(prev => [...prev, newMissile]);
      }, i * 166); // 0.2 second delay between missiles
    }

    return true;
  }, [enemyData,parentRef, charges, setCharges]);

  const updateMissiles = useCallback(() => {
    const currentTime = Date.now();

    setActiveMissiles(prev => {
      const updatedMissiles = prev.map(missile => {
        if (missile.hasCollided) return missile;

        // Find target
        const target = enemyData.find(enemy => enemy.id === missile.targetId && enemy.health > 0);
        if (!target) {
          // Target is dead or missing, mark missile for removal
          return { ...missile, hasCollided: true };
        }

        const deltaTime = (currentTime - missile.startTime) / 1000;
        
        // Remove missiles that have been flying too long (8 seconds max)
        if (deltaTime > 5.0) {
          return { ...missile, hasCollided: true };
        }
        
        // Improved target position - aim for center mass (higher up)
        const targetCenter = target.position.clone().add(new Vector3(0, 1, 0));
        
        let currentDirection = missile.direction.clone();
        
        // Implement homing behavior after delay
        if (currentTime >= missile.homingStartTime) {
          const directionToTarget = targetCenter.clone().sub(missile.position).normalize();
          
          // Stronger homing with distance-based adjustment
          const distanceToTarget = missile.position.distanceTo(targetCenter);
          const homingStrength = Math.min(0.25, 0.15 + (1.0 / Math.max(distanceToTarget, 1.0)) * 0.1);
          
          currentDirection = currentDirection.lerp(directionToTarget, homingStrength).normalize();
        }
        
        // Apply velocity
        const velocity = currentDirection.clone().multiplyScalar(MISSILE_SPEED * deltaTime);
        const newPosition = missile.position.clone().add(velocity);

        // Check for collision with improved detection
        const distanceToTarget = newPosition.distanceTo(targetCenter);
        if (distanceToTarget < 1.2) {
          // Hit the target
          const { damage, isCritical } = calculateDamage(missile.damage);
          
          // Ensure we're hitting the correct target ID format
          const hitTargetId = missile.targetId.startsWith('enemy-') ? missile.targetId : `enemy-${missile.targetId}`;
          
          console.log(`[GuidedBolts] Missile ${missile.id} hit target ${hitTargetId} for ${damage} damage (critical: ${isCritical})`);
          
          onHit(hitTargetId, damage);
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: targetCenter.clone().add(new Vector3(
              (Math.random() - 0.5) * 0.5,
              Math.random() * 0.5,
              (Math.random() - 0.5) * 0.5
            )),
            isCritical,
            isGuidedBolt: true
          }]);

          return { ...missile, hasCollided: true };
        }

        return { 
          ...missile, 
          position: newPosition,
          direction: currentDirection
        };
      });

      // Remove collided missiles
      return updatedMissiles.filter(missile => !missile.hasCollided);
    });
  }, [enemyData, onHit, setDamageNumbers, nextDamageNumberId, calculateDamage]);

  const getActiveMissiles = useCallback(() => activeMissiles, [activeMissiles]);

  const cleanup = useCallback(() => {
    setActiveMissiles([]);
  }, []);

  return {
    castGuidedBolts,
    updateMissiles,
    getActiveMissiles,
    cleanup
  };
} 