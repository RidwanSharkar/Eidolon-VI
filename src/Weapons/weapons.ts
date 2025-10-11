// src/weapons/weapons.ts

export type AbilityType = 'q' | 'e' | 'r' | 'passive' | 'active' | 'special' | 'vault' | 'innate';
export type AbilityHotkey = 'q' | 'e' | 'r' | '1' | '2' | '3' | 's' | 'w' | 'd' | 'a';

export enum WeaponType {
  SCYTHE = 'scythe',
  SWORD = 'sword',
  SABRES = 'sabres',
  SPEAR = 'spear',
  BOW = 'bow',
}

export enum WeaponSubclass {
  // Sword subclasses
  VENGEANCE = 'vengeance',
  DIVINITY = 'divinity',
  // Scythe subclasses
  CHAOS = 'chaos',
  ABYSSAL = 'abyssal',
  // Sabres subclasses
  ASSASSIN = 'assassin',
  FROST = 'frost',
  // Spear subclasses
  STORM = 'storm',
  PYRO = 'pyro',
  // Bow subclasses
  ELEMENTAL = 'elemental',
  VENOM = 'venom',
}

export interface WeaponSubclassInfo {
  name: string;
  description: string;
  weaponType: WeaponType;
}

export const WEAPON_SUBCLASSES: Record<WeaponSubclass, WeaponSubclassInfo> = {
  [WeaponSubclass.VENGEANCE]: {
    name: 'Vengeance',
    description: 'Focused on offensive power with inherent Chain Lightning effects on all attacks',
    weaponType: WeaponType.SWORD
  },
  [WeaponSubclass.DIVINITY]: {
    name: 'Divinity',
    description: 'Balanced approach with defensive capabilities and healing. Inherent Divine Shield (50 HP, 10s recharge)',
    weaponType: WeaponType.SWORD
  },
  [WeaponSubclass.CHAOS]: {
    name: 'Chaos',
    description: 'Aggressive playstyle with draconic claws and summoned totems that provide healing. Dragon Claw killing blows summon additional totems',
    weaponType: WeaponType.SCYTHE
  },
  [WeaponSubclass.ABYSSAL]: {
    name: 'Abyssal',
    description: 'Life-stealing abilities with resurrection powers',
    weaponType: WeaponType.SCYTHE
  },
  [WeaponSubclass.ASSASSIN]: {
    name: 'Assassin',
    description: 'Stealth-based combat with frost magic',
    weaponType: WeaponType.SABRES
  },
  [WeaponSubclass.FROST]: {
    name: 'Frost',
    description: 'Fire and ice combination with beam attacks',
    weaponType: WeaponType.SABRES
  },
  [WeaponSubclass.STORM]: {
    name: 'Storm',
    description: 'Whirlwind attacks with Concussive Blow passive that stuns enemies hit by 2 critical hits in one burst attack',
    weaponType: WeaponType.SPEAR
  },
  [WeaponSubclass.PYRO]: {
    name: 'Pyro',
    description: 'Explosive pyroclast missiles with breach mobility',
    weaponType: WeaponType.SPEAR
  },
  [WeaponSubclass.ELEMENTAL]: {
    name: 'Elemental',
    description: 'Enhanced shots with elemental damage',
    weaponType: WeaponType.BOW
  },
  [WeaponSubclass.VENOM]: {
    name: 'Venom',
    description: 'Poison-enhanced arrows with toxic effects',
    weaponType: WeaponType.BOW
  }
};

export interface AbilityInfo {  
  type: AbilityType;
  key: AbilityHotkey;
  cooldown: number; 
  currentCooldown: number;
  icon: string;
  maxCooldown: number;
  name: string;
  isUnlocked: boolean;
  unlockLevel: number; // New field to track when ability unlocks
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
  special: AbilityInfo;
  vault: AbilityInfo;
  innate: AbilityInfo;
}

export interface Weapon {
  type: WeaponType;
  subclass: WeaponSubclass;
  abilities: WeaponAbilities;
  damage: WeaponDamage;
}

export type WeaponInfo = Record<WeaponType, WeaponAbilities>;
export type SubclassInfo = Record<WeaponSubclass, WeaponAbilities>;

export const WEAPON_DAMAGES: Record<WeaponType, WeaponDamage> = {
  [WeaponType.SWORD]: {
    normal: 41,
    range: 5,
    maxHitsPerSwing: 1
  },
  [WeaponType.SCYTHE]: {
    normal: 29,
    range: 4.25,
    maxHitsPerSwing: 1
  },
  [WeaponType.SABRES]: {
    normal: 17, // Base damage - actual damage varies by subclass
    range: 3.85,
    maxHitsPerSwing: 2
  },
  [WeaponType.SPEAR]: {
    normal: 31,
    range: 5.65,
    maxHitsPerSwing: 1
  },
  [WeaponType.BOW]: {
    normal: 17,
    range: 0.125,
    maxHitsPerSwing: 1
  },
};

// Get subclass-specific damage for weapons that have different damage values per subclass
export const getWeaponDamage = (weapon: WeaponType, subclass?: WeaponSubclass, stealthKillCount?: number, isLegionEmpowered?: boolean): number => {
  const baseDamage = WEAPON_DAMAGES[weapon].normal;
  
  // Legion empowerment for Abyssal Scythe - increases damage from 29 to 47
  if (weapon === WeaponType.SCYTHE && 
      subclass === WeaponSubclass.ABYSSAL && 
      isLegionEmpowered) {
    return 47; // Empowered damage
  }
  
  // Sabres have different damage based on subclass
  if (weapon === WeaponType.SABRES && subclass) {
    switch (subclass) {
      case WeaponSubclass.FROST:
        return 17;
      case WeaponSubclass.ASSASSIN:
        // Assassin gets +1 damage per stealth kill (permanent bonus)
        const baseDamageAssassin = 19;
        const stealthBonus = stealthKillCount ? stealthKillCount : 0;
        return baseDamageAssassin + stealthBonus;
      default:
        return baseDamage;
    }
  }
  
  // Spear has different damage based on subclass (to balance burst vs single attacks)
  if (weapon === WeaponType.SPEAR && subclass) {
    switch (subclass) {
      case WeaponSubclass.STORM:
        return 31; //  damage per hit since it hits twice per attack (burst)
      case WeaponSubclass.PYRO:
        return 37; //  damage for single attack
      default:
        return baseDamage;
    }
  }
  
  // Other weapons use base damage
  return baseDamage;
};

// Add this function to dynamically determine maxHitsPerSwing based on weapon, subclass, and level
export const getMaxHitsPerSwing = (
  weapon: WeaponType, 
  subclass?: WeaponSubclass, 
  level: number = 1
): number => {
  // Base maxHitsPerSwing from WEAPON_DAMAGES
  const baseMaxHits = WEAPON_DAMAGES[weapon].maxHitsPerSwing || 1;
  
  // Special case for Abyssal Scythe at level 2+
  if (weapon === WeaponType.SCYTHE && 
      subclass === WeaponSubclass.ABYSSAL && 
      level >= 2) {
    return 2;
  }
  return baseMaxHits;
};

// Subclass-based ability definitions with proper unlock levels
export const SUBCLASS_ABILITIES: SubclassInfo = {
  // SWORD SUBCLASSES
  [WeaponSubclass.VENGEANCE]: {
    q: { type: 'q', key: 'q', cooldown: 0.9, currentCooldown: 0, icon: 'icons/VengeanceSwordQ.png', maxCooldown: 1.08, name: 'Greatsword', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 4, currentCooldown: 0, icon: 'icons/VengeanceSwordE.png', maxCooldown: 4, name: 'Divine Smite', isUnlocked: true, unlockLevel: 1 },
    r: { type: 'r', key: 'r', cooldown: 3.0, currentCooldown: 0, icon: 'icons/VengeanceSwordR.png', maxCooldown: 3.0, name: 'DivineStorm', isUnlocked: false, unlockLevel: 2 },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/VengeanceSwordPassive.png', maxCooldown: 0, name: 'Crusader Aura', isUnlocked: false, unlockLevel: 3 },
    active: { type: 'active', key: '2', cooldown: 7.0, currentCooldown: 0, icon: 'icons/VengeanceSword2.png', maxCooldown: 7.0, name: 'Colossus Strike', isUnlocked: false, unlockLevel: 4 },
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/VengeanceSword2.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/VengeanceSwordInnate.png', maxCooldown: 0, name: 'Static Discharge', isUnlocked: true, unlockLevel: 1 }
  },

  [WeaponSubclass.DIVINITY]: {
    q: { type: 'q', key: 'q', cooldown: 0.9, currentCooldown: 0, icon: 'icons/DivinitySwordQ.png', maxCooldown: 1.08, name: 'Greatsword', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 4, currentCooldown: 0, icon: 'icons/DivinitySwordE.png', maxCooldown: 4, name: 'Divine Smite', isUnlocked: true, unlockLevel: 1 },
    r: { type: 'r', key: 'r', cooldown: 1.275, currentCooldown: 0, icon: 'icons/DivinitySwordR.png', maxCooldown: 1.75, name: 'Oathstrike', isUnlocked: false, unlockLevel: 2 },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/DivinitySwordPassive.png', maxCooldown: 0, name: 'Crusader Aura', isUnlocked: false, unlockLevel: 3 },
    active: { type: 'active', key: '2', cooldown: 10.0, currentCooldown: 0, icon: 'icons/DivinitySword2.png', maxCooldown: 10.0, name: 'Aegis', isUnlocked: false, unlockLevel: 4 },
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/DivinitySword2.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/DivinitySwordInnate.png', maxCooldown: 0, name: 'Guardian Shell', isUnlocked: true, unlockLevel: 1 }
  },

  // SCYTHE SUBCLASSES
  [WeaponSubclass.CHAOS]: {
    q: { type: 'q', key: 'q', cooldown: 0.8, currentCooldown: 0, icon: 'icons/ChaosScytheQ.png', maxCooldown: 1, name: 'Scythe', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 0.6, currentCooldown: 0, icon: 'icons/ChaosScytheE.png', maxCooldown: 0.6675, name: 'Entropic Bolt', isUnlocked: true, unlockLevel: 1 },
    r: { type: 'r', key: 'r', cooldown: 0, currentCooldown: 0, icon: 'icons/ChaosScytheR.png', maxCooldown: 0, name: 'Dragon Claw', isUnlocked: false, unlockLevel: 3 },
    passive: { type: 'passive', key: '1', cooldown: 0.725, currentCooldown: 0, icon: 'icons/ChaosScythePassive.png', maxCooldown: 0, name: 'Cross Entropy', isUnlocked: false, unlockLevel: 2 },
    active: { type: 'active', key: '2', cooldown: 3.0, currentCooldown: 0, icon: 'icons/ChaosScythe2.png', maxCooldown: 3.0, name: 'Dragon Breath', isUnlocked: false, unlockLevel: 4 },
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/ChaosScythePassive.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/ChaosScytheInnate.png', maxCooldown: 0, name: 'Momentum Rift', isUnlocked: true, unlockLevel: 1 }
  },

  [WeaponSubclass.ABYSSAL]: {
    q: { type: 'q', key: 'q', cooldown: 0.8, currentCooldown: 0, icon: 'icons/AbyssalScytheQ.png', maxCooldown: 1, name: 'Scythe', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 5.0, currentCooldown: 0, icon: 'icons/AbyssalScytheE.png', maxCooldown: 5.0, name: 'Soul Reaper', isUnlocked: true, unlockLevel: 1 },
    r: { type: 'r', key: 'r', cooldown: 0.725, currentCooldown: 0, icon: 'icons/AbyssalScytheR.png', maxCooldown: 0, name: 'Reanimate', isUnlocked: false, unlockLevel: 3 },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/AbyssalScythePassive.png', maxCooldown: 0, name: 'Grim Scythes', isUnlocked: true, unlockLevel: 2 },
    active: { type: 'active', key: '2', cooldown: 20.0, currentCooldown: 0, icon: 'icons/AbyssalScythe2.png', maxCooldown: 20.0, name: 'Legion', isUnlocked: false, unlockLevel: 4 },
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/AbyssalScythePassive.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/AbyssalScytheInnate.png', maxCooldown: 0, name: 'Void Slash', isUnlocked: true, unlockLevel: 1 }
  },

  // SABRES SUBCLASSES
  [WeaponSubclass.ASSASSIN]: {
    q: { type: 'q', key: 'q', cooldown: 0.5825, currentCooldown: 0, icon: 'icons/AssassinSabresQ.png', maxCooldown: 0.9, name: 'Twin Sabres', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 5, currentCooldown: 0, icon: 'icons/AssassinSabresE.png', maxCooldown: 10, name: 'Blinding Mist', isUnlocked: true, unlockLevel: 1 },
    r: { type: 'r', key: 'r', cooldown: 10, currentCooldown: 0, icon: 'icons/AssassinSabresR.png', maxCooldown: 10, name: 'Blizzard', isUnlocked: false, unlockLevel: 2 },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/AssassinSabresPassive.png', maxCooldown: 0, name: 'Avalanche', isUnlocked: false, unlockLevel: 3 },
    active: { type: 'active', key: '2', cooldown: 0, currentCooldown: 0, icon: 'icons/AssassinSabres2.png', maxCooldown: 0, name: 'Eviscerate', isUnlocked: false, unlockLevel: 4 },
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/AssassinSabres2.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/AssassinSabresInnate.png', maxCooldown: 0, name: 'Lethality', isUnlocked: true, unlockLevel: 1 }
  },

  [WeaponSubclass.FROST]: {
    q: { type: 'q', key: 'q', cooldown: 0.6125, currentCooldown: 0, icon: 'icons/FrostSabresQ.png', maxCooldown: 0.9, name: 'Twin Sabres', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 2, currentCooldown: 0, icon: 'icons/FrostSabresE.png', maxCooldown: 2, name: 'Icebeam', isUnlocked: true, unlockLevel: 1 }, // Uses Firebeam
    r: { type: 'r', key: 'r', cooldown: 5.0, currentCooldown: 0, icon: 'icons/FrostSabresR.png', maxCooldown: 5.0, name: 'Glacial Shard', isUnlocked: false, unlockLevel: 2 },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/FrostSabresPassive.png', maxCooldown: 0, name: 'Deep Freeze', isUnlocked: false, unlockLevel: 3 },
    active: { type: 'active', key: '2', cooldown: 20.0, currentCooldown: 0, icon: 'icons/FrostSabres2.png', maxCooldown: 20.0, name: 'Summon Elemental', isUnlocked: false, unlockLevel: 4 },
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/FrostSabres2.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/FrostSabresInnate.png', maxCooldown: 0, name: 'Particle Storm', isUnlocked: true, unlockLevel: 1 }
  },

  // SPEAR SUBCLASSES
  [WeaponSubclass.STORM]: {
    q: { type: 'q', key: 'q', cooldown: 0.675, currentCooldown: 0, icon: 'icons/StormSpearQ.png', maxCooldown: 1, name: 'Spear', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 1.2, currentCooldown: 0, icon: 'icons/StormSpearE.png', maxCooldown: 1.2, name: 'Whirlwind', isUnlocked: true, unlockLevel: 1 }, // Uses Whirlwind
    r: { type: 'r', key: 'r', cooldown: 5.0, currentCooldown: 0, icon: 'icons/StormSpearR.png', maxCooldown: 5.0, name: 'ThrowSpear', isUnlocked: false, unlockLevel: 4 }, // ThrowSpear ability
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/StormSpearPassive.png', maxCooldown: 0, name: 'Reignite', isUnlocked: false, unlockLevel: 3 },
    active: { type: 'active', key: '2', cooldown: 2, currentCooldown: 0, icon: 'icons/StormSpear2 .png', maxCooldown: 2, name: 'Breach', isUnlocked: false, unlockLevel: 2 }, // Breach moved to '2' key
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/StormSpear2 .png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/StormSpearInnate.png', maxCooldown: 0, name: 'Storm Bolt', isUnlocked: true, unlockLevel: 1 }
  },

  [WeaponSubclass.PYRO]: {
    q: { type: 'q', key: 'q', cooldown: 0.675, currentCooldown: 0, icon: 'icons/PyroSpearQ.png', maxCooldown: 1, name: 'Spear', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 1.2, currentCooldown: 0, icon: 'icons/PyroSpearE.png', maxCooldown: 1.2, name: 'Inferno', isUnlocked: true, unlockLevel: 1 }, // Uses Pyroclast
    r: { type: 'r', key: 'r', cooldown: 15.0, currentCooldown: 0, icon: 'icons/PyroSpearR.png', maxCooldown: 15.0, name: 'MeteorSwarm', isUnlocked: false, unlockLevel: 4 }, // MeteorSwarm moved to 'r' key
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/PyroSpearPassive.png', maxCooldown: 0, name: 'Reignite', isUnlocked: false, unlockLevel: 3 },
    active: { type: 'active', key: '2', cooldown: 2, currentCooldown: 0, icon: 'icons/PyroSpear2.png', maxCooldown: 8, name: 'Breach', isUnlocked: false, unlockLevel: 2 }, // Breach moved to '2' key
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/PyroSpear2.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/PyroSpearInnate.png', maxCooldown: 0, name: 'Lava Lash', isUnlocked: true, unlockLevel: 1 }
  },

  // BOW SUBCLASSES
  [WeaponSubclass.ELEMENTAL]: {
    q: { type: 'q', key: 'q', cooldown: 0.155, currentCooldown: 0, icon: 'icons/ElementalBowQ.png', maxCooldown: 1, name: 'Quick Shot', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 0.875, currentCooldown: 0, icon: 'icons/ElementalBowE.png', maxCooldown: 1, name: 'Power Shot', isUnlocked: true, unlockLevel: 1 },
    r: { type: 'r', key: 'r', cooldown: 5, currentCooldown: 0, icon: 'icons/ElementalBowR.png', maxCooldown: 5, name: 'Barrage', isUnlocked: false, unlockLevel: 2 },
    passive: { type: 'passive', key: '1', cooldown: 5, currentCooldown: 0, icon: 'icons/ElementalBowPassive.png', maxCooldown: 5, name: 'Elemental Shots', isUnlocked: false, unlockLevel: 3 },
    active: { type: 'active', key: '2', cooldown: 8, currentCooldown: 0, icon: 'icons/ElementalBow2.png', maxCooldown: 8, name: 'Guided Bolts', isUnlocked: false, unlockLevel: 4 },
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/ElementalBow2.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/ElementalBowInnate.png', maxCooldown: 0, name: 'Hunter\'s Mark', isUnlocked: true, unlockLevel: 1 }
  },

  [WeaponSubclass.VENOM]: {
    q: { type: 'q', key: 'q', cooldown: 0.155, currentCooldown: 0, icon: 'icons/VenomBowQ.png', maxCooldown: 1, name: 'Quick Shot', isUnlocked: true, unlockLevel: 1 },
    e: { type: 'e', key: 'e', cooldown: 0.875, currentCooldown: 0, icon: 'icons/VenomBowE.png', maxCooldown: 1, name: 'Power Shot', isUnlocked: true, unlockLevel: 1 },
    r: { type: 'r', key: 'r', cooldown: 5, currentCooldown: 0, icon: 'icons/VenomBowR.png', maxCooldown: 5, name: 'Barrage', isUnlocked: false, unlockLevel: 3 },
    passive: { type: 'passive', key: '1', cooldown: 0, currentCooldown: 0, icon: 'icons/VenomBowPassive.png', maxCooldown: 0, name: 'Venom Shots', isUnlocked: false, unlockLevel: 2 },
    active: { type: 'active', key: '2', cooldown: 7, currentCooldown: 0, icon: 'icons/VenomBow2.png', maxCooldown: 7, name: 'Viper Sting', isUnlocked: false, unlockLevel: 4 },
    special: { type: 'special', key: '3', cooldown: 12.0, currentCooldown: 0, icon: 'icons/VenomBow2.png', maxCooldown: 12.0, name: 'Unused', isUnlocked: false, unlockLevel: 99 },
    vault: { type: 'vault', key: 's', cooldown: 0, currentCooldown: 0, icon: 'icons/r5.svg', maxCooldown: 0, name: 'Vault', isUnlocked: true, unlockLevel: 1 },
    innate: { type: 'innate', key: 'w', cooldown: 0, currentCooldown: 0, icon: 'icons/VenomBowInnate.png', maxCooldown: 0, name: 'Venom Laced', isUnlocked: true, unlockLevel: 1 }
  },
};

// Legacy support - keep for backward compatibility
export const DEFAULT_WEAPON_ABILITIES: Record<WeaponType, WeaponAbilities> = {
  [WeaponType.SCYTHE]: SUBCLASS_ABILITIES[WeaponSubclass.CHAOS],
  [WeaponType.SWORD]: SUBCLASS_ABILITIES[WeaponSubclass.VENGEANCE],
  [WeaponType.SABRES]: SUBCLASS_ABILITIES[WeaponSubclass.ASSASSIN],
  [WeaponType.SPEAR]: SUBCLASS_ABILITIES[WeaponSubclass.STORM],
  [WeaponType.BOW]: SUBCLASS_ABILITIES[WeaponSubclass.ELEMENTAL],
}; 

export const getModifiedCooldown = (weapon: WeaponType, ability: keyof WeaponAbilities, abilities: WeaponInfo, currentSubclass?: WeaponSubclass): number => {
  // Use the current abilities (which reflect the actual subclass) instead of default abilities
  const currentAbility = abilities[weapon][ability];
  
  // Check for Crusader Aura passive and modify Sword Q cooldown
  if (weapon === WeaponType.SWORD && 
      ability === 'q' && 
      abilities[WeaponType.SWORD].passive.isUnlocked) {
    return 0.70; // ATTACK SPEED BUFF
  }
  
  // Abyssal Scythe FrenzyAura no longer provides attack speed bonuses
  // Removed skeleton count-based cooldown modification
  
  // Handle subclass-specific cooldowns for Sabres Q ability
  if (weapon === WeaponType.SABRES && ability === 'q' && currentSubclass) {
    switch (currentSubclass) {
      case WeaponSubclass.FROST:
        return 0.675; // Frost subclass cooldown
      case WeaponSubclass.ASSASSIN:
        return 0.5875; // Assassin subclass cooldown
      default:
        return currentAbility.cooldown;
    }
  }
  
  // Handle subclass-specific cooldowns for Spear Q ability
  if (weapon === WeaponType.SPEAR && ability === 'q' && currentSubclass) {
    switch (currentSubclass) {
      case WeaponSubclass.STORM:
        return 0.675; // Storm subclass cooldown
      case WeaponSubclass.PYRO:
        return 0.675; // Pyro subclass cooldown
      default:
        return currentAbility.cooldown;
    }
  }
  
  // Return the base cooldown for the ability
  return currentAbility.cooldown;
};

// Tooltip information for abilities - now subclass-specific
export interface AbilityTooltip {
  name: string;
  description: string;
  cooldown: string;
  unlockLevel: number;
}

// Helper function to get tooltip for a specific ability in a subclass
export const getAbilityTooltip = (weapon: WeaponType, subclass: WeaponSubclass, abilityType: 'q' | 'e' | 'r' | 'passive' | 'active' | 'special' | 'vault' | 'innate'): AbilityTooltip => {
  const ability = SUBCLASS_ABILITIES[subclass][abilityType];

  // Create cooldown string
  const cooldownStr = ability.cooldown === 0 ? 'Always Active' : `${ability.cooldown}s`;

  return {
    name: ability.name,
    description: getAbilityDescription(weapon, subclass, abilityType),
    cooldown: cooldownStr,
    unlockLevel: ability.unlockLevel
  };
};

// Subclass-specific ability descriptions
const getAbilityDescription = (weapon: WeaponType, subclass: WeaponSubclass, abilityType: 'q' | 'e' | 'r' | 'passive' | 'active' | 'special' | 'vault' | 'innate'): string => {
  switch (weapon) {
    case WeaponType.SWORD:
      switch (subclass) {
        case WeaponSubclass.VENGEANCE:
          switch (abilityType) {
            case 'q': return 'Powerful two-handed 3-hit combo attack.';
            case 'e': return 'Delivers a powerful strike that calls down a beam of radiant energy that deals damage to enemies near the impact.';           
             case 'r': return 'Creates a devastating storm of divine energy around you, damaging all nearby enemies';
            case 'passive': return 'Attacks have a 25% chance to heal you.';
            case 'active': return 'Colossus Strike';
            case 'innate': return 'Attacks have a 40% chance on hit to discharge lightning that jumps to the next closest enemy, up to 4 times.';
          }
          break;
        case WeaponSubclass.DIVINITY:
          switch (abilityType) {
            case 'q': return 'One-handed swing in a wide arc with a shield.';
            case 'e': return 'Delivers a powerful strike that calls down a beam of radiant energy that deals damage to enemies near the impact.';
            case 'r': return 'Oathstrike';
            case 'passive': return 'Attacks have a chance to heal nearby allies when damaging enemies.';
            case 'active': return 'Aegis';
            case 'innate': return 'Permanently grants a protective bubble shield that blocks up to 50 damage. If broken, a new shield returns after 30 seconds.';
          }
          break;
      }
      break;

    case WeaponType.SCYTHE:
      switch (subclass) {
        case WeaponSubclass.CHAOS:
          switch (abilityType) {
            case 'q': return 'Swift reap in a medium arc.';
            case 'e': return 'Consumes 1 Orb Charge to fire a chaotic bolt of green flame, dealing damage to the first enemy hit. Starting at level 2, Entropic Bolts have a 50% chance to become Crossentropy Bolts, dealing double damage and costing no orb charge.';
            case 'r': return 'Dragon Claw';
            case 'passive': return 'Entropic Bolts have a 50% chance to become Crossentropy bolts, dealing double damage and costing no orb charge.';
            case 'active': return 'Breathe dragon fire in a wide arc, pushing enemies back. 3 Orbs are regenerated for every killing blow landed by this ability.';
            case 'innate': return 'Critical hits dealt by Entropic Bolt and killing blows dealt by Dragon Claw always summon a Totem, healing you for 2 HP per second while dealing damage to enemiesfor 8 seconds. Up to 2 Totems can be active at once.';
          }
          break;
        case WeaponSubclass.ABYSSAL:
          switch (abilityType) {
            case 'q': return 'Starting at level 2, the scythe is dual wielded and heals you for a portion of its damage dealt.';
            case 'e': return 'Mark the nearest target in front of you for 2 seconds. After 2 seconds, a phantom sword crashes down onto the marked enemy. If the enemy was killed by this attack, raise a Death Knight to fight by your side and spread the Soul Reaper mark to 2 neighboring enemies.';
            case 'r': return 'Reanimate';
            case 'passive': return 'Dual wield scythes for increased attack speed and damage output';
            case 'active': return 'Call down a devastating meteor that creates empowered area and summons an abomination';
            case 'innate': return 'Every 5 seconds, the Abyssal Scythe passively charges. Your next melee attack unleashes this charge, dealing extra damage in wide arc in front of you.';
          }
          break;
      }
      break;

    case WeaponType.SABRES:
      switch (subclass) {
        case WeaponSubclass.ASSASSIN:
          switch (abilityType) {
            case 'q': return 'Rapid close range twin sabre strikes.';
            case 'e': return 'Enter stealth mode, becoming invisible and gaining bonus damage on your next attack. The critical strike chance of this ability increases significantly if behind an enemy. If a killing blow is dealt with this ability, heal for 5-7 HP.';
            case 'r': return 'Create a freezing blizzard that slows and damages enemies in a large area';
            case 'passive': return 'Avalanche effect creates frost explosions when hitting enemies with sabres';
            case 'active': return 'Eviscerate enemies with powerful charged strikes that stun and deal massive damage';
            case 'innate': return 'Delivering a killing blow with Blinding Mist permanently increases its damage. Lethality stacks can accumulate without limit and also increases each Sabre\'s base swing damage by 1.';
          }
          break;
        case WeaponSubclass.FROST:
          switch (abilityType) {
            case 'q': return 'Rapid twin sabre strikes that release icicle shards';
            case 'e': return 'Channel a freezing beam that damages all enemies caught in a line, growing more powerful the longer it is channeled. Starting at level 3, enemies that stay in the beam for over 2 seconds are frozen solid.';
            case 'r': return 'Launch a glacial shard that permamently increases its damage if delivering a killing blow. Deals double damage to frozen enemies.';
            case 'passive': return 'Deep Freeze';
            case 'active': return 'Summon an elemental ally that fights alongside you with frost magic';
            case 'innate': return 'Icicles are periodically formed around you, and can be released in bursts alongside primary attacks. Deals triple damage to frozen enemies.';
          }
          break;
      }
      break;

    case WeaponType.SPEAR:
      switch (subclass) {
        case WeaponSubclass.STORM:
          switch (abilityType) {
            case 'q': return '2-Round burst thrust in a straight line. Always deals critical damage if the enemy is caught with the tip of the spear.';
            case 'e': return 'Consumes 1 Orb charge per second to spin in a whirlwind, rapidly attacking all nearby enemies around you. Critical damage is guaranteed at the spear\'s tip.';
            case 'r': return 'Throw your spear like a javelin, stunning enemies in its path';
            case 'passive': return 'Killing enemies reignites your attacks, providing temporary damage bonuses';
            case 'active': return 'Breach through enemies, creating a path of destruction and stunning foes';
            case 'innate': return 'Dealing 2 consecutive critical hits with the primary attack has a chance to call down a lightning bolt that stuns the enemy in place for 2 seconds. Critical strikes with the Whirlwind ability also create an additional spinning Firestorm for 4 seconds.';
          }
          break;
        case WeaponSubclass.PYRO:
          switch (abilityType) {
            case 'q': return 'Single thrust that always deals critical damage if the enemy is caught with the tip of the spear.';
            case 'e': return 'Consumes 1 Orb every 0.5 seconds to charge up a massive fireball that deals increased damage the longer it is charged, exploding on impact.';
            case 'r': return 'Call down a swarm of meteors that crash into enemies across the battlefield';
            case 'passive': return 'Killing enemies reignites your attacks, building incinerate stacks for bonus damage';
            case 'active': return 'Breach through enemies with explosive force, leaving fire in your wake';
            case 'innate': return 'Firebolts are released from your spear during primary attacks, burning and damaging enemies in a straight line. Each enemy hit by this firebolt grants a burning stack. At 25 stacks, the next cast of Inferno becomes instant and will always deal its maximum damage.';
          }
          break;
      }
      break;

    case WeaponType.BOW:
      switch (subclass) {
        case WeaponSubclass.ELEMENTAL:
          switch (abilityType) {
            case 'q': return 'Rapidly fires bone arrows. At level 3, frost arrows are fired instead, dealing increased damage and slowing enemies hit for 5 seconds.';
            case 'e': return 'Charges up a powerful shot that deals increased damage the longer it is charged. At full charge, the arrow will pierce through enemies.';
            case 'r': return 'Barrage';
            case 'passive': return 'Elemental shots gain bonus damage and create lightning strikes';
            case 'active': return 'Launch guided bolts that track and damage multiple enemies';
            case 'innate': return 'Power Shots can now be Perfect Shots if released at the right moment, dealing increased damage and stunning enemies hit. In addition, Power Shots can now be charged while moving.';
          }
          break;
        case WeaponSubclass.VENOM:
          switch (abilityType) {
            case 'q': return 'Rapidly fires poison arrows.';
            case 'e': return 'Charges up a powerful shot that deals increased damage the longer it is charged. At full charge, the arrow will pierce through enemies.';
            case 'r': return 'Barrage';
            case 'passive': return 'Venom Shots: every 3rd Quick Shot landed deals bonus damage. ';
            case 'active': return 'Viper Sting';
            case 'innate': return 'If 12 consecutive hits of Quick Shot are landed, the bow glows green, allowing you to fire your next Power Shot instantly. Power Shots now also deal poison damage over time.';
          }
          break;
      }
      break;
  }

  // Fallback description
  return 'Ability description not available';
}; 

export const WEAPON_ORB_COUNTS: Record<WeaponType, number> = {
  [WeaponType.SCYTHE]: 8,
  [WeaponType.SWORD]: 5,
  [WeaponType.SABRES]: 6,
  [WeaponType.SPEAR]: 8,
  [WeaponType.BOW]: 6,
};

// Dash charges system - number of dash charges per weapon type
export const WEAPON_DASH_CHARGES: Record<WeaponType, number> = {
  [WeaponType.SWORD]: 1,
  [WeaponType.SCYTHE]: 1,
  [WeaponType.SPEAR]: 1,
  [WeaponType.SABRES]: 3,
  [WeaponType.BOW]: 2,
};

// Dash charge interface for tracking individual charges
export interface DashCharge {
  isAvailable: boolean;
  cooldownRemaining: number;
}

// Dash charges state for a weapon
export interface DashChargesState {
  charges: DashCharge[];
  globalCooldownRemaining: number; // Short cooldown between rapid dashes
}

// Constants for dash system
export const DASH_CHARGE_COOLDOWN = 6.0; // 6 seconds per charge
export const DASH_GLOBAL_COOLDOWN = 0.75; // 0.75 seconds between rapid dashes 
