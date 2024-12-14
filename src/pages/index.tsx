import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import Scene from '../Scene/Scene';
import Scene2 from '../Scene/Scene2';
import Panel from '../Interface/Panel';
import { WeaponType } from '../Weapons/weapons';
import { trunkColors, leafColors } from '../Environment/treeColors';  
import { generateMountains, generateTrees, generateMushrooms } from '../Environment/terrainGenerators';
import { SceneProps, SkeletonProps } from '../Scene/SceneProps';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { DEFAULT_WEAPON_ABILITIES } from '../Weapons/weapons';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { WeaponInfo } from '../Unit/UnitProps';

// SKELETON SPAWN POINTS
const generateRandomPosition = () => {
  const radius = 50; // Increased radius for more spread
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
  const [currentLevel, setCurrentLevel] = useState(1);
  const [, setShowLevelUp] = useState(false);

  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>(WeaponType.SCYTHE);
  const controlsRef = useRef<OrbitControlsType>(null);
  const [playerHealth, setPlayerHealth] = useState(200);
  const [lastHitTime, setLastHitTime] = useState(0);
  const [abilities, setAbilities] = useState<WeaponInfo>(() => DEFAULT_WEAPON_ABILITIES as WeaponInfo);

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

  const handleAbilityUse = (weapon: WeaponType, abilityKey: 'q' | 'e') => {
    setAbilities(prev => {
      const newAbilities = { ...prev };
      newAbilities[weapon][abilityKey].currentCooldown = newAbilities[weapon][abilityKey].cooldown;
      return newAbilities;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAbilities((prev: WeaponInfo) => {
        const newAbilities = { ...prev };
        (Object.keys(newAbilities) as WeaponType[]).forEach(weapon => {
          ['q', 'e'].forEach(ability => {
            const key = ability as 'q' | 'e';
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

  // Disposed to be here?
  const [, setSkeletonHealths] = useState(() => 
    Array(NUM_SKELETONS).fill(200) // Create an array of skeletons with 200 health each
  );

  // Initialize skeletonProps once
  const [skeletonProps, setSkeletonProps] = useState<SkeletonProps[]>(() => 
    Array.from({ length: NUM_SKELETONS }, (_, index) => {
      const initialPosition = generateRandomPosition();
      return {
        id: `skeleton-${index}`,
        initialPosition,
        position: initialPosition.clone(),
        health: 200,
        maxHealth: 200,
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

  // Add this near the top of the component with other refs
  const fireballManagerRef = useRef<{ shootFireball: () => void }>(null);

  // Prepare props for Scene component
  const sceneProps: SceneProps = {
    mountainData,
    treeData,
    mushroomData,
    treePositions,
    interactiveTrunkColor: interactiveTrunkColor as THREE.Color,
    interactiveLeafColor: interactiveLeafColor as THREE.Color,
    unitProps: {
      onFireballDamage: handleFireballDamage,
      onSmiteDamage: handleSmiteDamage,
      onHit: handleHit,
      controlsRef,
      currentWeapon,
      onWeaponSelect: handleWeaponSelect,
      health: playerHealth,
      maxHealth: 200,
      isPlayer: true,
      abilities,
      onAbilityUse: (weapon: WeaponType, abilityKey: 'q' | 'e' | 'r') => {
        handleAbilityUse(weapon, abilityKey as 'q' | 'e');
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
    },
    skeletonProps,
    killCount,
    onFireballDamage: handleFireballDamage,
  };

  // Add handleReset function
  const handleReset = () => {
    // Reset player health
    setPlayerHealth(200);

    // Reset skeleton health
    setSkeletonHealths(Array(NUM_SKELETONS).fill(200));

    // Reset ability cooldowns
    setAbilities(prev => {
      const newAbilities = { ...prev };
      Object.keys(newAbilities).forEach(weapon => {
        ['q', 'e'].forEach(ability => {
          newAbilities[weapon as WeaponType][ability as 'q' | 'e'].currentCooldown = 0;
        });
      });
      return newAbilities;
    });

    // Reset last hit time
    setLastHitTime(0);

    // Reset kill count
    setKillCount(0);
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

    // GAME STATE HANDLER
  const handleLevelComplete = () => {
    if (currentLevel === 1) {
      setShowLevelUp(true);
      setTimeout(() => {
        setCurrentLevel(2);
        setShowLevelUp(false);
        handleReset(); // Reset game state for level 2
      }, 15000); // 15 second intermission
    }
  };

  // Use CurrentSceneComponent based on level
  const CurrentSceneComponent = useMemo(() => {
    return currentLevel === 1 ? Scene : Scene2;
  }, [currentLevel]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <Canvas shadows camera={{ position: [0, 10, 20], fov: 60 }}>
        <ambientLight intensity={0.2} />
        {interactiveTrunkColor && interactiveLeafColor && (
          <CurrentSceneComponent 
            {...sceneProps} 
            onLevelComplete={handleLevelComplete}
            spawnInterval={currentLevel === 2 ? 10000 : undefined}
            maxSkeletons={currentLevel === 2 ? 20 : undefined}
          />
        )}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          maxDistance={75}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,   // Enabled left-click for rotation
            MIDDLE: undefined,          // Disabled middle-click actions
            RIGHT: THREE.MOUSE.ROTATE,  // Enabled right-click for rotation
          }}
        />
      </Canvas>
      <Panel
        currentWeapon={currentWeapon}
        onWeaponSelect={handleWeaponSelect}
        playerHealth={playerHealth}
        maxHealth={200}
        abilities={abilities}
        onReset={handleReset}
        killCount={killCount}
      />
    </div>
  );
}