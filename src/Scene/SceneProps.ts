import { Vector3 } from 'three';
import { WeaponType } from '../Weapons/weapons';
import { UnitProps } from '../Unit/UnitProps';


export interface SkeletonProps {
  id: string;
  position: Vector3;
  rotation: number;
  initialPosition: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
}

export interface SceneProps {
  unitProps: UnitProps;
  onWeaponSelect: (weapon: WeaponType) => void;
  onLevelComplete?: () => void;
  onReset: () => void;
  skeletonProps: SkeletonProps[];
  killCount: number;
  onAbilityUnlock: (abilityType: 'r' | 'passive' | 'active') => void;
  onFireballDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
  spawnInterval?: number;
  maxSkeletons?: number;
  initialSkeletons?: number;
  spawnCount?: number;
  bossActive: boolean;
}

export interface ScenePropsWithCallback extends SceneProps {
  onLevelComplete: () => void;
}