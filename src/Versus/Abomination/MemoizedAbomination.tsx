import React from 'react';
import AbominationUnit from './AbominationUnit';
import { AbominationProps } from './AbominationProps';
import { sharedGeometries, sharedMaterials } from '../../Scene/SharedResources';

export const MemoizedAbominationUnit = React.memo(
  AbominationUnit,
  (prevProps: AbominationProps, nextProps: AbominationProps) => {
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
    
    return true;
  }
);

// Use shared resources
const geometry = sharedGeometries.abomination;
const material = sharedMaterials.abomination;

// Export these for use in the mesh
export { geometry, material }; 