import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import LevelManager from '@/Scene/LevelManager'; 
import Panel from '@/Interface/Panel';
import HealthOrb from '@/Interface/HealthOrb';
import { SceneProps } from '@/Scene/SceneProps';
import * as THREE from 'three';
import { AbilityType, WeaponType, WeaponSubclass, WeaponInfo, SUBCLASS_ABILITIES } from '@/Weapons/weapons';
import WeaponSelectionPanel from '../Interface/WeaponSelectionPanel';
import Behavior from '@/Scene/Behavior';
import { GameStateProvider, useGameState } from '@/Scene/GameStateContext';
import { MultiplayerProvider, useMultiplayer } from '@/Multiplayer/MultiplayerContext';
import RoomJoin from '@/Multiplayer/RoomJoin';
import { useDashCharges } from '@/Unit/useDashCharges';
import { RuneCounter } from '@/Interface/RuneCounter';

interface GameWrapperProps {
  sceneProps: SceneProps;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
  onWeaponSelect: (weapon: WeaponType, subclass?: WeaponSubclass) => void;
  playerHealth: number;
  maxHealth: number;
  abilities: WeaponInfo;
  onReset: () => void;
  killCount: number;
  onAbilityUnlock: (abilityType: AbilityType) => void;
}

type GameMode = 'menu' | 'gamemode-selection' | 'singleplayer' | 'multiplayer' | 'game';

// Inner component that uses the multiplayer hook
function GameContent({ 
  sceneProps,
  currentWeapon,
  currentSubclass,
  onWeaponSelect,
  playerHealth,
  maxHealth,
  abilities,
  onReset,
  killCount,
  onAbilityUnlock
}: GameWrapperProps) {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  
  // ✅ Now this works because we're inside the MultiplayerProvider
  const { 
    isInRoom, 
    killCount: multiplayerKillCount, 
    currentPlayerHealth, 
    currentPlayerMaxHealth 
  } = useMultiplayer();
  
  // Get rune system state
  const { 
    criticalRuneCount, 
    critDamageRuneCount, 
    criticalChance, 
    criticalDamageMultiplier, 
    resetRunes 
  } = useGameState();

  // Dash charges system for the current weapon
  const { dashCharges, canVault, consumeDashCharge } = useDashCharges({ currentWeapon });

  // Kill count states for ability display
  const [stealthKillCount, setStealthKillCount] = useState(0);
  const [glacialShardKillCount, setGlacialShardKillCount] = useState(0);
  
  // Eviscerate charges state for ability display
  const [eviscerateLashes, setEviscerateLashes] = useState<Array<{ id: number; available: boolean; cooldownStartTime: number | null }>>(() => [
    { id: 1, available: true, cooldownStartTime: null },
    { id: 2, available: true, cooldownStartTime: null }
  ]);

  // Boneclaw charges state for ability display
  const [boneclawCharges, setBoneclawCharges] = useState<Array<{ id: number; available: boolean; cooldownStartTime: number | null }>>(() => [
    { id: 1, available: true, cooldownStartTime: null },
    { id: 2, available: true, cooldownStartTime: null }
  ]);

  // Incinerate stacks state for Pyro Spear
  const [incinerateStacks, setIncinerateStacks] = useState(0);
  
  // Debug logging for incinerate stacks
  const handleIncinerateStacksChange = useCallback((stacks: number) => {
    setIncinerateStacks(stacks);
  }, []);

  // Shield state for Glacial Shard
  const [shieldState, setShieldState] = useState({ hasShield: false, shieldAbsorption: 0 });

  // Use the prop health directly instead of creating local state
  // This matches the original Panel implementation approach

  // Track previous kill count to detect level changes in multiplayer
  const prevKillCountRef = useRef(0);

  // Function to calculate level based on kill count (same as in pages/index.tsx)
  const getLevel = useCallback((kills: number) => {
    if (kills < 10) return 1;    
    if (kills < 25) return 2;     
    if (kills < 45) return 3;    
    if (kills < 70) return 4;   
    return 5;                      // Level 5: 20+ kills
  }, []);

  // Function to unlock abilities based on current level and subclass (same as in pages/index.tsx)
  const unlockAbilitiesForLevel = useCallback((level: number) => {
    if (!currentWeapon || !currentSubclass) return;

    // Get the abilities for the current subclass
    const subclassAbilities = SUBCLASS_ABILITIES[currentSubclass];
    if (!subclassAbilities) return;

    // Check each ability to see if it should be unlocked at this level
    Object.keys(subclassAbilities).forEach(abilityKey => {
      const ability = subclassAbilities[abilityKey as AbilityType];
      if (ability && !ability.isUnlocked && ability.unlockLevel <= level) {
        onAbilityUnlock(abilityKey as AbilityType);
      }
    });
  }, [currentWeapon, currentSubclass, onAbilityUnlock]);

  // Monitor kill count changes in multiplayer mode to trigger ability unlocks
  useEffect(() => {
    if (isInRoom) {
      const currentKillCount = multiplayerKillCount;
      const prevKillCount = prevKillCountRef.current;
      
      const currentLevel = getLevel(currentKillCount);
      const prevLevel = getLevel(prevKillCount);
      
      // Check if we leveled up
      if (currentLevel > prevLevel) {
        unlockAbilitiesForLevel(currentLevel);
      }
      
      prevKillCountRef.current = currentKillCount;
    }
  }, [isInRoom, multiplayerKillCount, getLevel, unlockAbilitiesForLevel]);

  // Initial ability unlock when joining multiplayer room
  useEffect(() => {
    if (isInRoom && currentWeapon && currentSubclass && gameMode === 'game') {
      const currentLevel = getLevel(multiplayerKillCount);
      unlockAbilitiesForLevel(currentLevel);
      prevKillCountRef.current = multiplayerKillCount;
    }
  }, [isInRoom, currentWeapon, currentSubclass, gameMode, multiplayerKillCount, getLevel, unlockAbilitiesForLevel]);

  const handleSinglePlayerStart = () => {
    if (currentWeapon && currentSubclass) {
      setGameMode('singleplayer');
    }
  };

  const handleMultiplayerSelect = () => {
    setGameMode('multiplayer');
  };

  const handleMultiplayerJoinSuccess = () => {
    setGameMode('game');
    
    // When joining multiplayer, unlock abilities based on current kill count
    if (isInRoom && currentWeapon && currentSubclass) {
      const currentLevel = getLevel(multiplayerKillCount);
      unlockAbilitiesForLevel(currentLevel);
    }
  };

  const handleEnterClick = () => {
    if (currentWeapon && currentSubclass) {
      setGameMode('gamemode-selection');
    }
  };

  const handleReset = useCallback(() => {
    setGameMode('menu');
    // Reset Eviscerate charges to initial state
    setEviscerateLashes([
      { id: 1, available: true, cooldownStartTime: null },
      { id: 2, available: true, cooldownStartTime: null }
    ]);
    // Reset runes
    resetRunes();
    onReset();
  }, [onReset, resetRunes]);

  // Remove the local health change handler since we're using prop health directly

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
      if (sceneProps.unitProps.controlsRef.current) {
        sceneProps.unitProps.controlsRef.current.dispose();
      }
      THREE.Cache.clear();
    };
  }, [sceneProps.unitProps.controlsRef]);

  // Handle eviscerate charges changes
  const handleEviscerateLashesChange = useCallback((charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>) => {
    setEviscerateLashes(charges);
  }, []);

  // Handle boneclaw charges changes
  const handleBoneclawChargesChange = useCallback((charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>) => {
    setBoneclawCharges(charges);
  }, []);

  const gameInProgress = gameMode === 'singleplayer' || gameMode === 'game';
  
  const renderMainMenu = () => (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '3rem',
      borderRadius: '15px',
      border: '2px solid #4CAF50',
      color: 'white',
      textAlign: 'center',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '250px' }}>
        <button
          onClick={handleSinglePlayerStart}
          disabled={!currentWeapon}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            background: currentWeapon ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: currentWeapon ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          Single Player
        </button>
        <button
          onClick={handleMultiplayerSelect}
          disabled={!currentWeapon}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            background: currentWeapon ? '#2196F3' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: currentWeapon ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          Multiplayer
        </button>
      </div>
      {!currentWeapon && (
        <p style={{ marginTop: '1rem', color: '#ff6b6b' }}>
          Please select a weapon first
        </p>
      )}
    </div>
  );

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
          <Canvas
            frameloop="demand"
            performance={{ min: 0.5 }}
            dpr={[1, 2]} // Limit pixel ratio
          >
            <ambientLight intensity={0.215} />
            {gameInProgress && (
              <Suspense fallback={null}>
                <LevelManager 
                  sceneProps={{
                    ...sceneProps,
                    unitProps: {
                      ...sceneProps.unitProps
                    },
                    onReset: handleReset,
                    onStealthKillCountChange: setStealthKillCount,
                    onGlacialShardKillCountChange: setGlacialShardKillCount,
                    canVault,
                    consumeDashCharge,
                    onShieldStateChange: (hasShield: boolean, shieldAbsorption: number) => {
                      setShieldState({ hasShield, shieldAbsorption });
                    },
                    playerStunRef: sceneProps.playerStunRef,
                    onEviscerateLashesChange: handleEviscerateLashesChange,
                    onBoneclawChargesChange: handleBoneclawChargesChange,
                    onIncinerateStacksChange: handleIncinerateStacksChange
                  }}
                  onAbilityUnlock={onAbilityUnlock}
                  onLevelTransition={() => {}}
                  currentLevel={1}
                />
              </Suspense>
            )}
            <OrbitControls
              ref={sceneProps.unitProps.controlsRef}
              enablePan={false}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.25}
              maxDistance={11.5}
              mouseButtons={{
                LEFT: undefined,
                MIDDLE: undefined,
                RIGHT: THREE.MOUSE.ROTATE
              }} 
              minDistance={11.5}
              rotateSpeed={0.8}
              enableDamping={true}
              dampingFactor={0.075}
              zoomSpeed={1.25}
              position={[0, 15, 20]}
              target={[0, 0, 0]}
            />
          </Canvas>
        </div>

        <Behavior
          playerHealth={isInRoom ? currentPlayerHealth : playerHealth}
          onReset={handleReset}
          killCount={isInRoom ? multiplayerKillCount : killCount}
          onEnemiesDefeated={() => {}}
          maxSkeletons={12}
        />

        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: !gameInProgress ? 'auto' : 'none',
          zIndex: 1000
        }}>
          {gameMode === 'menu' && (
            <WeaponSelectionPanel 
              onWeaponSelect={onWeaponSelect}
              selectedWeapon={currentWeapon}
              selectedSubclass={currentSubclass || null}
              onStart={handleEnterClick}
            />
          )}
          
          {gameMode === 'gamemode-selection' && renderMainMenu()}
          
          {gameMode === 'multiplayer' && (
            <RoomJoin 
              onJoinSuccess={handleMultiplayerJoinSuccess} 
              currentWeapon={currentWeapon}
              currentSubclass={currentSubclass}
            />
          )}
          
          {gameInProgress && (
            <>
              <Panel 
                currentWeapon={currentWeapon}
                currentSubclass={currentSubclass}
                onWeaponSelect={() => {}}
                abilities={abilities}
                onReset={onReset}
                stealthKillCount={stealthKillCount}
                glacialShardKillCount={glacialShardKillCount}
                dashCharges={dashCharges}
                eviscerateLashes={eviscerateLashes}
                boneclawCharges={boneclawCharges}
                incinerateStacks={incinerateStacks}
              />
              <HealthOrb 
                currentHealth={isInRoom ? currentPlayerHealth : playerHealth}
                maxHealth={isInRoom ? currentPlayerMaxHealth : maxHealth}
                killCount={isInRoom ? multiplayerKillCount : killCount}
                hasShield={shieldState.hasShield}
                shieldAbsorption={shieldState.shieldAbsorption}
              />
              <RuneCounter 
                criticalRuneCount={criticalRuneCount}
                critDamageRuneCount={critDamageRuneCount}
                criticalChance={criticalChance}
                criticalDamageMultiplier={criticalDamageMultiplier}
              />
            </>
          )}
        </div>
      </>
  );
}

// Outer component that provides the MultiplayerProvider and GameStateProvider
export default function GameWrapper(props: GameWrapperProps) {
  return (
    <MultiplayerProvider>
      <GameStateProvider>
        <GameContent {...props} />
      </GameStateProvider>
    </MultiplayerProvider>
  );
}

