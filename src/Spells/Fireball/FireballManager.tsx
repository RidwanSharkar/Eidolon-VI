import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback
} from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { WeaponType } from '@/Weapons/weapons';
import * as THREE from 'three';
import { Fireball } from './Fireball';
import { FireballType } from './Fireball.types';
import { calculateDamage } from '@/Weapons/damage';
import { Enemy } from '../../Versus/enemy';


interface FireballManagerProps {
  groupRef: React.RefObject<Group>;
  currentWeapon: WeaponType;
  onAbilityUse: (weapon: WeaponType, abilityKey: 'q' | 'e') => void;
  enemyData: Enemy[];
  onFireballDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
}

const FIREBALL_DAMAGE = 30;

const FireballManager = forwardRef<{ shootFireball: () => void }, FireballManagerProps>(({
  groupRef,
  currentWeapon,
  onAbilityUse,
  enemyData,
  onFireballDamage
}, ref) => {
  const [fireballs, setFireballs] = useState<FireballType[]>([]);
  const nextFireballId = useRef(0);

  const shootFireball = useCallback(() => {
    if (!groupRef.current) return;

    const worldPosition = groupRef.current.getWorldPosition(new Vector3());
    worldPosition.y += 1.5;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(groupRef.current.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();

    const newFireball: FireballType = {
      id: nextFireballId.current++,
      position: worldPosition.clone(),
      direction: direction,
      startPosition: worldPosition.clone(),
      maxDistance: 15,
      hitTargets: new Set()
    };

    setFireballs(prev => [...prev, newFireball]);
    onAbilityUse(currentWeapon, 'e');
  }, [groupRef, currentWeapon, onAbilityUse]);

  useImperativeHandle(ref, () => ({
    shootFireball
  }));

  useFrame(() => {
    setFireballs(prev => {
      const updatedFireballs: FireballType[] = [];

      prev.forEach(fireball => {
        const movement = fireball.direction.clone().multiplyScalar(0.5);
        const newPosition = fireball.position.clone().add(movement);

        // Check distance traveled
        const distanceTraveled = newPosition.distanceTo(fireball.startPosition);
        if (distanceTraveled >= fireball.maxDistance) return;

        // Check for collisions with ALL enemies in range
        const hitEnemies = enemyData.filter(enemy => 
          !fireball.hitTargets.has(enemy.id) &&
          newPosition.distanceTo(enemy.position.clone().setY(1.5)) < 1.5
        );

        // If we hit any enemies, damage them all
        if (hitEnemies.length > 0) {
          hitEnemies.forEach(enemy => {
            const { damage, isCritical } = calculateDamage(FIREBALL_DAMAGE);
            onFireballDamage(
              enemy.id,
              damage,
              isCritical,
              enemy.position.clone().setY(1.5)
            );
            fireball.hitTargets.add(enemy.id);
          });
        }

        // Continue the fireball's path
        fireball.position = newPosition;
        updatedFireballs.push(fireball);
      });

      return updatedFireballs;
    });
  });

  return (
    <>
      {fireballs.map(fireball => (
        <Fireball
          key={fireball.id}
          position={fireball.position}
          direction={fireball.direction}
          onImpact={() => {
            setFireballs(prev => prev.filter(fb => fb.id !== fireball.id));
          }}
        />
      ))}
    </>
  );
});

FireballManager.displayName = 'FireballManager';

export default FireballManager;

