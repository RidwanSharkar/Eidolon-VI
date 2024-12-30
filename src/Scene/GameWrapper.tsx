import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import LevelManager from './LevelManager'; 
import Panel from '../Interface/Panel';
import { SceneProps } from './SceneProps';
import * as THREE from 'three';
import { WeaponType } from '@/Weapons/weapons';
import { WeaponInfo } from '../Unit/UnitProps';
import WeaponSelectionPanel from '../Interface/WeaponSelectionPanel';
import LevelCompletionPanel from '../Interface/LevelCompletionPanel';
import Behavior from './Behavior';

interface GameWrapperProps {
  sceneProps: SceneProps;
  currentWeapon: WeaponType;
  onWeaponSelect: (weapon: WeaponType) => void;
  playerHealth: number;
  maxHealth: number;
  abilities: WeaponInfo;
  onReset: () => void;
  killCount: number;
  onAbilityUnlock: (abilityType: 'r' | 'passive') => void;
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

  const handleLevelTransition = useCallback((level: number, show: boolean) => {
    setCurrentLevel(level);
    setShowLevelPanel(show);
  }, []);

  const handleContinue = useCallback(() => {
    setCurrentLevel(2);
    setShowLevelPanel(false);
    setSelectedIcon(null);
  }, []);

  const handleReset = useCallback(() => {
    console.log("GameWrapper: Reset triggered");
    setGameStarted(false);
    setCurrentLevel(1);
    setShowLevelPanel(false);
    setSelectedIcon(null);
    onReset();
  }, [onReset]);

  useEffect(() => {
    const preventSpaceScroll = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventSpaceScroll);
    return () => window.removeEventListener('keydown', preventSpaceScroll);
  }, []);

  return (
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
            <LevelManager 
              sceneProps={{
                ...sceneProps,
                onReset: handleReset
              }}
              onAbilityUnlock={onAbilityUnlock}
              onLevelTransition={handleLevelTransition}
              currentLevel={currentLevel}
            />
          )}
          <OrbitControls
            ref={sceneProps.unitProps.controlsRef}
            enablePan={false}
            maxPolarAngle={Math.PI / 2.25}
            maxDistance={21}
            mouseButtons={{
              LEFT: undefined,
              MIDDLE: undefined,
              RIGHT: THREE.MOUSE.ROTATE
            }}
            minDistance={7}
            rotateSpeed={0.75}
            enableDamping={true}
            dampingFactor={0.075}
            zoomSpeed={1.5}
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
        maxSkeletons={15}
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
  );
} 

