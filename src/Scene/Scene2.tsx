import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Vector3, Group } from 'three';
import Terrain from '../Environment/Terrain';
import Mountain from '../Environment/Mountain';
import Tree from '../Environment/Tree';
import Mushroom from '../Environment/Mushroom';
import Unit from '../Unit/Unit';
import { MemoizedEnemyUnit } from '../Versus/MemoizedEnemyUnit';
import { SceneProps as SceneType } from '@/Scene/SceneProps';
import { UnitProps } from '../Unit/UnitProps';
import Planet from '../Environment/Planet';
import CustomSky from '../Environment/Sky';
import DriftingSouls from '../Environment/DriftingSouls';
import { generateRandomPosition } from '../Environment/terrainGenerators';
import { Enemy } from '../Versus/enemy';
import * as THREE from 'three';
import { MemoizedSkeletalMage } from '../Versus/SkeletalMage/MemoizedSkeletalMage';
import { MemoizedAbominationUnit } from '../Versus/Abomination/MemoizedAbomination';


interface SceneProps extends SceneType {
  onLevelComplete: () => void;
  spawnInterval?: number;
  maxSkeletons?: number;
  initialSkeletons?: number;
  spawnCount?: number;
  killCount: number;
}

export default function Scene2({
  mountainData,
  treeData,
  mushroomData,
  unitProps: { controlsRef, ...unitProps },
  onLevelComplete,
  spawnInterval = 1000,
  maxSkeletons = 17,
  initialSkeletons = 6,
  spawnCount = 3,
  killCount,
}: SceneProps) {
  // State for enemies (with Scene1-specific health values)
  const [enemies, setEnemies] = useState<Enemy[]>(() => {
    // Initialize with initial skeletons
    return Array.from({ length: initialSkeletons }, (_, index) => {
      const spawnPosition = generateRandomPosition();
      return {
        id: `skeleton-${index}`,
        position: spawnPosition.clone(),
        initialPosition: spawnPosition.clone(),
        health: 300,
        maxHealth: 300,
        ref: React.createRef<Group>()
      };
    });
  });

  const [totalSpawned, setTotalSpawned] = useState(initialSkeletons);
  const [playerHealth, setPlayerHealth] = useState<number>(unitProps.health);
  const playerRef = useRef<Group>(null);
  const [playerPosition, setPlayerPosition] = useState<Vector3>(new Vector3(0, 0, 0));

  // Callback to handle damage to enemies
  const handleTakeDamage = useCallback((targetId: string, damage: number) => {
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
  }, [unitProps]);

  // Update handlePlayerDamage to use setPlayerHealth
  const handlePlayerDamage = useCallback((damage: number) => {
    unitProps.onDamage?.(damage);
  }, [unitProps]);

  // Callback to update player position
  const handlePlayerPositionUpdate = useCallback((position: Vector3) => {
    setPlayerPosition(position);
  }, []);

  // Add this callback before unitComponentProps
  const handleEnemyPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    setEnemies(prevEnemies =>
      prevEnemies.map(enemy =>
        enemy.id === id.replace('enemy-', '')
          ? { 
              ...enemy, 
              position: newPosition.clone()
            }
          : enemy
      )
    );
  }, []);


  // Update unitComponentProps to use playerHealth
  const unitComponentProps: UnitProps = {
    onHit: handleTakeDamage,
    controlsRef: controlsRef,
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
    enemyData: enemies
      .filter(enemy => !enemy.isDying && enemy.health > 0)  // Only include living enemies
      .map((enemy) => ({
        id: `enemy-${enemy.id}`,
        position: enemy.position.clone(),  // Ensure we clone the position
        initialPosition: enemy.initialPosition.clone(),
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        type: enemy.type  // Include the enemy type if needed
      })),
    onDamage: unitProps.onDamage,
    onEnemyDeath: () => {
      console.log("Kill counted in Scene");  // Debug logwd
    },
    onFireballDamage: unitProps.onFireballDamage,
    fireballManagerRef: unitProps.fireballManagerRef,
    onSmiteDamage: unitProps.onSmiteDamage
  };

  // Add state for tracking waves and abomination spawn
  const [currentWave, setCurrentWave] = useState(0);
  const [abominationSpawned] = useState(false);

  // Modify spawning logic
  useEffect(() => {
    if (totalSpawned >= maxSkeletons) return;

    const spawnTimer = setInterval(() => {
      // Wave control based on kill count (adjusted for Scene2)
      if ((killCount < 12 && currentWave === 0) || 
          (killCount < 16 && currentWave === 1) || 
          (killCount < 20 && currentWave === 2) ||
          (killCount < 22 && currentWave === 3) ||
          (killCount < 24 && currentWave === 4)) {
        return;
      }

      setEnemies(prev => {
        const remainingSpawns = maxSkeletons - totalSpawned;
        
        // If we have exactly one spawn left, make it an abomination
        if (remainingSpawns <= spawnCount && remainingSpawns > 0) {
          const spawnPosition = generateRandomPosition();
          setTotalSpawned(prev => prev + 1);
          setCurrentWave(prev => prev + 1);
          return [...prev, {
            id: `abomination-${totalSpawned}`,
            position: spawnPosition.clone(),
            initialPosition: spawnPosition.clone(),
            health: 675,
            maxHealth: 675,
            isDying: false,
            type: 'abomination' as const,
            ref: React.createRef<Group>()
          }];
        }

        // Regular wave spawns (only if we have room for a full wave)
        if (remainingSpawns >= spawnCount) {
          const spawnAmount = spawnCount; // Use spawnCount prop
          const newEnemies: Enemy[] = Array.from({ length: spawnAmount }, (_, index) => {
            const spawnPosition = generateRandomPosition();
            
            // Spawn mage every 3rd spawn
            const shouldSpawnMage = (totalSpawned + index) % 3 === 0;
            
            if (shouldSpawnMage) {
              return {
                id: `mage-${totalSpawned + index}`,
                position: spawnPosition.clone(),
                initialPosition: spawnPosition.clone(),
                health: 340,
                maxHealth: 340,
                isDying: false,
                type: 'mage' as const,
                ref: React.createRef<Group>()
              };
            }

            return {
              id: `skeleton-${totalSpawned + index}`,
              position: spawnPosition.clone(),
              initialPosition: spawnPosition.clone(),
              health: 312,
              maxHealth: 312,
              isDying: false,
              type: 'regular' as const,
              ref: React.createRef<Group>()
            };
          });

          setTotalSpawned(prev => prev + spawnAmount);
          setCurrentWave(prev => prev + 1);
          return [...prev, ...newEnemies];
        }

        return prev;
      });
    }, spawnInterval);

    return () => clearInterval(spawnTimer);
  }, [totalSpawned, maxSkeletons, spawnInterval, abominationSpawned, killCount, currentWave, spawnCount]);

  useEffect(() => {
    if (controlsRef.current) {
      // Set initial camera position for Scene 2
      controlsRef.current.object.position.set(0, 12, -18);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [controlsRef]);

  // cleanup of dead enemies
  useEffect(() => {
    const DEATH_ANIMATION_DURATION = 1500; // match  animation length
    
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

  useEffect(() => {
    // Capture the ref value when the effect runs
    const currentPlayerRef = playerRef.current;

    return () => {
      // Cleanup when scene unmounts
      setEnemies([]);
      if (currentPlayerRef) {
        currentPlayerRef.clear();
      }
      // Reset any scene-specific state
      setPlayerPosition(new Vector3(0, 0, 0));
      setTotalSpawned(initialSkeletons);
    };
  }, [initialSkeletons]);

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

  const cleanup = () => {
    setEnemies(prev => {
      prev.forEach(enemy => {
        if (enemy.ref?.current?.parent) {
          enemy.ref.current.parent.remove(enemy.ref.current);
          //  dispose of any materials/geometries if they exist
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
    return cleanup;
  }, []);

  useEffect(() => {
    const allEnemiesDefeated = enemies.every(enemy => enemy.health <= 0);
    const spawnComplete = totalSpawned >= maxSkeletons;
    
    if (allEnemiesDefeated && spawnComplete) {
      onLevelComplete();
    }
  }, [enemies, totalSpawned, maxSkeletons, onLevelComplete]);

  useEffect(() => {
    console.log('Enemy Data:', enemies.map(e => ({
      id: e.id,
      position: e.position,
      health: e.health
    })));
  }, [enemies]);

  return (
    <>
      <group>


        {/* Background Environment */}
        <DriftingSouls />
        <CustomSky />
        <Planet />

        {/* Ground Environment */}
        <Terrain 
          color="#FFAFC5"
          roughness={0.5}
          metalness={0.1}
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
        {mushroomData.map((data, index) => (
          <Mushroom key={`mushroom-${index}`} position={data.position} scale={data.scale} />
        ))}



        {/* Player Unit with ref */}
        <group ref={playerRef}>
          <Unit {...unitComponentProps} />
        </group>

        {/* Enemy Units (Skeletons only) */}
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

      

      </group>
    </>
  );
}