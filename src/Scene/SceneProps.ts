import { Vector3 } from 'three';
import { WeaponType, WeaponSubclass } from '../Weapons/weapons';
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
  onWeaponSelect: (weapon: WeaponType, subclass?: WeaponSubclass) => void;
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
  onStealthKillCountChange?: (count: number) => void;
  onGlacialShardKillCountChange?: (count: number) => void;
  canVault?: () => boolean;
  consumeDashCharge?: () => boolean;
  onShieldStateChange?: (hasShield: boolean, shieldAbsorption: number) => void;
  playerStunRef?: React.MutableRefObject<{ triggerStun: (duration: number) => void } | null>;
  onEviscerateLashesChange?: (charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>) => void;
  onBoneclawChargesChange?: (charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>) => void;
  onIncinerateStacksChange?: (stacks: number) => void;
}

export interface ScenePropsWithCallback extends SceneProps {
  onLevelComplete: () => void;
}