import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Vector3 } from 'three';
import { WeaponType, AbilityType } from '@/Weapons/weapons';
import { trunkColors, leafColors } from '@/Environment/treeColors';  
import { generateMountains, generateTrees, generateMushrooms, generateFlowers } from '@/Environment/terrainGenerators';
import { SceneProps, SkeletonProps } from '@/Scene/SceneProps';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { DEFAULT_WEAPON_ABILITIES, getModifiedCooldown } from '@/Weapons/weapons';
import * as THREE from 'three';
import { WeaponInfo } from '@/Unit/UnitProps';

import GameWrapper from '@/Scene/GameWrapper';

//might want to specialize this file for kill counter, everything else scattered from 1.0 
// redistribute dis file throughout scene/unit  or move scene-> pages
// SKELETON SPAWN POINTS DEPRECATED DUE TO TERRAIN GENERATION.ts
const generateRandomPosition = () => {
  const radius = 30;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radius; // Using sqrt for more even distribution
  return new Vector3(
    Math.cos(angle) * distance,
    0,
    Math.sin(angle) * distance
  );
};

const NUM_SKELETONS = 5;  // start with 5 skeletons

// Home Component
export default function HomePage() {
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType | null>(null);
  const controlsRef = useRef<OrbitControlsType>(null);
  const [playerHealth, setPlayerHealth] = useState(200);
  const [maxHealth, setMaxHealth] = useState(200);
  const [lastHitTime, setLastHitTime] = useState(0);
  const [abilities, setAbilities] = useState<WeaponInfo>(() => DEFAULT_WEAPON_ABILITIES as WeaponInfo);

  
  // state for ability unlocks - moved up before its usage
  const [unlockedAbilities, setUnlockedAbilities] = useState({
    r: false,
    passive: false,
    active: false
  });

  // ability unlock handler
  const handleAbilityUnlock = (abilityType: AbilityType) => {
    console.log(`Unlocking ${abilityType} ability`);
    
    setUnlockedAbilities(prev => ({
      ...prev,
      [abilityType]: true
    }));
    
    setAbilities(prev => {
      const newAbilities = { ...prev };
      if (currentWeapon) {
        newAbilities[currentWeapon][abilityType] = { // PRESERVE EXISTING UNLOCKS 
          ...newAbilities[currentWeapon][abilityType],
          isUnlocked: true
        };
      }
      return newAbilities;
    });
  };

  // Define the main tree position
  const treePositions = useMemo(() => ({
    mainTree: new Vector3(0, 2, -5),
  }), []);

  // Memoize mountain data
  const mountainData = useMemo(() => generateMountains(), []);

  // Memoize tree data
  const treeData = useMemo(() => generateTrees(), []);

  // Memoize mushroom data
  const mushroomData = useMemo(() => generateMushrooms(), []);

  // Memoize flower data
  const flowerData = useMemo(() => generateFlowers(), []);

  // Assign consistent colors to the interactive tree using useMemo
  const [interactiveTrunkColor, setInteractiveTrunkColor] = useState<THREE.Color>();
  const [interactiveLeafColor, setInteractiveLeafColor] = useState<THREE.Color>();

  useEffect(() => {
    setInteractiveTrunkColor(new THREE.Color(trunkColors[Math.floor(Math.random() * trunkColors.length)]));
    setInteractiveLeafColor(new THREE.Color(leafColors[Math.floor(Math.random() * leafColors.length)]));
  }, []);

  const handleWeaponSelect = (weapon: WeaponType) => {
    setCurrentWeapon(weapon);
  };

  const handleHit = useCallback((targetId: string, damage: number) =>{
    const currentTime = Date.now();
    if (currentTime - lastHitTime > 100) {
      if (targetId.startsWith('skeleton-')) {
        const skeletonIndex = parseInt(targetId.split('-')[1]);
        setSkeletonHealths(prev => {
          const newHealths = [...prev];
          newHealths[skeletonIndex] = Math.max(0, prev[skeletonIndex] - damage);
          return newHealths;
        });
      }
      setLastHitTime(currentTime);
    }
  }, [lastHitTime]);

  const handleAbilityUse = (weapon: WeaponType, abilityType: AbilityType) => {
    setAbilities(prev => {
      const newAbilities = { ...prev };
      newAbilities[weapon][abilityType].currentCooldown = getModifiedCooldown(weapon, abilityType, prev);
      return newAbilities;
    });
  };


  useEffect(() => {

    const interval = setInterval(() => {
      setAbilities((prev: WeaponInfo) => {
        const newAbilities = { ...prev };
        (Object.keys(newAbilities) as WeaponType[]).forEach(weapon => {
          ['q', 'e', 'r', 'passive', 'active'].forEach(ability => {
            const key = ability as 'q' | 'e' | 'r' | 'passive' | 'active';
            if (newAbilities[weapon][key].currentCooldown > 0) {
              newAbilities[weapon][key].currentCooldown -= 0.15;
            }
          });
        });
        return newAbilities;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Add unit position state
  const [unitPosition] = useState(new THREE.Vector3(0, 0, 0));

  // Disposed to be here? wat it do 
  const [, setSkeletonHealths] = useState(() => 
    Array(NUM_SKELETONS).fill(175) // Create an array of skeletons with 200 health each
  );

  // Initialize skeletonProps once
  const [skeletonProps, setSkeletonProps] = useState<SkeletonProps[]>(() => 
    Array.from({ length: NUM_SKELETONS }, (_, index) => {
      const initialPosition = generateRandomPosition();
      return {
        id: `skeleton-${index}`,
        initialPosition,
        position: initialPosition.clone(),
        health: 175,
        maxHealth: 175,
        onTakeDamage: (id: string, damage: number) => {
          setSkeletonProps(prev => prev.map(skeleton => 
            skeleton.id === id 
              ? { ...skeleton, health: Math.max(0, skeleton.health - damage) } 
              : skeleton
          ));
        }
      };
    })
  );

  const handlePlayerDamage = (damage: number) => {
    setPlayerHealth(prevHealth => Math.max(0, prevHealth - damage));
  };

  const [killCount, setKillCount] = useState(0);

  // KILL COUNTER
  const handleEnemyDeath = useCallback(() => {
    console.log("Enemy death registered in HomePage");
    setKillCount(prev => {
      const newCount = prev + 1;
      console.log("Kill count updated:", newCount);
      setMaxHealth(200 + newCount);
      setPlayerHealth(prev => prev + 1);
      return newCount;
    });
  }, []);

  const handleFireballDamage = useCallback((targetId: string, damage: number, isCritical: boolean) => {
    // Update skeleton health
    setSkeletonProps(prev => prev.map(skeleton => 
      skeleton.id === targetId 
        ? { ...skeleton, health: Math.max(0, skeleton.health - damage) } 
        : skeleton
    ));
    
    // Handle critical hit effects
    if (isCritical) {
      // Add visual or sound effects for critical hits
      console.log(`Critical hit on ${targetId} for ${damage} damage!`);
    }
  }, []);

  // Define handleSmiteDamage in HomePage
  const handleSmiteDamage = useCallback(
    (targetId: string, damage: number, isCritical: boolean, position: Vector3) => {
      console.log(`Smite hit ${targetId} for ${damage} damage (Critical: ${isCritical}) at position:`, position);
      handleHit(targetId, damage);
    },
    [handleHit]
  );

  // FIREBALL MANAGER
  const fireballManagerRef = useRef<{
    shootFireball: () => void;
    cleanup: () => void;
  } | null>(null);

  // Move handleReset up, before sceneProps
  const handleReset = () => {
    console.log("HomePage: Reset triggered");
    setMaxHealth(200);
    setPlayerHealth(200);
    setSkeletonHealths(Array(NUM_SKELETONS).fill(175));
    setAbilities(prev => {
      const newAbilities = { ...prev };
      Object.keys(newAbilities).forEach(weapon => {
        ['q', 'e'].forEach(ability => {
          newAbilities[weapon as WeaponType][ability as 'q' | 'e'].currentCooldown = 0;
        });
      });
      return newAbilities;
    });
    setLastHitTime(0);
    setKillCount(0);
    setCurrentWeapon(null);  // FORCES WEAPON RESELECTION
    setUnlockedAbilities({
      r: false,
      passive: false,
      active: false
    });
  };

  // Change this handler to properly handle delta values
  const handleHealthChange = useCallback((deltaHealth: number) => {
    setPlayerHealth(prevHealth => {
      const newHealth = Math.min(maxHealth, prevHealth + deltaHealth);
      return newHealth;
    });
  }, [maxHealth]);

  // sceneProps after handleReset
  const sceneProps: SceneProps = {
    bossActive: false,
    mountainData,
    onAbilityUnlock: handleAbilityUnlock,
    treeData,
    mushroomData,
    treePositions,
    interactiveTrunkColor: interactiveTrunkColor as THREE.Color,
    interactiveLeafColor: interactiveLeafColor as THREE.Color,
    onReset: handleReset,
    unitProps: {
      onFireballDamage: handleFireballDamage,
      onSmiteDamage: handleSmiteDamage,
      onHit: handleHit,
      controlsRef,
      currentWeapon: currentWeapon || WeaponType.SCYTHE,
      onWeaponSelect: handleWeaponSelect,
      health: playerHealth,
      maxHealth: maxHealth,
      isPlayer: true,
      abilities: {
        ...abilities,
        ...(currentWeapon ? {
          [currentWeapon]: {
            ...abilities[currentWeapon],
            r: {
              ...abilities[currentWeapon].r,
              isUnlocked: unlockedAbilities.r
            },
            passive: {
              ...abilities[currentWeapon].passive,
              isUnlocked: unlockedAbilities.passive
            }
          }
        } : {})
      },
      onAbilityUse: (weapon: WeaponType, abilityType: AbilityType) => {
        if (currentWeapon) {
          handleAbilityUse(weapon, abilityType);
        }
      },
      onPositionUpdate: (newPosition: THREE.Vector3) => {
        unitPosition.copy(newPosition);
      },
      enemyData: skeletonProps.map(skeleton => ({
        id: skeleton.id,
        position: skeleton.position,
        initialPosition: skeleton.initialPosition,
        currentPosition: skeleton.position.clone(),
        health: skeleton.health,
        maxHealth: skeleton.maxHealth
      })),
      onDamage: handlePlayerDamage,
      onEnemyDeath: handleEnemyDeath,
      fireballManagerRef: fireballManagerRef,
      onHealthChange: handleHealthChange,
    },
    skeletonProps,
    killCount,
    onFireballDamage: handleFireballDamage,
    onWeaponSelect: handleWeaponSelect,
    flowerData: flowerData

  };

  useEffect(() => {
    const preventSpaceScroll = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventSpaceScroll);
    
    return () => {
      window.removeEventListener('keydown', preventSpaceScroll);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <GameWrapper
        sceneProps={sceneProps}
        currentWeapon={currentWeapon as WeaponType}
        onWeaponSelect={handleWeaponSelect}
        playerHealth={playerHealth}
        maxHealth={maxHealth}
        abilities={abilities}
        onReset={handleReset}
        killCount={killCount}
        onAbilityUnlock={handleAbilityUnlock}
        
      />
    </div>
  );
}