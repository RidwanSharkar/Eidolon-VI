import React, { useRef, useCallback, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

export interface IcicleCharge {
  id: number;
  available: boolean;
  cooldownStartTime: number | null;
}

interface IcicleOrbitalsProps {
  parentRef: React.RefObject<Group>;
  charges: Array<IcicleCharge>;
  setCharges: React.Dispatch<React.SetStateAction<Array<IcicleCharge>>>;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
    isDying?: boolean;
  }>;
  onHit: (targetId: string, damage: number) => void;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isIcicle?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  onShootIcicle?: (shootFunction: () => boolean) => void; // Callback to expose shoot function
  level?: number; // Add level prop for damage scaling
  onFreezeStateCheck?: (enemyId: string) => boolean; // Add frozen enemy check
  onUpdateProjectiles?: (updateFunction: () => void) => void; // Callback to expose update function
  onGetActiveProjectiles?: (getFunction: () => IcicleProjectile[]) => void; // Callback to expose get active projectiles function
  onApplySlowEffect?: (enemyId: string, duration?: number) => void; // Slow effect callback like QuickShot
  comboStep?: 1 | 2 | 3; // Add combo step prop like Sword
  onComboComplete?: () => void; // Callback when combo completes
  // Multiplayer props
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
}

const ICICLE_COUNT = 8;
const RECHARGE_INTERVAL = 1500; // 4 seconds per icicle

// Level-based damage scaling: 23/29/37/49/61
const getIcicleDamage = (level: number): number => {
  switch (level) {
    case 1: return 23;
    case 2: return 29;
    case 3: return 37;
    case 4: return 49;
    case 5: return 61;
    default: return 23;
  }
};

// Queue-based regeneration system like ChargedOrbitals
interface IcicleRegenerationQueue {
  chargeId: number;
  startTime: number;
}

// Icicle projectile interface following Barrage pattern
interface IcicleProjectile {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  damage: number;
  startTime: number;
  hasCollided: boolean;
  hitEnemies: Set<string>;
  active: boolean;
  opacity: number;
  fadeStartTime: number | null;
}

// Icicle projectiles are now rendered directly in Unit component (like Barrage)

export default function IcicleOrbitals({ 
  parentRef, 
  charges, 
  setCharges,
  enemyData,
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  onShootIcicle,
  level = 1,
  onFreezeStateCheck,
  onUpdateProjectiles,
  onGetActiveProjectiles,
  onApplySlowEffect,
  comboStep = 1,
  onComboComplete,
  // Multiplayer props
  sendEffect,
  isInRoom = false,
  isPlayer = false
}: IcicleOrbitalsProps) {
  // Active projectiles array like Barrage
  const activeProjectilesRef = useRef<IcicleProjectile[]>([]);
  const nextProjectileId = useRef(0);
  const FADE_DURATION = 333; // 1 second fade duration like Barrage
  
  // Queue-based regeneration system
  const regenerationQueue = useRef<IcicleRegenerationQueue[]>([]);
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // No need for projectile pool initialization - using dynamic array like Barrage

  // Initialize charges if empty
  useEffect(() => {
    if (charges.length === 0) {
      const initialCharges = Array.from({ length: ICICLE_COUNT }, (_, i) => ({
        id: i,
        available: true,
        cooldownStartTime: null
      }));
      setCharges(initialCharges);
    }
  }, [charges.length, setCharges]);

  // No need for helper functions - using Barrage pattern

  // Clear timeouts on unmount
  useEffect(() => {
    const timeouts = activeTimeouts.current;
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // Queue-based regeneration system (like ChargedOrbitals)
  const addToRegenerationQueue = useCallback((chargeId: number) => {
    const now = Date.now();
    
    // Add to queue
    regenerationQueue.current.push({
      chargeId,
      startTime: now
    });

    // Sort queue by start time to maintain order
    regenerationQueue.current.sort((a, b) => a.startTime - b.startTime);

    // Calculate delay based on position in queue
    const queuePosition = regenerationQueue.current.findIndex(item => item.chargeId === chargeId);
    const delay = RECHARGE_INTERVAL + (queuePosition * RECHARGE_INTERVAL);

    const timeout = setTimeout(() => {
      // Remove from active timeouts
      activeTimeouts.current.delete(timeout);
      
      // Remove from queue
      regenerationQueue.current = regenerationQueue.current.filter(item => item.chargeId !== chargeId);
      
      // Restore the charge
      setCharges(prev => prev.map(charge => 
        charge.id === chargeId
          ? { ...charge, available: true, cooldownStartTime: null }
          : charge
      ));
      

    }, delay);

    activeTimeouts.current.add(timeout);
  }, [setCharges]);

  // Shoot icicle function - following Barrage pattern with combo system
  const shootIcicle = useCallback((): boolean => {
    if (!parentRef.current) return false;

    // Check if we have at least one available charge
    const availableChargeIndex = charges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) return false;

    // Consume one charge for the icicles
    setCharges(prev => prev.map((charge, index) => 
      index === availableChargeIndex
        ? { ...charge, available: false, cooldownStartTime: Date.now() }
        : charge
    ));

    // Add to regeneration queue
    addToRegenerationQueue(charges[availableChargeIndex].id);

    // Get the unit's position (same approach as Barrage)
    const unitPosition = parentRef.current.position.clone();
    unitPosition.y += 1; // Shoot from chest level

    // Get the unit's forward direction
    const baseDirection = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    // Define angles based on combo step
    let angles: number[] = [];
    switch (comboStep) {
      case 1:
        // 1st hit: 1 icicle straight forward
        angles = [0];
        break;
      case 2:
        // 2nd hit: 2 icicles in an arc (left and right)
        angles = [Math.PI / 16, -Math.PI / 16]; // 30°, -30°
        break;
      case 3:
        // 3rd hit: 3 icicles in an arc (center, left, right)
        angles = [0, Math.PI / 8, -Math.PI / 8]; // 0°, 30°, -30°
        break;
      default:
        angles = [0];
    }
    
    angles.forEach(angle => {
      // Rotate the base direction by the specified angle around the Y axis
      const direction = baseDirection.clone();
      const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
      direction.applyMatrix4(rotationMatrix);

      const projectile: IcicleProjectile = {
        id: nextProjectileId.current++,
        position: unitPosition.clone(),
        direction: direction,
        startPosition: unitPosition.clone(),
        maxDistance: 20, // Same as other projectiles
        damage: getIcicleDamage(level),
        startTime: Date.now(),
        hasCollided: false,
        hitEnemies: new Set(),
        active: true,
        opacity: 1,
        fadeStartTime: null
      };

      activeProjectilesRef.current.push(projectile);
    });

    // Send icicle projectile effects to other players in multiplayer
    if (isInRoom && isPlayer && sendEffect) {
      angles.forEach(angle => {
        // Rotate the base direction by the specified angle around the Y axis
        const direction = baseDirection.clone();
        const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
        direction.applyMatrix4(rotationMatrix);

        sendEffect({
          type: 'icicleProjectile',
          position: unitPosition.clone(),
          direction: direction.clone(),
          duration: 1250, // 10 second max lifespan
          speed: 0.275, // Icicle projectile speed
          weaponType: 'sabres',
          subclass: 'frost',
          comboStep: comboStep,
          projectileId: `icicle-${nextProjectileId.current - angles.length + angles.indexOf(angle)}`
        });
      });
    }

    // Call combo complete callback if provided
    if (onComboComplete) {
      onComboComplete();
    }

    return true;
  }, [parentRef, charges, setCharges, addToRegenerationQueue, level, comboStep, onComboComplete, isInRoom, isPlayer, sendEffect]);

  // Expose shoot function to parent
  useEffect(() => {
    if (onShootIcicle) {
      onShootIcicle(shootIcicle);
    }
  }, [onShootIcicle, shootIcicle]);

  // Update projectiles function - following Barrage pattern (called externally)
  const updateProjectiles = useCallback(() => {
    const now = Date.now();
    
    activeProjectilesRef.current = activeProjectilesRef.current.filter(projectile => {
      const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
      
      // Handle fading when projectile reaches max distance
      if (distanceTraveled >= projectile.maxDistance && !projectile.fadeStartTime) {
        projectile.fadeStartTime = now;
      }
      
      // Handle fade effect
      if (projectile.fadeStartTime) {
        const fadeElapsed = now - projectile.fadeStartTime;
        const fadeProgress = fadeElapsed / FADE_DURATION;
        projectile.opacity = Math.max(0, 1 - fadeProgress);
        
        if (fadeProgress >= 1) {
          return false; // Remove projectile after fade completes
        }
      }
      
      if (distanceTraveled < projectile.maxDistance && !projectile.hasCollided && !projectile.fadeStartTime) {
        // Move projectile forward
        const speed = 0.275; // Same speed as Barrage
        projectile.position.add(
          projectile.direction.clone().multiplyScalar(speed)
        );

        // Check for enemy collisions
        for (const enemy of enemyData) {
          // Skip dead or dying enemies
          if (enemy.health <= 0 || enemy.isDying) continue;
          
          // Skip if we've already hit this enemy
          if (projectile.hitEnemies.has(enemy.id)) continue;

          const projectilePos2D = new Vector3(
            projectile.position.x,
            0,
            projectile.position.z
          );
          const enemyPos2D = new Vector3(
            enemy.position.x,
            0,
            enemy.position.z
          );
          const distanceToEnemy = projectilePos2D.distanceTo(enemyPos2D);
          
          if (distanceToEnemy < 1.2) {
            // Mark this enemy as hit by this projectile
            projectile.hitEnemies.add(enemy.id);
            
            // Calculate damage with freeze bonus
            const baseDamage = projectile.damage;
            const isFrozen = onFreezeStateCheck ? onFreezeStateCheck(enemy.id) : false;
            const finalDamage = isFrozen ? baseDamage * 3 : baseDamage;
            
            // Apply damage
            onHit(enemy.id, finalDamage);
            
            // Add damage number
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: finalDamage,
              position: enemy.position.clone(),
              isCritical: isFrozen, // Show as critical if frozen (tripled damage)
              isIcicle: true
            }]);

            // Apply slow effect to hit enemies (like QuickShot for Elemental Bow at level 3+)
            if (onApplySlowEffect) {
              onApplySlowEffect(enemy.id, 4000); // 4 second slow effect, same as QuickShot
            }

            // Like bow's uncharged projectile, icicles stop after hitting one enemy
            projectile.hasCollided = true;
            projectile.fadeStartTime = now;
            return; // Stop checking for more enemies
          }
        }
        
        return true;
      }
      
      // Keep projectile alive if it's fading
      return projectile.fadeStartTime !== null;
    });
  }, [onApplySlowEffect, enemyData, onHit, setDamageNumbers, nextDamageNumberId, onFreezeStateCheck]);

  // Get active projectiles function - following Barrage pattern
  const getActiveProjectiles = useCallback((): IcicleProjectile[] => {
    return [...activeProjectilesRef.current];
  }, []);

  // Expose update function to parent
  useEffect(() => {
    if (onUpdateProjectiles) {
      onUpdateProjectiles(updateProjectiles);
    }
  }, [onUpdateProjectiles, updateProjectiles]);

  // Expose get active projectiles function to parent
  useEffect(() => {
    if (onGetActiveProjectiles) {
      onGetActiveProjectiles(getActiveProjectiles);
    }
  }, [onGetActiveProjectiles, getActiveProjectiles]);

  // Cleanup function
  const cleanup = useCallback(() => {
    activeProjectilesRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const availableCharges = charges.filter(charge => charge.available);

  return (
    <>
      {/* Orbiting icicles - positioned relative to unit */}
      <group position={[0, 0, 0]}>
        {availableCharges.map((charge, i) => {
          // Calculate orbital position directly in render (like OrbShield)
          const angle = (i / availableCharges.length) * Math.PI * 2 + Date.now() * 0.001 * 0.8;
          const radius = 0.75; // Slightly smaller radius as requested
          
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = Math.sin(Date.now() * 0.002 + i) * 0.2;

          return (
            <group
              key={charge.id}
              position={[x, y, z]}
              rotation={[
                Math.PI/2, // No X rotation
                angle, // Point outward using the same angle as position
                -Math.PI/2  // No Z rotation
              ]}
            >
              <mesh>
                <coneGeometry args={[0.075, 0.3, 6]} />
                <meshStandardMaterial
                  color="#CCFFFF"
                  emissive="#CCFFFF"
                  emissiveIntensity={0.6}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
          );
        })}

        {/* Frost aura light */}
        <pointLight
          color="#CCFFFF"
          intensity={2}
          distance={6}
          decay={1.5}
        />
      </group>

      {/* Projectile icicles are now rendered in Unit component like Barrage */}
    </>
  );
}