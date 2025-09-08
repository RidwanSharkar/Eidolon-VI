import { useState, useRef, useCallback, useEffect } from 'react';
import { Vector3, Group } from 'three';

interface ThrowSpearProjectile {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  active: boolean;
  startTime: number;
  hitEnemies: Set<string>;
  opacity: number;
  fadeStartTime: number | null;
  isReturning: boolean;
  returnHitEnemies: Set<string>;
  chargeTime: number; // How long it was charged (0-2 seconds)
  damage: number; // Calculated damage based on charge time
}

interface UseThrowSpearProps {
  parentRef: React.RefObject<Group>;
  onHit: (targetId: string, damage: number, isCritical?: boolean) => void;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
    isDying?: boolean;
  }>;
  setDamageNumbers: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isThrowSpear?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isThrowSpear?: boolean;
  }>) => void;
  nextDamageNumberId: { current: number };
  isEnemyStunned?: (enemyId: string) => boolean; // Check if enemy is stunned for double damage
  // New props for orb charges and Reignite
  charges?: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges?: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;
  reigniteRef?: React.RefObject<{ processKill: (position: Vector3) => void }>;
  // New prop for cooldown reset
  onCooldownReset?: (weapon: string, ability: string) => void;
  // New prop for setting cooldown when spear is thrown
  onAbilityUse?: (weapon: string, ability: string) => void;
}

const THROW_SPEAR_MIN_DAMAGE = 120;
const THROW_SPEAR_MAX_DAMAGE = 360;
const THROW_SPEAR_MIN_RANGE = 5;
const THROW_SPEAR_MAX_RANGE = 20;
const THROW_SPEAR_MAX_CHARGE_TIME = 2; // 2 seconds max charge
const PROJECTILE_SPEED = 0.55; // Speed of the thrown spear
const FADE_DURATION = 400; // Fade duration when returning to player

function calculateThrowSpearDamage(chargeTimeSeconds: number): number {
  // Clamp charge time between 0 and MAX_CHARGE_TIME seconds
  const clampedChargeTime = Math.max(0, Math.min(THROW_SPEAR_MAX_CHARGE_TIME, chargeTimeSeconds));
  
  // Linear scaling from min to max damage
  const damageRange = THROW_SPEAR_MAX_DAMAGE - THROW_SPEAR_MIN_DAMAGE;
  const chargeRatio = clampedChargeTime / THROW_SPEAR_MAX_CHARGE_TIME;
  
  return Math.floor(THROW_SPEAR_MIN_DAMAGE + (damageRange * chargeRatio));
}

function calculateThrowSpearRange(chargeTimeSeconds: number): number {
  // Clamp charge time between 0 and MAX_CHARGE_TIME seconds
  const clampedChargeTime = Math.max(0, Math.min(THROW_SPEAR_MAX_CHARGE_TIME, chargeTimeSeconds));
  
  // Linear scaling from min to max range
  const rangeSpread = THROW_SPEAR_MAX_RANGE - THROW_SPEAR_MIN_RANGE;
  const chargeRatio = clampedChargeTime / THROW_SPEAR_MAX_CHARGE_TIME;
  
  return THROW_SPEAR_MIN_RANGE + (rangeSpread * chargeRatio);
}

export function useThrowSpear({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  isEnemyStunned,
  charges,
  setCharges,
  reigniteRef,
  onCooldownReset,
  onAbilityUse
}: UseThrowSpearProps) {
  
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const chargeStartTime = useRef<number | null>(null);
  const [activeProjectiles, setActiveProjectiles] = useState<ThrowSpearProjectile[]>([]);
  const nextProjectileId = useRef(0);
  const [isSpearThrown, setIsSpearThrown] = useState(false); // Track if spear is currently thrown
  
  // Function to consume 2 orb charges
  const consumeOrbCharges = useCallback(() => {
    if (!charges || !setCharges) return false;
    
    // Find two available charges
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length < 2) {
      return false;
    }

    // Consume two charges
    setCharges(prev => prev.map((charge, index) => {
      if (
        index === availableCharges[0].id - 1 || 
        index === availableCharges[1].id - 1
      ) {
        return {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        };
      }
      return charge;
    }));

    return true;
  }, [charges, setCharges]);

  // Function to refresh cooldown when hitting stunned enemies
  const refreshCooldownOnStunnedHit = useCallback(() => {
    if (onCooldownReset) {
      onCooldownReset('spear', 'r');
    }
  }, [onCooldownReset]);

  // Start charging the throw
  const startCharging = useCallback(() => {
    if (isSpearThrown) return; // Can't charge if spear is already thrown
    
    const now = Date.now();
    setIsCharging(true);
    chargeStartTime.current = now;
    setChargeProgress(0);
  }, [isSpearThrown]);

  // Release the charge and throw the spear
  const releaseCharge = useCallback(() => {
    if (!isCharging || !chargeStartTime.current || !parentRef.current) {
      return;
    }

    // Consume 2 orb charges before throwing
    if (!consumeOrbCharges()) {
      return; // Can't throw if we don't have enough charges
    }

    const now = Date.now();
    const chargeTime = (now - chargeStartTime.current) / 1000; // Convert to seconds
    const clampedChargeTime = Math.min(chargeTime, THROW_SPEAR_MAX_CHARGE_TIME);
    
    // Calculate damage and range based on charge time
    const damage = calculateThrowSpearDamage(clampedChargeTime);
    const maxDistance = calculateThrowSpearRange(clampedChargeTime);
    
    // Get player position and forward direction
    const playerPosition = parentRef.current.position.clone();
    const playerQuaternion = parentRef.current.quaternion.clone();
    const forward = new Vector3(0, 0, 1).applyQuaternion(playerQuaternion).normalize();
    
    // Create the projectile
    const projectile: ThrowSpearProjectile = {
      id: nextProjectileId.current++,
      position: playerPosition.clone(),
      direction: forward.clone(),
      startPosition: playerPosition.clone(),
      maxDistance,
      active: true,
      startTime: now,
      hitEnemies: new Set(),
      opacity: 1,
      fadeStartTime: null,
      isReturning: false,
      returnHitEnemies: new Set(),
      chargeTime: clampedChargeTime,
      damage
    };
    
    setActiveProjectiles(prev => [...prev, projectile]);
    setIsSpearThrown(true); // Mark spear as thrown
    
    // Reset charging state
    setIsCharging(false);
    setChargeProgress(0);
    chargeStartTime.current = null;

    // Set cooldown when spear is thrown
    if (onAbilityUse) {
      onAbilityUse('spear', 'r');
    }
  }, [isCharging, parentRef, consumeOrbCharges, onAbilityUse]);

  // Update charge progress
  useEffect(() => {
    if (!isCharging || !chargeStartTime.current) return;

    const updateProgress = () => {
      if (!chargeStartTime.current) return;
      
      const now = Date.now();
      const elapsed = (now - chargeStartTime.current) / 1000;
      const progress = Math.min(elapsed / THROW_SPEAR_MAX_CHARGE_TIME, 1);
      
      setChargeProgress(progress);
      
      // Auto-release if fully charged
      if (progress >= 1) {
        releaseCharge();
        return;
      }
    };

    const interval = setInterval(updateProgress, 16); // ~60fps updates
    return () => clearInterval(interval);
  }, [isCharging, releaseCharge]);

  // Update projectiles
  useEffect(() => {
    if (activeProjectiles.length === 0) return;

    let animationFrameId: number;

    const updateProjectiles = () => {
      const now = Date.now();

      setActiveProjectiles(prevProjectiles => {
        const updatedProjectiles = prevProjectiles.map(projectile => {
          if (!projectile.active) return projectile;

          const updatedProjectile = { ...projectile };
          const distanceTraveled = updatedProjectile.position.distanceTo(updatedProjectile.startPosition);

          if (!updatedProjectile.isReturning) {
            // Forward movement phase
            if (distanceTraveled < updatedProjectile.maxDistance) {
              // Move projectile forward
              updatedProjectile.position.add(
                updatedProjectile.direction.clone().multiplyScalar(PROJECTILE_SPEED)
              );

              // Check for enemy collisions during forward phase
              for (const enemy of enemyData) {
                if (enemy.isDying || enemy.health <= 0) continue;
                if (updatedProjectile.hitEnemies.has(enemy.id)) continue;

                const projectilePos2D = new Vector3(
                  updatedProjectile.position.x,
                  0,
                  updatedProjectile.position.z
                );
                const enemyPos2D = new Vector3(
                  enemy.position.x,
                  0,
                  enemy.position.z
                );
                
                if (projectilePos2D.distanceTo(enemyPos2D) < 1.5) {
                  // Mark enemy as hit
                  updatedProjectile.hitEnemies.add(enemy.id);
                  
                  let finalDamage = updatedProjectile.damage;
                  
                  // Check if enemy is stunned BEFORE applying damage (important for timing)
                  const wasEnemyStunned = isEnemyStunned && isEnemyStunned(enemy.id);
                  
                  // Double damage if enemy is stunned
                  if (wasEnemyStunned) {
                    finalDamage *= 2;
                  }
                  
                  // Store enemy health before damage to check if it was a killing blow
                  const enemyHealthBeforeDamage = enemy.health;
                  
                  // Apply damage
                  onHit(enemy.id, finalDamage);
                  
                  // Add damage number
                  setDamageNumbers(prev => [...prev, {
                    id: nextDamageNumberId.current++,
                    damage: finalDamage,
                    position: enemy.position.clone(),
                    isCritical: false,
                    isThrowSpear: true
                  }]);

                  // Refresh cooldown on stunned hit ONLY (use the pre-damage stunned status)
                  if (wasEnemyStunned) {
                    refreshCooldownOnStunnedHit();
                  }
                  
                  // Check if this was a killing blow and trigger Reignite
                  if (enemyHealthBeforeDamage > 0 && enemyHealthBeforeDamage - finalDamage <= 0 && reigniteRef?.current) {
                    reigniteRef.current.processKill(enemy.position.clone());
                  }
                }
              }
            } else {
              // Start return phase
              updatedProjectile.isReturning = true;
              // Reverse direction to point back to start position
              updatedProjectile.direction = updatedProjectile.startPosition.clone()
                .sub(updatedProjectile.position)
                .normalize();
            }
          } else {
            // Return movement phase
            if (!parentRef.current) return updatedProjectile;
            
            const currentPlayerPosition = parentRef.current.position;
            const distanceToPlayer = updatedProjectile.position.distanceTo(currentPlayerPosition);
            
            if (distanceToPlayer > 1.5 && !updatedProjectile.fadeStartTime) {
              // Update direction to current player position (in case player moved)
              updatedProjectile.direction = currentPlayerPosition.clone()
                .sub(updatedProjectile.position)
                .normalize();
              
              // Move projectile back toward player
              updatedProjectile.position.add(
                updatedProjectile.direction.clone().multiplyScalar(PROJECTILE_SPEED)
              );

              // Check for enemy collisions during return phase
              for (const enemy of enemyData) {
                if (enemy.isDying || enemy.health <= 0) continue;
                if (updatedProjectile.returnHitEnemies.has(enemy.id)) continue;

                const projectilePos2D = new Vector3(
                  updatedProjectile.position.x,
                  0,
                  updatedProjectile.position.z
                );
                const enemyPos2D = new Vector3(
                  enemy.position.x,
                  0,
                  enemy.position.z
                );
                
                if (projectilePos2D.distanceTo(enemyPos2D) < 1.5) {
                  // Mark enemy as hit during return phase
                  updatedProjectile.returnHitEnemies.add(enemy.id);
                  
                  let finalDamage = updatedProjectile.damage;
                  
                  // Check if enemy is stunned BEFORE applying damage (important for timing)
                  const wasEnemyStunned = isEnemyStunned && isEnemyStunned(enemy.id);
                  
                  // Double damage if enemy is stunned
                  if (wasEnemyStunned) {
                    finalDamage *= 2;
                  }
                  
                  // Store enemy health before damage to check if it was a killing blow
                  const enemyHealthBeforeDamage = enemy.health;
                  
                  // Apply damage again
                  onHit(enemy.id, finalDamage);
                  
                  // Add damage number
                  setDamageNumbers(prev => [...prev, {
                    id: nextDamageNumberId.current++,
                    damage: finalDamage,
                    position: enemy.position.clone(),
                    isCritical: false,
                    isThrowSpear: true
                  }]);

                  // Refresh cooldown on stunned hit ONLY (use the pre-damage stunned status)
                  if (wasEnemyStunned) {
                    refreshCooldownOnStunnedHit();
                  }
                  
                  // Check if this was a killing blow and trigger Reignite
                  if (enemyHealthBeforeDamage > 0 && enemyHealthBeforeDamage - finalDamage <= 0 && reigniteRef?.current) {
                    reigniteRef.current.processKill(enemy.position.clone());
                  }
                }
              }
            } else if (!updatedProjectile.fadeStartTime) {
              // Start fading when projectile reaches player
              updatedProjectile.fadeStartTime = now;
            }
          }

          // Handle fading
          if (updatedProjectile.fadeStartTime) {
            const fadeElapsed = now - updatedProjectile.fadeStartTime;
            updatedProjectile.opacity = Math.max(0, 1 - (fadeElapsed / FADE_DURATION));
            
            if (updatedProjectile.opacity <= 0) {
              updatedProjectile.active = false;
              // Spear has returned, allow new throws
              setIsSpearThrown(false);
            }
          }

          return updatedProjectile;
        });

        // Remove inactive projectiles
        return updatedProjectiles.filter(p => p.active);
      });

      animationFrameId = requestAnimationFrame(updateProjectiles);
    };

    updateProjectiles();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [activeProjectiles.length, enemyData, onHit, setDamageNumbers, nextDamageNumberId, isEnemyStunned, parentRef, refreshCooldownOnStunnedHit, reigniteRef]);

  return {
    isCharging,
    chargeProgress,
    activeProjectiles,
    startCharging,
    releaseCharge,
    isSpearThrown, // Export this so other systems can check if abilities should be locked
    THROW_SPEAR_MAX_CHARGE_TIME
  };
}
