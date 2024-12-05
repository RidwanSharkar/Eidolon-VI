import { WeaponType, WeaponDamages, WeaponCooldowns } from '../types/weapons';

export const WEAPON_DAMAGES: WeaponDamages = {
  [WeaponType.SWORD]: { normal: 17, special: 20 },
  [WeaponType.SCYTHE]: { normal: 12, special: 16 },
  [WeaponType.SABRES]: { normal: 10, special: 50 },
  [WeaponType.SABRES2]: { normal: 15, special: 25 }
};
//unused
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