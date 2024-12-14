import React, { useState } from 'react';
import Scene from './Scene';
import Scene2 from './Scene2';   
import LevelUpNotification from '../Interface/LevelUpNotification';
import { SceneProps } from './SceneProps';

interface LevelManagerProps {
  sceneProps: SceneProps;
}

export default function LevelManager({ sceneProps }: LevelManagerProps) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const handleLevelComplete = () => {
    if (currentLevel === 1) {
      setShowLevelUp(true);
      
      // Wait 15 seconds before starting level 2
      setTimeout(() => {
        setCurrentLevel(2);
        setShowLevelUp(false);
      }, 20000);
    }
  };

  const sceneCommonProps = {
    ...sceneProps,
    onLevelComplete: handleLevelComplete,
    spawnInterval: 10000,
  };

  return (
    <>
      {currentLevel === 1 ? (
        <Scene
          {...sceneCommonProps}
          maxSkeletons={15}
          initialSkeletons={5}
        />
      ) : (
        <Scene2
          {...sceneCommonProps}
          maxSkeletons={25}
          initialSkeletons={5}
          spawnCount={2}
        />
      )}
      {showLevelUp && (
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 1000 
        }}>
          <LevelUpNotification level={2} />
        </div>
      )}
    </>
  );
}