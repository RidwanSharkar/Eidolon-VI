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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkForSpearKillAndProcessReignite?: (
    targetId: string, 
    damageFn: (id: string, damage: number) => void, 
    damage: number,
    bypassWeaponCheck: boolean
  ) => void;
}

const PYROCLAST_DAMAGE_PER_SECOND = 334;
const PYROCLAST_MAX_CHARGE_TIME = 4;
const PYROCLAST_HIT_RADIUS = 4;
const CHARGE_CONSUME_INTERVAL = 500;

function calculatePyroclastDamage(chargeTimeSeconds: number): { damage: number; isCritical: boolean } {
  // Clamp charge time between 0.5 and MAX_CHARGE_TIME seconds
  const clampedChargeTime = Math.max(0.5, Math.min(PYROCLAST_MAX_CHARGE_TIME, chargeTimeSeconds));
  
  // Calculate base damage linearly
  let damage = Math.floor(clampedChargeTime * PYROCLAST_DAMAGE_PER_SECOND);
  
  // 11% chance to critical hit
  const isCritical = Math.random() < 0.11;
  
  // Double damage on critical hits
  if (isCritical) {
    damage *= 2;
  }
  
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
  reigniteRef,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkForSpearKillAndProcessReignite
}: UsePyroclastProps) {
  // Add debug log to check if reigniteRef is properly passed
  console.log('[usePyroclast] Initializing with reigniteRef:', reigniteRef);
  
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
  // Add a lastToggleTime to prevent rapid toggling
  const lastToggleTime = useRef<number>(0);
  const TOGGLE_DEBOUNCE_TIME = 150; // 150ms debounce for toggling charge state

  // Add health tracker for kill detection
  const enemyHealthTracker = useRef<Record<string, number>>({});
  
  // Update health tracker when enemy data changes
  useEffect(() => {
    if (enemyData) {
      // Update our health tracker with the current enemy health values
      enemyData.forEach(enemy => {
        enemyHealthTracker.current[enemy.id] = enemy.health;
      });
    }
  }, [enemyData]);

  const startCharging = useCallback(() => {
    const now = Date.now();
    // Prevent toggling too rapidly
    if (now - lastToggleTime.current < TOGGLE_DEBOUNCE_TIME) {
      return;
    }
    
    lastToggleTime.current = now;
    setIsCharging(true);
    chargeStartTime.current = now;
  }, []);

  const releaseCharge = useCallback(() => {
    if (!parentRef.current || !chargeStartTime.current) return;

    const now = Date.now();
    // Prevent toggling too rapidly
    if (now - lastToggleTime.current < TOGGLE_DEBOUNCE_TIME) {
      return;
    }
    lastToggleTime.current = now;

    const chargeTime = (now - chargeStartTime.current) / 1000;
    
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

  // Optimize the checkMissileCollisions callback to handle multiple hits better
  const checkMissileCollisions = useCallback((missileId: number, currentPosition: Vector3, previousPosition?: Vector3): boolean => {
    let collisionOccurred = false;
    const missile = activeMissiles.find(m => m.id === missileId);

    if (!missile) {
      console.log(`[Pyroclast] Missile ${missileId} not found for collision check`);
      return false;
    }

    console.log(`[Pyroclast] Checking collisions for missile ${missileId} at position ${currentPosition.x.toFixed(2)}, ${currentPosition.y.toFixed(2)}, ${currentPosition.z.toFixed(2)}`);

    // Initialize hitEnemies if it doesn't exist
    if (!missile.hitEnemies) {
      missile.hitEnemies = new Set<string>();
    }

    // Track if we hit any enemies with this collision check
    let anyHits = false;

    // Check all enemies for collisions
    for (const enemy of enemyData) {
      // Skip dead enemies or enemies we've already hit with this missile
      if (enemy.health <= 0 || missile.hitEnemies.has(enemy.id)) {
        // Debug log for skipped enemies (reduce noise by only logging once per enemy)
        if (enemy.health <= 0 && !missile.hitEnemies.has(enemy.id)) {
          console.log(`[Pyroclast] Skipping dead enemy ${enemy.id} with health ${enemy.health}`);
          // Add to hitEnemies to avoid logging again
          missile.hitEnemies.add(enemy.id);
        }
        continue;
      }

      // Check current position
      const distance = currentPosition.distanceTo(enemy.position);
      
      // If within hit radius, process the hit
      if (distance < PYROCLAST_HIT_RADIUS) {
        console.log(`[Pyroclast] Hit detected! Enemy ${enemy.id} at distance ${distance.toFixed(2)}, health before: ${enemy.health}`);
        
        // Calculate damage based on charge time
        const { damage, isCritical } = calculatePyroclastDamage(missile.chargeTime);
        console.log(`[Pyroclast] Calculated damage for enemy ${enemy.id}: ${damage} (critical: ${isCritical}), charge time: ${missile.chargeTime.toFixed(2)}s`);
        
        // Store enemy position and health before damage
        const enemyPosition = enemy.position.clone();
        const previousHealth = enemy.health;
        
        // Apply damage directly
        onHit(enemy.id, damage);
        
        // Check if enemy was killed by this hit
        if (previousHealth > 0 && enemy.health <= 0) {
          console.log(`[Pyroclast] Enemy ${enemy.id} was killed! Calling Reignite`);
          
          // Directly call Reignite like Breach does
          if (reigniteRef && reigniteRef.current) {
            console.log(`[Pyroclast] Triggering Reignite effect at position:`, enemyPosition);
            reigniteRef.current.processKill(enemyPosition);
          }
        }
        
        // Create damage number for visual feedback
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: enemyPosition,
          isCritical,
          isPyroclast: true
        }]);
        
        anyHits = true;
        collisionOccurred = true;
        
        console.log(`[Pyroclast] Processed hit on enemy ${enemy.id} for ${damage} damage`);
      }
      // Also check points along the path if we have a previous position
      else if (previousPosition) {
        const direction = currentPosition.clone().sub(previousPosition);
        const length = direction.length();
        
        // Skip interpolation check if the movement is too small
        if (length < 0.1) continue;
        
        const steps = Math.ceil(length / (PYROCLAST_HIT_RADIUS * 0.5));
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const interpolatedPosition = previousPosition.clone().lerp(currentPosition, t);
          const interpolatedDistance = interpolatedPosition.distanceTo(enemy.position);
          
          if (interpolatedDistance < PYROCLAST_HIT_RADIUS) {
            console.log(`[Pyroclast] Interpolated hit detected! Enemy ${enemy.id} at distance ${interpolatedDistance.toFixed(2)}`);
            
            const { damage, isCritical } = calculatePyroclastDamage(missile.chargeTime);
            
            // Store enemy position and health before damage
            const enemyPosition = enemy.position.clone();
            const previousHealth = enemy.health;
            
            // Apply damage directly
            onHit(enemy.id, damage);
            
            // Check if enemy was killed by this hit
            if (previousHealth > 0 && enemy.health <= 0) {
              console.log(`[Pyroclast] Enemy ${enemy.id} was killed! Calling Reignite`);
              
              // Directly call Reignite like Breach does
              if (reigniteRef && reigniteRef.current) {
                console.log(`[Pyroclast] Triggering Reignite effect at position:`, enemyPosition);
                reigniteRef.current.processKill(enemyPosition);
              }
            }
            
            // Create damage number
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage,
              position: enemyPosition,
              isCritical,
              isPyroclast: true
            }]);
            
            anyHits = true;
            collisionOccurred = true;
            
            console.log(`[Pyroclast] Processed interpolated hit on enemy ${enemy.id} for ${damage} damage`);
            break; // Found hit for this enemy, move to next enemy
          }
        }
      }
    }

    if (anyHits) {
      console.log(`[Pyroclast] Missile ${missileId} hit one or more enemies`);
    }

    return collisionOccurred;
  }, [reigniteRef,activeMissiles, enemyData, setDamageNumbers, nextDamageNumberId, onHit]);

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