// src/Spells/Blizzard/BlizzardDamage.ts
import { Vector3 } from 'three';
import { calculateDamage } from '@/Weapons/damage';

const BLIZZARD_BASE_DAMAGE = 29;
const BLIZZARD_RADIUS = 4.75;

interface BlizzardHitResult {
  targetId: string;
  damage: number;
  isCritical: boolean;
  position: Vector3;
}

export function calculateBlizzardDamage(
  position: Vector3,
  enemies: Array<{ id: string; position: Vector3; health: number }>,
): BlizzardHitResult[] {
  const hits: BlizzardHitResult[] = [];
  
  enemies.forEach(enemy => {
    if (enemy.health <= 0) return;

    const distance = enemy.position.distanceTo(position);
    if (distance <= BLIZZARD_RADIUS) {
      const { damage, isCritical } = calculateDamage(BLIZZARD_BASE_DAMAGE);
      
      hits.push({
        targetId: enemy.id,
        damage,
        isCritical,
        position: enemy.position.clone()
      });
    }
  });

  return hits;
}