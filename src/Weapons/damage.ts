// src/weapons/damage.ts

export interface DamageResult {
  damage: number;
  isCritical: boolean;
}

// Global rune counts - will be updated by the GameState context
let globalCriticalRuneCount = 0;
let globalCritDamageRuneCount = 0;

export function setGlobalCriticalRuneCount(count: number) {
  globalCriticalRuneCount = count;
}

export function setGlobalCritDamageRuneCount(count: number) {
  globalCritDamageRuneCount = count;
}

export function calculateDamage(baseAmount: number): DamageResult {
  // Base crit chance is 11%, each rune adds 3%
  const criticalChance = 0.11 + (globalCriticalRuneCount * 0.03);
  const isCritical = Math.random() < criticalChance;
  
  // Base crit damage multiplier is 2x, each crit damage rune adds 0.15x
  const criticalDamageMultiplier = 2.0 + (globalCritDamageRuneCount * 0.15);
  const rawDamage = isCritical ? baseAmount * criticalDamageMultiplier : baseAmount;
  
  // Round down to integer to avoid floating point precision issues
  const damage = Math.floor(rawDamage);
  
  return { damage, isCritical };
}
