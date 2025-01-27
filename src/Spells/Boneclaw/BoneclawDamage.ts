import { Vector3 } from 'three';
import { calculateDamage } from '@/Weapons/damage';

// Cache commonly used values
const BONECLAW_BASE_DAMAGE = 79;
const BONECLAW_RANGE = 8.625;
const BONECLAW_ARC = Math.PI;
const BONECLAW_ARC_HALF = BONECLAW_ARC / 2;

// Reusable vectors to avoid garbage collection
const toEnemyVector = new Vector3();
const normalizedToEnemy = new Vector3();

interface BoneclawHitResult {
  targetId: string;
  damage: number;
  isCritical: boolean;
  position: Vector3;
}

export function calculateBoneclawHits(
  position: Vector3,
  direction: Vector3,
  enemies: Array<{ id: string; position: Vector3; health: number }>,
  hitEnemies: Set<string> // Track already hit enemies
): BoneclawHitResult[] {
  const hits: BoneclawHitResult[] = [];
  
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.health <= 0 || hitEnemies.has(enemy.id)) continue;

    // Reuse vectors for calculations
    toEnemyVector.subVectors(enemy.position, position);
    const distance = toEnemyVector.length();

    if (distance > BONECLAW_RANGE) continue;

    normalizedToEnemy.copy(toEnemyVector).normalize();
    const angle = Math.acos(normalizedToEnemy.dot(direction));

    if (angle > BONECLAW_ARC_HALF) continue;

    const { damage, isCritical } = calculateDamage(BONECLAW_BASE_DAMAGE);

    hits.push({
      targetId: enemy.id,
      damage,
      isCritical,
      position: enemy.position.clone() // Only clone when necessary
    });
  }

  return hits;
}