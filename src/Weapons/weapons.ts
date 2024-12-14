export enum WeaponType {
  SCYTHE = 'scythe',
  SWORD = 'sword',
  SABRES = 'sabres',
  SABRES2 = 'sabres2' 
}

export interface AbilityInfo {
  key: 'q' | 'e' | 'r' | 'passive';
  cooldown: number;
  currentCooldown: number;
  icon: string;
  maxCooldown: number;
  name: string;
}

export interface WeaponDamage {
  normal: number;
  range: number;
  maxHitsPerSwing?: number;
}

export interface WeaponAbilities {
  q: AbilityInfo;
  e: AbilityInfo;
  r: AbilityInfo;
  passive: AbilityInfo;
}

export interface Weapon {
  type: WeaponType;
  abilities: WeaponAbilities;
  damage: WeaponDamage;
}

export type WeaponInfo = Record<WeaponType, WeaponAbilities>;

export const WEAPON_DAMAGES: Record<WeaponType, WeaponDamage> = {
  [WeaponType.SWORD]: {
    normal: 17,
    range: 5.5,
    maxHitsPerSwing: 1
  },
  [WeaponType.SCYTHE]: {
    normal: 12,
    range: 4.5,
    maxHitsPerSwing: 1
  },
  [WeaponType.SABRES]: {
    normal: 10,
    range: 3.5,
    maxHitsPerSwing: 2
  },
  [WeaponType.SABRES2]: {
    normal: 15,
    range: 4.0,
    maxHitsPerSwing: 2
  }
};

// reduntant current cooldown ?
export const DEFAULT_WEAPON_ABILITIES: Record<WeaponType, WeaponAbilities> = {
  [WeaponType.SCYTHE]: {
    q: { key: 'q', cooldown: 0.9, currentCooldown: 0, icon: '/Eidolon/icons/q1.svg', maxCooldown: 1, name: 'Scythe Q' },
    e: { key: 'e', cooldown: 0.65, currentCooldown: 0, icon: '/Eidolon/icons/e1.svg', maxCooldown: 0.75, name: 'Scythe E' },
    r: { key: 'r', cooldown: 8, currentCooldown: 0, icon: '/Eidolon/icons/r1.svg', maxCooldown: 8, name: 'Bonespear' },
    passive: { key: 'passive', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate' }
  },
  [WeaponType.SWORD]: {
    q: { key: 'q', cooldown: 1.0, currentCooldown: 0, icon: '/Eidolon/icons/q2.svg', maxCooldown: 1.08, name: 'Sword Q' },
    e: { key: 'e', cooldown: 3., currentCooldown: 0, icon: '/Eidolon/icons/e2.svg', maxCooldown: 4, name: 'Sword E' },
    r: { key: 'r', cooldown: 12, currentCooldown: 0, icon: '/Eidolon/icons/r2.svg', maxCooldown: 12, name: 'Retribute' },
    passive: { key: 'passive', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/p2.svg', maxCooldown: 0, name: 'Divine Shield' }
  },
  [WeaponType.SABRES]: {
    q: { key: 'q', cooldown: 0.85, currentCooldown: 0, icon: '/Eidolon/icons/q3.svg', maxCooldown: 0.9, name: 'Sabres Q' },
    e: { key: 'e', cooldown: 0.85, currentCooldown: 0, icon: '/Eidolon/icons/e3.svg', maxCooldown: 1, name: 'Sabres E' },
    r: { key: 'r', cooldown: 15, currentCooldown: 0, icon: '/Eidolon/icons/r3.svg', maxCooldown: 15, name: 'Blizzard' },
    passive: { key: 'passive', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/p3.svg', maxCooldown: 0, name: 'Rapidfire' }
  },
  [WeaponType.SABRES2]: {
    q: { key: 'q', cooldown: 1.5, currentCooldown: 0, icon: '/Eidolon/icons/q4.svg', maxCooldown: 1.5, name: 'Sabres2 Q' },
    e: { key: 'e', cooldown: 6, currentCooldown: 0, icon: '/Eidolon/icons/e4.svg', maxCooldown: 6, name: 'Sabres2 E' },
    r: { key: 'r', cooldown: 15, currentCooldown: 0, icon: '/Eidolon/icons/r4.svg', maxCooldown: 15, name: 'Blizzard' },
    passive: { key: 'passive', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/p4.svg', maxCooldown: 0, name: 'Rapidfire' }
  }
}; 