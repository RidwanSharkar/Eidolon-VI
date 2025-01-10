import React from 'react';
import AbominationUnit from './AbominationUnit';
import { AbominationProps } from './AbominationProps';

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