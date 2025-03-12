// src/weapons/damage.ts

export interface DamageResult {
  damage: number;
  isCritical: boolean;
}

export function calculateDamage(baseAmount: number): DamageResult {
  const isCritical = Math.random() < 0.11;
  const damage = isCritical ? baseAmount * 2 : baseAmount;
  return { damage, isCritical };
}
