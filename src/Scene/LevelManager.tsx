// src/Scene/LevelManager.tsx
import React, { useCallback } from 'react';
import Scene from './Scene';
import Scene2 from './Scene2';   
import { SceneProps } from './SceneProps';

interface LevelManagerProps {
  sceneProps: SceneProps & {
    spawnInterval?: number;
    maxSkeletons?: number;
    initialSkeletons?: number;
  };
  onAbilityUnlock: (abilityType: 'r' | 'passive') => void;
  onLevelTransition: (level: number, showPanel: boolean) => void;
  currentLevel: number;
}

export default function LevelManager({ 
  sceneProps, 
  onLevelTransition,
  currentLevel 
}: LevelManagerProps) {
  const handleLevelComplete = useCallback(() => {
    if (currentLevel === 1) {
      onLevelTransition(2, true);
    } else if (currentLevel === 2) {
      onLevelTransition(3, true);
    }
  }, [currentLevel, onLevelTransition]);

  return (
    <>
      {currentLevel === 1 ? (
        <Scene {...sceneProps} onLevelComplete={handleLevelComplete} />
      ) : (
        <Scene2 {...sceneProps} onLevelComplete={handleLevelComplete} />
      )}
    </>
  );
}