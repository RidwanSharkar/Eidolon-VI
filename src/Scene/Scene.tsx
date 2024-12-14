import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import Terrain from '../Environment/Terrain';
import Mountain from '../Environment/Mountain';
import Tree from '../Environment/Tree';
import Mushroom from '../Environment/Mushroom';
import Unit from '../Unit/Unit';
import EnemyUnit from '../Versus/EnemyUnit';
import { SceneProps as SceneType } from './SceneProps';
import { Group } from 'three';
import { UnitProps } from '../Unit/UnitProps';
import Planet from '../Environment/Planet';
import CustomSky from '../Environment/Sky';
import Behavior from '../Versus/Behavior';
import DriftingSouls from '../Environment/DriftingSouls';
import BackgroundStars from '../Environment/Stars';
import { generateRandomPosition } from '../Environment/terrainGenerators';
import { Enemy } from '../Versus/enemy';

interface ScenePropsWithCallback extends SceneType {
  onLevelComplete: () => void;
}

export default function Scene({
  mountainData,
  treeData,
  mushroomData,
  treePositions,
  interactiveTrunkColor,
  interactiveLeafColor,
  unitProps,
  killCount,
  onLevelComplete,
  spawnInterval = 8000,
  maxSkeletons = 15,
  initialSkeletons = 5,
}: ScenePropsWithCallback) {
  // State for enemies (with Scene1-specific health values)
  const [enemies, setEnemies] = useState<Enemy[]>(() => {
    // Initialize with initial skeletons
    return Array.from({ length: initialSkeletons }, (_, index) => {
      const spawnPosition = generateRandomPosition();
      return {
        id: `skeleton-${index}`,
        position: spawnPosition.clone(),
        initialPosition: spawnPosition.clone(),
        health: 200,
        maxHealth: 200,
      };
    });
  });

  const [totalSpawned, setTotalSpawned] = useState(initialSkeletons);
  const [playerHealth, setPlayerHealth] = useState<number>(unitProps.health);
  const playerRef = useRef<Group>(null);
  const [playerPosition, setPlayerPosition] = useState<Vector3>(new Vector3(0, 0, 0));

  // Callback to handle damage to enemies
  const handleTakeDamage = useCallback((targetId: string, damage: number) => {
    console.log(`Target ${targetId} takes ${damage} damage`);
    setEnemies(prevEnemies =>
      prevEnemies.map(enemy => {
        const strippedId = targetId.replace('enemy-', '');
        if (enemy.id === strippedId) {
          const newHealth = Math.max(0, enemy.health - damage);
          console.log(`Enemy ${strippedId} health: ${enemy.health} -> ${newHealth}`);
          if (newHealth === 0 && enemy.health > 0) {
            console.log('Enemy defeated, triggering onEnemyDeath');
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

  // Add reset function
  const handleReset = useCallback(() => {
    setPlayerHealth(unitProps.maxHealth);
    setEnemies(Array.from({ length: initialSkeletons }, (_, index) => {
      const spawnPosition = generateRandomPosition();
      return {
        id: `skeleton-${index}`,
        position: spawnPosition.clone(),
        initialPosition: spawnPosition.clone(),
        health: 200,
        maxHealth: 200,
      };
    }));
  }, [initialSkeletons, unitProps.maxHealth]);

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
    enemyData: enemies.map((enemy) => ({
      id: `enemy-${enemy.id}`,
      position: enemy.position,
      initialPosition: enemy.initialPosition,
      health: enemy.health,
      maxHealth: enemy.maxHealth
    })),
    onDamage: unitProps.onDamage,
    onEnemyDeath: () => {
      console.log("Kill counted in Scene");  // Debug log
    },
    onFireballDamage: unitProps.onFireballDamage,
    fireballManagerRef: unitProps.fireballManagerRef,
    onSmiteDamage: unitProps.onSmiteDamage
  };

  // Handle spawning logic
  useEffect(() => {
    if (totalSpawned >= maxSkeletons) return;

    const spawnTimer = setInterval(() => {
      setEnemies(prev => {
        if (totalSpawned >= maxSkeletons) {
          clearInterval(spawnTimer);
          return prev;
        }
        
        const spawnPosition = generateRandomPosition();
        const newEnemy: Enemy = {
          id: `skeleton-${totalSpawned}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          health: 200, // Scene1-specific health
          maxHealth: 200, // Scene1-specific max health
        };
        
        setTotalSpawned(prev => prev + 1);
        return [...prev, newEnemy];
      });
    }, spawnInterval);

    return () => clearInterval(spawnTimer);
  }, [totalSpawned, maxSkeletons, spawnInterval]);

  // Check for level completion
  useEffect(() => {
    const allEnemiesDefeated = enemies.every(enemy => enemy.health <= 0);
    const spawnComplete = totalSpawned >= maxSkeletons;
    
    if (allEnemiesDefeated && spawnComplete) {
      onLevelComplete();
    }
  }, [enemies, totalSpawned, maxSkeletons, onLevelComplete]);

  return (
    <>
      <Behavior 
        playerHealth={playerHealth}
        onReset={handleReset}
        killCount={killCount}
        onEnemiesDefeated={onLevelComplete}
        maxSkeletons={maxSkeletons}
      />

      {/* Background Environment */}
      <BackgroundStars />
      <DriftingSouls />
      <CustomSky />
      <Planet />

      {/* Ground Environment */}
      <Terrain />
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

      {/* Render the main interactive tree */}
      <Tree
        position={treePositions.mainTree}
        scale={1}
        trunkColor={interactiveTrunkColor}
        leafColor={interactiveLeafColor}
      />

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
    </>
  );
}