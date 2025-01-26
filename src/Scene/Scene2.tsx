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
import { ObjectPool } from './ObjectPool';


interface SceneProps extends SceneType {
  onLevelComplete: () => void;
  spawnInterval?: number;
  maxSkeletons?: number;
  initialSkeletons?: number;
  spawnCount?: number;
  killCount: number;
}

// Add pool configuration
const POOL_CONFIG = {
  initialSize: 20,
  expandSize: 5,
  maxSize: 30
};

export default function Scene2({
  mountainData,
  treeData,
  mushroomData,
  unitProps: { controlsRef, ...unitProps },
  onLevelComplete,
  maxSkeletons = 17,
  initialSkeletons = 6,
  killCount,
  boneDoodadData,
}: SceneProps) {
  // Add group pool
  const [groupPool] = useState(() => new ObjectPool<Group>(() => {
    const group = new Group();
    group.visible = false;
    return group;
  }, POOL_CONFIG.initialSize, POOL_CONFIG.expandSize, POOL_CONFIG.maxSize));

  // Modify enemy state initialization to use pool
  const [enemies, setEnemies] = useState<Enemy[]>(() => {
    return Array.from({ length: initialSkeletons }, (_, index) => {
      const spawnPosition = generateRandomPosition();
      spawnPosition.y = 0;
      const group = groupPool.acquire();
      group.visible = true;
      return {
        id: `skeleton-${index}`,
        position: spawnPosition.clone(),
        initialPosition: spawnPosition.clone(),
        health: 324,
        maxHealth: 324,
        ref: { current: group }
      };
    });
  });

  const [totalSpawned, setTotalSpawned] = useState(initialSkeletons);
  const [playerHealth, setPlayerHealth] = useState<number>(unitProps.health);
  const playerRef = useRef<Group>(null);
  const [playerPosition, setPlayerPosition] = useState<Vector3>(new Vector3(0, 0, 0));

  // Add cleanup function for enemy removal
  const removeEnemy = useCallback((enemy: Enemy) => {
    if (enemy.ref?.current) {
      enemy.ref.current.visible = false;
      groupPool.release(enemy.ref.current);
    }
  }, [groupPool]);

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

  // Modify enemy spawning logic in useEffect
  useEffect(() => {
    if (totalSpawned >= maxSkeletons) return;

    const spawnTimer = setInterval(() => {
      // Wave control based on kill count
      if ((killCount < 14 && currentWave === 0) || 
          (killCount < 20 && currentWave === 1) || 
          (killCount < 27 && currentWave === 2)) {
        return;
      }

      setEnemies(prev => {
        const remainingSpawns = maxSkeletons - totalSpawned;
        if (remainingSpawns <= 0) return prev;

        // Only spawn abomination if it's the very last spawn of the scene
        if (remainingSpawns === 1) {
          const spawnPosition = generateRandomPosition();
          setTotalSpawned(prev => prev + 1);
          setCurrentWave(prev => prev + 1);
          const group = groupPool.acquire();
          group.visible = true;
          return [...prev, {
            id: `abomination-${totalSpawned}`,
            position: spawnPosition.clone(),
            initialPosition: spawnPosition.clone(),
            health: 841,
            maxHealth: 841,
            isDying: false,
            type: 'abomination' as const,
            ref: { current: group }
          }];
        }

        // Spawn single enemy at a time
        const spawnPosition = generateRandomPosition();
        // Changed to every fourth spawn is a mage (3:1 ratio instead of 2:1)
        const isMage = (totalSpawned + 1) % 4 === 0;

        const group = groupPool.acquire();
        group.visible = true;
        
        const newEnemy: Enemy = isMage ? {
          id: `mage-${totalSpawned}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          health: 289,
          maxHealth: 289,
          isDying: false,
          type: 'mage' as const,
          ref: { current: group }
        } : {
          id: `skeleton-${totalSpawned}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          health: 324,
          maxHealth: 324,
          isDying: false,
          type: 'regular' as const,
          ref: { current: group }
        };

        setTotalSpawned(prev => prev + 1);
        return [...prev, newEnemy];
      });
    }, 2750);

    return () => clearInterval(spawnTimer);
  }, [totalSpawned, maxSkeletons, killCount, currentWave, groupPool]);

  useEffect(() => {
    if (controlsRef.current) {
      // Set initial camera position for Scene 2
      controlsRef.current.object.position.set(0, 12, -18);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [controlsRef]);

  // Modify cleanup effect
  useEffect(() => {
    const DEATH_ANIMATION_DURATION = 1500;
    
    setEnemies(prev => {
      const currentTime = Date.now();
      return prev.filter(enemy => {
        if (enemy.isDying && enemy.deathStartTime) {
          if (currentTime - enemy.deathStartTime >= DEATH_ANIMATION_DURATION) {
            removeEnemy(enemy);
            return false;
          }
          return true;
        }
        return enemy.health > 0;
      });
    });
  }, [enemies, removeEnemy]);

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

  // Modify main cleanup
  const cleanup = useCallback(() => {
    setEnemies(prev => {
      prev.forEach(enemy => {
        removeEnemy(enemy);
        //  dispose of any materials/geometries if they exist
        enemy.ref?.current?.traverse((child) => {
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
      });
      return [];
    });
    groupPool.clear(); // Clear the pool when unmounting
  }, [groupPool, removeEnemy]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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