// src/Scene/LevelManager.tsx
import React, { useCallback, useState, useEffect } from 'react';
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
  const [showScene2, setShowScene2] = useState(false);

  const handleLevelComplete = useCallback(() => {
    if (currentLevel === 1) {
      onLevelTransition(1, true);
    }
  }, [currentLevel, onLevelTransition]);

  useEffect(() => {
    if (currentLevel === 2) {
      setShowScene2(true);
    } else {
      setShowScene2(false);
    }
  }, [currentLevel]);

  return (
    <>
      {!showScene2 ? (
        <Scene {...sceneProps} onLevelComplete={handleLevelComplete} />
      ) : (
        <Scene2 {...sceneProps} onLevelComplete={handleLevelComplete} />
      )}
    </>
  );
}