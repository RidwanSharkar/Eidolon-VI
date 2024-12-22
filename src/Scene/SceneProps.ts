import { Vector3 } from 'three';
import { WeaponType } from '../Weapons/weapons';
import { GeneratedTree } from '../Environment/terrainGenerators';
import { UnitProps } from '../Unit/UnitProps';
import * as THREE from 'three';

export interface SkeletonProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
}

export interface SceneProps {
  mountainData: { position: Vector3; scale: number; }[];
  treeData: GeneratedTree[];
  mushroomData: { position: Vector3; scale: number; }[];
  treePositions: { mainTree: Vector3; };
  interactiveTrunkColor: THREE.Color;
  interactiveLeafColor: THREE.Color;
  unitProps: UnitProps;
  onWeaponSelect: (weapon: WeaponType) => void;
  onLevelComplete?: () => void;
  onReset: () => void;
  skeletonProps: SkeletonProps[];
  killCount: number;
  onFireballDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
  spawnInterval?: number;
  maxSkeletons?: number;
  initialSkeletons?: number;
  spawnCount?: number;
}

export interface ScenePropsWithCallback extends SceneProps {
  onLevelComplete: () => void;
}