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
  isIncinerateEmpowered?: boolean; // Whether we have 25 Incinerate stacks
  onIncinerateEmpowermentUsed?: () => void; // Callback when empowerment is consumed
}

const PYROCLAST_DAMAGE_PER_SECOND = 257;
const PYROCLAST_MAX_CHARGE_TIME = 4;
const PYROCLAST_HIT_RADIUS = 3.75;
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
  checkForSpearKillAndProcessReignite,
  isIncinerateEmpowered = false,
  onIncinerateEmpowermentUsed
}: UsePyroclastProps) {
  // Add debug log to check if reigniteRef is properly passed
  
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

  // Function to fire an empowered Pyroclast instantly at max damage
  const fireEmpoweredPyroclast = useCallback(() => {
    if (!parentRef.current) return;

    const position = parentRef.current.position.clone();
    position.y += 1;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    // Fire at maximum charge time for maximum damage, no orb cost
    setActiveMissiles(prev => [...prev, {
      id: nextMissileId.current++,
      position,
      direction,
      chargeTime: PYROCLAST_MAX_CHARGE_TIME, // Max damage
      hitEnemies: new Set<string>()
    }]);

    // Consume the empowerment
    if (onIncinerateEmpowermentUsed) {
      onIncinerateEmpowermentUsed();
    }
  }, [parentRef, onIncinerateEmpowermentUsed]);

  const startCharging = useCallback(() => {
    // If we have Incinerate empowerment, fire instantly at max damage
    if (isIncinerateEmpowered) {
      fireEmpoweredPyroclast();
      return;
    }

    const now = Date.now();
    // Prevent toggling too rapidly
    if (now - lastToggleTime.current < TOGGLE_DEBOUNCE_TIME) {
      return;
    }
    
    lastToggleTime.current = now;
    setIsCharging(true);
    chargeStartTime.current = now;
  }, [isIncinerateEmpowered, fireEmpoweredPyroclast]);

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
      return false;
    }


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
          // Add to hitEnemies to avoid logging again
          missile.hitEnemies.add(enemy.id);
        }
        continue;
      }

      // Check current position
      const distance = currentPosition.distanceTo(enemy.position);
      
      // If within hit radius, process the hit
      if (distance < PYROCLAST_HIT_RADIUS) {
        
        // Calculate damage based on charge time
        const { damage, isCritical } = calculatePyroclastDamage(missile.chargeTime);
        
        // Store enemy position and health before damage
        const enemyPosition = enemy.position.clone();
        const previousHealth = enemy.health;
        
        // Use the checkForSpearKillAndProcessReignite function to handle damage and kill detection
        if (checkForSpearKillAndProcessReignite) {
          checkForSpearKillAndProcessReignite(
            enemy.id,
            onHit,
            damage,
            true // bypass weapon check since we're in Pyroclast already
          );
        }
        // Fallback: apply damage directly and check for kill
        else {
          onHit(enemy.id, damage);
          
          // Check if enemy was killed using the same logic as Whirlwind
          if (previousHealth > 0 && previousHealth - damage <= 0 && reigniteRef && reigniteRef.current) {
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
            
            const { damage, isCritical } = calculatePyroclastDamage(missile.chargeTime);
            
            // Store enemy position and health before damage
            const enemyPosition = enemy.position.clone();
            const previousHealth = enemy.health;
            
            // Use the checkForSpearKillAndProcessReignite function to handle damage and kill detection
            if (checkForSpearKillAndProcessReignite) {
              checkForSpearKillAndProcessReignite(
                enemy.id,
                onHit,
                damage,
                true // bypass weapon check since we're in Pyroclast already
              );
            }
            // Fallback: apply damage directly and check for kill
            else {
              onHit(enemy.id, damage);
              
              // Check if enemy was killed using the same logic as Whirlwind
              if (previousHealth > 0 && previousHealth - damage <= 0 && reigniteRef && reigniteRef.current) {
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
            
            break; // Found hit for this enemy, move to next enemy
          }
        }
      }
    }

    if (anyHits) {
    }

    return collisionOccurred;
  }, [reigniteRef, activeMissiles, enemyData, setDamageNumbers, nextDamageNumberId, onHit, checkForSpearKillAndProcessReignite]);

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