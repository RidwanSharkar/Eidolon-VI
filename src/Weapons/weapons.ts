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
    normal: 41,
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
    normal: 31,
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
    q: { type: 'q', key: 'q', cooldown: 0.685, currentCooldown: 0, icon: 'icons/q1.svg', maxCooldown: 1, name: 'Scythe Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 0.65, currentCooldown: 0, icon: 'icons/e1.svg', maxCooldown: 0.6675, name: 'Scythe E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 2.05, currentCooldown: 0, icon: 'icons/r1.svg', maxCooldown: 1.8, name: 'Boneclaw', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0.725, currentCooldown: 0, icon: 'icons/p1.svg', maxCooldown: 0, name: 'Reanimate', isUnlocked: false },
    active: { type: 'active',  key: '2', cooldown: 4.5, currentCooldown: 0,  icon: 'icons/a1.svg', maxCooldown: 4.5, name: 'Summon Skeleton', isUnlocked: false}
  }, 

  [WeaponType.SWORD]: {
    q: { type: 'q', key: 'q', cooldown: 1.125, currentCooldown: 0, icon: 'icons/q2.svg', maxCooldown: 1.08, name: 'Sword Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 3.85, currentCooldown: 0, icon: 'icons/e2.svg', maxCooldown: 4, name: 'Sword E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 1.275, currentCooldown: 0, icon: 'icons/r2.svg', maxCooldown: 1.75, name: 'Oathstrike', isUnlocked: false },
    passive: {  type: 'passive', key: '1',  cooldown: 0,  currentCooldown: 0,  icon: 'icons/p2.svg', maxCooldown: 0, name: 'Crusader Aura', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: 'icons/a2.svg', maxCooldown: 0, name: 'Sword Active', isUnlocked: false }
  },
  
  [WeaponType.SABRES]: {
    q: { type: 'q', key: 'q', cooldown: 0.6125, currentCooldown: 0, icon: 'icons/q3.svg', maxCooldown: 0.9, name: 'Sabres Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 5.25, currentCooldown: 0, icon: 'icons/e3.svg', maxCooldown: 10, name: 'Shadow Strike', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 9.5, currentCooldown: 0, icon: 'icons/r3.svg', maxCooldown: 10, name: 'Blizzard', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/p3.svg', maxCooldown: 0, name: 'Frost Lance', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: 'icons/a3.svg', maxCooldown: 0, name: 'Orb Shield', isUnlocked: false }
  },

  [WeaponType.SPEAR]: {
    q: { type: 'q', key: 'q', cooldown: 0.625, currentCooldown: 0, icon: 'icons/q4.svg', maxCooldown: 1, name: 'Spear Q', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 4.5, currentCooldown: 0, icon: 'icons/e4.svg', maxCooldown: 5, name: 'Spear E', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: .5, currentCooldown: 0, icon: 'icons/r4.svg', maxCooldown: 4.5, name: 'Pyroclast', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/p4.svg', maxCooldown: 0, name: 'Reignite', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 2, currentCooldown: 0, icon: 'icons/a4.svg', maxCooldown: 8, name: 'Breach', isUnlocked: false }
  },

  [WeaponType.BOW]: {
    q: { type: 'q', key: 'q', cooldown: 0.25, currentCooldown: 0, icon: 'icons/q5.svg', maxCooldown: 1, name: 'Quick Shot', isUnlocked: true },
    e: { type: 'e', key: 'e', cooldown: 1, currentCooldown: 0, icon: 'icons/e5.svg', maxCooldown: 1, name: 'Power Shot', isUnlocked: true },
    r: { type: 'r', key: 'r', cooldown: 3.65, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 8, name: 'Vault', isUnlocked: false },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/p5.svg', maxCooldown: 0, name: 'Venom Shots', isUnlocked: false },
    active: { type: 'active', key: '2', cooldown: 5, currentCooldown: 0, icon: 'icons/a5.svg', maxCooldown: 5, name: 'Elemental Shots', isUnlocked: false }
  },
}; 

export const getModifiedCooldown = (weapon: WeaponType, ability: keyof WeaponAbilities, abilities: WeaponInfo): number => {
  const baseAbility = DEFAULT_WEAPON_ABILITIES[weapon][ability];
  
  // Check for Crusader Aura passive and modify Sword Q cooldown
  if (weapon === WeaponType.SWORD && 
      ability === 'q' && 
      abilities[WeaponType.SWORD].passive.isUnlocked) {
    return 0.725; // ATTACK SPEED BUFF
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

// =====================================================================================================================
export const WEAPON_ABILITY_TOOLTIPS: Record<WeaponType, Record<keyof WeaponAbilities, AbilityTooltip>> = {
  [WeaponType.SCYTHE]: {
    q: {
      title: "Scythe",
      description: "Swift reaping attack in an arc.",
    },
    e: {
      title: "Entropic Bolt",
      description: "Consumes 1 orb charge to fire a bolt of necrotic energy at a single target.",
    },
    r: {
      title: "Dragon Claw",
      description: "Active: Summons a brief draconic claw to swipe down necrotic beams of energy at enemies caught in its path.",
    },
    passive: {
      title: "Reanimate",
      description: "Active: Consumes 1 Orb Charge to heal the wielder."
    },
    active: {
      title: "Chaos Totem",
      description: "Active: Summons a totem that fights by your side for 12 seconds, shooting rapid bolts at enemies within range - 5 second cooldown.",
    }
  },
// =====================================================================================================================
  [WeaponType.SWORD]: {
    q: {
      title: "Greatsword",
      description: "Slow powerful swing in a wide arc.",
    },
    e: {
      title: "Divine Smite",
      description: "Delivers an extra instant strike that calls down a radiant bolt of energy to deal additional damage to nearby enemies.",
    },
    r: {
      title: "Oathstrike",
      description: "Active: Consumes 2 Orb Charges to unleash a devastating strike in an arc that heals the wielder if at least one enemy is hit.",
    },
    passive: {
      title: "Crusader Aura",
      description: "Passive: Increases attack speed by 30% and gives successfulattacks a 20% chance to heal the wielder."
    },
    active: {
      title: "Static Discharge",
      description: "Passive: Sword attacks conduct electricity, bouncing lightning damage to nearby enemies in a chain-reaction."
    }
  },
 // =====================================================================================================================
  [WeaponType.SABRES]: {
    q: {
      title: "Twin Sabres",
      description: "Fast dual-wielding slashes at close range.",
    },
    e: {
      title: "Blinding Mist - Shadowstrike",
      description: "Blinds enemies around you, granting invisibility for 5 seconds. Breaking stealth with an attack deals significant bonus damage. If a killing blow is landed this way, health is restored.",
    },
    r: {
      title: "Blizzard",
      description: "Active: Unleash a devastating ice storm originating at the wielder, dealing frost damage to surrounding enemies.",
    },
    passive: {
      title: "Frost Lance",
      description: "Active: Consumes 1 Orb Charge to fire a beam of ice that pierces through all enemies in a line."
    },
    active: {
      title: "Avalanche",
      description: "Passive: Melee attacks passively consume orb charges to deal extra frost damage scaling with the number of charges available."
    }
  },
// =====================================================================================================================
  [WeaponType.SPEAR]: {
    q: {
      title: "Spear",
      description: "Long-range piercing attack. Ineffective at close range; however, attacks that land at the tip of the spear are guaranteed to be critical strikes.",
    },
    e: {
      title: "Razorwind",
      description: "Consumes 1 orb per second to unleashes a fiery bladestorm. Attacks that land at the tip of the spear are guaranteed to be critical strikes.",
    },
    r: {
      title: "Inferno",
      description: "Active: Consumes 2 orbs per second to charge and release a volcanic missile that deals damage based on the number of orbs consumed.",
    },
    passive: {
      title: "Reignite",
      description: "Passive: Restores 3 orb charges whenever you kill an enemy."
    },
    active: {
      title: "Breach",
      description: "Active: Consumes 2 orbs to quickly dash forward with the spear, dealing damage to enemies caught in the path.",
    }
  },
// =====================================================================================================================
  [WeaponType.BOW]: {
    q: {
      title: "Quick Shots",
      description: "Rapidly fire bone arrows, consuming 1 orb per 6 shots.",
    },
    e: {
      title: "Power Shot",
      description: "Charge a powerful shot that deals increased damage based on charge time. Fully charged shots pierce through all enemies in the arrow's path.",
    },
    r: {
      title: "Vault",
      description: "Quickly dash backwards to escape danger or obtain better positioning - 4 Second Cooldown.",
    },
    passive: {
      title: "Venom Shots",
      description: "Passive: Every 3rd shot that hits a target deals an additional 67 damage."
    },
    active: {
      title: "Elemental Shots",
      description: "Fully charged shots deal an additional 100-200 fire damage. Non-fully charged shots deal 30 additional lightning damage to the target. Movement speed while charging the Power-Shot is increased 1000%",
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
