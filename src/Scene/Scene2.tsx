import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Vector3, Group } from 'three';
import Terrain from '../Environment/Terrain';
import Unit from '../Unit/Unit';
import { MemoizedEnemyUnit } from '../Versus/MemoizedEnemyUnit';
import { SceneProps as SceneType } from '@/Scene/SceneProps';
import { UnitProps } from '../Unit/UnitProps';
import Planet from '../Environment/Planet';
import CustomSky from '../Environment/Sky';
import { generateRandomPosition, generateMountains, generateTrees, generateMushrooms } from '../Environment/terrainGenerators';
import { Enemy } from '../Versus/enemy';
import * as THREE from 'three';
import { MemoizedSkeletalMage } from '../Versus/SkeletalMage/MemoizedSkeletalMage';
import { MemoizedAbominationUnit } from '../Versus/Abomination/MemoizedAbomination';
import { ObjectPool } from './ObjectPool';
import InstancedTrees from '../Environment/InstancedTrees';
import InstancedMountains from '../Environment/InstancedMountains';
import InstancedMushrooms from '../Environment/InstancedMushrooms';
import Pillar from '../Environment/Pillar';
import { sharedGeometries, sharedMaterials, initializeSharedResources, disposeSharedResources } from './SharedResources';


interface SceneProps extends SceneType {
  onLevelComplete: () => void;
  spawnInterval?: number;
  maxSkeletons?: number;
  initialSkeletons?: number;
  spawnCount?: number;
  killCount: number;
}

const POOL_CONFIG = {
  initialSize: 20,
  expandSize: 5,
  maxSize: 30
};

export default function Scene2({
  unitProps: { controlsRef, ...unitProps },
  onLevelComplete,
  maxSkeletons = 17,
  initialSkeletons = 6,
  killCount,
}: SceneProps) {
  // TERRAIN
  const mountainData = useMemo(() => generateMountains(), []);
  const treeData = useMemo(() => generateTrees(), []);
  const mushroomData = useMemo(() => generateMushrooms(), []);

  // GROUP POOL
  const [groupPool] = useState(() => new ObjectPool<Group>(() => {
    const group = new Group();
    group.visible = false;
    return group;
  }, POOL_CONFIG.initialSize, POOL_CONFIG.expandSize, POOL_CONFIG.maxSize));

  // ENEMIES
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
        rotation: 0,
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
  const [activeEnemyCount, setActiveEnemyCount] = useState(initialSkeletons);

  // CLEANUP
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
          // Mark enemy as dying and decrease active count
          newEnemies[enemyIndex] = {
            ...newEnemies[enemyIndex],
            health: newHealth,
            isDying: true,
            deathStartTime: Date.now()
          };
          setActiveEnemyCount(prev => Math.max(0, prev - 1));
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

  // Enemy Position Update
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
      .filter(enemy => !enemy.isDying && enemy.health > 0)
      .map((enemy) => ({
        id: `enemy-${enemy.id}`,
        position: enemy.position.clone(),
        initialPosition: enemy.initialPosition.clone(),
        rotation: enemy.rotation,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        type: enemy.type
      })),
    onDamage: unitProps.onDamage,
    onEnemyDeath: () => {
    },
    onFireballDamage: unitProps.onFireballDamage,
    fireballManagerRef: unitProps.fireballManagerRef,
    onSmiteDamage: unitProps.onSmiteDamage
  };

  // State for tracking waves and abomination spawn
  const [currentWave, setCurrentWave] = useState(0);

  // SPAWNING LOGIC
  useEffect(() => {
    if (totalSpawned >= maxSkeletons) return;

    const spawnTimer = setInterval(() => {
      // Add check for active enemy count
      if (activeEnemyCount >= 6) return;

      // Wave control based on kill count
      if ((killCount < 14 && currentWave === 0) || 
          (killCount < 20 && currentWave === 1) || 
          (killCount < 26 && currentWave === 2)) {
        return;
      }

      setEnemies(prev => {
        const remainingSpawns = maxSkeletons - totalSpawned;
        if (remainingSpawns <= 0) return prev;

        // Only spawn if we're under the limit
        if (activeEnemyCount >= 6) return prev;

        // Only spawn abomination if it's the very last spawn of the scene
        if (remainingSpawns === 1) {
          const spawnPosition = generateRandomPosition();
          setTotalSpawned(prev => prev + 1);
          setCurrentWave(prev => prev + 1);
          const group = groupPool.acquire();
          group.visible = true;
          setActiveEnemyCount(prev => prev + 1);
          return [...prev, {
            id: `abomination-${totalSpawned}`,
            position: spawnPosition.clone(),
            initialPosition: spawnPosition.clone(),
            rotation: 0,
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
          rotation: 0,
          health: 289,
          maxHealth: 289,
          isDying: false,
          type: 'mage' as const,
          ref: { current: group }
        } : {
          id: `skeleton-${totalSpawned}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: 324,
          maxHealth: 324,
          isDying: false,
          type: 'regular' as const,
          ref: { current: group }
        };

        setTotalSpawned(prev => prev + 1);
        setActiveEnemyCount(prev => prev + 1);
        return [...prev, newEnemy];
      });
    }, 2500);

    return () => clearInterval(spawnTimer);
  }, [totalSpawned, maxSkeletons, killCount, currentWave, groupPool, activeEnemyCount]);

  useEffect(() => {
    if (controlsRef.current) {
      // Set initial camera position for Scene 2
      controlsRef.current.object.position.set(0, 12, -18);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [controlsRef]);

  // cleanup effect
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
    initializeSharedResources();
    
    // Initialize specific geometries and materials with proper values
    sharedGeometries.mountain = new THREE.ConeGeometry(23, 35, 12);
    sharedGeometries.mushroom = new THREE.CylinderGeometry(0.25, 0.25 * 1.225, 4, 8);
    sharedGeometries.tree = new THREE.CylinderGeometry(0.25, 0.25 * 1.225, 4, 8);
    
    // Add specific materials
    sharedMaterials.mountain = new THREE.MeshPhysicalMaterial({
      color: "#2a2a2a",
      metalness: 0.1,
      roughness: 1,
      emissive: "#222222",
      flatShading: true,
      clearcoat: 0.1,
      clearcoatRoughness: 0.8,
    });

    return () => {
      disposeSharedResources();
    };
  }, []);

  // main cleanup
  const cleanup = useCallback(() => {
    setEnemies(prev => {
      prev.forEach(enemy => {
        removeEnemy(enemy);
        // Only dispose of instance-specific resources
        enemy.ref?.current?.traverse((child) => {
          if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
            if (!Object.values(sharedGeometries).includes(child.geometry)) {
              child.geometry.dispose();
            }
          }
          if ('material' in child) {
            const material = child.material as THREE.Material | THREE.Material[];
            if (Array.isArray(material)) {
              material.forEach(m => {
                if (!Object.values(sharedMaterials).includes(m)) {
                  m.dispose();
                }
              });
            } else if (material && !Object.values(sharedMaterials).includes(material)) {
              material.dispose();
            }
          }
        });
      });
      return [];
    });
    groupPool.clear();
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

  return (
    <>
      <group>
        {/* Background Environment */}
        <CustomSky />
        <Planet />

        {/* Ground Environment */}
        <Terrain />
        
        {/* Add Pillar in center */}
        <Pillar />
        
        {/* Replaced individual mountains with instanced mountains */}
        <InstancedMountains mountains={mountainData} />

        {/* Replaced individual trees with instanced trees */}
        <InstancedTrees trees={treeData} />

        {/* Replaced individual mushrooms with InstancedMushrooms */}
        <InstancedMushrooms mushrooms={mushroomData} />

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