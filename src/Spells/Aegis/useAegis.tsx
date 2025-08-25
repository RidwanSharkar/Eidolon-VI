import { useState, useCallback, useRef } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { ORBITAL_COOLDOWN } from '../../color/ChargedOrbitals';

interface AegisProjectileData {
  id: number;
  position: Vector3;
  targetId: string | null;
  bounceCount: number;
  hitTargets: Set<string>;
  startTime: number;
  travelProgress: number;
  startPosition: Vector3;
  targetPosition: Vector3;
  direction: Vector3;
  isInitialProjectile: boolean;
  maxDistance: number;
  isReturnBounce?: boolean; // Flag for aesthetic return bounce
}

interface AegisControllerProps {
  onHit: (targetId: string, damage: number) => void;
  parentRef: React.RefObject<THREE.Group>;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isAegis?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  onAegisKill?: () => void; // New callback for when Aegis gets a kill
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
}

export const useAegis = ({ 
  parentRef, 
  onHit, 
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  onAegisKill,
  charges,
  setCharges
}: AegisControllerProps) => {
  const [projectiles, setProjectiles] = useState<AegisProjectileData[]>([]);
  const nextProjectileId = useRef(0);
  const COOLDOWN_TIME = 5000; // 10 seconds
  const lastActivationTime = useRef(0);
  const MAX_BOUNCES = 6; // Changed to 6 to get 7 total hits (initial + 6 bounces)
  const MAX_DISTANCE = 35;
  const PROJECTILE_SPEED = 15; // units per second
  const INITIAL_PROJECTILE_DISTANCE = 25; // Maximum distance for initial projectile
  const HIT_RADIUS = 1.5; // Same as fireball hit detection

  // Find the nearest target for bouncing (changed to allow multiple hits per enemy)
  const findNextTarget = useCallback((currentPos: Vector3, lastHitId?: string): { position: Vector3, id: string } | null => {
    // First check if we have at least 2 alive enemies for bouncing
    const aliveEnemies = enemyData.filter(enemy => enemy.health > 0);
    if (aliveEnemies.length < 2) {
      return null; // Need at least 2 enemies for bouncing
    }

    let nearestEnemy = null;
    let shortestDistance = Infinity;
    let enemyId = '';

    enemyData.forEach(enemy => {
      if (enemy.health <= 0) return; // Only check if enemy is alive
      if (enemy.id === lastHitId) return; // Don't bounce back to the same enemy immediately

      const distance = currentPos.distanceTo(enemy.position);
      if (distance < shortestDistance && distance <= MAX_DISTANCE) {
        shortestDistance = distance;
        nearestEnemy = enemy.position;
        enemyId = enemy.id;
      }
    });

    return nearestEnemy ? { position: nearestEnemy, id: enemyId } : null;
  }, [enemyData]);

  // Check for collision with enemies during initial projectile flight
  const checkInitialProjectileHit = useCallback((projectilePos: Vector3): string | null => {
    for (const enemy of enemyData) {
      if (enemy.health <= 0) continue;
      
      const enemyPos = enemy.position.clone();
      enemyPos.y = 1.5; // Match fireball hit detection height
      if (projectilePos.distanceTo(enemyPos) < HIT_RADIUS) {
        return enemy.id;
      }
    }
    return null;
  }, [enemyData]);

  // Calculate damage based on bounce count
  const calculateDamage = useCallback((bounceCount: number): number => {
    return 200 + (bounceCount * 50); // 200 initial, +50 per bounce
  }, []);

  // Check if damage would kill enemy and trigger kill callback
  const checkForKill = useCallback((targetId: string, damage: number) => {
    const target = enemyData.find(e => e.id === targetId);
    if (target && target.health > 0 && target.health <= damage && onAegisKill) {
      onAegisKill();
    }
  }, [enemyData, onAegisKill]);

  // Update projectiles and handle bouncing
  const updateProjectiles = useCallback(() => {
    setProjectiles(prevProjectiles => {
      const updatedProjectiles: AegisProjectileData[] = [];

      prevProjectiles.forEach(projectile => {
        if (projectile.isInitialProjectile) {
          // Handle initial straight-ahead projectile
          const elapsedTime = (Date.now() - projectile.startTime) / 1000;
          const distanceTraveled = elapsedTime * PROJECTILE_SPEED;
          
          if (distanceTraveled < projectile.maxDistance) {
            // Update position along direction vector
            const newPosition = projectile.startPosition.clone().add(
              projectile.direction.clone().multiplyScalar(distanceTraveled)
            );
            
            // Check for enemy collision
            const hitEnemyId = checkInitialProjectileHit(newPosition);
            if (hitEnemyId) {
              // Hit an enemy - check for kill first, then deal damage and start bouncing
              const damage = calculateDamage(projectile.bounceCount);
              checkForKill(hitEnemyId, damage);
              onHit(hitEnemyId, damage);
              
              // Add damage number
              const targetEnemy = enemyData.find(e => e.id === hitEnemyId);
              if (targetEnemy) {
                setDamageNumbers(prev => [...prev, {
                  id: nextDamageNumberId.current++,
                  damage,
                  position: targetEnemy.position.clone(),
                  isCritical: false,
                  isAegis: true
                }]);
              }

              // Start bouncing if under bounce limit
              if (projectile.bounceCount < MAX_BOUNCES) {
                const nextTarget = findNextTarget(newPosition, hitEnemyId);
                if (nextTarget) {
                  // Adjust target position to flight height (1.5 units above ground)
                  const adjustedTargetPosition = nextTarget.position.clone();
                  adjustedTargetPosition.y = 1.5;
                  
                  updatedProjectiles.push({
                    id: nextProjectileId.current++,
                    position: newPosition,
                    targetId: nextTarget.id,
                    bounceCount: projectile.bounceCount + 1,
                    hitTargets: new Set(projectile.hitTargets),
                    startTime: Date.now(),
                    travelProgress: 0,
                    startPosition: newPosition,
                    targetPosition: adjustedTargetPosition,
                    direction: new Vector3(),
                    isInitialProjectile: false,
                    maxDistance: 0,
                    isReturnBounce: false
                  });
                }
              } else if (projectile.bounceCount === MAX_BOUNCES && parentRef.current) {
                // Create final return bounce to player (aesthetic only)
                const playerPosition = parentRef.current.position.clone();
                playerPosition.y += 1; // Match initial projectile height
                
                updatedProjectiles.push({
                  id: nextProjectileId.current++,
                  position: newPosition,
                  targetId: null, // No target ID for return bounce
                  bounceCount: projectile.bounceCount + 1,
                  hitTargets: new Set(projectile.hitTargets),
                  startTime: Date.now(),
                  travelProgress: 0,
                  startPosition: newPosition,
                  targetPosition: playerPosition,
                  direction: new Vector3(),
                  isInitialProjectile: false,
                  maxDistance: 0,
                  isReturnBounce: true
                });
              }
            } else {
              // No collision yet, continue traveling
              updatedProjectiles.push({
                ...projectile,
                position: newPosition
              });
            }
          }
          // If max distance reached without hitting, projectile disappears
        } else {
          // Handle bouncing projectiles (targeting specific enemies)
          const travelDistance = projectile.startPosition.distanceTo(projectile.targetPosition);
          const travelTime = travelDistance / PROJECTILE_SPEED;
          const elapsedTime = (Date.now() - projectile.startTime) / 1000;

          if (elapsedTime >= travelTime) {
            // Projectile reached target
            if (!projectile.isReturnBounce) {
              // Deal damage only if not a return bounce
              const damage = calculateDamage(projectile.bounceCount);
              if (projectile.targetId) {
                checkForKill(projectile.targetId, damage);
                onHit(projectile.targetId, damage);
                
                // Add damage number
                const targetEnemy = enemyData.find(e => e.id === projectile.targetId);
                if (targetEnemy) {
                  setDamageNumbers(prev => [...prev, {
                    id: nextDamageNumberId.current++,
                    damage,
                    position: targetEnemy.position.clone(),
                    isCritical: false,
                    isAegis: true
                  }]);
                }

                // Check for next bounce if under bounce limit
                if (projectile.bounceCount < MAX_BOUNCES) {
                  const nextTarget = findNextTarget(projectile.targetPosition, projectile.targetId || undefined);
                  if (nextTarget) {
                    // Adjust target position to flight height (1.5 units above ground)
                    const adjustedTargetPosition = nextTarget.position.clone();
                    adjustedTargetPosition.y = 1.5;
                    
                    updatedProjectiles.push({
                      id: nextProjectileId.current++,
                      position: projectile.targetPosition.clone(),
                      targetId: nextTarget.id,
                      bounceCount: projectile.bounceCount + 1,
                      hitTargets: new Set(projectile.hitTargets),
                      startTime: Date.now(),
                      travelProgress: 0,
                      startPosition: projectile.targetPosition.clone(),
                      targetPosition: adjustedTargetPosition,
                      direction: new Vector3(),
                      isInitialProjectile: false,
                      maxDistance: 0,
                      isReturnBounce: false
                    });
                  }
                } else if (projectile.bounceCount === MAX_BOUNCES && parentRef.current) {
                  // Create final return bounce to player (aesthetic only)
                  const playerPosition = parentRef.current.position.clone();
                  playerPosition.y += 1; // Match initial projectile height
                  
                  updatedProjectiles.push({
                    id: nextProjectileId.current++,
                    position: projectile.targetPosition.clone(),
                    targetId: null, // No target ID for return bounce
                    bounceCount: projectile.bounceCount + 1,
                    hitTargets: new Set(projectile.hitTargets),
                    startTime: Date.now(),
                    travelProgress: 0,
                    startPosition: projectile.targetPosition.clone(),
                    targetPosition: playerPosition,
                    direction: new Vector3(),
                    isInitialProjectile: false,
                    maxDistance: 0,
                    isReturnBounce: true
                  });
                }
              }
            }
            // If it's a return bounce, it just disappears when it reaches the player
          } else {
            // Update projectile position during travel
            const progress = elapsedTime / travelTime;
            const newPosition = projectile.startPosition.clone().lerp(projectile.targetPosition, progress);
            
            updatedProjectiles.push({
              ...projectile,
              position: newPosition,
              travelProgress: progress
            });
          }
        }
      });

      return updatedProjectiles;
    });
  }, [findNextTarget, calculateDamage, onHit, enemyData, setDamageNumbers, nextDamageNumberId, checkInitialProjectileHit, parentRef, checkForKill]);

  // Launch new aegis projectile (costs 1 orb)
  const activateAegis = useCallback(() => {
    if (!parentRef.current) return false;
    
    const now = Date.now();
    if (now - lastActivationTime.current < COOLDOWN_TIME) {
      return false;
    }

    // Check if we have at least 1 orb charge available
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length < 1) return false;

    // Consume 1 orb charge
    setCharges(prev => prev.map((charge, index) => {
      if (index === availableCharges[0].id - 1) {
        return {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        };
      }
      return charge;
    }));

    // Start cooldown recovery for the charge
    setTimeout(() => {
      setCharges(prev => prev.map((c, index) => 
        index === availableCharges[0].id - 1
          ? { ...c, available: true, cooldownStartTime: null }
          : c
      ));
    }, ORBITAL_COOLDOWN);

    lastActivationTime.current = now;

    // Calculate straight-ahead direction from player facing
    const playerPosition = new Vector3().copy(parentRef.current.position);
    playerPosition.y += 1; // Start slightly above ground like fireball

    const direction = new Vector3(0, 0, 1);
    direction.applyQuaternion(parentRef.current.quaternion);
    direction.normalize();

    // Calculate target position at max distance
    const targetPosition = playerPosition.clone().add(
      direction.clone().multiplyScalar(INITIAL_PROJECTILE_DISTANCE)
    );

    // Create initial straight-ahead projectile
    const newProjectile: AegisProjectileData = {
      id: nextProjectileId.current++,
      position: new Vector3().copy(playerPosition),
      targetId: null, // No specific target initially
      bounceCount: 0,
      hitTargets: new Set(),
      startTime: now,
      travelProgress: 0,
      startPosition: new Vector3().copy(playerPosition),
      targetPosition: targetPosition,
      direction: direction,
      isInitialProjectile: true,
      maxDistance: INITIAL_PROJECTILE_DISTANCE,
      isReturnBounce: false
    };

    setProjectiles(prev => [...prev, newProjectile]);

    return true;
  }, [parentRef, charges, setCharges]);

  // Check if ability is on cooldown
  const isOnCooldown = useCallback(() => {
    const now = Date.now();
    return (now - lastActivationTime.current) < COOLDOWN_TIME;
  }, []);

  const getCooldownRemaining = useCallback(() => {
    const now = Date.now();
    const remaining = COOLDOWN_TIME - (now - lastActivationTime.current);
    return Math.max(0, remaining);
  }, []);

  return {
    projectiles,
    activateAegis,
    updateProjectiles,
    isOnCooldown,
    getCooldownRemaining
  };
};