// src/versus/enemy.ts

import { Vector3 } from 'three';
import { RefObject } from 'react';
import { Group } from 'three';

export type EnemyType = 'regular' | 'mage' | 'abomination' | 'reaper' | 'fallen-titan' | 'ascendant' | 'death-knight';

export interface Enemy {
  id: string;
  position: Vector3;
  rotation: number;
  initialPosition: Vector3;
  health: number;
  maxHealth: number;
  ref?: RefObject<Group>;
  isDying?: boolean;
  deathStartTime?: number;
  type?: EnemyType;
  currentPosition?: Vector3;
}

// Enemy priority system for summoned units targeting
export const ENEMY_PRIORITY: Record<EnemyType, number> = {
  'fallen-titan': 1,    // Highest priority
  'ascendant': 2,
  'abomination': 3,
  'death-knight': 4,
  'reaper': 5,
  'mage': 6,
  'regular': 7         // Lowest priority (EnemySkeleton)
};

// Get enemy type from ID
export function getEnemyTypeFromId(enemyId: string): EnemyType {
  if (enemyId.includes('fallen-titan') || enemyId.includes('boss-fallen-titan')) return 'fallen-titan';
  if (enemyId.includes('ascendant') || enemyId.includes('boss-ascendant')) return 'ascendant';
  if (enemyId.includes('abomination') || enemyId.includes('boss-abomination')) return 'abomination';
  if (enemyId.includes('death-knight') || enemyId.includes('boss-death-knight')) return 'death-knight';
  if (enemyId.includes('reaper') || enemyId.includes('boss-reaper')) return 'reaper';
  if (enemyId.includes('mage') || enemyId.includes('skeletal-mage')) return 'mage';
  return 'regular'; // Default to regular (skeleton)
}

// Find the highest priority target for summoned units
export function findHighestPriorityTarget(
  enemies: Enemy[], 
  attackingEnemyId?: string
): Enemy | null {
  if (enemies.length === 0) return null;

  // Filter out dead/dying enemies
  const validEnemies = enemies.filter(enemy => 
    enemy.health > 0 && 
    !enemy.isDying && 
    !enemy.deathStartTime && 
    enemy.position
  );

  if (validEnemies.length === 0) return null;

  // If there's an attacking enemy, prioritize it above all else
  if (attackingEnemyId) {
    const attackingEnemy = validEnemies.find(e => e.id === attackingEnemyId);
    if (attackingEnemy) return attackingEnemy;
  }

  // Sort by priority (lower number = higher priority)
  validEnemies.sort((a, b) => {
    const priorityA = ENEMY_PRIORITY[getEnemyTypeFromId(a.id)] || 999;
    const priorityB = ENEMY_PRIORITY[getEnemyTypeFromId(b.id)] || 999;
    return priorityA - priorityB;
  });

  return validEnemies[0];
}