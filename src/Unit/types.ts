import { Group, Vector3 } from 'three';
import { WeaponInfo, WeaponType } from '../Weapons/weapons';
import { Enemy } from '@/Versus/enemy';

type ActiveEffect = {
  id: number;
  type: string;
  position: Vector3;
  direction: Vector3;
};

export interface UseAbilityKeysProps {
  keys: boolean;
  groupRef: React.RefObject<Group>;
  currentWeapon: WeaponType;
  abilities: WeaponInfo;
  setActiveEffects: React.Dispatch<React.SetStateAction<ActiveEffect[]>>;
  onAbilityUse: (weapon: WeaponType, abilityKey: 'q' | 'e' | 'r') => void;
  enemyData: Enemy[];
  onHit: (targetId: string, damage: number) => void;
} 