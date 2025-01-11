// src/versus/SkeletalMage/MemoizedSkeletalMage.tsx
import React from 'react';
import SkeletalMage from '@/Versus/SkeletalMage/SkeletalMage';
import { SkeletalMageProps } from '@/Versus/SkeletalMage/SkeletalMageProps';

export const MemoizedSkeletalMage = React.memo(
  SkeletalMage,
  (prevProps: SkeletalMageProps, nextProps: SkeletalMageProps) => {
    return (
      prevProps.health === nextProps.health &&
      prevProps.position.equals(nextProps.position) &&
      prevProps.playerPosition.equals(nextProps.playerPosition)
    );
  }
); 