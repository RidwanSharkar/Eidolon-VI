import { Vector3, Color } from 'three';
import { GeneratedTree } from '../Environment/terrainGenerators';
import { UnitProps } from '../Unit/UnitProps';

export interface SkeletonProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
}

export interface SceneProps {
  mountainData: Array<{
    position: Vector3;
    scale: number;
  }>;
  treeData: GeneratedTree[];
  mushroomData: Array<{
    position: Vector3;
    scale: number;
  }>;
  treePositions: {
    mainTree: Vector3;
  };
  interactiveTrunkColor: Color;
  interactiveLeafColor: Color;
  unitProps: UnitProps;
  skeletonProps: SkeletonProps[];
  killCount: number;
  spawnInterval?: number;
  maxSkeletons?: number;
  initialSkeletons?: number;
  spawnCount?: number;
  onFireballDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
  onLevelComplete?: () => void;
}