import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Vector3, Group } from 'three';
import Terrain from '../Environment/Terrain';
import Mountain from '../Environment/Mountain';
import Tree from '../Environment/Tree';
import Mushroom from '../Environment/Mushroom';
import Unit from '../Unit/Unit';
import EnemyUnit from '../Versus/EnemyUnit';
import { SceneProps as SceneType } from './SceneProps';
import { UnitProps } from '../Unit/UnitProps';
import Planet from '../Environment/Planet';
import CustomSky from '../Environment/Sky';
import DriftingSouls from '../Environment/DriftingSouls';
import { generateRandomPosition } from '../Environment/terrainGenerators';
import { Enemy } from '../Versus/enemy';
import BossUnit from '@/Versus/Boss/BossUnit';
import Flower from '../Environment/Flower';

interface ScenePropsWithCallback extends SceneType {
  onLevelComplete: () => void;
  flowerData: Array<{ position: Vector3; scale: number }>;
}

const BOSS_SPAWN_POSITION = new Vector3(0, 0, 0); // Center of the map

export default function Scene2({
  mountainData,
  treeData,
  mushroomData,
  unitProps,
  skeletonProps,
  killCount,
  onLevelComplete,
  spawnInterval = 8500,
  maxSkeletons = 23,
  initialSkeletons = 5,
  spawnCount = 2,
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
      health: 250,
      maxHealth: 250,
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
  const [bossHealth, setBossHealth] = useState(5184);

  // Add state to track boss position
  const [bossPosition, setBossPosition] = useState<Vector3>(BOSS_SPAWN_POSITION.clone());

  // Callback to handle damage to enemies
  const handleTakeDamage = useCallback((targetId: string, damage: number) => {
    // Handle boss damage
    if (targetId.includes('boss')) {
      const newHealth = Math.max(0, bossHealth - damage);
      setBossHealth(newHealth);
      return;
    }

    // Handle regular enemy damage
    setEnemies(prevEnemies =>
      prevEnemies.map(enemy => {
        const strippedId = targetId.replace('enemy-', '');
        if (enemy.id === strippedId) {
          const newHealth = Math.max(0, enemy.health - damage);
          if (newHealth === 0 && enemy.health > 0) {
            unitProps.onEnemyDeath?.();
          }
          return {
            ...enemy,
            health: newHealth
          };
        }
        return enemy;
      })
    );
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
        position: bossPosition, // Use tracked boss position instead of BOSS_SPAWN_POSITION
        initialPosition: BOSS_SPAWN_POSITION,
        health: bossHealth,
        maxHealth: 5184
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
    const shouldSpawnBoss = allEnemiesDefeated && hasStartedSpawning && killCount >= 24 && !isBossSpawned;
    
    if (shouldSpawnBoss) {
      setIsBossSpawned(true);
    } else if (allEnemiesDefeated && isBossSpawned && bossHealth <= 0) {
      // Level complete when boss is defeated
      onLevelComplete();
    }
  }, [enemies, killCount, onLevelComplete, spawnStarted, totalSpawned, initialSkeletons, isBossSpawned, bossHealth]);

  // Modify the spawn logic to include the delay
  useEffect(() => {
    // First, set a 5-second delay before allowing spawns
    const initialDelay = setTimeout(() => {
      setSpawnStarted(true);
    }, 4000);

    return () => clearTimeout(initialDelay);
  }, []);

  // Modify the spawn effect to check for spawnStarted
  useEffect(() => {
    if (!spawnStarted || totalSpawned >= maxSkeletons) return;

    const spawnTimer = setInterval(() => {
      setEnemies(prev => {
        if (totalSpawned >= maxSkeletons) {
          clearInterval(spawnTimer);
          return prev;
        }
        
        const newEnemies = Array(spawnCount).fill(null).map((_, i) => {
          const spawnPosition = generateRandomPosition();
          return {
            id: `skeleton-${totalSpawned + i}`,
            position: spawnPosition.clone(),
            initialPosition: spawnPosition.clone(),
            currentPosition: spawnPosition.clone(),
            health: 250, // Scene2-specific health
            maxHealth: 250, // Scene2-specific max health
          };
        });
        
        setTotalSpawned(prev => prev + spawnCount);
        return [...prev, ...newEnemies];
      });
    }, spawnInterval);

    return () => clearInterval(spawnTimer);
  }, [spawnStarted, totalSpawned, maxSkeletons, spawnInterval, spawnCount]);

  useEffect(() => {
    if (unitProps.controlsRef.current) {
      unitProps.controlsRef.current.object.position.set(0, 12, -18);
      unitProps.controlsRef.current.target.set(0, 0, 0);
      unitProps.controlsRef.current.update();
    }
  }, [unitProps.controlsRef]);

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

      {/* Render all flowers */}
      {flowerData.map((data, index) => (
        <Flower key={`flower-${index}`} position={data.position} scale={data.scale} />
      ))}

      {/* Player Unit with ref */}
      <group ref={playerRef}>
        <Unit {...unitComponentProps} />
      </group>

      {/* Enemy Units (Skeletons only) */}
      {enemies.map((enemy) => (
        <EnemyUnit
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
        />
      ))}


      {isBossSpawned && (
        <BossUnit
          key="boss-1"
          id="boss-1"
          initialPosition={BOSS_SPAWN_POSITION}
          position={BOSS_SPAWN_POSITION}
          health={bossHealth}
          maxHealth={5184}
          onTakeDamage={(id, damage) => {
            setBossHealth(prev => Math.max(0, prev - damage));
          }}
          onPositionUpdate={handleEnemyPositionUpdate}
          playerPosition={playerPosition}
          onAttackPlayer={handlePlayerDamage}
        />
      )}

      
    </>
  );
} 