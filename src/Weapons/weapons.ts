export enum WeaponType {
  SCYTHE = 'scythe',
  SWORD = 'sword',
  SABRES = 'sabres',
  SABRES2 = 'sabres2',
  STAFF = 'staff'
}

export interface AbilityInfo {
  key: 'q' | 'e' | 'r' | 'passive' | '1';
  cooldown: number;
  currentCooldown: number;
  icon: string;
  maxCooldown: number;
  name: string;
  isUnlocked: boolean;
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
    normal: 29,
    range: 6.5,
    maxHitsPerSwing: 1
  },
  [WeaponType.SCYTHE]: {
    normal: 17,
    range: 4.5,
    maxHitsPerSwing: 1
  },
  [WeaponType.SABRES]: {
    normal: 13,
    range: 3.5,
    maxHitsPerSwing: 2
  },
  
  [WeaponType.SABRES2]: {
    normal: 11,
    range: 4,
    maxHitsPerSwing: 2
  },
  [WeaponType.STAFF]: {
    normal: 15,
    range: 4,
    maxHitsPerSwing: 1
  }
};

// reduntant current cooldown /max?
export const DEFAULT_WEAPON_ABILITIES: Record<WeaponType, WeaponAbilities> = {
  [WeaponType.SCYTHE]: {
    q: { key: 'q', cooldown: 0.8, currentCooldown: 0, icon: '/Eidolon/icons/q1.svg', maxCooldown: 1, name: 'Scythe Q', isUnlocked: true },
    e: { key: 'e', cooldown: 0.7, currentCooldown: 0, icon: '/Eidolon/icons/e1.svg', maxCooldown: 0.65, name: 'Scythe E', isUnlocked: true },
    r: { key: 'r', cooldown: 2.5, currentCooldown: 0, icon: '/Eidolon/icons/r1.svg', maxCooldown: 1, name: 'Boneclaw', isUnlocked: false },
    passive: { key: '1', cooldown: 0.5, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false }
  },
  [WeaponType.SWORD]: {
    q: { key: 'q', cooldown: 1., currentCooldown: 0, icon: '/Eidolon/icons/q2.svg', maxCooldown: 1.08, name: 'Sword Q', isUnlocked: true },
    e: { key: 'e', cooldown: 3., currentCooldown: 0, icon: '/Eidolon/icons/e2.svg', maxCooldown: 4, name: 'Sword E', isUnlocked: true },
    r: { key: 'r', cooldown: 25, currentCooldown: 0, icon: '/Eidolon/icons/r2.svg', maxCooldown: 5, name: 'Retribute', isUnlocked: false },
    passive: { key: '1', cooldown: 0.5, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false }
  },
  [WeaponType.SABRES]: {
    q: { key: 'q', cooldown: 0.575, currentCooldown: 0, icon: '/Eidolon/icons/q3.svg', maxCooldown: 0.9, name: 'Sabres Q', isUnlocked: true },
    e: { key: 'e', cooldown: 0.50, currentCooldown: 0, icon: '/Eidolon/icons/e3.svg', maxCooldown: 1, name: 'Sabres E', isUnlocked: true },
    r: { key: 'r', cooldown: 9.5, currentCooldown: 0, icon: '/Eidolon/icons/r3.svg', maxCooldown: 5, name: 'Blizzard', isUnlocked: false },
    passive: { key: '1', cooldown: 0.5, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false }
  },
  [WeaponType.SABRES2]: {
    q: { key: 'q', cooldown: 0.70, currentCooldown: 0, icon: '/Eidolon/icons/q4.svg', maxCooldown: 1.5, name: 'Sabres2 Q', isUnlocked: true },
    e: { key: 'e', cooldown: 1.5, currentCooldown: 0, icon: '/Eidolon/icons/e4.svg', maxCooldown: 6, name: 'Firebeam', isUnlocked: true },
    r: { key: 'r', cooldown: 15, currentCooldown: 0, icon: '/Eidolon/icons/r4.svg', maxCooldown: 15, name: 'Blizzard', isUnlocked: false },
    passive: { key: '1', cooldown: 0.5, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false }
  },
  [WeaponType.STAFF]: {
    q: { key: 'q', cooldown: 0.8, currentCooldown: 0, icon: '/Eidolon/icons/q4.svg', maxCooldown: 1.0, name: 'Staff Q', isUnlocked: true },
    e: { key: 'e', cooldown: 2, currentCooldown: 0, icon: '/Eidolon/icons/e4.svg', maxCooldown: 0, name: 'Firebeam', isUnlocked: true },
    r: { key: 'r', cooldown: 15, currentCooldown: 0, icon: '/Eidolon/icons/r4.svg', maxCooldown: 15, name: 'Blizzard', isUnlocked: false },
    passive: { key: '1', cooldown: 0.5, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false }
  }
}; 