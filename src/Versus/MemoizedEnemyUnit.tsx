// src/versus/MemoizedEnemyUnit.tsx
import React from 'react';
import EnemyUnit from '@/Versus/EnemyUnit';
import { EnemyUnitProps } from '@/Versus/EnemyUnitProps';
import { sharedGeometries, sharedMaterials } from '../Scene/SharedResources';

export const MemoizedEnemyUnit = React.memo(
  EnemyUnit,
  (prevProps: EnemyUnitProps, nextProps: EnemyUnitProps) => {
    // Check if health changed
    if (prevProps.health !== nextProps.health) return false;
    
    // Check if position changed
    if (!prevProps.position.equals(nextProps.position)) return false;
    
    // Check playerPosition (handle optional nature)
    if (prevProps.playerPosition !== nextProps.playerPosition) {
      // If one is undefined and other is defined, they're different
      if (!prevProps.playerPosition || !nextProps.playerPosition) {
        return false;
      }
      // Both are defined, compare with equals
      if (!prevProps.playerPosition.equals(nextProps.playerPosition)) {
        return false;
      }
    }
    
    // Check allPlayers array (handle optional nature)
    if (prevProps.allPlayers !== nextProps.allPlayers) {
      // If one is undefined and other is defined, they're different
      if (!prevProps.allPlayers || !nextProps.allPlayers) {
        return false;
      }
      // Both are defined, compare arrays
      if (prevProps.allPlayers.length !== nextProps.allPlayers.length) {
        return false;
      }
      // Compare each player in the arrays
      for (let i = 0; i < prevProps.allPlayers.length; i++) {
        if (!prevProps.allPlayers[i].position.equals(nextProps.allPlayers[i].position)) {
          return false;
        }
      }
    }
    
    // Check summonedUnits array (handle optional nature)
    if (prevProps.summonedUnits !== nextProps.summonedUnits) {
      // If one is undefined and other is defined, they're different
      if (!prevProps.summonedUnits || !nextProps.summonedUnits) {
        return false;
      }
      // Both are defined, compare arrays
      if (prevProps.summonedUnits.length !== nextProps.summonedUnits.length) {
        return false;
      }
      // Compare each summoned unit in the arrays
      for (let i = 0; i < prevProps.summonedUnits.length; i++) {
        const prev = prevProps.summonedUnits[i];
        const next = nextProps.summonedUnits[i];
        if (!prev.position.equals(next.position) || prev.health !== next.health) {
          return false;
        }
      }
    }
    
    return true;
  }
);

// Use shared resources
const geometry = sharedGeometries.skeleton;
const material = sharedMaterials.skeleton;

// Export these for use in the mesh
export { geometry, material }; 