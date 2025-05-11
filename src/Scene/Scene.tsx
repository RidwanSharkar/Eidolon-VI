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
import InstancedTrees from '../Environment/InstancedTrees';
import InstancedMountains from '../Environment/InstancedMountains';
import InstancedMushrooms from '../Environment/InstancedMushrooms';
import InstancedVegetation from '../Environment/InstancedVegetation';
import Pillar from '../Environment/Pillar';
import { initializeSharedResources, sharedGeometries, sharedMaterials, disposeSharedResources } from './SharedResources';


interface SceneProps extends SceneType {
  onLevelComplete: () => void;
  spawnInterval?: number;
  maxSkeletons?: number;
  initialSkeletons?: number;
  spawnCount?: number;
  killCount: number;
}

// Add ObjectPool class
class ObjectPool<T> {
  private pool: T[] = [];
  private create: () => T;
  private maxSize: number;

  constructor(createFn: () => T, initialSize: number, maxSize: number) {
    this.create = createFn;
    this.maxSize = maxSize;
    
    // Initialize pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.create());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    if (this.maxSize > 0 && this.pool.length >= this.maxSize) {
      throw new Error('Pool exhausted');
    }
    return this.create();
  }

  release(object: T) {
    if (this.maxSize > 0 && this.pool.length >= this.maxSize) {
      return;
    }
    this.pool.push(object);
  }

  clear() {
    this.pool = [];
  }
}

export default function Scene({
  unitProps: { controlsRef, ...unitProps },
  onLevelComplete,
  spawnInterval = 2000,
  maxSkeletons = 13,
  initialSkeletons = 4,
  killCount,
}: SceneProps) {
  // TERRAIN
  const mountainData = useMemo(() => generateMountains(), []);
  const treeData = useMemo(() => generateTrees(), []);
  const mushroomData = useMemo(() => generateMushrooms(), []);

  // Add group pool
  const [groupPool] = useState(() => new ObjectPool<Group>(
    () => new Group(),
    maxSkeletons,
    maxSkeletons + 5
  ));

  // Modify enemy creation to use pool
  const createEnemy = useCallback((id: string) => {
    const group = groupPool.acquire();
    const spawnPosition = generateRandomPosition();
    spawnPosition.y = 0;
    
    return {
      id,
      position: spawnPosition.clone(),
      initialPosition: spawnPosition.clone(),
      rotation: 0,
      health: 225,
      maxHealth: 225,
      ref: { current: group }
    };
  }, [groupPool]);

  // Modify enemy cleanup
  const removeEnemy = useCallback((enemy: Enemy) => {
    if (enemy.ref?.current) {
      // Reset position before returning to pool
      enemy.ref.current.position.set(0, 0, 0);
      groupPool.release(enemy.ref.current);
    }
  }, [groupPool]);

  // Update initial enemies state
  const [enemies, setEnemies] = useState<Enemy[]>(() => 
    Array.from({ length: initialSkeletons }, (_, index) => 
      createEnemy(`skeleton-${index}`)
    )
  );

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
    enemyData: enemies.map((enemy) => ({
      id: `enemy-${enemy.id}`,
      position: enemy.position,
      initialPosition: enemy.initialPosition,
      rotation: enemy.rotation,
      health: enemy.health,
      maxHealth: enemy.maxHealth
    })),
    onDamage: unitProps.onDamage,
    onEnemyDeath: () => {
    },
    onFireballDamage: unitProps.onFireballDamage,
    fireballManagerRef: unitProps.fireballManagerRef,
    onSmiteDamage: unitProps.onSmiteDamage
  };

  // State to track spawn waves
  const [currentWave, setCurrentWave] = useState(0);
  
  // Update spawning logic
  useEffect(() => {
    if (totalSpawned >= maxSkeletons) return;

    const spawnTimer = setInterval(() => {
      if ((killCount < 2 && currentWave === 0) || 
          (killCount < 5 && currentWave === 1) || 
          (killCount < 8 && currentWave === 2)) {
        return;
      }

      setEnemies(prev => {
        const remainingSpawns = maxSkeletons - totalSpawned;
        if (remainingSpawns <= 0) return prev;

        const spawnAmount = Math.min(3, remainingSpawns);
        const newEnemies = Array.from({ length: spawnAmount }, (_, index) => 
          createEnemy(`skeleton-${totalSpawned + index}`)
        );

        setTotalSpawned(prev => prev + spawnAmount);
        setCurrentWave(prev => prev + 1);
        return [...prev, ...newEnemies];
      });
    }, spawnInterval);

    return () => clearInterval(spawnTimer);
  }, [totalSpawned, maxSkeletons, spawnInterval, currentWave, killCount, createEnemy]);

  // Check for level completion
  useEffect(() => {
    const allEnemiesDefeated = enemies.every(enemy => enemy.health <= 0);
    const spawnComplete = totalSpawned >= maxSkeletons;
    
    if (allEnemiesDefeated && spawnComplete) {
      onLevelComplete();
    }
  }, [enemies, totalSpawned, maxSkeletons, onLevelComplete]);

  useEffect(() => {
    if (controlsRef.current) {
      // Set initial camera position for Scene 1
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

  // Update cleanup
  const cleanup = useCallback(() => {
    setEnemies(prev => {
      prev.forEach(removeEnemy);
      return [];
    });
    groupPool.clear();
  }, [removeEnemy, groupPool]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    initializeSharedResources();
    
    // Initialize specific geometries and materials
    sharedGeometries.mountain = new THREE.ConeGeometry(23, 35, 12);
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

  useEffect(() => {
    const cleanup = () => {
      disposeSharedResources();
      // Clean up any other resources
      groupPool.clear();
    };

    return cleanup;
  }, [groupPool]);

  return (
    <>
      <group>
        <CustomSky />
        <Planet />
        <Terrain />
        <InstancedVegetation />
        <InstancedTrees trees={treeData} />
        <InstancedMountains mountains={mountainData} />
        <InstancedMushrooms mushrooms={mushroomData} />
        <Pillar />
        <group ref={playerRef}>
          <Unit {...unitComponentProps} />
        </group>
        {enemies.map((enemy) => (
          <MemoizedEnemyUnit
            key={enemy.id}
            id={enemy.id}
            initialPosition={enemy.initialPosition}
            position={enemy.position}
            health={enemy.health}
            maxHealth={enemy.maxHealth}
            isDying={enemy.isDying}
            onTakeDamage={handleTakeDamage}
            onPositionUpdate={handleEnemyPositionUpdate}
            playerPosition={playerPosition}
            onAttackPlayer={handlePlayerDamage}
            weaponType={unitProps.currentWeapon}
          />
        ))}
      </group>
    </>
  );
}