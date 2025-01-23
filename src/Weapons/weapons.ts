// src/weapons/weapons.ts

export type AbilityType = 'q' | 'e' | 'r' | 'passive' | 'active';
export type AbilityHotkey = 'q' | 'e' | 'r' | '1' | '2';

export enum WeaponType {
  SCYTHE = 'scythe',
  SWORD = 'sword',
  SABRES = 'sabres',
  SABRES2 = 'sabres2',
  STAFF = 'staff'
}

export interface AbilityInfo {
  type: AbilityType;
  key: AbilityHotkey;
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
  active: AbilityInfo;
}

export interface Weapon {
  type: WeaponType;
  abilities: WeaponAbilities;
  damage: WeaponDamage;
}

export type WeaponInfo = Record<WeaponType, WeaponAbilities>;

export const WEAPON_DAMAGES: Record<WeaponType, WeaponDamage> = {
  [WeaponType.SWORD]: {
    normal: 31,
    range: 5.425,
    maxHitsPerSwing: 1
  },
  [WeaponType.SCYTHE]: {
    normal: 23,
    range: 4.375,
    maxHitsPerSwing: 1
  },
  [WeaponType.SABRES]: {
    normal: 17,
    range: 4,
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

export const DEFAULT_WEAPON_ABILITIES: Record<WeaponType, WeaponAbilities> = {
  [WeaponType.SCYTHE]: {
    q: { type: 'q', key: 'q', cooldown: 0.725, currentCooldown: 0, icon: '/Eidolon/icons/q1.svg', maxCooldown: 1, name: 'Scythe Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 0.725, currentCooldown: 0, icon: '/Eidolon/icons/e1.svg', maxCooldown: 0.6675, name: 'Scythe E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 1.95, currentCooldown: 0, icon: '/Eidolon/icons/r1.svg', maxCooldown: 1.8, name: 'Boneclaw', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0.75, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false },
    active: { 
      type: 'active', 
      key: '2', 
      cooldown: 4.5, 
      currentCooldown: 0, 
      icon: '/Eidolon/icons/a1.svg', 
      maxCooldown: 4.5, 
      name: 'Summon Skeleton', 
      isUnlocked: false 
    }
  },

  [WeaponType.SWORD]: {
    q: { type: 'q', key: 'q', cooldown: 0.925, currentCooldown: 0, icon: '/Eidolon/icons/q2.svg', maxCooldown: 1.08, name: 'Sword Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 3.9, currentCooldown: 0, icon: '/Eidolon/icons/e2.svg', maxCooldown: 4, name: 'Sword E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 1.375, currentCooldown: 0, icon: '/Eidolon/icons/r2.svg', maxCooldown: 1.75, name: 'Oathstrike', isUnlocked: false },
    passive: { 
      type: 'passive', 
      key: '1', 
      cooldown: 0, 
      currentCooldown: 0, 
      icon: '/Eidolon/icons/p2.svg', 
      maxCooldown: 0, 
      name: 'Crusader Aura', 
      isUnlocked: false 
    },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/a2.svg', maxCooldown: 0, name: 'Sword Active', isUnlocked: false }
  },
  
  [WeaponType.SABRES]: {
    q: { type: 'q', key: 'q', cooldown: 0.6, currentCooldown: 0, icon: '/Eidolon/icons/q3.svg', maxCooldown: 0.9, name: 'Sabres Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 0.75, currentCooldown: 0, icon: '/Eidolon/icons/e3.svg', maxCooldown: 1, name: 'Sabres E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 10, currentCooldown: 0, icon: '/Eidolon/icons/r3.svg', maxCooldown: 10, name: 'Blizzard', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/p3.svg', maxCooldown: 0, name: 'Frost Lance', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/a3.svg', maxCooldown: 0, name: 'Orb Shield', isUnlocked: false }
  },
  [WeaponType.SABRES2]: {
    q: { type: 'q', key: 'q', cooldown: 0.70, currentCooldown: 0, icon: '/Eidolon/icons/q4.svg', maxCooldown: 1.5, name: 'Sabres2 Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 1.5, currentCooldown: 0, icon: '/Eidolon/icons/e4.svg', maxCooldown: 6, name: 'Firebeam', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 15, currentCooldown: 0, icon: '/Eidolon/icons/r4.svg', maxCooldown: 15, name: 'Blizzard', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0.5, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/s4.svg', maxCooldown: 0, name: 'Sabres2 Active', isUnlocked: false }
  },
  [WeaponType.STAFF]: {
    q: { type: 'q', key: 'q', cooldown: 0.8, currentCooldown: 0, icon: '/Eidolon/icons/q4.svg', maxCooldown: 1.0, name: 'Staff Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 2, currentCooldown: 0, icon: '/Eidolon/icons/e4.svg', maxCooldown: 0, name: 'Firebeam', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 15, currentCooldown: 0, icon: '/Eidolon/icons/r4.svg', maxCooldown: 15, name: 'Blizzard', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0.5, currentCooldown: 0, icon: '/Eidolon/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: '/Eidolon/icons/s4.svg', maxCooldown: 0, name: 'Staff Active', isUnlocked: false }
  }
}; 

export const getModifiedCooldown = (weapon: WeaponType, ability: keyof WeaponAbilities, abilities: WeaponInfo): number => {
  const baseAbility = DEFAULT_WEAPON_ABILITIES[weapon][ability];
  
  // Check for Crusader Aura passive and modify Sword Q cooldown
  if (weapon === WeaponType.SWORD && 
      ability === 'q' && 
      abilities[WeaponType.SWORD].passive.isUnlocked) {
    return 0.69;
  }
  
  return baseAbility.cooldown;
}; 

interface AbilityTooltip {
  title: string;
  description: string;
  cost?: number | string;  // Optional since passives might not have cost
  range?: number | string; // Optional since some abilities might not have range
  damage?: number | string; // Optional for non-damaging abilities
}

export const WEAPON_ABILITY_TOOLTIPS: Record<WeaponType, Record<keyof WeaponAbilities, AbilityTooltip>> = {
  [WeaponType.SCYTHE]: {
    q: {
      title: "Scythe",
      description: "Swift reaping attack in an arc",
      cost: "Cooldown: 0.75 seconds",
      range: "Range: 4.2 feet",
      damage: "Damage: 17"
    },
    e: {
      title: "Entropic Bolt",
      description: "Consumes 1 orb charge to fire a ball of chaotic energy at a single target.",
      cost: "Cooldown: 0.75 seconds",
      range: "Range: 80 feet",
      damage: "Damage: 53"
    },
    r: {
      title: "Bone Claw",
      description: "Summon skeletal lazer claws to damage enemies within mid-range - 2 second cooldown.",
      cost: "Cooldown: 2.5 seconds",
      range: "Range: 8.0 feet",
      damage: "Damage: 67"
    },
    passive: {
      title: "Reanimate",
      description: "Active: Consumes 1 Orb Charge to heal for 7 HP - 0.75 second cooldown."
    },
    active: {
      title: "Chaos Totem",
      description: "Active: Summons a totem that fights by your side for 12 seconds, shooting rapid bolts at enemies within range - 5 second cooldown.",
      cost: "Cooldown: 15 seconds"
    }
  },
  [WeaponType.SWORD]: {
    q: {
      title: "Greatsword",
      description: "Slow powerful swing in a wide arc.",
      cost: "1.1",
      range: "6.5",
      damage: "29"
    },
    e: {
      title: "Divine Smite",
      description: "Unleashes an extra strike that calls down radiant energy upon nearby enemies.",
      cost: "30",
      range: "4.0",
      damage: "35"
    },
    r: {
      title: "Oathstrike",
      description: "Active: Consumes 4 Orb Charges to unleash a devastating strike in an arc that heals the wielder if at least one enemy is hit.",
      cost: "50",
      range: "7.0",
      damage: "65"
    },
    passive: {
      title: "Crusader Aura",
      description: "Passive: Increases attack speed by 30% and gives attacks a 20% chance to heal for 3 HP."
    },
    active: {
      title: "Chain Lightning",
      description: "Passive: Sword attacks conduct electricity, bouncing lightning damage to nearby enemies on every hit."
    }
  },
  [WeaponType.SABRES]: {
    q: {
      title: "Twin Sabres",
      description: "Fast dual-wielding slashes at close range",
      cost: "12",
      range: "3.8",
      damage: "13"
    },
    e: {
      title: "Etherbow",
      description: "Conjures an arrow that deals damage based on charging time. Fully charged shots are guarnateed to critical hit.",
      cost: " ",
      range: "Range: 80 feet",
      damage: "Damage: 53"
    },
    r: {
      title: "Blizzard",
      description: "Active: Unleash a devastating ice storm to nearby enemies for 6 seconds - 10 second cooldown.",
      cost: "60",
      range: "12.0",
      damage: "85"
    },
    passive: {
      title: "Frost Lance",
      description: "Active: Consumes 1 Orb Charge to fire a beam of ice that piereces through all enemies in a line - 0.5 second cooldown."
    },
    active: {
      title: "Avalanche",
      description: "Passive: Melee attacks passively consume orb charges to extra damage based on the number of charges available."
    }
  },
  // Placeholder tooltips for test weapons
  [WeaponType.SABRES2]: {
    q: { title: "Test", description: "Test ability" },
    e: { title: "Test", description: "Test ability" },
    r: { title: "Test", description: "Test ability" },
    passive: { title: "Test", description: "Test ability" },
    active: { title: "Test", description: "Test ability" }
  },
  [WeaponType.STAFF]: {
    q: { title: "Test", description: "Test ability" },
    e: { title: "Test", description: "Test ability" },
    r: { title: "Test", description: "Test ability" },
    passive: { title: "Test", description: "Test ability" },
    active: { title: "Test", description: "Test ability" }
  }
}; 
