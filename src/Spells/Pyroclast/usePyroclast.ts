import { useState, useRef, useCallback, useEffect } from 'react';
import { Vector3 } from 'three';
import { Group } from 'three';
import { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';
import { ReigniteRef } from '../Reignite/Reignite';
import { calculateDamage } from '@/Weapons/damage';

// BOUNDED CACHE for missile hit tracking - prevents memory leaks from accumulating hit data
class MissileHitCache {
  private cache = new Map<string, number>(); // missileId_enemyId -> timestamp
  private maxSize = 2000; // Maximum entries before cleanup
  private cleanupThreshold = 500; // Cleanup when we hit this many entries

  add(missileId: number, enemyId: string): void {
    const key = `${missileId}_${enemyId}`;
    const now = Date.now();
    this.cache.set(key, now);

    // Trigger cleanup if we exceed threshold
    if (this.cache.size > this.cleanupThreshold) {
      this.cleanup();
    }
  }

  has(missileId: number, enemyId: string): boolean {
    const key = `${missileId}_${enemyId}`;
    return this.cache.has(key);
  }

  // Remove entries older than 10 seconds to prevent indefinite accumulation
  cleanup(): void {
    const cutoff = Date.now() - 10000; // 10 seconds ago
    for (const [key, timestamp] of this.cache) {
      if (timestamp < cutoff) {
        this.cache.delete(key);
      }
    }

    // If still too large, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const sorted = Array.from(this.cache.entries()).sort((a, b) => a[1] - b[1]);
      const toRemove = sorted.slice(0, this.cache.size - this.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Clean up all entries for a specific missile
  cleanupMissile(missileId: number): void {
    const prefix = `${missileId}_`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

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
  level?: number; // Player level for damage scaling
}

// Level-based Pyroclast damage per second
const PYROCLAST_DAMAGE_BY_LEVEL: Record<number, number> = {
  1: 257,
  2: 281,
  3: 300,
  4: 314,
  5: 357,
};

function getPyroclastDamagePerSecond(level: number = 1): number {
  return PYROCLAST_DAMAGE_BY_LEVEL[Math.min(Math.max(level, 1), 5)] || PYROCLAST_DAMAGE_BY_LEVEL[1];
}
const PYROCLAST_MAX_CHARGE_TIME = 4;
const PYROCLAST_HIT_RADIUS = 3.25;
const CHARGE_CONSUME_INTERVAL = 500;

function calculatePyroclastDamage(chargeTimeSeconds: number, level: number = 1): { damage: number; isCritical: boolean } {
  // Clamp charge time between 0.5 and MAX_CHARGE_TIME seconds
  const clampedChargeTime = Math.max(0.5, Math.min(PYROCLAST_MAX_CHARGE_TIME, chargeTimeSeconds));

  // Calculate base damage linearly using level-scaled damage per second
  const damagePerSecond = getPyroclastDamagePerSecond(level);
  const baseDamage = Math.floor(clampedChargeTime * damagePerSecond);

  // Use rune system for critical calculation
  return calculateDamage(baseDamage);
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
  onIncinerateEmpowermentUsed,
  level = 1
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
  }>>([]);
  const nextMissileId = useRef(0);
  const lastChargeConsumeTime = useRef<number>(0);
  // Add a lastToggleTime to prevent rapid toggling
  const lastToggleTime = useRef<number>(0);
  const TOGGLE_DEBOUNCE_TIME = 150; // 150ms debounce for toggling charge state
  const pendingTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());
  const missileHitCache = useRef(new MissileHitCache());

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

  // Cleanup pending timeouts on unmount with failsafe
  useEffect(() => {
    return () => {
      pendingTimeouts.current.forEach(timeoutId => {
        try {
          clearTimeout(timeoutId);
        } catch (error) {
          // Ignore errors from already cleared timeouts
        }
      });
      pendingTimeouts.current.clear();
    };
  }, []);

  // Periodic cleanup of old/stale timeouts to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // This is a safety net - normally timeouts should be cleaned up when they execute
      // But if somehow they don't get cleaned up, this will prevent indefinite accumulation
      if (pendingTimeouts.current.size > 50) { // If we have too many pending timeouts
        console.warn('Pyroclast: High number of pending timeouts detected, clearing all');
        pendingTimeouts.current.forEach(timeoutId => {
          try {
            clearTimeout(timeoutId);
          } catch (error) {
            // Ignore errors
          }
        });
        pendingTimeouts.current.clear();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

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
      chargeTime: PYROCLAST_MAX_CHARGE_TIME // Max damage
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
      chargeTime // Store the actual charge time in seconds
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
    // Clean up hit tracking for this missile
    missileHitCache.current.cleanupMissile(missileId);
  }, [onImpact]);

  // Optimize the checkMissileCollisions callback to handle multiple hits better
  const checkMissileCollisions = useCallback((missileId: number, currentPosition: Vector3, previousPosition?: Vector3): boolean => {
    let collisionOccurred = false;
    const missile = activeMissiles.find(m => m.id === missileId);

    if (!missile) {
      return false;
    }

    // Track if we hit any enemies with this collision check
    let anyHits = false;

    // Check all enemies for collisions
    for (const enemy of enemyData) {
      // Skip dead enemies or enemies we've already hit with this missile
      if (enemy.health <= 0 || missileHitCache.current.has(missileId, enemy.id)) {
        continue;
      }

      // Check current position
      const distance = currentPosition.distanceTo(enemy.position);
      
      // If within hit radius, process the hit
      if (distance < PYROCLAST_HIT_RADIUS) {
        
        // Add to hit tracking using shared cache
        missileHitCache.current.add(missileId, enemy.id);

        // Calculate damage based on charge time and level
        const { damage, isCritical } = calculatePyroclastDamage(missile.chargeTime, level);

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
          isPyroclast: true,
          createdAt: Date.now() // MEMORY FIX: Required for cleanup
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
            
            const { damage, isCritical } = calculatePyroclastDamage(missile.chargeTime, level);
            
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
              isPyroclast: true,
              createdAt: Date.now() // MEMORY FIX: Required for cleanup
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
  }, [reigniteRef, activeMissiles, enemyData, setDamageNumbers, nextDamageNumberId, onHit, checkForSpearKillAndProcessReignite, level]);

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

    const timeoutId = setTimeout(() => {
      setCharges(prev => {
        const newCharges = [...prev];
        newCharges[availableChargeIndex] = {
          ...newCharges[availableChargeIndex],
          available: true,
          cooldownStartTime: null
        };
        return newCharges;
      });
      // Remove from pending timeouts when it executes
      pendingTimeouts.current.delete(timeoutId);
    }, ORBITAL_COOLDOWN);

    // Track the timeout for cleanup
    pendingTimeouts.current.add(timeoutId);

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

  const clearAllMissiles = useCallback(() => {
    setActiveMissiles([]);
    // Clear enemy health tracker
    enemyHealthTracker.current = {};
    // Clear missile hit cache
    missileHitCache.current.clear();
  }, []);

  return {
    isCharging,
    chargeProgress,
    activeMissiles,
    startCharging,
    releaseCharge,
    handleMissileImpact,
    checkMissileCollisions,
    clearAllMissiles,
    setChargeProgress,
    chargeStartTime,
    charges,
    setCharges
  };
}