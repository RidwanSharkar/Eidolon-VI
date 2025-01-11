   // src/types/SkeletalMageProps.ts
   import { Vector3 } from 'three';
   import { WeaponType } from '../../Weapons/weapons';

   export interface SkeletalMageProps {
     id: string;
     initialPosition: Vector3;
     position: Vector3;
     health: number;
     maxHealth: number;
     onTakeDamage: (id: string, damage: number) => void;
     onPositionUpdate: (id: string, position: Vector3) => void;
     playerPosition: Vector3;
     onAttackPlayer: (damage: number) => void;
     weaponType: WeaponType;
     isDying?: boolean;
   }