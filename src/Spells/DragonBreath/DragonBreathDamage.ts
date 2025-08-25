import { Vector3 } from 'three';

// Dragon Breath damage constants
const DRAGON_BREATH_BASE_DAMAGE = 360;
const DRAGON_BREATH_RANGE = 9; // Range of the breath cone
const DRAGON_BREATH_ARC = Math.PI * 0.8; // 144-degree arc (wider than most cones)
const DRAGON_BREATH_ARC_HALF = DRAGON_BREATH_ARC / 2;

// Static vectors for reuse
const STATIC_VECTORS = {
  temp1: new Vector3(),
  temp2: new Vector3()
};

interface DragonBreathHitResult {
  targetId: string;
  damage: number;
  isCritical: boolean;
  position: Vector3;
  knockbackDirection?: Vector3;
}

export function calculateDragonBreathHits(
  position: Vector3,
  direction: Vector3,
  enemies: Array<{ id: string; position: Vector3; health: number; isDying?: boolean }>,
  hitEnemies: Set<string> // Track already hit enemies to prevent multiple hits
): DragonBreathHitResult[] {
  const hits: DragonBreathHitResult[] = [];
  
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.health <= 0 || enemy.isDying || hitEnemies.has(enemy.id)) continue;

    // Calculate vector from breath origin to enemy
    STATIC_VECTORS.temp1.subVectors(enemy.position, position);
    const distance = STATIC_VECTORS.temp1.length();

    // Check if enemy is within range
    if (distance > DRAGON_BREATH_RANGE) continue;

    // Normalize the direction to enemy and check angle
    STATIC_VECTORS.temp2.copy(STATIC_VECTORS.temp1).normalize();
    const angle = Math.acos(Math.max(-1, Math.min(1, STATIC_VECTORS.temp2.dot(direction))));

    // Check if enemy is within the breath cone
    if (angle > DRAGON_BREATH_ARC_HALF) continue;

    // Dragon Breath doesn't crit - consistent green flame damage
    const damage = DRAGON_BREATH_BASE_DAMAGE;
    const isCritical = false;

    // Calculate knockback direction (away from caster)
    const knockbackDirection = STATIC_VECTORS.temp1.clone().normalize();

    hits.push({
      targetId: enemy.id,
      damage,
      isCritical,
      position: enemy.position.clone(),
      knockbackDirection: knockbackDirection.clone()
    });
  }

  return hits;
}
