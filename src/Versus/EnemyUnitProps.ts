// src/versus/EnemyUnitProps.ts
import { Group, Vector3 } from 'three';
import { TargetId } from '@/Versus/TargetId';
import { WeaponType } from '@/Weapons/weapons';

   export interface EnemyUnitProps {
     id: TargetId;
     initialPosition: Vector3;
     health: number;
     maxHealth: number;
     onTakeDamage: (targetId: TargetId, damage: number) => void;
     playerPosition: Vector3;
     onAttackPlayer: (damage: number) => void;
     onPositionUpdate: (id: string, position: Vector3, rotation: number) => void;
     position: Vector3;
     weaponType: WeaponType;
     isAttacking?: boolean;
     forwardedRef?: React.ForwardedRef<Group>;
     isDying?: boolean;
     deathStartTime?: number;
   }