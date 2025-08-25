// src/versus/EnemyUnitProps.ts
import { Group, Vector3 } from 'three';
import { TargetId } from '@/Versus/TargetId';
import { WeaponType } from '@/Weapons/weapons';
import { PlayerInfo, SummonedUnitInfo } from './AggroSystem';

export interface EnemyUnitProps {
  id: TargetId;
  initialPosition: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (targetId: TargetId, damage: number) => void;
  // Updated to support multiple players
  playerPosition?: Vector3; // Keep for backward compatibility
  allPlayers?: PlayerInfo[]; // New prop for multiplayer support
  summonedUnits?: SummonedUnitInfo[]; // New prop for summoned units
  onAttackPlayer: (damage: number) => void;
  onAttackSummonedUnit?: (summonId: string, damage: number) => void; // New callback for attacking summoned units
  onPositionUpdate: (id: string, position: Vector3, rotation: number) => void;
  position: Vector3;
  weaponType: WeaponType;
  isAttacking?: boolean;
  forwardedRef?: React.ForwardedRef<Group>;
  isDying?: boolean;
  deathStartTime?: number;
  isFrozen?: boolean;
  isStunned?: boolean;
  isSlowed?: boolean;
  knockbackEffect?: { direction: Vector3; distance: number; progress: number; isActive: boolean } | null;
}