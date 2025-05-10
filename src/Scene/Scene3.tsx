import React, { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { Vector3, Group } from 'three';
import Terrain from '../Environment/Terrain';
import InstancedTrees from '../Environment/InstancedTrees';
import InstancedMountains from '../Environment/InstancedMountains';
import Unit from '../Unit/Unit';
import { SceneProps as SceneType } from '@/Scene/SceneProps';
import { UnitProps } from '../Unit/UnitProps';
import Planet from '../Environment/Planet';
import CustomSky from '../Environment/Sky';
import { generateRandomPosition, generateMountains, generateTrees, generateMushrooms } from '../Environment/terrainGenerators';
import { Enemy } from '../Versus/enemy';
import BossUnit from '@/Versus/Boss/BossUnit';

import * as THREE from 'three';
import { MemoizedEnemyUnit } from '../Versus/MemoizedEnemyUnit';
import { MemoizedSkeletalMage } from '../Versus/SkeletalMage/MemoizedSkeletalMage';
import { MemoizedAbominationUnit } from '../Versus/Abomination/MemoizedAbomination';
import { ObjectPool } from './ObjectPool';
import InstancedMushrooms from '../Environment/InstancedMushrooms';
import InstancedVegetation from '../Environment/InstancedVegetation';
import Pillar from '../Environment/Pillar';
import { initializeSharedResources, sharedGeometries, sharedMaterials, disposeSharedResources } from './SharedResources';


interface ScenePropsWithCallback extends SceneType {
  onLevelComplete: () => void;
  spawnCount: number;
}

const BOSS_SPAWN_POSITION = new Vector3(0, 0, 0); // Center of the map

// Add pool configuration (same as Scene2)
const POOL_CONFIG = {
  initialSize: 20,
  expandSize: 5,
  maxSize: 30
};

interface R3FElement extends HTMLElement {
  __r3f?: {
    fiber: {
      renderer: THREE.WebGLRenderer;
    };
  };
}

export default function Scene3({
  unitProps,
  skeletonProps,
  killCount,
  onLevelComplete,
  spawnInterval = 5500,
  maxSkeletons = 23,
  initialSkeletons = 5,
}: ScenePropsWithCallback) {
  // TERRAIN
  const mountainData = useMemo(() => generateMountains(), []);
  const treeData = useMemo(() => generateTrees(), []);
  const mushroomData = useMemo(() => generateMushrooms(), []);

  const [spawnStarted, setSpawnStarted] = useState(false);
  const [totalSpawned, setTotalSpawned] = useState(initialSkeletons || 5);
  const [activeEnemyCount, setActiveEnemyCount] = useState(initialSkeletons);

  // Group Pool
  const [groupPool] = useState(() => new ObjectPool<Group>(() => {
    const group = new Group();
    group.visible = false;
    return group;
  }, POOL_CONFIG.initialSize, POOL_CONFIG.expandSize, POOL_CONFIG.maxSize));


  // Modify enemy state initialization to ensure we have initial enemies
  const [enemies, setEnemies] = useState<Enemy[]>(() => {
    // If skeletonProps is empty or undefined, create some default enemies
    if (!skeletonProps || skeletonProps.length === 0) {
      return Array.from({ length: initialSkeletons }, (_, index) => {
        const spawnPosition = generateRandomPosition();
        const group = groupPool.acquire();
        group.visible = true;
        return {
          id: `skeleton-${index}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          currentPosition: spawnPosition.clone(),
          health: 361,
          maxHealth: 361,
          ref: { current: group },
          rotation: 0
        };
      });
    }
    
    // Use skeletonProps if available
    return skeletonProps.map((skeleton, index) => {
      const group = groupPool.acquire();
      group.visible = true;
      return {
        id: `skeleton-${index}`,
        position: skeleton.initialPosition.clone(),
        initialPosition: skeleton.initialPosition.clone(),
        currentPosition: skeleton.initialPosition.clone(),
        health: 361,
        maxHealth: 361,
        ref: { current: group },
        rotation: 0
      };
    });
  });

  // State for enemies (with Scene2-specific health values)
  const [playerHealth, setPlayerHealth] = useState<number>(unitProps.health);

  // Ref to track player position
  const playerRef = useRef<Group>(null);

  // State to store player position
  const [playerPosition, setPlayerPosition] = useState<Vector3>(new Vector3(0, 0, 0));

  // Boss states
  const [isBossSpawned, setIsBossSpawned] = useState(false);
  const [bossHealth, setBossHealth] = useState(6084);

  // Add state to track boss position
  const [bossPosition, setBossPosition] = useState<Vector3>(BOSS_SPAWN_POSITION.clone());

  // State for tracking waves and abomination spawns
  const [abominationsSpawned, setAbominationsSpawned] = useState(0);

  // Cleanup function for enemy removal
  const removeEnemy = useCallback((enemy: Enemy) => {
    if (enemy.ref?.current) {
      enemy.ref.current.visible = false;
      groupPool.release(enemy.ref.current);
    }
  }, [groupPool]);


  // Callback to handle damage to enemies
  const handleTakeDamage = useCallback((targetId: string, damage: number) => {
    // Handle boss damage
    if (targetId.includes('boss')) {
      const newHealth = Math.max(0, bossHealth - damage);
      setBossHealth(newHealth);
      
      // If boss is defeated, stop all spawning immediately
      if (newHealth <= 0 && bossHealth > 0) {
        setSpawnStarted(false);
      }
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
  }, [bossHealth, unitProps, setSpawnStarted]);

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
        rotation: enemy.rotation,
        health: enemy.health,
        maxHealth: enemy.maxHealth
      })),
      ...(isBossSpawned && bossHealth > 0 ? [{
        id: `enemy-boss-1`,
        position: bossPosition,
        initialPosition: BOSS_SPAWN_POSITION,
        rotation: 0,
        health: bossHealth,
        maxHealth: 6084
      }] : [])
    ],
    onDamage: unitProps.onDamage,
    onEnemyDeath: () => { },
    onFireballDamage: unitProps.onFireballDamage,
    fireballManagerRef: unitProps.fireballManagerRef,
    onSmiteDamage: unitProps.onSmiteDamage
  };

  // Monitor enemies to determine level completion
  useEffect(() => {
    const allEnemiesDefeated = enemies.every(enemy => enemy.health <= 0);
    const hasStartedSpawning = spawnStarted && totalSpawned > initialSkeletons;
    // Lower the kill count requirement for boss spawn from 47 to 40
    const shouldSpawnBoss = allEnemiesDefeated && hasStartedSpawning && killCount >= 40 && !isBossSpawned;
    
    if (shouldSpawnBoss) {
      console.log("BOSS SPAWN CONDITION MET - Preparing to spawn boss");
      const cleanupBeforeBoss = async () => {
        // 1. Stop all spawns and clear intervals
        setSpawnStarted(false);
        
        // 2. Clear all existing enemies and their resources
        setEnemies(prev => {
          prev.forEach(enemy => {
            if (enemy.ref?.current) {
              // Dispose of geometries, materials, and textures
              enemy.ref.current.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                  if (child.geometry) {
                    child.geometry.dispose();
                  }
                  if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                      if (mat.map) mat.map.dispose();
                      if (mat.normalMap) mat.normalMap.dispose();
                      if (mat.specularMap) mat.specularMap.dispose();
                      if (mat.envMap) mat.envMap.dispose();
                      mat.dispose();
                    });
                  } else if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    if (child.material.normalMap) child.material.normalMap.dispose();
                    if (child.material.specularMap) child.material.specularMap.dispose();
                    if (child.material.envMap) child.material.envMap.dispose();
                    child.material.dispose();
                  }
                }
              });
              
              // Remove from parent
              if (enemy.ref.current.parent) {
                enemy.ref.current.parent.remove(enemy.ref.current);
              }
              
              // Release to pool and ensure it's hidden
              enemy.ref.current.visible = false;
              groupPool.release(enemy.ref.current);
            }
          });
          return [];
        });

        // 3. Clear object pool and reset
        groupPool.clear();
        
        // 4. Clear Three.js cache
        THREE.Cache.clear();
        
        // 5. Clear any remaining references
        if (playerRef.current) {
          playerRef.current.updateMatrixWorld();
        }
        
        // 6. Force a garbage collection hint (if available)
        if (window.gc) {
          window.gc();
        }

        // 7. Wait for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // 8. Run another cleanup pass
        const renderer = unitProps.controlsRef.current?.domElement?.parentElement as R3FElement;
        if (renderer?.__r3f?.fiber?.renderer) {
          renderer.__r3f.fiber.renderer.renderLists.dispose();
        }

        // 9. Final wait before boss spawn
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // 10. Spawn the boss with delay 
        setTimeout(() => {
          console.log("SPAWNING BOSS NOW");
          setIsBossSpawned(true);
        }, 1000); // Reduced from 2750 to 1000 for faster boss spawn
      };

      cleanupBeforeBoss();
    }
    
    if (isBossSpawned && bossHealth <= 0) {
      // Immediately stop any further spawning when boss is defeated
      setSpawnStarted(false);
      onLevelComplete();
    }
  }, [unitProps.controlsRef, enemies, killCount, onLevelComplete, spawnStarted, totalSpawned, initialSkeletons, isBossSpawned, bossHealth, groupPool]);

  // Delay before allowing spawns
  useEffect(() => {
    const initialDelay = setTimeout(() => {
      setSpawnStarted(true);
    }, 1000);

    return () => clearTimeout(initialDelay);
  }, []);

  // Modify the SPAWNING LOGIC to ensure initial enemies
  useEffect(() => {
    // If we have no enemies at the start and haven't reached max, spawn some
    if (enemies.length === 0 && totalSpawned < initialSkeletons) {
      setEnemies(() => {
        const newEnemies = Array.from({ length: initialSkeletons }, (_, index) => {
          const spawnPosition = generateRandomPosition();
          const group = groupPool.acquire();
          group.visible = true;
          return {
            id: `skeleton-${totalSpawned + index}`,
            position: spawnPosition.clone(),
            initialPosition: spawnPosition.clone(),
            currentPosition: spawnPosition.clone(),
            health: 361,
            maxHealth: 361,
            ref: { current: group },
            rotation: 0
          };
        });
        
        setTotalSpawned(initialSkeletons);
        setActiveEnemyCount(initialSkeletons);
        return newEnemies;
      });
    }
  }, [enemies.length, totalSpawned, initialSkeletons, groupPool]);

  // Modify the regular spawning logic
  useEffect(() => {
    // Don't spawn if any of these conditions are true
    if (!spawnStarted || 
        totalSpawned >= maxSkeletons || 
        isBossSpawned || 
        bossHealth <= 0 || 
        killCount >= 40) return; // Stop spawning at 40 kills to prepare for boss

    const spawnTimer = setInterval(() => {
      // Add check for active enemy count
      if (activeEnemyCount >= 6) return;

      setEnemies(prev => {
        // Double-check conditions inside the state update
        if (isBossSpawned || bossHealth <= 0 || killCount >= 40) return prev;
        
        const remainingSpawns = maxSkeletons - totalSpawned;
        if (remainingSpawns <= 0) return prev;

        // Only spawn if we're under the limit
        if (activeEnemyCount >= 6) return prev;

        // Define specific spawn points for abominations
        const shouldSpawnAbomination = 
          (killCount >= 36 && abominationsSpawned === 0) ||
          (killCount >= 38 && abominationsSpawned === 1);

        if (shouldSpawnAbomination && abominationsSpawned < 2) {
          const spawnPosition = generateRandomPosition();
          setTotalSpawned(prev => prev + 1);
          setAbominationsSpawned(prev => prev + 1);
          setActiveEnemyCount(prev => prev + 1);
          
          const group = groupPool.acquire();
          group.visible = true;
          
          return [...prev, {
            id: `abomination-${totalSpawned}`,
            position: spawnPosition.clone(),
            initialPosition: spawnPosition.clone(),
            rotation: 0,
            health: 961,
            maxHealth: 961,
            isDying: false,
            type: 'abomination' as const,
            ref: { current: group }
          }];
        }

        // Spawn single enemy at a time instead of groups
        const spawnPosition = generateRandomPosition();
        
        // Every fourth spawn is a mage (3:1 ratio instead of 2:1)
        const isMage = (totalSpawned + 1) % 4 === 0;
        
        const group = groupPool.acquire();
        group.visible = true;
        
        const newEnemy: Enemy = isMage ? {
          id: `mage-${totalSpawned}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: 361,
          maxHealth: 361,
          isDying: false,
          type: 'mage' as const,
          ref: { current: group }
        } : {
          id: `skeleton-${totalSpawned}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: 361,
          maxHealth: 361,
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
  }, [totalSpawned, maxSkeletons, spawnInterval, abominationsSpawned, killCount, groupPool, activeEnemyCount, spawnStarted, isBossSpawned, bossHealth]);

  useEffect(() => {
    if (unitProps.controlsRef.current) {
      unitProps.controlsRef.current.object.position.set(0, 12, -18);
      unitProps.controlsRef.current.target.set(0, 0, 0);
      unitProps.controlsRef.current.update();
    }
  }, [unitProps.controlsRef]);

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

  // main cleanup
  const cleanup = useCallback(() => {
    setEnemies(prev => {
      prev.forEach(enemy => {
        removeEnemy(enemy);
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
  }, [cleanup]);
  
  // Initialize shared resources
  useEffect(() => {
    initializeSharedResources();
    
    // Initialize specific geometries and materials
    sharedGeometries.mountain = new THREE.ConeGeometry(23, 35, 12);
    sharedGeometries.mushroom = new THREE.CylinderGeometry(0.25, 0.25 * 1.225, 4, 8);
    sharedGeometries.tree = new THREE.CylinderGeometry(0.25, 0.25 * 1.225, 4, 8);
    sharedGeometries.skeleton = new THREE.BufferGeometry(); // Your skeleton geometry
    sharedGeometries.mage = new THREE.BufferGeometry(); // Your mage geometry
    sharedGeometries.boss = new THREE.BufferGeometry(); // Your boss geometry

    sharedMaterials.mountain = new THREE.MeshPhysicalMaterial({
      color: "#2a2a2a",
      metalness: 0.1,
      roughness: 1,
      emissive: "#222222",
      flatShading: true,
      clearcoat: 0.1,
      clearcoatRoughness: 0.8,
    });

    sharedMaterials.mushroom = new THREE.MeshStandardMaterial({
      color: "#FFBD83",
      roughness: 0.6,
      metalness: 0.2,
      emissive: "#FFBD83",
      emissiveIntensity: 0.0,
    });

    return () => {
      disposeSharedResources();
    };
  }, []);
  
  return (
    <Suspense fallback={null}>
      <group>
        {/* Background Environment */}
        <CustomSky />
        <Planet />

        <Terrain />
        <InstancedVegetation />
        
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


        {/* Boss Unit - Ensure it's rendered when isBossSpawned is true */}
        {isBossSpawned && (
          <BossUnit
            key="boss-1"
            id="boss-1"
            initialPosition={BOSS_SPAWN_POSITION}
            position={BOSS_SPAWN_POSITION}
            health={bossHealth}
            maxHealth={6084}
            onTakeDamage={(id, damage) => {
              console.log(`Boss taking damage: ${damage}, current health: ${bossHealth}`);
              setBossHealth(prev => Math.max(0, prev - damage));
            }}
            onPositionUpdate={handleEnemyPositionUpdate}
            playerPosition={playerPosition}
            onAttackPlayer={handlePlayerDamage}
            onEnrageSpawn={() => {
              // Only spawn if we're under the limit
              if (activeEnemyCount >= 6) return;
              
              // Spawn one abomination at a random position
              const spawnPosition = generateRandomPosition();
              setActiveEnemyCount(prev => prev + 1);
              setEnemies(prev => [...prev, {
                id: `abomination-enraged-${Date.now()}`,
                position: spawnPosition.clone(),
                initialPosition: spawnPosition.clone(),
                rotation: 0,
                health: 1024,
                maxHealth: 1024,
                isDying: false,
                type: 'abomination' as const,
                ref: { current: groupPool.acquire() }
              }]);
            }}
          />
        )}
      </group>
    </Suspense>
  );
} 