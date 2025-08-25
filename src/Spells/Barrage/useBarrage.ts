import { useCallback, useRef } from 'react';
import { Vector3, Group } from 'three';
import * as THREE from 'three';
import { ORBITAL_COOLDOWN } from '../../color/ChargedOrbitals';

interface BarrageProjectile {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  damage: number;
  startTime: number;
  hasCollided: boolean;
  hitEnemies: Set<string>;
  opacity?: number;
  fadeStartTime?: number | null;
}

interface UseBarrageProps {
  parentRef: React.RefObject<Group>;
  onHit: (targetId: string, damage: number) => void;
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
    isBarrage?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isBarrage?: boolean;
  }>) => void;
  nextDamageNumberId: React.MutableRefObject<number>;
  charges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges: (callback: (prev: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>) => Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>) => void;
}

export function useBarrage({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  charges,
  setCharges
}: UseBarrageProps) {
  const activeProjectilesRef = useRef<BarrageProjectile[]>([]);
  const nextProjectileId = useRef(0);
  
  // Recoil state
  const isRecoiling = useRef(false);
  const recoilStartTime = useRef<number | null>(null);
  const recoilStartPosition = useRef<Vector3 | null>(null);
  
  const RECOIL_DISTANCE = 4; // Same as vault distance
  const RECOIL_DURATION = 0.35; // Same as vault duration
  const MAX_RECOIL_BOUNDS = 25; // Maximum distance from origin

  const shootBarrage = useCallback(() => {
    if (!parentRef.current) return false;

    // Check if we have at least one available charge
    const availableChargeIndex = charges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) return false;

    // Consume one charge for the barrage
    setCharges(prev => prev.map((charge, index) => 
      index === availableChargeIndex
        ? { ...charge, available: false, cooldownStartTime: Date.now() }
        : charge
    ));

    // Start cooldown recovery for the consumed charge
    setTimeout(() => {
      setCharges(prev => prev.map((c, index) => 
        index === availableChargeIndex
          ? { ...c, available: true, cooldownStartTime: null }
          : c
      ));
    }, ORBITAL_COOLDOWN);

    const unitPosition = parentRef.current.position.clone();
    unitPosition.y += 1; // Shoot from chest level

    // Get the unit's forward direction
    const baseDirection = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    // Create 3 arrows: center (0°), left (45°), right (-45°)
    const angles = [0, Math.PI / 6, -Math.PI / 6]; // 0°, 45°, -45°
    
    angles.forEach(angle => {
      // Rotate the base direction by the specified angle around the Y axis
      const direction = baseDirection.clone();
      const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
      direction.applyMatrix4(rotationMatrix);

      const projectile: BarrageProjectile = {
        id: nextProjectileId.current++,
        position: unitPosition.clone(),
        direction: direction,
        startPosition: unitPosition.clone(),
        maxDistance: 12, // Same as other bow projectiles
        damage: 120,
        startTime: Date.now(),
        hasCollided: false,
        hitEnemies: new Set(),
        opacity: 1,
        fadeStartTime: null
      };

      activeProjectilesRef.current.push(projectile);
    });

    // Start recoil effect
    if (parentRef.current) {
      isRecoiling.current = true;
      recoilStartTime.current = Date.now();
      recoilStartPosition.current = parentRef.current.position.clone();
    }

    return true;
  }, [parentRef, charges, setCharges]);

  const updateProjectiles = useCallback(() => {
    // Handle recoil effect
    if (isRecoiling.current && parentRef.current && recoilStartTime.current && recoilStartPosition.current) {
      const elapsed = (Date.now() - recoilStartTime.current) / 1000;
      const progress = Math.min(elapsed / RECOIL_DURATION, 1);

      // Calculate movement using easing function (same as vault)
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      
      // Get backward direction based on current rotation
      const backwardDirection = new Vector3(0, 0, -1)
        .applyQuaternion(parentRef.current.quaternion)
        .normalize();

      // Calculate new position
      const newPosition = recoilStartPosition.current.clone().add(
        backwardDirection.multiplyScalar(RECOIL_DISTANCE * easeOutQuad)
      );

      // Bounds checking: Ensure position is within reasonable limits
      const distanceFromOrigin = newPosition.length();
      if (distanceFromOrigin <= MAX_RECOIL_BOUNDS) {
        // Update position only if within bounds
        parentRef.current.position.copy(newPosition);
      }

      // Complete recoil when finished
      if (progress === 1) {
        isRecoiling.current = false;
        recoilStartTime.current = null;
        recoilStartPosition.current = null;
      }
    }

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
        const fadeProgress = fadeElapsed / 250; // 1 second fade duration
        projectile.opacity = Math.max(0, 1 - fadeProgress);
        
        if (fadeProgress >= 1) {
          return false; // Remove projectile after fade completes
        }
      }
      
      if (distanceTraveled < projectile.maxDistance && !projectile.hasCollided && !projectile.fadeStartTime) {
        // Move projectile
        const speed = 0.45; // Slightly faster than regular arrows
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
            
            // Apply damage
            onHit(enemy.id, projectile.damage);
            
            // Add damage number
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: projectile.damage,
              position: enemy.position.clone(),
              isCritical: false,
              isBarrage: true
            }]);

            // This projectile stops after hitting one enemy
            projectile.hasCollided = true;
            return false;
          }
        }
        
        return true;
      }
      
      // Keep projectile alive if it's fading
      return projectile.fadeStartTime !== null;
    });
  }, [enemyData, onHit, setDamageNumbers, nextDamageNumberId, parentRef]);

  const getActiveProjectiles = useCallback(() => {
    return [...activeProjectilesRef.current];
  }, []);

  const cleanup = useCallback(() => {
    activeProjectilesRef.current = [];
    // Reset recoil state
    isRecoiling.current = false;
    recoilStartTime.current = null;
    recoilStartPosition.current = null;
  }, []);

  return {
    shootBarrage,
    updateProjectiles,
    getActiveProjectiles,
    cleanup
  };
} 