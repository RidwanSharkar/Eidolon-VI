import { Vector3 } from 'three';
import { EnemyType, getEnemyTypeFromId } from '@/Versus/enemy';

// Drop rates for each enemy type
export const RUNE_DROP_RATES: Record<EnemyType, number> = {
  'regular': 0.01,      // Skeleton: 1%
  'mage': 0.03,         // Skeleton Mage: 3%
  'reaper': 0.05,       // Reaper: 5%
  'death-knight': 0.08, // Death Knight: 8%
  'abomination': 0.12,  // Abomination: 12%
  'ascendant': 0.15,    // Ascendant: 15%
  'fallen-titan': 0.50, // Fallen Titan: 50%
};


export type RuneType = 'critical' | 'critDamage';

export interface RuneDrop {
  shouldDrop: boolean;
  position: Vector3;
  enemyType: EnemyType;
  runeType: RuneType;
}

/**
 * Determines if an enemy should drop runes based on its type and position
 * Each enemy can drop both types of runes independently
 */
export function calculateRuneDrops(enemyId: string, enemyPosition: Vector3): RuneDrop[] {
  const enemyType = getEnemyTypeFromId(enemyId);
  const dropRate = RUNE_DROP_RATES[enemyType];
  
  const drops: RuneDrop[] = [];
  
  // Check for critical chance rune drop
  const criticalRoll = Math.random();
  const shouldDropCritical = criticalRoll < dropRate;
  
  // Check for crit damage rune drop (independent roll)
  const critDamageRoll = Math.random();
  const shouldDropCritDamage = critDamageRoll < dropRate;
  
  // Debug logging
  console.log(`🎲 Rune Drop Check - Enemy: ${enemyId}, Type: ${enemyType}, Rate: ${(dropRate * 100).toFixed(1)}%`);
  console.log(`  Critical Rune: Roll ${(criticalRoll * 100).toFixed(1)}%, Drop: ${shouldDropCritical ? '✅' : '❌'}`);
  console.log(`  CritDamage Rune: Roll ${(critDamageRoll * 100).toFixed(1)}%, Drop: ${shouldDropCritDamage ? '✅' : '❌'}`);
  
  if (shouldDropCritical) {
    console.log(`💎 CRITICAL RUNE DROPPED! Position: (${enemyPosition.x.toFixed(1)}, ${enemyPosition.y.toFixed(1)}, ${enemyPosition.z.toFixed(1)})`);
    drops.push({
      shouldDrop: true,
      position: enemyPosition.clone(),
      enemyType,
      runeType: 'critical'
    });
  }
  
  if (shouldDropCritDamage) {
    console.log(`💥 CRIT DAMAGE RUNE DROPPED! Position: (${enemyPosition.x.toFixed(1)}, ${enemyPosition.y.toFixed(1)}, ${enemyPosition.z.toFixed(1)})`);
    // Offset position slightly to avoid overlap
    const offsetPosition = enemyPosition.clone();
    offsetPosition.x += 1.5; // Offset by 1.5 units
    drops.push({
      shouldDrop: true,
      position: offsetPosition,
      enemyType,
      runeType: 'critDamage'
    });
  }
  
  return drops;
}

/**
 * Legacy function for backward compatibility - only returns critical rune drops
 */
export function calculateRuneDrop(enemyId: string, enemyPosition: Vector3): RuneDrop {
  const drops = calculateRuneDrops(enemyId, enemyPosition);
  const criticalDrop = drops.find(drop => drop.runeType === 'critical');
  
  return criticalDrop || {
    shouldDrop: false,
    position: enemyPosition.clone(),
    enemyType: getEnemyTypeFromId(enemyId),
    runeType: 'critical'
  };
}

/**
 * Get drop rate percentage for display purposes
 */
export function getDropRatePercentage(enemyType: EnemyType): number {
  return RUNE_DROP_RATES[enemyType] * 100;
}
