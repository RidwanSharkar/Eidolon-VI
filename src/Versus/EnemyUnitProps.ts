   // src/types/EnemyUnitProps.ts

   import { Vector3 } from 'three';
   import { TargetId } from './TargetId';
   import * as THREE from 'three';

   export interface EnemyUnitProps {
     id: TargetId;
     initialPosition: Vector3;
     health: number;
     maxHealth: number;
     onTakeDamage: (targetId: TargetId, damage: number) => void;
     playerPosition: Vector3;
     onAttackPlayer: (damage: number) => void;
     onPositionUpdate: (id: string, position: Vector3) => void;
     position: THREE.Vector3;
   }