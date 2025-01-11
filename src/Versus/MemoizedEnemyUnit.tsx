// src/versus/MemoizedEnemyUnit.tsx
import React from 'react';
import EnemyUnit from '@/Versus/EnemyUnit';
import { EnemyUnitProps } from '@/Versus/EnemyUnitProps';

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