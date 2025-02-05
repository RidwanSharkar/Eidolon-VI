// src/unit/UnitProps.ts
import { Vector3, Group } from 'three';
import { WeaponType, AbilityType } from '../Weapons/weapons';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Enemy } from '../Versus/enemy';
import { RefObject } from 'react';

export interface AbilityButton {
  type: 'q' | 'e' | 'r' | 'passive' | 'active';
  key: 'q' | 'e' | 'r' | '1' | '2';
  cooldown: number;
  currentCooldown: number;
  icon: string;
  maxCooldown: number;
  name: string;
  isUnlocked: boolean;
}

export interface WeaponAbilities {
  q: AbilityButton;
  e: AbilityButton;
  r: AbilityButton;
  passive: AbilityButton;
  active: AbilityButton;
}

export type WeaponInfo = Record<WeaponType, WeaponAbilities>;

interface FireballManager {
  shootFireball: () => void;
  cleanup: () => void;
}

export interface UnitProps {
  onHit: (targetId: string, damage: number) => void;
  onHealthChange?: (newHealth: number) => void;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  currentWeapon: WeaponType;
  onWeaponSelect: (weapon: WeaponType) => void;
  health: number;
  maxHealth: number;
  isPlayer?: boolean;
  abilities: WeaponInfo;
  onAbilityUse: (weapon: WeaponType, abilityType: AbilityType) => void;
  onPositionUpdate: (position: Vector3, isStealthed?: boolean) => void;
  enemyData: Enemy[];
  onFireballDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
  onDamage: (damage: number) => void;
  onEnemyDeath: () => void;
  fireballManagerRef?: React.MutableRefObject<FireballManager | null>;
  onSmiteDamage: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
  parentRef?: RefObject<Group>;
}