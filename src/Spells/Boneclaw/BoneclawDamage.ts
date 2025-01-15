import { Vector3 } from 'three';
import { calculateDamage } from '@/Weapons/damage';

const BONECLAW_BASE_DAMAGE = 71;
const BONECLAW_RANGE = 8.625;
const BONECLAW_ARC = Math.PI ; // 144 degrees arc

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
): BoneclawHitResult[] {
  const hits: BoneclawHitResult[] = [];
  
  enemies.forEach(enemy => {
    if (enemy.health <= 0) return; // Skip dead enemies

    // Calculate distance
    const toEnemy = enemy.position.clone().sub(position);
    const distance = toEnemy.length();

    // Check if enemy is within range
    if (distance > BONECLAW_RANGE) return;

    // Calculate angle between boneclaw direction and direction to enemy
    toEnemy.normalize();
    const angle = Math.acos(toEnemy.dot(direction));

    // Check if enemy is within the arc
    if (angle > BONECLAW_ARC / 2) return;

    // Calculate damage
    const { damage, isCritical } = calculateDamage(BONECLAW_BASE_DAMAGE);

    hits.push({
      targetId: enemy.id,
      damage,
      isCritical,
      position: enemy.position.clone()
    });
  });

  return hits;
}