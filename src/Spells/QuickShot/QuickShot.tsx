import { Vector3 } from 'three';
import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useQuickShotManager } from '../QuickShot/useQuickShotManager';
import { WeaponType, WEAPON_DAMAGES } from '../../Weapons/weapons';

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
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
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
}

export const useQuickShot = ({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  charges,
  setCharges
}: QuickShotProps) => {
  const activeProjectilesRef = useRef<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    startPosition: Vector3;
    maxDistance: number;
    isQuickShot: boolean;
    power: number;
    startTime: number;
    hasCollided: boolean;
  }>>([]);
  const lastShotTime = useRef(0);
  const SHOT_DELAY = 150; // 166ms between shots

  const { consumeCharge } = useQuickShotManager({
    charges,
    setCharges
  });

  const shootQuickShot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotTime.current < SHOT_DELAY) {
      return;
    }

    // Check for available charges
    const hasAvailableCharges = charges.some(charge => charge.available);
    if (!hasAvailableCharges) {
      return;
    }

    // Consume a charge
    const success = consumeCharge();
    if (!success || !parentRef.current) {
      return;
    }

    lastShotTime.current = now;

    const unitPosition = parentRef.current.position.clone();
    unitPosition.y += 1;

    const direction = new Vector3(0, 0, 1);
    direction.applyQuaternion(parentRef.current.quaternion);

    const maxRange = 40;
    const rayStart = unitPosition.clone();

    const newProjectile = {
      id: Date.now(),
      position: rayStart.clone(),
      direction: direction.clone(),
      startPosition: rayStart.clone(),
      maxDistance: maxRange,
      isQuickShot: true,
      power: 1,
      startTime: Date.now(),
      hasCollided: false
    };

    activeProjectilesRef.current.push(newProjectile);

    // Handle projectile movement and collision
    const handleProjectileUpdate = () => {
      activeProjectilesRef.current = activeProjectilesRef.current.filter(projectile => {
        const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
        
        if (distanceTraveled < projectile.maxDistance) {
          // Move projectile
          projectile.position.add(
            projectile.direction
              .clone()
              .multiplyScalar(0.5)
          );

          // Check collisions
          for (const enemy of enemyData) {
            // Skip enemies that are dying or have 0 health
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
              }

              return false;
            }
          }
          
          return true;
        }
        return false;
      });

      if (activeProjectilesRef.current.length > 0) {
        requestAnimationFrame(handleProjectileUpdate);
      }
    };

    requestAnimationFrame(handleProjectileUpdate);
  }, [parentRef, enemyData, onHit, setDamageNumbers, nextDamageNumberId, charges, consumeCharge]);

  useEffect(() => {
    console.log('QuickShot hook initialized');
    return () => {
      console.log('QuickShot hook cleanup');
    };
  }, []);

  return {
    shootQuickShot,
    activeProjectilesRef
  };
}; 