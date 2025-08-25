// src/Spells/Blizzard/BlizzardDamage.ts
import { Vector3 } from 'three';
import { calculateDamage } from '@/Weapons/damage';

const BLIZZARD_RADIUS = 5.35;

// Level-based damage scaling function for Blizzard
const getBlizzardDamage = (level: number): number => {
  switch (level) {
    case 2: return 37;
    case 3: return 47;
    case 4: return 59;
    case 5: return 71;
    default: return 37; // Fallback to level 2 damage (Blizzard unlocks at level 2)
  }
};

interface BlizzardHitResult {
  targetId: string;
  damage: number;
  isCritical: boolean;
  position: Vector3;
}

export function calculateBlizzardDamage(
  position: Vector3,
  enemies: Array<{ id: string; position: Vector3; health: number }>,
  level: number = 2
): BlizzardHitResult[] {
  const hits: BlizzardHitResult[] = [];
  
  enemies.forEach(enemy => {
    if (enemy.health <= 0) return;

    const distance = enemy.position.distanceTo(position);
    if (distance <= BLIZZARD_RADIUS) {
      const baseDamage = getBlizzardDamage(level);
      const { damage, isCritical } = calculateDamage(baseDamage);
      
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