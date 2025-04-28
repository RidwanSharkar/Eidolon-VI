// src/Scene/LevelManager.tsx
import React, { useCallback, useState, useEffect } from 'react';
import Scene from '@/Scene/Scene';
import Scene2 from '@/Scene/Scene2';
import Scene3 from '@/Scene/Scene3';
import { SceneProps } from '@/Scene/SceneProps';
import * as THREE from 'three';
import { RootState } from '@react-three/fiber';

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

  // CLEANER
  const thoroughCleanup = useCallback(() => {
    return new Promise<void>(resolve => {
      // Clear THREE.js resources
      const disposeNode = (node: THREE.Object3D) => {
        if ('geometry' in node && node.geometry instanceof THREE.BufferGeometry) {
          node.geometry.dispose();
        }
        
        if ('material' in node) {
          const material = node.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) {
            material.forEach(m => m.dispose());
          } else {
            material?.dispose();
          }
        }
        
        if ('texture' in node && node.texture instanceof THREE.Texture) {
          node.texture.dispose();
        }
        
        node.children.forEach(child => disposeNode(child));
      };

      // Get all scenes and dispose their resources
      const scenes = document.querySelectorAll('canvas');
      scenes.forEach(canvas => {
        const scene = (canvas as { __r3f?: RootState }).__r3f?.scene;
        if (scene) {
          scene.traverse(disposeNode);
        }
      });

      // Force a garbage collection hint
      if (window.gc) {
        window.gc();
      }
      
      resolve();
    });
  }, []);

  const handleLevelComplete = useCallback(() => {
    if (levelCompleted) return; // Prevent duplicate handling

    const killCount = sceneProps.killCount || 0;
    
    // Level completion conditions
    if (killCount >= 13 && currentLevel === 1) {
      onLevelTransition(1, true);
      setLevelCompleted(true);
    } else if (killCount >= 30 && currentLevel === 2) {
      onLevelTransition(2, true);
      setLevelCompleted(true);
    } else if (currentLevel === 3 && killCount >= 50) {
      // For level 3, we rely on the boss defeat to trigger completion
      // This condition is a fallback
      onLevelTransition(3, false);
      setLevelCompleted(true);
    }
  }, [currentLevel, onLevelTransition, sceneProps.killCount, levelCompleted]);

  // useEffect to monitor kill count changes
  useEffect(() => {
    handleLevelComplete();
  }, [sceneProps.killCount, handleLevelComplete]);

  // Scene switching based on current level
  useEffect(() => {
    const switchScene = async () => {
      await thoroughCleanup();
      
      // Wait for 1.5 seconds to ensure thorough cleanup
      await new Promise(resolve => setTimeout(resolve, 1100));
      
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
      setLevelCompleted(false);
    };

    switchScene();
  }, [currentLevel, thoroughCleanup]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      thoroughCleanup();
    };
  }, [thoroughCleanup]);

  // Keep the existing return statement with all scenes
  return (
    <>
      {!showScene2 && !showScene3 && (
        <Scene 
          {...sceneProps} 
          onLevelComplete={handleLevelComplete}
          onAbilityUnlock={onAbilityUnlock}
          spawnInterval={1000}
          maxSkeletons={13}
          initialSkeletons={4}
        />
      )}
      {showScene2 && !showScene3 && (
        <Scene2 
          {...sceneProps} 
          onLevelComplete={handleLevelComplete}
          onAbilityUnlock={onAbilityUnlock}
          spawnInterval={1000}
          maxSkeletons={17}
          initialSkeletons={5}
          spawnCount={3}
        />
      )}
      {showScene3 && (
        <Scene3 
          {...sceneProps} 
          onLevelComplete={handleLevelComplete}
          onAbilityUnlock={onAbilityUnlock}
          spawnInterval={4500}
          maxSkeletons={20}
          initialSkeletons={5}
          spawnCount={4}
        />
      )}
    </>
  );
}