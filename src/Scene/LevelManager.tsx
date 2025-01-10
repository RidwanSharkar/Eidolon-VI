// src/Scene/LevelManager.tsx
import React, { useCallback, useState, useEffect } from 'react';
import Scene from './Scene';
import Scene2 from './Scene2';
import Scene3 from './Scene3';
import { SceneProps } from './SceneProps';

interface LevelManagerProps {
  sceneProps: SceneProps & {
    spawnInterval?: number;
    maxSkeletons?: number;
    initialSkeletons?: number;
  };
  onAbilityUnlock: (abilityType: 'r' | 'passive' | 'active') => void;
  onLevelTransition: (level: number, showPanel: boolean) => void;
  currentLevel: number;
}

export default function LevelManager({ 
  sceneProps, 
  onLevelTransition,
  currentLevel,
  onAbilityUnlock 
}: LevelManagerProps) {
  const [showScene2, setShowScene2] = useState(false);
  const [showScene3, setShowScene3] = useState(false);
  const [levelCompleted, setLevelCompleted] = useState(false);

  const handleLevelComplete = useCallback(() => {
    if (levelCompleted) return; // Prevent duplicate handling

    const killCount = sceneProps.killCount || 0;
    
    // Logging for debugging
    console.log('Checking level completion conditions:');
    console.log(`Level 1 condition: killCount >= 13 && currentLevel === 1: ${killCount >= 13 && currentLevel === 1}`);
    console.log(`Level 2 condition: killCount >= 30 && currentLevel === 2: ${killCount >= 30 && currentLevel === 2}`);
    console.log(`Level 3 condition: killCount >= 53 && currentLevel === 3: ${killCount >= 53 && currentLevel === 3}`);
    
    // Level completion conditions
    if (killCount >= 13 && currentLevel === 1) {
      console.log('Level 1 completion triggered');
      onLevelTransition(1, true);
      setLevelCompleted(true);
    } else if (killCount >= 30 && currentLevel === 2) {
      console.log('Level 2 completion triggered');
      onLevelTransition(2, true);
      setLevelCompleted(true);
    } else if (currentLevel === 3 && killCount >= 53) {
      console.log('Level 3 completion triggered');
      onLevelTransition(3, false);
      setLevelCompleted(true);
    }
  }, [currentLevel, onLevelTransition, sceneProps.killCount, levelCompleted]);

  // Add a useEffect to monitor kill count changes
  useEffect(() => {
    console.log(`Kill count changed: ${sceneProps.killCount}`);
  }, [sceneProps.killCount]);

  // Scene switching based on current level
  useEffect(() => {
    if (currentLevel === 2) {
      setShowScene2(true);
      setShowScene3(false);
    } else if (currentLevel === 3) {
      setShowScene2(false);
      setShowScene3(true);
    } else {
      setShowScene2(false);
      setShowScene3(false);
    }
    setLevelCompleted(false); // Reset flag for the new level
  }, [currentLevel]);

  return (
    <>
      {!showScene2 && !showScene3 && (
        <Scene 
          {...sceneProps} 
          onLevelComplete={handleLevelComplete}
          onAbilityUnlock={onAbilityUnlock}
          spawnInterval={4000}
          maxSkeletons={13}
          initialSkeletons={4}
        />
      )}
      {showScene2 && !showScene3 && (
        <Scene2 
          {...sceneProps} 
          onLevelComplete={handleLevelComplete}
          onAbilityUnlock={onAbilityUnlock}
          spawnInterval={9500}
          maxSkeletons={17}
          initialSkeletons={6}
          spawnCount={2}
        />
      )}
      {showScene3 && (
        <Scene3 
          {...sceneProps} 
          onLevelComplete={handleLevelComplete}
          onAbilityUnlock={onAbilityUnlock}
          spawnInterval={10500}
          maxSkeletons={23}
          initialSkeletons={8}
          spawnCount={2}
        />
      )}
    </>
  );
}