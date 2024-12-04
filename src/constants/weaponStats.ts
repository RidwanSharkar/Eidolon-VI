import { WeaponType, WeaponDamages, WeaponCooldowns } from '../types/weapons';

export const WEAPON_DAMAGES: WeaponDamages = {
  [WeaponType.SWORD]: { normal: 14, special: 25 },
  [WeaponType.SCYTHE]: { normal: 10, special: 16 },
  [WeaponType.SABRES]: { normal: 7, special: 40 },
  [WeaponType.SABRES2]: { normal: 12, special: 40 }
};

export const WEAPON_COOLDOWNS: WeaponCooldowns = {
  [WeaponType.SCYTHE]: {
    primary: 0.75,
    secondary: 0.75
  },
  [WeaponType.SWORD]: {
    primary: 0.75,
    secondary: 3.0
  },
  [WeaponType.SABRES]: {
    primary: 0.5,
    secondary: 0.5
  },
  [WeaponType.SABRES2]: {
    primary: 0.5,
    secondary: 0.5
  }
}; 