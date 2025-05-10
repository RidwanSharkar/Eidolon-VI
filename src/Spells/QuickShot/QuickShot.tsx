import { Vector3 } from 'three';
import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useQuickShotManager } from '../QuickShot/useQuickShotManager';
import { WeaponType, WEAPON_DAMAGES } from '../../Weapons/weapons';
import { useEagleEye } from '../EagleEye/useEagleEye';
import EagleEyeManager from '../EagleEye/EagleEyeManager';

interface QuickShotProps {
  parentRef: React.RefObject<THREE.Group>;
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
    isEagleEye?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isEagleEye?: boolean;
  }>) => void;
  nextDamageNumberId: React.MutableRefObject<number>;
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
  isEagleEyeUnlocked: boolean;
}

interface ProjectileData {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  isQuickShot: boolean;
  power: number;
  startTime: number;
  hasCollided: boolean;
  active: boolean;
  opacity: number;
  fadeStartTime: number | null;
}

export const useQuickShot = ({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  charges,
  setCharges,
  isEagleEyeUnlocked
}: QuickShotProps) => {
  const projectilePool = useRef<ProjectileData[]>([]);
  const POOL_SIZE = 7;
  const lastShotTime = useRef(0);
  const SHOT_DELAY = 166;
  const FADE_DURATION = 500; // 500ms fade out duration
  const eagleEyeManagerRef = useRef<{
    createEagleEyeEffect: (position: Vector3) => void;
  }>(null);

  const { consumeCharge } = useQuickShotManager({
    charges,
    setCharges
  });
  
  const { processHit, resetCounter } = useEagleEye({
    isUnlocked: isEagleEyeUnlocked,
    setDamageNumbers,
    nextDamageNumberId,
    onHit,
    eagleEyeManagerRef
  });

  useEffect(() => {
    projectilePool.current = Array(POOL_SIZE).fill(null).map((_, index) => ({
      id: index,
      position: new Vector3(),
      direction: new Vector3(),
      startPosition: new Vector3(),
      maxDistance: 40,
      isQuickShot: true,
      power: 1,
      startTime: 0,
      hasCollided: false,
      active: false,
      opacity: 1,
      fadeStartTime: null
    }));
  }, []);

  const getInactiveProjectile = () => {
    return projectilePool.current.find(p => !p.active);
  };

  const shootQuickShot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotTime.current < SHOT_DELAY) return;

    const hasAvailableCharges = charges.some(charge => charge.available);
    if (!hasAvailableCharges || !parentRef.current) return;

    const success = consumeCharge();
    if (!success) return;

    lastShotTime.current = now;

    const projectile = getInactiveProjectile();
    if (!projectile) return;

    const unitPosition = parentRef.current.position.clone();
    unitPosition.y += 1;

    const direction = new Vector3(0, 0, 1);
    direction.applyQuaternion(parentRef.current.quaternion);

    projectile.position.copy(unitPosition);
    projectile.direction.copy(direction);
    projectile.startPosition.copy(unitPosition);
    projectile.startTime = now;
    projectile.hasCollided = false;
    projectile.active = true;
    projectile.opacity = 1;
    projectile.fadeStartTime = null;
  }, [parentRef, charges, consumeCharge]);

  useEffect(() => {
    let animationFrameId: number;

    const updateProjectiles = () => {
      const now = Date.now();
      const activeProjectiles = projectilePool.current.filter(p => p.active);
      
      activeProjectiles.forEach(projectile => {
        // Handle fading out projectiles
        if (projectile.fadeStartTime !== null) {
          const fadeElapsed = now - projectile.fadeStartTime;
          if (fadeElapsed >= FADE_DURATION) {
            projectile.active = false;
            return;
          }
          
          projectile.opacity = 1 - (fadeElapsed / FADE_DURATION);
          return;
        }
        
        const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
        
        if (distanceTraveled >= projectile.maxDistance) {
          projectile.fadeStartTime = now;
          return;
        }

        projectile.position.add(
          projectile.direction.clone().multiplyScalar(0.5)
        );

        for (const enemy of enemyData) {
          if (enemy.isDying || enemy.health <= 0) continue;

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
          
          if (projectilePos2D.distanceTo(enemyPos2D) < 1.3) {
            const damage = WEAPON_DAMAGES[WeaponType.BOW].normal;
            onHit(enemy.id, damage);

            if (enemy.health - damage > 0) {
              setDamageNumbers(prev => [...prev, {
                id: nextDamageNumberId.current++,
                damage,
                position: enemy.position.clone(),
                isCritical: false
              }]);
              
              if (isEagleEyeUnlocked) {
                processHit(enemy.id, enemy.position);
              }
            }

            // Start fading out instead of immediately deactivating
            projectile.hasCollided = true;
            projectile.fadeStartTime = now;
            return;
          }
        }
      });

      if (projectilePool.current.some(p => p.active)) {
        animationFrameId = requestAnimationFrame(updateProjectiles);
      }
    };

    animationFrameId = requestAnimationFrame(updateProjectiles);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [enemyData, onHit, setDamageNumbers, nextDamageNumberId, isEagleEyeUnlocked, processHit]);

  return {
    shootQuickShot,
    projectilePool,
    resetEagleEyeCounter: resetCounter,
    eagleEyeManagerRef,
    eagleEyeManager: <EagleEyeManager ref={eagleEyeManagerRef} isUnlocked={isEagleEyeUnlocked} />
  };
}; 