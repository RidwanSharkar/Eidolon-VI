import React from 'react';
import AbominationUnit from './AbominationUnit';
import { AbominationProps } from './AbominationProps';
import { sharedGeometries, sharedMaterials } from '../../Scene/SharedResources';

export const MemoizedAbominationUnit = React.memo(
  AbominationUnit,
  (prevProps: AbominationProps, nextProps: AbominationProps) => {
    return (
      prevProps.health === nextProps.health &&
      prevProps.position.equals(nextProps.position) &&
      prevProps.playerPosition.equals(nextProps.playerPosition)
    );
  }
);

// Use shared resources
const geometry = sharedGeometries.abomination;
const material = sharedMaterials.abomination;

// Export these for use in the mesh
export { geometry, material }; 