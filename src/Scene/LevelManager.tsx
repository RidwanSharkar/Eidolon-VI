// src/Scene/LevelManager.tsx
import React, { useEffect } from 'react';
import Scene from '@/Scene/Scene';
import { SceneProps } from '@/Scene/SceneProps';

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
  onAbilityUnlock 
}: LevelManagerProps) {

  // Set initial camera position
  useEffect(() => {
    if (sceneProps.unitProps.controlsRef.current) {
      sceneProps.unitProps.controlsRef.current.object.position.set(0, 12, -18);
      sceneProps.unitProps.controlsRef.current.target.set(0, 0, 0);
      sceneProps.unitProps.controlsRef.current.update();
    }
  }, [sceneProps.unitProps.controlsRef]);

  // Since there are no level transitions anymore, we just render the continuous scene
  return (
    <Scene 
      {...sceneProps} 
      onLevelComplete={() => {}} // No level completion needed
      onAbilityUnlock={onAbilityUnlock}
      spawnInterval={10000} // 10 seconds for regular spawns
      maxSkeletons={20} // Effectively unlimited
      initialSkeletons={3} // Start with 3 skeletons
    />
  );
}