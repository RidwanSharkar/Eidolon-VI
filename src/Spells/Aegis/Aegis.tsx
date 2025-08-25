import React from 'react';
import { Vector3 } from 'three';
import AegisProjectile from './AegisProjectile';

interface AegisProjectileData {
  id: number;
  position: Vector3;
  targetId: string | null;
  bounceCount: number;
  hitTargets: Set<string>;
  startTime: number;
  travelProgress: number;
  startPosition: Vector3;
  targetPosition: Vector3;
  direction: Vector3;
  isInitialProjectile: boolean;
  maxDistance: number;
  isReturnBounce?: boolean; // Flag for aesthetic return bounce
}

interface AegisProps {
  projectiles: AegisProjectileData[];
}

export default function Aegis({ projectiles }: AegisProps) {
  return (
    <group>
      {projectiles.map((projectile) => (
        <AegisProjectile
          key={projectile.id}
          position={projectile.position}
          scale={0.8} // Smaller scale for projectile
          opacity={1}
        />
      ))}
    </group>
  );
}