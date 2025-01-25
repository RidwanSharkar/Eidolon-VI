import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Vector3, Group } from 'three';
import Terrain from '../Environment/Terrain';
import Mountain from '../Environment/Mountain';
import Tree from '../Environment/Tree';
import Mushroom from '../Environment/Mushroom';
import Unit from '../Unit/Unit';
import { SceneProps as SceneType } from '@/Scene/SceneProps';
import { UnitProps } from '../Unit/UnitProps';
import Planet from '../Environment/Planet';
import CustomSky from '../Environment/Sky';
import DriftingSouls from '../Environment/DriftingSouls';
import { generateRandomPosition } from '../Environment/terrainGenerators';
import { Enemy } from '../Versus/enemy';
import BossUnit from '@/Versus/Boss/BossUnit';
import Flower from '../Environment/Flower';

import * as THREE from 'three';
import { MemoizedEnemyUnit } from '../Versus/MemoizedEnemyUnit';
import { MemoizedSkeletalMage } from '../Versus/SkeletalMage/MemoizedSkeletalMage';
import { MemoizedAbominationUnit } from '../Versus/Abomination/MemoizedAbomination';

interface ScenePropsWithCallback extends SceneType {
  onLevelComplete: () => void;
  flowerData: Array<{ position: Vector3; scale: number }>;
  spawnCount: number;
}

const BOSS_SPAWN_POSITION = new Vector3(0, 0, 0); // Center of the map

export default function Scene3({
  mountainData,
  treeData,
  mushroomData,
  unitProps,
  skeletonProps,
  killCount,
  boneDoodadData,
  onLevelComplete,
  spawnInterval = 5000,
  maxSkeletons = 23,
  initialSkeletons = 5,
  //spawnCount = 4,
  flowerData,
}: ScenePropsWithCallback) {

  const [spawnStarted, setSpawnStarted] = useState(false);
  const [totalSpawned, setTotalSpawned] = useState(initialSkeletons || 5);
  const [enemies, setEnemies] = useState<Enemy[]>(() => 
    skeletonProps.map((skeleton, index) => ({
      id: `skeleton-${index}`,
      position: skeleton.initialPosition.clone(),
      initialPosition: skeleton.initialPosition.clone(),
      currentPosition: skeleton.initialPosition.clone(),
      health: 361,
      maxHealth: 361,
    }))
  );

  // State for enemies (with Scene2-specific health values)
  const [playerHealth, setPlayerHealth] = useState<number>(unitProps.health);

  // Ref to track player position
  const playerRef = useRef<Group>(null);

  // State to store player position
  const [playerPosition, setPlayerPosition] = useState<Vector3>(new Vector3(0, 0, 0));

  // Add boss state
  const [isBossSpawned, setIsBossSpawned] = useState(false);
  const [bossHealth, setBossHealth] = useState(6084);

  // Add state to track boss position
  const [bossPosition, setBossPosition] = useState<Vector3>(BOSS_SPAWN_POSITION.clone());

  // Add state for tracking waves and abomination spawns
  const [abominationsSpawned, setAbominationsSpawned] = useState(0);

  // Callback to handle damage to enemies
  const handleTakeDamage = useCallback((targetId: string, damage: number) => {
    // Handle boss damage
    if (targetId.includes('boss')) {
      const newHealth = Math.max(0, bossHealth - damage);
      setBossHealth(newHealth);
      return;
    }

    // Handle regular enemy damage
    setEnemies(prevEnemies => {
      const newEnemies = [...prevEnemies];
      const enemyIndex = newEnemies.findIndex(
        enemy => enemy.id === targetId.replace('enemy-', '')
      );
      
      if (enemyIndex !== -1) {
        const newHealth = Math.max(0, newEnemies[enemyIndex].health - damage);
        if (newHealth === 0 && newEnemies[enemyIndex].health > 0) {
          // Mark enemy as dying instead of removing immediately
          newEnemies[enemyIndex] = {
            ...newEnemies[enemyIndex],
            health: newHealth,
            isDying: true,
            deathStartTime: Date.now()
          };
          unitProps.onEnemyDeath?.();
        } else {
          newEnemies[enemyIndex] = {
            ...newEnemies[enemyIndex],
            health: newHealth
          };
        }
      }
      return newEnemies;
    });
  }, [bossHealth, unitProps]);

  // Update handlePlayerDamage to use setPlayerHealth
  const handlePlayerDamage = useCallback((damage: number) => {
    unitProps.onDamage?.(damage);
  }, [unitProps]);

  // Callback to update player position
  const handlePlayerPositionUpdate = useCallback((position: Vector3) => {
    setPlayerPosition(position);
  }, []);

  // Update the handleEnemyPositionUpdate callback
  const handleEnemyPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    if (id.includes('boss')) {
      setBossPosition(newPosition.clone());
      return;
    }

    setEnemies(prevEnemies =>
      prevEnemies.map(enemy =>
        enemy.id === id.replace('enemy-', '')
          ? { ...enemy, position: newPosition.clone() }
          : enemy
      )
    );
  }, []);

  // Update unitComponentProps to use playerHealth
  const unitComponentProps: UnitProps = {
    onHit: handleTakeDamage,
    controlsRef: unitProps.controlsRef,
    currentWeapon: unitProps.currentWeapon,
    onWeaponSelect: unitProps.onWeaponSelect,
    health: playerHealth,
    maxHealth: unitProps.maxHealth,
    isPlayer: unitProps.isPlayer,
    abilities: unitProps.abilities,
    onAbilityUse: unitProps.onAbilityUse,
    onPositionUpdate: handlePlayerPositionUpdate,
    onHealthChange: (newHealth: number | ((current: number) => number)) => {
      if (typeof newHealth === 'function') {
        // If it's a function, pass it the current health
        setPlayerHealth(current => {
          const nextHealth = newHealth(current);
          unitProps.onHealthChange?.(nextHealth);
          return nextHealth;
        });
      } else {
        // If it's a direct value
        setPlayerHealth(newHealth);
        unitProps.onHealthChange?.(newHealth);
      }
    },
    enemyData: [
      ...enemies.map((enemy) => ({
        id: `enemy-${enemy.id}`,
        position: enemy.position,
        initialPosition: enemy.initialPosition,
        health: enemy.health,
        maxHealth: enemy.maxHealth
      })),
      ...(isBossSpawned && bossHealth > 0 ? [{
        id: `enemy-boss-1`,
        position: bossPosition, // tracked boss position instead of BOSS_SPAWN_POSITION
        initialPosition: BOSS_SPAWN_POSITION,
        health: bossHealth,
        maxHealth: 6084
      }] : [])
    ],
    onDamage: unitProps.onDamage,
    onEnemyDeath: () => {
      console.log("Kill counted in Scene");  // Debug log
    },
    onFireballDamage: unitProps.onFireballDamage,
    fireballManagerRef: unitProps.fireballManagerRef,
    onSmiteDamage: unitProps.onSmiteDamage
  };

  // Monitor enemies to determine level completion
  useEffect(() => {
    const allEnemiesDefeated = enemies.every(enemy => enemy.health <= 0);
    const hasStartedSpawning = spawnStarted && totalSpawned > initialSkeletons;
    const shouldSpawnBoss = allEnemiesDefeated && hasStartedSpawning && killCount >= 50 && !isBossSpawned;
    
    if (shouldSpawnBoss) {
      // Add a delay before spawning the boss to allow for cleanup
      setTimeout(() => {
        // Clean up existing enemies first
        setEnemies(prev => {
          prev.forEach(enemy => {
            if (enemy.ref?.current?.parent) {
              enemy.ref.current.parent.remove(enemy.ref.current);
              enemy.ref.current.traverse((child) => {
                if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
                  child.geometry.dispose();
                }
                if ('material' in child) {
                  const material = child.material as THREE.Material | THREE.Material[];
                  if (Array.isArray(material)) {
                    material.forEach(m => m.dispose());
                  } else {
                    material?.dispose();
                  }
                }
              });
            }
          });
          return [];
        });

        // Force a garbage collection hint if available
        if (window.gc) {
          window.gc();
        }

        // Now spawn the boss
        setIsBossSpawned(true);
      }, 2500); // 2-second delay
    }
    // Only call onLevelComplete when boss is defeated
    if (isBossSpawned && bossHealth <= 0) {
      onLevelComplete();
    }
  }, [enemies, killCount, onLevelComplete, spawnStarted, totalSpawned, initialSkeletons, isBossSpawned, bossHealth]);

  // Modify the spawn logic to include the delay
  useEffect(() => {
    // 5-second delay before allowing spawns
    const initialDelay = setTimeout(() => {
      setSpawnStarted(true);
    }, 1000);

    return () => clearTimeout(initialDelay);
  }, []);

  // Modify the spawn effect
  useEffect(() => {
    if (totalSpawned >= maxSkeletons) return;

    const spawnTimer = setInterval(() => {
      // WAVE CONTROL
      if (killCount < 31) return; // Only basic requirement to start spawning

      setEnemies(prev => {
        const remainingSpawns = maxSkeletons - totalSpawned;
        if (remainingSpawns <= 0) return prev;

        // Define specific spawn points for abominations
        const shouldSpawnAbomination = 
        (killCount >= 34 && abominationsSpawned === 0) ||
        (killCount >= 41 && abominationsSpawned === 1) ||
        (killCount >= 48 && abominationsSpawned === 2);

        if (shouldSpawnAbomination && abominationsSpawned < 3) {
          const spawnPosition = generateRandomPosition();
          setTotalSpawned(prev => prev + 1);
          setAbominationsSpawned(prev => prev + 1);
          
          return [...prev, {
            id: `abomination-${totalSpawned}`,
            position: spawnPosition.clone(),
            initialPosition: spawnPosition.clone(),
            health: 961,
            maxHealth: 961,
            isDying: false,
            type: 'abomination' as const,
            ref: React.createRef<Group>()
          }];
        }

        // Spawn single enemy at a time instead of groups
        const spawnPosition = generateRandomPosition();
        
        // Every third spawn is a mage (2:1 ratio maintained)
        const isMage = (totalSpawned + 1) % 3 === 0;
        
        const newEnemy: Enemy = isMage ? {
          id: `mage-${totalSpawned}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          health: 361,
          maxHealth: 361,
          isDying: false,
          type: 'mage' as const,
          ref: React.createRef<Group>()
        } : {
          id: `skeleton-${totalSpawned}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          health: 361,
          maxHealth: 361,
          isDying: false,
          type: 'regular' as const,
          ref: React.createRef<Group>()
        };

        setTotalSpawned(prev => prev + 1);
        return [...prev, newEnemy];
      });
    }, 2500); // Changed to 2000ms (2 seconds) between spawns

    return () => clearInterval(spawnTimer);
  }, [totalSpawned, maxSkeletons, spawnInterval, abominationsSpawned, killCount]);

  useEffect(() => {
    if (unitProps.controlsRef.current) {
      unitProps.controlsRef.current.object.position.set(0, 12, -18);
      unitProps.controlsRef.current.target.set(0, 0, 0);
      unitProps.controlsRef.current.update();
    }
  }, [unitProps.controlsRef]);

  // Update the cleanup of dead enemies effect
  useEffect(() => {
    const DEATH_ANIMATION_DURATION = 1500; // match animation length
    
    setEnemies(prev => {
      const currentTime = Date.now();
      return prev.filter(enemy => {
        if (enemy.isDying && enemy.deathStartTime) {
          // Keep dying enemies until animation completes
          return currentTime - enemy.deathStartTime < DEATH_ANIMATION_DURATION;
        }
        return enemy.health > 0;
      });
    });
  }, [enemies]);

  // Cleanup function for enemies
  const cleanup = () => {
    setEnemies(prev => {
      prev.forEach(enemy => {
        if (enemy.ref?.current?.parent) {
          enemy.ref.current.parent.remove(enemy.ref.current);
          enemy.ref.current.traverse((child) => {
            if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
              child.geometry.dispose();
            }
            if ('material' in child) {
              const material = child.material as THREE.Material | THREE.Material[];
              if (Array.isArray(material)) {
                material.forEach(m => m.dispose());
              } else {
                material?.dispose();
              }
            }
          });
        }
      });
      return [];
    });
  };

  useEffect(() => {
    // Capture the ref value when the effect runs
    const currentPlayerRef = playerRef.current;
  
    return () => {
      // Cleanup when scene unmounts
      setEnemies([]);
      if (currentPlayerRef) {
        currentPlayerRef.clear();
      }
      // Reset scene-specific state
      setPlayerPosition(new Vector3(0, 0, 0));
      setTotalSpawned(initialSkeletons);
      setBossPosition(BOSS_SPAWN_POSITION.clone());
      setIsBossSpawned(false);
      setBossHealth(6084);
    };
  }, [initialSkeletons]);

  // Resource tracking effect
  useEffect(() => {
    const resources = {
      geometries: [] as THREE.BufferGeometry[],
      materials: [] as THREE.Material[]
    };
  
    return () => {
      resources.geometries.forEach(geometry => geometry.dispose());
      resources.materials.forEach(material => material.dispose());
    };
  }, []);
  
  useEffect(() => {
    return cleanup;
  }, []);
  
  
  return (
    <>

      {/* Background Environment */}
      <DriftingSouls />
      <CustomSky />
      <Planet />

      {/* Ground Environment with desert-like terrain */}
      <Terrain 
        color="#FFAFC5" //handled elsewhere 
        roughness={0.9} 
        metalness={0.1}
        doodadData={boneDoodadData}
      />
      
      {mountainData.map((data, index) => (
        <Mountain key={`mountain-${index}`} position={data.position} scale={data.scale} />
      ))}

      {/* Render all trees */}
      {treeData.map((data, index) => (
        <Tree
          key={`tree-${index}`}
          position={data.position}
          scale={data.scale}
          trunkColor={data.trunkColor}
          leafColor={data.leafColor}
        />
      ))}

      {/* Render all mushrooms */}
      {mushroomData.map((mushroom, index) => (
        <Mushroom
          key={`mushroom-${index}`}
          position={mushroom.position}
          scale={mushroom.scale}
          variant={mushroom.variant}
        />
      ))}

      {/* Render all flowers */}
      {flowerData.map((data, index) => (
        <Flower key={`flower-${index}`} position={data.position} scale={data.scale} />
      ))}

      {/* Player Unit with ref */}
      <group ref={playerRef}>
        <Unit {...unitComponentProps} />
      </group>

      {/* Enemy Units (Skeletons and Mages) */}
      {enemies.map((enemy) => {
        if (enemy.type === 'abomination') {
          return (
            <MemoizedAbominationUnit
              key={enemy.id}
              id={enemy.id}
              initialPosition={enemy.initialPosition}
              position={enemy.position}
              health={enemy.health}
              maxHealth={enemy.maxHealth}
              onTakeDamage={handleTakeDamage}
              onPositionUpdate={handleEnemyPositionUpdate}
              playerPosition={playerPosition}
              onAttackPlayer={handlePlayerDamage}
              weaponType={unitProps.currentWeapon}
            />
          );
        } else if (enemy.type === 'mage') {
          return (
            <MemoizedSkeletalMage
              key={enemy.id}
              id={enemy.id}
              initialPosition={enemy.initialPosition}
              position={enemy.position}
              health={enemy.health}
              maxHealth={enemy.maxHealth}
              onTakeDamage={handleTakeDamage}
              onPositionUpdate={handleEnemyPositionUpdate}
              playerPosition={playerPosition}
              onAttackPlayer={handlePlayerDamage}
              weaponType={unitProps.currentWeapon}
            />
          );
        }
        return (
          <MemoizedEnemyUnit
            key={enemy.id}
            id={enemy.id}
            initialPosition={enemy.initialPosition}
            position={enemy.position}
            health={enemy.health}
            maxHealth={enemy.maxHealth}
            onTakeDamage={handleTakeDamage}
            onPositionUpdate={handleEnemyPositionUpdate}
            playerPosition={playerPosition}
            onAttackPlayer={handlePlayerDamage}
            weaponType={unitProps.currentWeapon}
          />
        );
      })}


      {isBossSpawned && (
        <BossUnit
          key="boss-1"
          id="boss-1"
          initialPosition={BOSS_SPAWN_POSITION}
          position={BOSS_SPAWN_POSITION}
          health={bossHealth}
          maxHealth={6084}
          onTakeDamage={(id, damage) => {
            setBossHealth(prev => Math.max(0, prev - damage));
          }}
          onPositionUpdate={handleEnemyPositionUpdate}
          playerPosition={playerPosition}
          onAttackPlayer={handlePlayerDamage}
          onEnrageSpawn={() => {
            // Spawn one abomination at a random position
            const spawnPosition = generateRandomPosition();
            setEnemies(prev => [...prev, {
              id: `abomination-enraged-${Date.now()}`,
              position: spawnPosition.clone(),
              initialPosition: spawnPosition.clone(),
              health: 1024,
              maxHealth: 1024,
              isDying: false,
              type: 'abomination' as const,
              ref: React.createRef<Group>()
            }]);
          }}
        />
      )}

      
    </>
  );
} 