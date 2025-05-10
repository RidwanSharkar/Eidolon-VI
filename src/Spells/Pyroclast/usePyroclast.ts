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
  checkForSpearKillAndProcessReignite?: (targetId: string, damage: number) => void;
}

const PYROCLAST_DAMAGE_PER_SECOND = 277;
const PYROCLAST_MAX_CHARGE_TIME = 4;
const PYROCLAST_HIT_RADIUS = 3.25;
const CHARGE_CONSUME_INTERVAL = 600;

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
  reigniteRef,
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

  // Create a custom damage function that checks for kills and processes Reignite
  const handleDamageWithKillCheck = useCallback((targetId: string, damage: number) => {
    // Get the target and store its health before damage
    const target = enemyData.find(e => e.id === targetId);
    if (!target) {
      console.log(`[Pyroclast] Target ${targetId} not found for damage check`);
      onHit(targetId, damage);
      return;
    }
    
    const previousHealth = target.health;
    console.log(`[Pyroclast] Processing damage for enemy ${targetId}, health before: ${previousHealth}, damage: ${damage}`);
    
    // Store the position BEFORE applying damage (in case the enemy gets removed)
    const enemyPosition = target.position.clone();
    console.log(`[Pyroclast] Stored enemy position:`, {
      x: enemyPosition.x.toFixed(3),
      y: enemyPosition.y.toFixed(3),
      z: enemyPosition.z.toFixed(3)
    });
    
    // Apply the damage
    onHit(targetId, damage);
    
    // Find the enemy again to get its updated health
    const updatedEnemy = enemyData.find(e => e.id === targetId);
    
    // If the enemy isn't found (removed) or its health is now ≤ 0, it was killed
    if (!updatedEnemy || updatedEnemy.health <= 0) {
      if (previousHealth > 0) {
        console.log(`[Pyroclast] Enemy ${targetId} was killed! Processing Reignite...`);
        
        // Trigger Reignite effect if reigniteRef is available
        if (reigniteRef && reigniteRef.current) {
          console.log(`[Pyroclast] Calling reigniteRef.processKill with position:`, {
            x: enemyPosition.x.toFixed(3),
            y: enemyPosition.y.toFixed(3),
            z: enemyPosition.z.toFixed(3)
          });
          
          // CHANGE: Direct call instead of setTimeout
          if (reigniteRef.current) {
            console.log(`[Pyroclast] Executing processKill call directly`);
            reigniteRef.current.processKill(enemyPosition);
          }
        } else {
          console.warn(`[Pyroclast] Cannot trigger Reignite: reigniteRef is ${reigniteRef ? 'defined but current is null' : 'undefined'}`);
        }
      }
    }
  }, [enemyData, onHit, reigniteRef]);

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
        
        // Store enemy position before marking as hit
        const enemyPosition = enemy.position.clone();
        console.log(`[Pyroclast] Stored enemy position before hit:`, {
          x: enemyPosition.x.toFixed(3),
          y: enemyPosition.y.toFixed(3),
          z: enemyPosition.z.toFixed(3)
        });
        
        // Mark this enemy as hit before applying damage to prevent potential double-hits
        missile.hitEnemies.add(enemy.id);
        
        // Apply damage using the appropriate function
        if (checkForSpearKillAndProcessReignite) {
          // Use the centralized function that handles kills and Reignite
          console.log(`[Pyroclast] Using checkForSpearKillAndProcessReignite for enemy ${enemy.id}`);
          checkForSpearKillAndProcessReignite(enemy.id, damage);
          
          // Also directly call processKill if the enemy died (as a fallback)
          const updatedEnemy = enemyData.find(e => e.id === enemy.id);
          if ((!updatedEnemy || updatedEnemy.health <= 0) && enemy.health > 0 && reigniteRef?.current) {
            console.log(`[Pyroclast] DIRECT FALLBACK: Enemy ${enemy.id} was killed, calling reigniteRef.processKill directly`);
            reigniteRef.current.processKill(enemyPosition);
          }
        } else {
          // Fallback to our custom function
          handleDamageWithKillCheck(enemy.id, damage);
        }
        
        // Create damage number for visual feedback
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: enemyPosition, // Use stored position
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
            
            // Store enemy position before marking as hit
            const enemyPosition = enemy.position.clone();
            
            // Mark as hit before applying damage
            missile.hitEnemies.add(enemy.id);
            
            // Apply damage using the appropriate function
            if (checkForSpearKillAndProcessReignite) {
              // Use the centralized function that handles kills and Reignite
              console.log(`[Pyroclast] Using checkForSpearKillAndProcessReignite for enemy ${enemy.id}`);
              checkForSpearKillAndProcessReignite(enemy.id, damage);
              
              // Also directly call processKill if the enemy died (as a fallback)
              const updatedEnemy = enemyData.find(e => e.id === enemy.id);
              if ((!updatedEnemy || updatedEnemy.health <= 0) && enemy.health > 0 && reigniteRef?.current) {
                console.log(`[Pyroclast] DIRECT FALLBACK: Enemy ${enemy.id} was killed, calling reigniteRef.processKill directly`);
                reigniteRef.current.processKill(enemyPosition);
              }
            } else {
              // Fallback to our custom function
              handleDamageWithKillCheck(enemy.id, damage);
            }
            
            // Create damage number
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage,
              position: enemyPosition, // Use stored position
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
  }, [reigniteRef,activeMissiles, enemyData, handleDamageWithKillCheck, setDamageNumbers, nextDamageNumberId, checkForSpearKillAndProcessReignite]);

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