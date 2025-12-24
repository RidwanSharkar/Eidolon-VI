// src/Spells/Firestorm/FirestormDamage.ts
import { Vector3 } from 'three';
import { calculateDamage } from '@/Weapons/damage';

interface FirestormHit {
  targetId: string;
  damage: number;
  isCritical: boolean;
  position: Vector3;
}

export function calculateFirestormDamage(
  playerPosition: Vector3,
  enemyData: Array<{ id: string; position: Vector3; health: number }>
): FirestormHit[] {
  const hits: FirestormHit[] = [];
  const firestormRadius = 6.0;
  const baseDamage = 31;

  enemyData.forEach(enemy => {
    const distance = playerPosition.distanceTo(enemy.position);
    
    if (distance <= firestormRadius) {
      // Use global critical rune system for firestorm damage
      const damageResult = calculateDamage(baseDamage);
      const damage = damageResult.damage;
      const isCritical = damageResult.isCritical;

      hits.push({
        targetId: `enemy-${enemy.id}`,
        damage,
        isCritical,
        position: enemy.position.clone()
      });
    }
  });

  return hits;
}