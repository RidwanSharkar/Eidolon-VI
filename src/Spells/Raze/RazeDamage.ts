// src/Spells/Raze/RazeDamage.ts
import { Vector3 } from 'three';

interface RazeHit {
  targetId: string;
  damage: number;
  isCritical: boolean;
  position: Vector3;
}

export function calculateRazeDamage(
  razeStrips: Array<{ id: number; startPosition: Vector3; endPosition: Vector3; width: number }>,
  enemyData: Array<{ id: string; position: Vector3; health: number; isDying?: boolean }>,
  level: number = 1
): RazeHit[] {
  const hits: RazeHit[] = [];
  const baseDamage = level >= 4 ? 53 : 23; // Upgraded damage at level 4
  const stripWidth = 0.8; // Width of the fire strip

  razeStrips.forEach(strip => {
    enemyData.forEach(enemy => {
      // Skip dead or dying enemies
      if (enemy.isDying || enemy.health <= 0) {
        return;
      }

      // Calculate if enemy is within the strip area
      const isInStrip = isPointInStrip(
        enemy.position,
        strip.startPosition,
        strip.endPosition,
        stripWidth
      );
      
      if (isInStrip) {
        console.log(`[Raze Hit] Enemy ${enemy.id} at position (${enemy.position.x.toFixed(1)}, ${enemy.position.z.toFixed(1)}) taking ${baseDamage} damage from Raze strip`);
        
        // 5% critical chance for raze damage
        const isCritical = Math.random() < 0.1;
        const damage = isCritical ? baseDamage * 2 : baseDamage;
        
        hits.push({
          targetId: enemy.id, // enemy.id already includes "enemy-" prefix from Scene.tsx
          damage,
          isCritical,
          position: enemy.position.clone()
        });
      } else {
        // Debug logging for enemies not in strip
        const stripDirection = new Vector3().subVectors(strip.endPosition, strip.startPosition);
        const stripLength = stripDirection.length();
        const pointDirection = new Vector3().subVectors(enemy.position, strip.startPosition);
        const projectionLength = pointDirection.dot(stripDirection.normalize());
        
        if (projectionLength >= 0 && projectionLength <= stripLength) {
          const projectionPoint = new Vector3()
            .copy(stripDirection)
            .multiplyScalar(projectionLength)
            .add(strip.startPosition);
          const perpendicularDistance = enemy.position.distanceTo(projectionPoint);
          console.log(`[Raze Miss] Enemy ${enemy.id} at (${enemy.position.x.toFixed(1)}, ${enemy.position.z.toFixed(1)}) - perpendicular distance: ${perpendicularDistance.toFixed(2)} (need <= ${stripWidth/2})`);
        }
      }
    });
  });

  return hits;
}

function isPointInStrip(
  point: Vector3,
  startPosition: Vector3,
  endPosition: Vector3,
  width: number
): boolean {
  // Create a vector from start to end
  const stripDirection = new Vector3().subVectors(endPosition, startPosition);
  const stripLength = stripDirection.length();
  
  if (stripLength === 0) return false;
  
  stripDirection.normalize();
  
  // Vector from start to point
  const pointDirection = new Vector3().subVectors(point, startPosition);
  
  // Project point onto the strip line
  const projectionLength = pointDirection.dot(stripDirection);
  
  // Check if point is within the length of the strip
  if (projectionLength < 0 || projectionLength > stripLength) {
    return false;
  }
  
  // Calculate perpendicular distance from point to strip line
  const projectionPoint = new Vector3()
    .copy(stripDirection)
    .multiplyScalar(projectionLength)
    .add(startPosition);
  
  const perpendicularDistance = point.distanceTo(projectionPoint);
  
  // Check if point is within the width of the strip
  return perpendicularDistance <= width / 2;
}