// src/weapons/weapons.ts

export type AbilityType = 'q' | 'e' | 'r' | 'passive' | 'active';
export type AbilityHotkey = 'q' | 'e' | 'r' | '1' | '2';

export enum WeaponType {
  SCYTHE = 'scythe',
  SWORD = 'sword',
  SABRES = 'sabres',
  SPEAR = 'spear',
  BOW = 'bow',
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
    normal: 37,
    range: 5.5,
    maxHitsPerSwing: 1
  },
  [WeaponType.SCYTHE]: {
    normal: 23,
    range: 4.65,
    maxHitsPerSwing: 1
  },
  [WeaponType.SABRES]: {
    normal: 17,
    range: 4,
    maxHitsPerSwing: 2
  },
  [WeaponType.SPEAR]: {
    normal: 29,
    range: 6,
    maxHitsPerSwing: 1
  },
  [WeaponType.BOW]: {
    normal: 17,
    range: 0.125,
    maxHitsPerSwing: 1
  },
};

export const DEFAULT_WEAPON_ABILITIES: Record<WeaponType, WeaponAbilities> = {
  [WeaponType.SCYTHE]: {
    q: { type: 'q', key: 'q', cooldown: 0.725, currentCooldown: 0, icon: '/icons/q1.svg', maxCooldown: 1, name: 'Scythe Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 0.725, currentCooldown: 0, icon: '/icons/e1.svg', maxCooldown: 0.6675, name: 'Scythe E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 2.05, currentCooldown: 0, icon: '/icons/r1.svg', maxCooldown: 1.8, name: 'Boneclaw', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0.725, currentCooldown: 0, icon: '/icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false },
    active: { type: 'active',  key: '2', cooldown: 4.5, currentCooldown: 0,  icon: '/icons/a1.svg', maxCooldown: 4.5, name: 'Summon Skeleton', isUnlocked: false}
  }, 

  [WeaponType.SWORD]: {
    q: { type: 'q', key: 'q', cooldown: 1.1, currentCooldown: 0, icon: '/icons/q2.svg', maxCooldown: 1.08, name: 'Sword Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 3.85, currentCooldown: 0, icon: '/icons/e2.svg', maxCooldown: 4, name: 'Sword E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 1.275, currentCooldown: 0, icon: '/icons/r2.svg', maxCooldown: 1.75, name: 'Oathstrike', isUnlocked: false },
    passive: {  type: 'passive', key: '1',  cooldown: 0,  currentCooldown: 0,  icon: '/icons/p2.svg', maxCooldown: 0, name: 'Crusader Aura', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: '/icons/a2.svg', maxCooldown: 0, name: 'Sword Active', isUnlocked: false }
  },
  
  [WeaponType.SABRES]: {
    q: { type: 'q', key: 'q', cooldown: 0.625, currentCooldown: 0, icon: '/icons/q3.svg', maxCooldown: 0.9, name: 'Sabres Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 6, currentCooldown: 0, icon: '/icons/e3.svg', maxCooldown: 10, name: 'Shadow Strike', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 10, currentCooldown: 0, icon: '/icons/r3.svg', maxCooldown: 10, name: 'Blizzard', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: '/icons/p3.svg', maxCooldown: 0, name: 'Frost Lance', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: '/icons/a3.svg', maxCooldown: 0, name: 'Orb Shield', isUnlocked: false }
  },

  [WeaponType.SPEAR]: {
    q: { type: 'q', key: 'q', cooldown: 0.775, currentCooldown: 0, icon: '/icons/q4.svg', maxCooldown: 1, name: 'Spear Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 5, currentCooldown: 0, icon: '/icons/e4.svg', maxCooldown: 5, name: 'Spear E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 2.5, currentCooldown: 0, icon: '/icons/r4.svg', maxCooldown: 4.5, name: 'Pyroclast', isUnlocked: false },
    passive: { 
      type: 'passive', 
      key: '1', 
      cooldown: 0, 
      currentCooldown: 0, 
      icon: '/icons/p4.svg', 
      maxCooldown: 0, 
      name: 'Reignite', 
      isUnlocked: false 
    },
    active: { type: 'active', key: '2', cooldown: 4, currentCooldown: 0, icon: '/icons/a4.svg', maxCooldown: 8, name: 'Breach', isUnlocked: false }
  },

  [WeaponType.BOW]: {
    q: { type: 'q', key: 'q', cooldown: 0.25, currentCooldown: 0, icon: '/icons/q5.svg', maxCooldown: 1, name: 'Quick Shot', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 0.5, currentCooldown: 0, icon: '/icons/e5.svg', maxCooldown: 1, name: 'Sabres E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 5, currentCooldown: 0, icon: '/icons/r5.svg', maxCooldown: 8, name: 'Vault', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: '/icons/p5.svg', maxCooldown: 0, name: 'Venom Shots', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 5, currentCooldown: 0, icon: '/icons/a5.svg', maxCooldown: 5, name: 'Elemental Shots', isUnlocked: false }
  },
}; 

export const getModifiedCooldown = (weapon: WeaponType, ability: keyof WeaponAbilities, abilities: WeaponInfo): number => {
  const baseAbility = DEFAULT_WEAPON_ABILITIES[weapon][ability];
  
  // Check for Crusader Aura passive and modify Sword Q cooldown
  if (weapon === WeaponType.SWORD && 
      ability === 'q' && 
      abilities[WeaponType.SWORD].passive.isUnlocked) {
    return 0.7; // OP w/ chain lightning
  }
  
  return baseAbility.cooldown;
}; 

interface AbilityTooltip {
  title: string;
  description: string;
  cost?: number | string;  
  range?: number | string;
  damage?: number | string; 
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
      title: "Dragon Claw",
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
      title: "Shadow Strike",
      description: "Enter stealth for 10 seconds. Breaking stealth with an attack deals +100 bonus damage. If you are behind the target, this effect is doubled. If shadowstrike lands a killing blow on an enemy, you regain health.",
      cost: "Cooldown: 10 seconds",
      range: "Self",
      damage: "Bonus Damage: 100"
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
  [WeaponType.SPEAR]: {
    q: {
      title: "Spear Thrust",
      description: "Long-range piercing thrust attack",
      cost: "Cooldown: 0.85 seconds",
      range: "Range: 6 feet",
      damage: "Damage: 27"
    },
    e: {
      title: "Whirlwind",
      description: "Spin attack that hits all surrounding enemies",
      cost: "Cooldown: 0.95 seconds",
      range: "Range: 5.75 feet",
      damage: "Damage: 31"
    },
    r: {
      title: "Pyroclast",
      description: "Charge and release a powerful missile that deals damage based on charge time.",
      damage: "150-600",
      range: "30",
    },
    passive: {
      title: "Reignite",
      description: "Passive: Restores 1 orb charge whenever you kill an enemy"
    },
    active: {
      title: "Breach",
      description: "Quickly dash forward, covering significant distance to engage or escape combat.",
      cost: "Cooldown: 8 seconds",
      range: "Distance: 10 feet",
    }
  },
  [WeaponType.BOW]: {
    q: {
      title: "Quick Shot",
      description: "Rapidly fire an ethereal arrow",
      cost: "Cooldown: 0.85 seconds",
      range: "Range: 80 feet",
      damage: "Damage: 17"
    },
    e: {
      title: "Power Shot",
      description: "Charge a powerful shot that deals increased damage based on charge time. Fully charged shots pierce through enemies.",
      cost: "Cooldown: 0.75 seconds",
      range: "Range: 80 feet",
      damage: "Damage: 53-125"
    },
    r: {
      title: "Vault",
      description: "Quickly dash backwards",
      cost: "Cooldown: 8 seconds",
      range: "Range: 60 feet",
      damage: "Damage: 85"
    },
    passive: {
      title: "Venom Shots",
      description: "Passive: Every 3rd shot that hits a target deals an additional 70 damage."
    },
    active: {
      title: "Elemental Shots",
      description: "Fully charged shots deal an additional 100 damage. Non-fully charged shots deal 20 additional damage and call down a lightning bolt on the target.",
      cost: "Passive",
      damage: "+100 to fully charged shots, +20 to regular shots"
    }
  },
}; 

export const WEAPON_ORB_COUNTS: Record<WeaponType, number> = {
  [WeaponType.SCYTHE]: 8,
  [WeaponType.SWORD]: 4,
  [WeaponType.SABRES]: 6,
  [WeaponType.SPEAR]: 8,
  [WeaponType.BOW]: 6,
}; 
