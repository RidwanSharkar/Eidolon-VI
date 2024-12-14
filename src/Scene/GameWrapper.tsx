import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import LevelManager from './LevelManager'; 
import Panel from '../Interface/Panel';
import { SceneProps } from './SceneProps';
import * as THREE from 'three';
import { WeaponType } from '@/Weapons/weapons';

interface AbilityButton {
  key: string;
  cooldown: number;
  currentCooldown: number;
  icon: string;
  maxCooldown: number;
  name: string;
}

interface WeaponInfo {
  [key: string]: {
    q: AbilityButton;
    e: AbilityButton;
  };
}

interface GameWrapperProps {
  sceneProps: SceneProps;
  currentWeapon: WeaponType;
  onWeaponSelect: (weapon: WeaponType) => void;
  playerHealth: number;
  maxHealth: number;
  abilities: WeaponInfo;
  onReset: () => void;
  killCount: number;
}

export default function GameWrapper({ 
  sceneProps,
  currentWeapon,
  onWeaponSelect,
  playerHealth,
  maxHealth,
  abilities,
  onReset,
  killCount
}: GameWrapperProps) {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <Canvas shadows camera={{ position: [0, 10, 20], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <LevelManager sceneProps={sceneProps} />
        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          maxDistance={75}
          mouseButtons={{
            LEFT: undefined,
            MIDDLE: undefined,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
      </Canvas>
      <Panel 
        currentWeapon={currentWeapon}
        onWeaponSelect={onWeaponSelect}
        playerHealth={playerHealth}
        maxHealth={maxHealth}
        abilities={abilities}
        onReset={onReset}
        killCount={killCount}
      />
    </div>
  );
} 