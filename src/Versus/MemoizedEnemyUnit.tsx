// src/versus/MemoizedEnemyUnit.tsx
import React from 'react';
import EnemyUnit from '@/Versus/EnemyUnit';
import { EnemyUnitProps } from '@/Versus/EnemyUnitProps';
import { sharedGeometries, sharedMaterials } from '../Scene/SharedResources';

export const MemoizedEnemyUnit = React.memo(
  EnemyUnit,
  (prevProps: EnemyUnitProps, nextProps: EnemyUnitProps) => {
    return (
      prevProps.health === nextProps.health &&
      prevProps.position.equals(nextProps.position) &&
      prevProps.playerPosition.equals(nextProps.playerPosition)
    );
  }
);

// Use shared resources
const geometry = sharedGeometries.skeleton;
const material = sharedMaterials.skeleton;

// Export these for use in the mesh
export { geometry, material }; 