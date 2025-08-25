import { Vector3 } from 'three';
import { calculateDamage } from '@/Weapons/damage';

// Level-based damage scaling for Boneclaw
const BONECLAW_DAMAGE_BY_LEVEL: Record<number, number> = {
  1: 167,
  2: 221,
  3: 257,
  4: 311,
  5: 343
};

const BONECLAW_RANGE = 9; // 8.625 prior
const BONECLAW_ARC = Math.PI;
const BONECLAW_ARC_HALF = BONECLAW_ARC / 2;

// Static vectors for reuse
const STATIC_VECTORS = {
  temp1: new Vector3(),
  temp2: new Vector3(),
  temp3: new Vector3()
};

interface BoneclawHitResult {
  targetId: string;
  damage: number;
  isCritical: boolean;
  position: Vector3;
}

export function calculateBoneclawHits(
  position: Vector3,
  direction: Vector3,
  enemies: Array<{ id: string; position: Vector3; health: number; isDying?: boolean }>,
  hitEnemies: Set<string>, // Track already hit enemies
  level: number = 1 // Default to level 1 if not specified
): BoneclawHitResult[] {
  const hits: BoneclawHitResult[] = [];
  
  // Get damage for current level, fallback to level 1 if level not found
  const baseDamage = BONECLAW_DAMAGE_BY_LEVEL[level] || BONECLAW_DAMAGE_BY_LEVEL[1];
  
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.health <= 0 || enemy.isDying || hitEnemies.has(enemy.id)) continue;

    STATIC_VECTORS.temp1.subVectors(enemy.position, position);
    const distance = STATIC_VECTORS.temp1.length();

    if (distance > BONECLAW_RANGE) continue;

    STATIC_VECTORS.temp2.copy(STATIC_VECTORS.temp1).normalize();
    const angle = Math.acos(STATIC_VECTORS.temp2.dot(direction));

    if (angle > BONECLAW_ARC_HALF) continue;

    const { damage, isCritical } = calculateDamage(baseDamage);

    hits.push({
      targetId: enemy.id,
      damage,
      isCritical,
      position: enemy.position.clone() // Only clone when necessary
    });
  }

  return hits;
}