// src/unit/UnitProps.ts
import { RefObject } from 'react';
import { Vector3, Group } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { WeaponType, WeaponSubclass, WeaponInfo, AbilityType } from '../Weapons/weapons';


// Define internal summoned unit interface (separate from AggroSystem)
export interface AllSummonedUnitInfo {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
  type: 'skeleton' | 'elemental' | 'abyssal-abomination';
  ownerId?: string;
}

export interface Enemy {
  id: string;
  position: Vector3;
  initialPosition: Vector3;
  rotation: number;
  health: number;
  maxHealth: number;
  isDying?: boolean;
  deathStartTime?: number;
}

interface FireballManager {
  shootFireball: () => void;
  cleanup: () => void;
}

export interface UnitProps {
  onHit: (targetId: string, damage: number) => void;
  onHealthChange?: (newHealth: number) => void;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
  onWeaponSelect: (weapon: WeaponType, subclass?: WeaponSubclass) => void;
  health: number;
  maxHealth: number;
  isPlayer?: boolean;
  abilities: WeaponInfo;
  onAbilityUse: (weapon: WeaponType, abilityType: AbilityType) => void;
  onResetAbilityCooldown?: (weapon: WeaponType, abilityType: AbilityType) => void;
  onPositionUpdate: (position: Vector3, isStealthed?: boolean, rotation?: Vector3, movementDirection?: Vector3) => void;
  enemyData: Enemy[];
  onFireballDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
  onDamage: (damage: number) => void;
  onEnemyDeath: () => void;
  fireballManagerRef?: React.MutableRefObject<FireballManager | null>;
  onSmiteDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
  parentRef?: RefObject<Group>;
  level?: number; // Add level prop for Crossentropy Bolt feature
  // Aegis-related props
  isAegisActive?: boolean;
  onAegisDamageBlock?: (damage: number) => boolean;
  onAegisStateChange?: (active: boolean) => void;
  // Deep Freeze related props
  onFreezeStateCheck?: (enemyId: string) => boolean;
  onFrozenEnemyIdsUpdate?: (frozenEnemyIds: string[]) => void;
  // Slow effect related props
  onApplySlowEffect?: (enemyId: string, duration?: number) => void;
  // Stun effect related props
  onApplyStunEffect?: (enemyId: string, duration?: number) => void;
  // Knockback effect related props
  onApplyKnockbackEffect?: (enemyId: string, direction: Vector3, distance: number) => void;
  // Kill count reporting props
  onStealthKillCountChange?: (count: number) => void;
  onGlacialShardKillCountChange?: (count: number) => void;
  // Skeleton count reporting props  
  onSkeletonCountChange?: (count: number) => void;
  // Dash charge props
  canVault?: () => boolean;
  consumeDashCharge?: () => boolean;
  // Glacial Shard shield props
  glacialShardRef?: React.RefObject<{ absorbDamage: (damage: number) => number; hasShield: boolean; shieldAbsorption: number; shootGlacialShard?: () => boolean; getKillCount?: () => number }>;
  onShieldStateChange?: (hasShield: boolean, shieldAbsorption: number) => void;
  // Summoned units callback for aggro system
  onSummonedUnitsUpdate?: (units: AllSummonedUnitInfo[]) => void;
  // Player stun effect props
  playerStunRef?: React.MutableRefObject<{ triggerStun: (duration: number) => void } | null>;
  // Eviscerate charges callback
  onEviscerateLashesChange?: (charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>) => void;
  // Boneclaw charges callback
  onBoneclawChargesChange?: (charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>) => void;
  // Incinerate stacks callback for Pyro Spear
  onIncinerateStacksChange?: (stacks: number) => void;
}