import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import LevelManager from '@/Scene/LevelManager'; 
import Panel from '@/Interface/Panel';
import { SceneProps } from '@/Scene/SceneProps';
import * as THREE from 'three';
import { AbilityType, WeaponType } from '@/Weapons/weapons';
import { WeaponInfo } from '../Unit/UnitProps';
import WeaponSelectionPanel from '../Interface/WeaponSelectionPanel';
import LevelCompletionPanel from '../Interface/LevelCompletionPanel';
import Behavior from '@/Scene/Behavior';
import { GameStateProvider } from '@/Scene/GameStateContext';

interface GameWrapperProps {
  sceneProps: SceneProps;
  currentWeapon: WeaponType;
  onWeaponSelect: (weapon: WeaponType) => void;
  playerHealth: number;
  maxHealth: number;
  abilities: WeaponInfo;
  onReset: () => void;
  killCount: number;
  onAbilityUnlock: (abilityType: AbilityType) => void;
}
  
export default function GameWrapper({ 
  sceneProps,
  currentWeapon,
  onWeaponSelect,
  playerHealth,
  maxHealth,
  abilities,
  onReset,
  killCount,
  onAbilityUnlock
}: GameWrapperProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [showLevelPanel, setShowLevelPanel] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<number | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);

  const handleStart = () => {
    console.log('handleStart called, currentWeapon:', currentWeapon);
    if (currentWeapon) {
      setGameStarted(true);
    }
  };

  const handleLevelTransition = useCallback((level: number, showPanel: boolean) => {
    if (showPanel) {
      setShowLevelPanel(true);
    } else {
      setCurrentLevel(prev => prev + 1);
    }
  }, []);

  const handleContinue = useCallback(() => {
    setShowLevelPanel(false);
    setSelectedIcon(null);
    setCurrentLevel(prev => prev + 1);
  }, []);

  const handleReset = useCallback(() => {
    console.log("GameWrapper: Reset triggered");
    setGameStarted(false);
    setCurrentLevel(1);
    setShowLevelPanel(false);
    setSelectedIcon(null);
    onReset();
  }, [onReset, ,]);

  useEffect(() => {
    const preventSpaceScroll = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventSpaceScroll);
    return () => window.removeEventListener('keydown', preventSpaceScroll);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup when game wrapper unmounts
      if (sceneProps.unitProps.controlsRef.current) {
        sceneProps.unitProps.controlsRef.current.dispose();
      }
      // Clear any game-wide resources
      THREE.Cache.clear();
    };
  }, [sceneProps.unitProps.controlsRef,]);

  return (
    <GameStateProvider>
      <>
        <div style={{ 
          width: '100vw', 
          height: '100vh', 
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          touchAction: 'none'
        }}>
          <Canvas>
            <ambientLight intensity={0.2} />
            {gameStarted && (
              <Suspense fallback={null}>
                <LevelManager 
                  sceneProps={{
                    ...sceneProps,
                    onReset: handleReset
                  }}
                  onAbilityUnlock={onAbilityUnlock}
                  onLevelTransition={handleLevelTransition}
                  currentLevel={currentLevel}
                />
              </Suspense>
            )}
            <OrbitControls
              ref={sceneProps.unitProps.controlsRef}
              enablePan={false}
              maxPolarAngle={Math.PI / 2.25}
              maxDistance={13.5}
              mouseButtons={{
                LEFT: undefined,
                MIDDLE: undefined,
                RIGHT: THREE.MOUSE.ROTATE
              }}
              minDistance={5}
              rotateSpeed={0.5}
              enableDamping={true}
              dampingFactor={0.075}
              zoomSpeed={1.75}
              position={[0, 15, 20]}
              target={[0, 0, 0]}
            />
          </Canvas>
        </div>

        <Behavior
          playerHealth={playerHealth}
          onReset={handleReset}
          killCount={killCount}
          onEnemiesDefeated={() => {}}
          maxSkeletons={12} // why dfq
        />

        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: (!gameStarted || showLevelPanel) ? 'auto' : 'none',
          zIndex: 1000
        }}>
          {!gameStarted ? (
            <WeaponSelectionPanel 
              onWeaponSelect={onWeaponSelect}
              selectedWeapon={currentWeapon}
              onStart={handleStart}
            />
          ) : showLevelPanel ? (
            <LevelCompletionPanel 
              onContinue={handleContinue}
              onSelectIcon={setSelectedIcon}
              selectedIcon={selectedIcon}
              currentWeapon={currentWeapon}
              onAbilityUnlock={onAbilityUnlock}
              abilities={abilities}
            />
          ) : (
            <Panel 
              currentWeapon={currentWeapon}
              onWeaponSelect={() => {}}
              playerHealth={playerHealth}
              maxHealth={maxHealth}
              abilities={abilities}
              onReset={onReset}
              killCount={killCount}
            />
          )}
        </div>
      </>
    </GameStateProvider>
  );
} 

