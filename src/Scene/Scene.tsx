import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Vector3, Group } from 'three';
import Terrain from '../Environment/Terrain';
import Unit from '../Unit/Unit';
import { MemoizedEnemyUnit } from '../Versus/MemoizedEnemyUnit';
import { MemoizedSkeletalMage } from '../Versus/SkeletalMage/MemoizedSkeletalMage';
import { MemoizedAbominationUnit } from '../Versus/Abomination/MemoizedAbomination';
import ReaperUnit from '../Versus/Reaper/ReaperUnit';
import FallenTitanUnit from '../Versus/FallenTitan/FallenTitanUnit';
import DeathKnightUnit from '../Versus/DeathKnight/DeathKnightUnit';
import AscendantUnit from '../Versus/Ascendant/AscendantUnit';
import { SceneProps as SceneType } from '@/Scene/SceneProps';
import { UnitProps } from '../Unit/UnitProps';
import Planet from '../Environment/Planet';
import CustomSky from '../Environment/Sky';
import { generateRandomPosition, generateMountains, generateTrees, generateMushrooms } from '../Environment/terrainGenerators';
import { Enemy } from '../Versus/enemy';
import * as THREE from 'three';
import DetailedTrees from '../Environment/DetailedTrees';
import InstancedMountains from '../Environment/InstancedMountains';
import InstancedMushrooms from '../Environment/InstancedMushrooms';
import InstancedVegetation from '../Environment/InstancedVegetation';
import Pillar from '../Environment/Pillar';
import Pedestal from '../Environment/Pedestal';
import { initializeSharedResources, sharedGeometries, sharedMaterials, disposeSharedResources } from './SharedResources';
import { useMultiplayer } from '@/Multiplayer/MultiplayerContext';
import MultiplayerPlayer from '@/Multiplayer/MultiplayerPlayer';
import { WeaponType } from '../Weapons/weapons';
import { AbilityType } from '../Weapons/weapons';
import MultiplayerEnemyUnit from '../Versus/MultiplayerEnemyUnit';
import { globalAggroSystem, PlayerInfo, SummonedUnitInfo } from '../Versus/AggroSystem';
import AbyssalAbominationSummon from '../Spells/Legion/AbyssalAbominationSummon';
import { WeaponSubclass } from '../Weapons/weapons';
import { CriticalRune } from '../Spells/CriticalRune/CriticalRune';
import { CritDamageRune } from '../Spells/CriticalRune/CritDamageRune';
import { calculateRuneDrops } from '../Spells/CriticalRune/runeDropSystem';
import { useGameState } from './GameStateContext';
import { performanceMonitor } from './PerformanceMonitor';

// Add local interface for all summoned units (includes non-targetable types)
interface AllSummonedUnitInfo {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
  type: 'skeleton' | 'elemental' | 'abyssal-abomination';
  ownerId?: string;
}

// Interface for skeleton group with takeDamage method
interface SkeletonGroup extends THREE.Object3D {
  takeDamage: (damage: number) => void;
}

interface SceneProps extends SceneType {
  initialSkeletons?: number;
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
  initialSkeletons = 3,
  killCount,
  onStealthKillCountChange,
  onGlacialShardKillCountChange,
  canVault,
  consumeDashCharge,
  onShieldStateChange,
  playerStunRef,
  onEviscerateLashesChange,
  onBoneclawChargesChange,
  onIncinerateStacksChange,
}: SceneProps) {
  // Add multiplayer hook
  const { 
    players, 
    playerId, 
    isInRoom,
    enemies: multiplayerEnemies,
    updatePlayerPosition,
    changeWeapon,
    damageEnemy,
    updatePlayerHealth,
    sendAttackAnimation,
    sendAbilityAnimation,
    applyEnemyStatusEffect
  } = useMultiplayer();

  // TERRAIN
  const mountainData = useMemo(() => generateMountains(), []);
  const treeData = useMemo(() => generateTrees(), []);
  const mushroomData = useMemo(() => generateMushrooms(), []);

  // Add group pool
  const [groupPool] = useState(() => new ObjectPool<Group>(
    () => new Group(),
    20, // Initial pool size
    30  // Max pool size
  ));

  // ========================================================================
  // HEALTH CALCULATOR - Must be defined before createEnemy
  // ========================================================================
  const getEnemyHealth = useCallback((enemyType: string, level: number): number => {
    switch (enemyType) {
      case 'regular':
        switch (level) {
          case 1: return 625;
          case 2: return 784;
          case 3: return 841;
          case 4: return 961;
          case 5: return 1024;
          default: return 625;
        }
      case 'mage':
        switch (level) {
          case 1: return 484;
          case 2: return 529;
          case 3: return 625;
          case 4: return 729;
          case 5: return 841;
          default: return 484;
        }
      case 'reaper':
        switch (level) {
          case 2: return 841;
          case 3: return 900;
          case 4: return 1089;
          case 5: return 1156;
          default: return 784;
        }
      case 'abomination':
        switch (level) {
          case 3: return 2304;
          case 4: return 2500;
          case 5: return 2704;
          default: return 2304;
        }
      case 'ascendant':
        switch (level) {
          case 4: return 1681;
          case 5: return 1849;
          default: return 1681;
        }
      default:
        return 500; // Fallback health
    }
  }, []);

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
      health: getEnemyHealth('regular', 1),
      maxHealth: getEnemyHealth('regular', 1),
      ref: { current: group },
      isDying: false
    };
  }, [groupPool, getEnemyHealth]);

  // Modify enemy cleanup
  const removeEnemy = useCallback((enemy: Enemy) => {
    if (enemy.ref?.current) {
      // Reset position before returning to pool
      enemy.ref.current.position.set(0, 0, 0);
      groupPool.release(enemy.ref.current);
    }
  }, [groupPool]);

  // Use multiplayer enemies when in room, otherwise use local enemies
  const [localEnemies, setLocalEnemies] = useState<Enemy[]>(() => 
    Array.from({ length: initialSkeletons }, (_, index) => 
      createEnemy(`skeleton-${index}`)
    )
  );

  // Convert multiplayer enemies to local enemy format
  const convertedMultiplayerEnemies = useMemo(() => {
    if (!isInRoom) return [];
    
    return Array.from(multiplayerEnemies.values()).map(enemy => ({
      id: enemy.id,
      position: enemy.position.clone(),
      initialPosition: enemy.position.clone(),
      rotation: 0,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      type: enemy.type,
      isDying: enemy.isDying,
      ref: { current: null } // We'll handle refs differently for multiplayer
    }));
  }, [multiplayerEnemies, isInRoom]);

  // Use the appropriate enemy list based on multiplayer status
  const enemies = isInRoom ? convertedMultiplayerEnemies : localEnemies;

  const totalSpawnedRef = useRef(initialSkeletons);
  const playerRef = useRef<Group>(null);
  const [playerPosition, setPlayerPosition] = useState<Vector3>(new Vector3(0, 0, 0));
  
  // Rune system integration
  const { 
    criticalRunes, 
    critDamageRunes, 
    addCriticalRune, 
    addCritDamageRune, 
    pickupCriticalRune, 
    pickupCritDamageRune 
  } = useGameState();

  // Callback to handle damage to enemies
  const handleTakeDamage = useCallback((targetId: string, damage: number) => {
    const enemyId = targetId.replace('enemy-', '');
    const currentPlayerId = playerId || 'local-player';
    
    // Register aggro for player damage (summoned units handle their own aggro)
    // This function is called by player attacks, so we attribute damage to the player
    globalAggroSystem.addDamageAggro(enemyId, currentPlayerId, damage, 'player');
    
    if (isInRoom) {
      // In multiplayer, send damage to server
      const enemy = Array.from(multiplayerEnemies.values()).find(e => e.id === enemyId);
      if (enemy) {
        damageEnemy(enemy.id, damage, enemy.position);
      } 
    } else {
      // In single player, handle damage locally
      setLocalEnemies(prevEnemies => {
        const newEnemies = [...prevEnemies];
        const enemyIndex = newEnemies.findIndex(
          enemy => enemy.id === enemyId
        );
        
        if (enemyIndex !== -1) {
          const newHealth = Math.max(0, newEnemies[enemyIndex].health - damage);
          if (newHealth === 0 && newEnemies[enemyIndex].health > 0) {
            // Remove enemy from aggro system when it dies
            globalAggroSystem.removeEnemy(enemyId);
            
            // Check for rune drops
            const runeDrops = calculateRuneDrops(enemyId, newEnemies[enemyIndex].position);
            runeDrops.forEach(drop => {
              if (drop.runeType === 'critical') {
                addCriticalRune(drop.position);
              } else if (drop.runeType === 'critDamage') {
                addCritDamageRune(drop.position);
              }
            });
            
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
    }
  }, [unitProps, isInRoom, damageEnemy, multiplayerEnemies, playerId, addCriticalRune, addCritDamageRune]);

  // Aegis damage blocking state
  const [isAegisActive, setIsAegisActive] = useState(false);
  const onAegisDamageBlock = useCallback(() => {
    if (isAegisActive) {
      return true; // Damage was blocked
    }
    return false; // Damage was not blocked
  }, [isAegisActive]);



  // Function to update Aegis state from Unit component
  const updateAegisState = useCallback((active: boolean) => {
    setIsAegisActive(active);
  }, []);
  
  // Track frozen enemy IDs from Unit component
  const [frozenEnemyIds, setFrozenEnemyIds] = useState<string[]>([]);
  
  // Handle frozen enemy IDs update from Unit component
  const handleFrozenEnemyIdsUpdate = useCallback((newFrozenEnemyIds: string[]) => {
    if (isInRoom) {
      // In multiplayer, send freeze effects to server for each newly frozen enemy
      const currentFrozenSet = new Set(frozenEnemyIds);
      
      // Find newly frozen enemies
      newFrozenEnemyIds.forEach(enemyId => {
        if (!currentFrozenSet.has(enemyId)) {
          const normalizedId = enemyId.startsWith('enemy-') ? enemyId.slice(6) : enemyId;
          applyEnemyStatusEffect(normalizedId, 'freeze', 4000); // Default freeze duration
        }
      });
    }
    
    setFrozenEnemyIds(newFrozenEnemyIds);
  }, [isInRoom, applyEnemyStatusEffect, frozenEnemyIds]);
  
  // Callback to receive the freeze check function from Unit component (keep for backward compatibility)
  const handleFreezeStateCheck = useCallback((enemyId: string) => {
    // Handle both "enemy-" prefixed and raw enemy IDs
    const normalizedId = enemyId.startsWith('enemy-') ? enemyId.slice(6) : enemyId;
    const prefixedId = enemyId.startsWith('enemy-') ? enemyId : `enemy-${enemyId}`;
    
    if (isInRoom) {
      // In multiplayer, check server-synchronized status effects
      const enemy = multiplayerEnemies.get(normalizedId);
      return enemy?.isFrozen || false;
    } else {
      // In single player, check if enemy is in the frozen enemies list (try both formats)
      return frozenEnemyIds.includes(normalizedId) || frozenEnemyIds.includes(prefixedId);
    }
  }, [isInRoom, multiplayerEnemies, frozenEnemyIds]);

  // Track slowed enemy IDs and their expiration times
  const [slowedEnemies, setSlowedEnemies] = useState<Record<string, number>>({});
  
  // Add slow effect to an enemy
  const addSlowEffect = useCallback((enemyId: string, duration: number = 4000) => {
    const normalizedId = enemyId.startsWith('enemy-') ? enemyId.slice(6) : enemyId;
    
    if (isInRoom) {
      // In multiplayer, send status effect to server
      applyEnemyStatusEffect(normalizedId, 'slow', duration);
    } else {
      // In single player, handle locally
      const expirationTime = Date.now() + duration;
      setSlowedEnemies(prev => ({
        ...prev,
        [normalizedId]: expirationTime
      }));
    }
  }, [isInRoom, applyEnemyStatusEffect]);
  
  // Check if enemy is slowed
  const handleSlowStateCheck = useCallback((enemyId: string) => {
    const normalizedId = enemyId.startsWith('enemy-') ? enemyId.slice(6) : enemyId;
    
    if (isInRoom) {
      // In multiplayer, check server-synchronized status effects
      const enemy = multiplayerEnemies.get(normalizedId);
      return enemy?.isSlowed || false;
    } else {
      // In single player, use local state
      const expirationTime = slowedEnemies[normalizedId];
      
      if (!expirationTime) return false;
      
      // Check if slow effect has expired
      if (Date.now() > expirationTime) {
        // Remove expired slow effect
        setSlowedEnemies(prev => {
          const newSlowed = { ...prev };
          delete newSlowed[normalizedId];
          return newSlowed;
        });
        return false;
      }
      
      return true;
    }
  }, [isInRoom, multiplayerEnemies, slowedEnemies]);

  // Track stunned enemy IDs and their expiration times  
  const [stunnedEnemies, setStunnedEnemies] = useState<Record<string, number>>({});
  
  // Add stun effect to an enemy
  const addStunEffect = useCallback((enemyId: string, duration: number = 2000) => {
    const normalizedId = enemyId.startsWith('enemy-') ? enemyId.slice(6) : enemyId;
    
    if (isInRoom) {
      // In multiplayer, send status effect to server
      applyEnemyStatusEffect(normalizedId, 'stun', duration);
    } else {
      // In single player, handle locally
      const expirationTime = Date.now() + duration;
      setStunnedEnemies(prev => ({
        ...prev,
        [normalizedId]: expirationTime
      }));
    }
  }, [isInRoom, applyEnemyStatusEffect]);
  
  // Check if an enemy is currently stunned
  const handleStunStateCheck = useCallback((enemyId: string) => {
    const normalizedId = enemyId.startsWith('enemy-') ? enemyId.slice(6) : enemyId;
    
    if (isInRoom) {
      // In multiplayer, check server-synchronized status effects
      const enemy = multiplayerEnemies.get(normalizedId);
      return enemy?.isStunned || false;
    } else {
      // In single player, use local state
      const expirationTime = stunnedEnemies[normalizedId];
      
      if (!expirationTime) return false;
      
      // Check if stun effect has expired
      if (Date.now() > expirationTime) {
        // Remove expired stun effect
        setStunnedEnemies(prev => {
          const newStunned = { ...prev };
          delete newStunned[normalizedId];
          return newStunned;
        });
        return false;
      }
      
      return true;
    }
  }, [isInRoom, multiplayerEnemies, stunnedEnemies]);

  // Track knockback effects for enemies
  const [knockbackEffects, setKnockbackEffects] = useState<Record<string, { direction: Vector3; distance: number; startTime: number; duration: number }>>({});
  
  // Add knockback effect to an enemy
  const addKnockbackEffect = useCallback((enemyId: string, direction: Vector3, distance: number) => {
    const normalizedId = enemyId.startsWith('enemy-') ? enemyId.slice(6) : enemyId;
    const startTime = Date.now();
    const duration = 600; // 0.5 seconds for knockback animation
    
    setKnockbackEffects(prev => ({
      ...prev,
      [normalizedId]: {
        direction: direction.clone(),
        distance,
        startTime,
        duration
      }
    }));
  }, []);

  // Check if an enemy is currently being knocked back and get knockback data
  const getKnockbackEffect = useCallback((enemyId: string) => {
    const normalizedId = enemyId.startsWith('enemy-') ? enemyId.slice(6) : enemyId;
    const effect = knockbackEffects[normalizedId];
    
    if (!effect) return null;
    
    const now = Date.now();
    const elapsed = now - effect.startTime;
    
    // Check if knockback effect has expired
    if (elapsed > effect.duration) {
      return null;
    }
    
    // Calculate progress (0 to 1)
    const progress = elapsed / effect.duration;
    // Use easing for smooth knockback (fast start, slow end)
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    return {
      direction: effect.direction,
      distance: effect.distance,
      progress: easedProgress,
      isActive: true
    };
  }, [knockbackEffects]);

  // Update performance monitoring after all state variables are declared
  useEffect(() => {
    performanceMonitor.updateObjectCount('enemies', enemies.length);
    performanceMonitor.updateObjectCount('statusEffects', 
      Object.keys(slowedEnemies).length + 
      Object.keys(stunnedEnemies).length + 
      Object.keys(knockbackEffects).length + 
      frozenEnemyIds.length
    );
  }, [enemies.length, slowedEnemies, stunnedEnemies, knockbackEffects, frozenEnemyIds]);

  // MORE AGGRESSIVE memory cleanup - force garbage collection when memory usage is high
  useEffect(() => {
    const memoryCleanupInterval = setInterval(() => {
      // Check if we have too many accumulated objects
      const totalStatusEffects = Object.keys(slowedEnemies).length +
        Object.keys(stunnedEnemies).length +
        Object.keys(knockbackEffects).length +
        frozenEnemyIds.length;

      // LOWER THRESHOLD: Clean up when we have 20+ status effects instead of 50
      if (totalStatusEffects > 10) {

        // Force cleanup of all expired effects
        const now = Date.now();

        setSlowedEnemies(prev => {
          const newSlowed = { ...prev };
          let hasChanges = false;
          Object.keys(newSlowed).forEach(enemyId => {
            // Remove effects older than 5 seconds (more aggressive)
            if (now > newSlowed[enemyId] + 5000) {
              delete newSlowed[enemyId];
              hasChanges = true;
            }
          });
          return hasChanges ? newSlowed : prev;
        });

        setStunnedEnemies(prev => {
          const newStunned = { ...prev };
          let hasChanges = false;
          Object.keys(newStunned).forEach(enemyId => {
            // Remove effects older than 3 seconds (more aggressive)
            if (now > newStunned[enemyId] + 3000) {
              delete newStunned[enemyId];
              hasChanges = true;
            }
          });
          return hasChanges ? newStunned : prev;
        });

        setKnockbackEffects(prev => {
          const newKnockback = { ...prev };
          let hasChanges = false;
          Object.keys(newKnockback).forEach(enemyId => {
            const effect = newKnockback[enemyId];
            // Remove effects older than 1 second (more aggressive)
            if (now > effect.startTime + effect.duration + 1000) {
              delete newKnockback[enemyId];
              hasChanges = true;
            }
          });
          return hasChanges ? newKnockback : prev;
        });

        // Clear frozen enemies that have been frozen too long (5 seconds max)
        setFrozenEnemyIds(prev => prev.filter(() => {
          return true; // This will be handled by the spell effects - keep aggressive
        }));
      }
    }, 3000); // Check every 3 seconds instead of 5

    return () => clearInterval(memoryCleanupInterval);
  }, [slowedEnemies, stunnedEnemies, knockbackEffects, frozenEnemyIds]);
  
  // Clean up expired slow effects periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Get alive enemy IDs for cleanup
      const aliveEnemyIds = new Set(
        isInRoom 
          ? Array.from(multiplayerEnemies.keys())
          : localEnemies.filter(e => e.health > 0 && !e.isDying).map(e => e.id)
      );
      
      setSlowedEnemies(prev => {
        const newSlowed = { ...prev };
        let hasChanges = false;
        
        Object.keys(newSlowed).forEach(enemyId => {
          // Remove if expired OR if enemy is dead
          if (now > newSlowed[enemyId] || !aliveEnemyIds.has(enemyId)) {
            delete newSlowed[enemyId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? newSlowed : prev;
      });
      
      // Also clean up expired stun effects
      setStunnedEnemies(prev => {
        const newStunned = { ...prev };
        let hasChanges = false;
        
        Object.keys(newStunned).forEach(enemyId => {
          // Remove if expired OR if enemy is dead
          if (now > newStunned[enemyId] || !aliveEnemyIds.has(enemyId)) {
            delete newStunned[enemyId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? newStunned : prev;
      });

      // Clean up expired knockback effects
      setKnockbackEffects(prev => {
        const newKnockback = { ...prev };
        let hasChanges = false;
        
        Object.keys(newKnockback).forEach(enemyId => {
          const effect = newKnockback[enemyId];
          // Remove if expired OR if enemy is dead
          if (now > effect.startTime + effect.duration || !aliveEnemyIds.has(enemyId)) {
            delete newKnockback[enemyId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? newKnockback : prev;
      });
    }, 2000); // Check every 2 seconds instead of every second
    
    return () => clearInterval(cleanupInterval);
  }, [isInRoom, multiplayerEnemies, localEnemies]);

  // Add glacial shard shield state and ref
  const glacialShardRef = useRef<{ absorbDamage: (damage: number) => number; hasShield: boolean; shieldAbsorption: number; shootGlacialShard?: () => boolean; getKillCount?: () => number } | null>(null);


  // Update handlePlayerDamage to use combined shield absorption and Aegis
  const handlePlayerDamage = useCallback((damage: number) => {
    // Safety check - ensure damage is a valid number
    if (typeof damage !== 'number' || damage < 0 || !isFinite(damage)) {
      // console.error(`[Scene] ❌ Invalid damage value: ${damage}, ignoring damage`);
      return;
    }
    
    // Check if Aegis is active and block damage
    if (isAegisActive) {
      return; // Don't apply damage to player
    }

    // Use the combined shield absorption from Unit component (includes Divine Shield, Blizzard Shield, and Glacial Shard shield)
    let remainingDamage = damage;
    if (glacialShardRef.current && glacialShardRef.current.absorbDamage) {
      remainingDamage = glacialShardRef.current.absorbDamage(damage);
      
      // Update shield state for UI
      const newShieldState = {
        hasShield: glacialShardRef.current.hasShield,
        shieldAbsorption: glacialShardRef.current.shieldAbsorption || 0
      };
      
      // Notify parent component of shield state change
      if (onShieldStateChange) {
        onShieldStateChange(newShieldState.hasShield, newShieldState.shieldAbsorption);
      }
    }

    // Only apply remaining damage after shield absorption
    if (remainingDamage > 0) {
      // Call the original damage callback directly - this matches the original Panel implementation
      unitProps.onDamage?.(remainingDamage);
    }
  }, [onShieldStateChange, unitProps, isAegisActive]);

  // Handle damage to summoned units (like abyssal skeletons)
  const handleSummonedUnitDamage = useCallback((summonedUnitId: string, damage: number) => {
    // Find the summoned unit in the scene and call its takeDamage method
    // We need to traverse the scene to find the skeleton's group ref
    if (playerRef.current) {
      const findSkeletonGroup = (object: THREE.Object3D): SkeletonGroup | null => {
        if ('takeDamage' in object && object.userData?.skeletonId === summonedUnitId) {
          return object as SkeletonGroup;
        }
        
        // Search through children recursively
        if (object.children) {
          for (const child of object.children) {
            const found = findSkeletonGroup(child);
            if (found) return found;
          }
        }
        
        return null;
      };
      
      const skeletonGroup = findSkeletonGroup(playerRef.current);
      if (skeletonGroup) {
        skeletonGroup.takeDamage(damage);
      }
    }
    
    // Also update the summoned units state for aggro system
    setSummonedUnits(prev => prev.map(unit => {
      if (unit.id === summonedUnitId) {
        const newHealth = Math.max(0, unit.health - damage);
        
        // If unit dies, remove it from aggro system
        if (newHealth <= 0) {
          globalAggroSystem.removeTarget(summonedUnitId);
        }
        
        return { ...unit, health: newHealth };
      }
      return unit;
    }));
  }, []);

  // Callback to update player position
  const handlePlayerPositionUpdate = useCallback((position: Vector3, isStealthed?: boolean, rotation?: Vector3, movementDirection?: Vector3) => {
    setPlayerPosition(position);
    
    // Send position to multiplayer if in a room
    if (isInRoom && playerRef.current) {
      const actualRotation = rotation || new Vector3(
        playerRef.current.rotation.x,
        playerRef.current.rotation.y, 
        playerRef.current.rotation.z
      );
      updatePlayerPosition(position, actualRotation, movementDirection);
    }
  }, [isInRoom, updatePlayerPosition]);

  // Enemy Position Update - only for local enemies in single player
  const handleEnemyPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    if (!isInRoom) {
      setLocalEnemies(prevEnemies =>
        prevEnemies.map(enemy =>
          enemy.id === id.replace('enemy-', '')
            ? { 
                ...enemy, 
                position: newPosition.clone()
              }
            : enemy
        )
      );
    }
    // In multiplayer, enemy positions are handled by the server
  }, [isInRoom]);

  // Add weapon change handler
  const handleWeaponChange = useCallback((weapon: WeaponType, subclass?: WeaponSubclass) => {
    unitProps.onWeaponSelect(weapon, subclass);
    
    // Send weapon change to multiplayer
    if (isInRoom) {
      changeWeapon(weapon, subclass);
    }
  }, [unitProps, isInRoom, changeWeapon]);

  // Add ability handler for multiplayer
  const handleAbilityUse = useCallback((weapon: WeaponType, abilityType: AbilityType) => {
    // Call the original ability handler
    unitProps.onAbilityUse(weapon, abilityType);
    
    // Send ability animation to multiplayer
    if (isInRoom && playerRef.current) {
      const position = playerRef.current.position.clone();
      const direction = new Vector3(0, 0, 1).applyQuaternion(playerRef.current.quaternion);
      
      if (abilityType === 'q') {
        // Regular attack - include weapon and subclass info
        sendAttackAnimation(`${weapon}-${abilityType}`, position, direction);
      } else {
        // Ability (e, r, passive, active, etc.)
        sendAbilityAnimation(abilityType, position, direction);
      }
    }
  }, [unitProps, isInRoom, sendAttackAnimation, sendAbilityAnimation]);

  // Function to calculate level based on kill count (same as in pages/index.tsx)
  const getLevel = (kills: number) => {
    if (kills < 10) return 1;    
    if (kills < 25) return 2;     
    if (kills < 45) return 3;    
    if (kills < 70) return 4;   
    return 5;                      // Level 5: 20+ kills
  };

  const currentLevel = getLevel(killCount);


  // Track summoned units for aggro system
  const [summonedUnits, setSummonedUnits] = useState<AllSummonedUnitInfo[]>([]);

  // Damage numbers system for summoned units
  const [, setDamageNumbers] = useState<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isSummon?: boolean;
    isLegion?: boolean;
  }>>([]);
  const nextDamageNumberId = useRef(1);

  // Helper function to convert multiplayer players to PlayerInfo format
  const getAllPlayersInfo = useCallback((): PlayerInfo[] => {
    if (!isInRoom || players.size === 0) {
      // Single player mode - return current player info
      return [{
        id: playerId || 'local-player',
        position: playerPosition,
        name: 'Player'
      }];
    }
    
    // Multiplayer mode - convert all players
    return Array.from(players.values()).map(player => ({
      id: player.id,
      position: player.position,
      name: player.name,
      health: player.health,
      maxHealth: player.maxHealth
    }));
  }, [isInRoom, players, playerId, playerPosition]);

  // Callback to update summoned units from Unit component
  const handleSummonedUnitsUpdate = useCallback((units: AllSummonedUnitInfo[]) => {
    setSummonedUnits(units);
  }, []);

  // Function to get real-time player position directly from the player ref
  const getCurrentPlayerPosition = useCallback((): Vector3 => {
    if (playerRef.current && playerRef.current.children.length > 0) {
      // The Unit component is the first child of playerRef, and it has its own group
      // We need to get the position from the Unit's internal group
      const unitGroup = playerRef.current.children[0] as Group;
      if (unitGroup && unitGroup.position) {
        return unitGroup.position.clone();
      }
    }
    
    // Fallback to the state-based position
    return playerPosition;
  }, [playerPosition]);

  // Update unitComponentProps to use prop health directly
  const unitComponentProps: UnitProps = {
    onHit: handleTakeDamage,
    controlsRef: controlsRef,
    currentWeapon: unitProps.currentWeapon,
    currentSubclass: unitProps.currentSubclass,
    onWeaponSelect: handleWeaponChange, // Use new handler
    health: unitProps.health,
    maxHealth: unitProps.maxHealth,
    isPlayer: unitProps.isPlayer,
    abilities: unitProps.abilities,
    onAbilityUse: handleAbilityUse,
    onResetAbilityCooldown: unitProps.onResetAbilityCooldown,
    onPositionUpdate: handlePlayerPositionUpdate,
    level: currentLevel, // Add the calculated level
    onHealthChange: unitProps.onHealthChange, // Pass through the original healing callback
    enemyData: enemies.map((enemy) => ({
      id: `enemy-${enemy.id}`,
      position: enemy.position,
      initialPosition: enemy.initialPosition,
      rotation: enemy.rotation,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      isDying: enemy.isDying // Add isDying property
    })),
    onDamage: unitProps.onDamage,
    onEnemyDeath: () => {
    },
    onFireballDamage: unitProps.onFireballDamage,
    fireballManagerRef: unitProps.fireballManagerRef,
    onSmiteDamage: unitProps.onSmiteDamage,
    // Aegis-related props
    isAegisActive: isAegisActive,
    onAegisDamageBlock: onAegisDamageBlock,
    onAegisStateChange: updateAegisState,
    // Deep Freeze related props
    onFreezeStateCheck: handleFreezeStateCheck,
    onFrozenEnemyIdsUpdate: handleFrozenEnemyIdsUpdate,
    // Slow effect related props
    onApplySlowEffect: addSlowEffect,
    // Stun effect related props
    onApplyStunEffect: addStunEffect,
    // Knockback effect related props
    onApplyKnockbackEffect: addKnockbackEffect,
    // Kill count reporting callbacks
    onStealthKillCountChange,
    onGlacialShardKillCountChange,
    // Dash charge functions
    canVault,
    consumeDashCharge,
    // Add glacial shard shield props
    glacialShardRef: glacialShardRef,
    onShieldStateChange: (hasShield: boolean, shieldAbsorption: number) => {
      // Remove: setGlacialShieldState({ hasShield, shieldAbsorption });
      // Notify parent component
      if (onShieldStateChange) {
        onShieldStateChange(hasShield, shieldAbsorption);
      }
    },
    // Summoned units callback for aggro system
    onSummonedUnitsUpdate: handleSummonedUnitsUpdate,
    // Player stun ref
    playerStunRef,
    // Eviscerate charges callback
    onEviscerateLashesChange,
    // Boneclaw charges callback
    onBoneclawChargesChange,
    // Incinerate stacks callback
    onIncinerateStacksChange
  };

  // Spawning logic - Apply to both single player and multiplayer modes
  useEffect(() => {
    // In multiplayer mode, only the host/server should spawn enemies
    // For now, we'll enable spawning for all players in multiplayer
    // The server should handle synchronization

    const MAX_ENEMIES = 4; // Hard cap on total enemies on screen

    // Timer for regular skeletons: 3 every 75 seconds
    const skeletonTimer = setInterval(() => {
      setLocalEnemies(prev => {
        // Level-based spawning constraint: Regular skeletons only spawn at levels 1-3
        if (currentLevel >= 4) return prev;

        // Check if we can spawn more enemies
        const availableSlots = MAX_ENEMIES - prev.length;
        if (availableSlots <= 0) return prev;

        // Spawn up to 3 skeletons or fill remaining slots
        const spawnCount = Math.min(2, availableSlots);
        const newSkeletons = Array.from({ length: spawnCount }, (_, index) => {
          const spawnPosition = generateRandomPosition();
          spawnPosition.y = 0;
          const group = groupPool.acquire();
          group.visible = true;
          const health = getEnemyHealth('regular', currentLevel);
          return {
            id: `skeleton-${totalSpawnedRef.current + index}`,
            position: spawnPosition.clone(),
            initialPosition: spawnPosition.clone(),
            rotation: 0,
            health: health,
            maxHealth: health,
            type: 'regular' as const,
            ref: { current: group },
            isDying: false
          };
        });

        totalSpawnedRef.current += spawnCount;
        return [...prev, ...newSkeletons];
      });
    }, 15000);

    // Timer for skeletal mages: 1 every 100 seconds
    const mageTimer = setInterval(() => {
      setLocalEnemies(prev => {
        // Level-based spawning constraint: Skeletal mages spawn at all levels (1-5)
        // No level restriction for mages

        // Check if we can spawn more enemies
        if (prev.length >= MAX_ENEMIES) return prev;

        // Check if there are already 2 skeletal mages on the map (maximum allowed)
        const existingMages = prev.filter(enemy => enemy.type === 'mage');
        if (existingMages.length >= 2) return prev; // Don't spawn if 2 already exist

        const spawnPosition = generateRandomPosition();
        spawnPosition.y = 0;
        const group = groupPool.acquire();
        group.visible = true;
        
        const health = getEnemyHealth('mage', currentLevel);
        const newMage = {
          id: `mage-${Date.now()}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: health,
          maxHealth: health,
          type: 'mage' as const,
          ref: { current: group },
          isDying: false
        };

        totalSpawnedRef.current += 1;
        return [...prev, newMage];
      });
    }, 22500);

    // Timer for abominations: 1 every 150 seconds
    const abominationTimer = setInterval(() => {
      setLocalEnemies(prev => {
        // Level-based spawning constraint: Abominations only spawn at levels 3-5
        if (currentLevel < 3) return prev;

        // Check if we can spawn more enemies
        if (prev.length >= MAX_ENEMIES) return prev;

        const spawnPosition = generateRandomPosition();
        spawnPosition.y = 0;
        const group = groupPool.acquire();
        group.visible = true;
        
        const health = getEnemyHealth('abomination', currentLevel);
        const newAbomination = {
          id: `abomination-${Date.now()}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: health,
          maxHealth: health,
          type: 'abomination' as const,
          ref: { current: group }
        };

        totalSpawnedRef.current += 1;
        return [...prev, newAbomination];
      });
    }, 45000);

    // Timer for reapers: 1 every 25 seconds
    const reaperTimer = setInterval(() => {
      setLocalEnemies(prev => {
        // Level-based spawning constraint: Reapers only spawn at levels 2-5
        if (currentLevel < 2) return prev;

        // Check if we can spawn more enemies
        if (prev.length >= MAX_ENEMIES) return prev;

        const spawnPosition = generateRandomPosition();
        spawnPosition.y = 0;
        const group = groupPool.acquire();
        group.visible = true;
        
        const health = getEnemyHealth('reaper', currentLevel);
        const newReaper = {
          id: `reaper-${Date.now()}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: health,
          maxHealth: health,
          type: 'reaper' as const,
          ref: { current: group }
        };

        totalSpawnedRef.current += 1;
        return [...prev, newReaper];
      });
    }, 22500);

    // Timer for fallen titans: 1 every 30 seconds (only one allowed on map at a time)
    const fallenTitanTimer = setInterval(() => {
      setLocalEnemies(prev => {
        // Level-based spawning constraint: Fallen Titans only spawn at level 5
        if (currentLevel < 5) return prev;

        // Check if we can spawn more enemies
        if (prev.length >= MAX_ENEMIES) return prev;

        // Check if there's already a Fallen Titan on the map
        const existingFallenTitan = prev.find(enemy => enemy.type === 'fallen-titan');
        if (existingFallenTitan) return prev; // Don't spawn if one already exists

        const spawnPosition = generateRandomPosition();
        spawnPosition.y = 0;
        const group = groupPool.acquire();
        group.visible = true;
        
        const newFallenTitan = {
          id: `fallen-titan-${Date.now()}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: 4900,
          maxHealth: 4900,
          type: 'fallen-titan' as const,
          ref: { current: group }
        };

        totalSpawnedRef.current += 1;
        return [...prev, newFallenTitan];
      });
    }, 60000);

    // Timer for ascendants: 1 every 45 seconds
    const ascendantTimer = setInterval(() => {
      setLocalEnemies(prev => {
        // Level-based spawning constraint: Ascendants only spawn at levels 4-5
        if (currentLevel < 4) return prev;

        // Check if we can spawn more enemies
        if (prev.length >= MAX_ENEMIES) return prev;

        const spawnPosition = generateRandomPosition();
        spawnPosition.y = 0;
        const group = groupPool.acquire();
        group.visible = true;
        
        const health = getEnemyHealth('ascendant', currentLevel);
        const newAscendant = {
          id: `ascendant-${Date.now()}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: health,
          maxHealth: health,
          type: 'ascendant' as const,
          ref: { current: group }
        };

        totalSpawnedRef.current += 1;
        return [...prev, newAscendant];
      });
    }, 35000);

    // Timer for death knights: 1 every 35 seconds
    const deathKnightTimer = setInterval(() => {
      setLocalEnemies(prev => {
        // Level-based spawning constraint: Death Knights only spawn at levels 3-5
        if (currentLevel < 3) return prev;

        // Check if we can spawn more enemies
        if (prev.length >= MAX_ENEMIES) return prev;

        const spawnPosition = generateRandomPosition();
        spawnPosition.y = 0;
        const group = groupPool.acquire();
        group.visible = true;
        
        const newDeathKnight = {
          id: `death-knight-${Date.now()}`,
          position: spawnPosition.clone(),
          initialPosition: spawnPosition.clone(),
          rotation: 0,
          health: 1424,
          maxHealth: 1424,
          type: 'death-knight' as const,
          ref: { current: group },
          isDying: false
        };

        totalSpawnedRef.current += 1;
        return [...prev, newDeathKnight];
      });
    }, 17500);

    return () => {
      clearInterval(skeletonTimer);
      clearInterval(mageTimer);
      clearInterval(abominationTimer);
      clearInterval(reaperTimer);
      clearInterval(fallenTitanTimer);
      clearInterval(ascendantTimer);
      clearInterval(deathKnightTimer);
    };
  }, [getEnemyHealth, groupPool, isInRoom, currentLevel]); // Added currentLevel dependency

  // No level completion needed for continuous gameplay

  useEffect(() => {
    if (controlsRef.current) {
      // Set initial camera position for Scene 1
      controlsRef.current.object.position.set(0, 12, -18);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [controlsRef]);

  // cleanup of dead enemies - only for local enemies
  useEffect(() => {
    if (isInRoom) return; // Don't clean up multiplayer enemies locally

    const DEATH_ANIMATION_DURATION = 1500; // match  animation length
    
    setLocalEnemies(prev => {
      const currentTime = Date.now();
      return prev.filter(enemy => {
        if (enemy.isDying && enemy.deathStartTime) {
          // Keep dying enemies until animation completes
          return currentTime - enemy.deathStartTime < DEATH_ANIMATION_DURATION;
        }
        return enemy.health > 0;
      });
    });
  }, [localEnemies, isInRoom]);

  useEffect(() => {
    // Capture the ref value when the effect runs
    const currentPlayerRef = playerRef.current;

    return () => {
      // Cleanup when scene unmounts
      setLocalEnemies([]);
      if (currentPlayerRef) {
        currentPlayerRef.clear();
      }
      // Reset any scene-specific state
      setPlayerPosition(new Vector3(0, 0, 0));
      totalSpawnedRef.current = initialSkeletons;
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

  // Track previous enemy states to detect deaths - moved outside useEffect
  const previousEnemyStates = useRef<Map<string, { health: number; position: Vector3 }>>(new Map());

  // Handle multiplayer enemy deaths for rune drops
  useEffect(() => {
    if (!isInRoom) return;

    const checkForEnemyDeaths = () => {
      // Get current alive enemy IDs for cleanup
      const aliveEnemyIds = new Set(Array.from(multiplayerEnemies.keys()));
      
      multiplayerEnemies.forEach((enemy) => {
        const previousState = previousEnemyStates.current.get(enemy.id);
        
        // If enemy just died (health went from > 0 to 0)
        if (previousState && previousState.health > 0 && enemy.health === 0) {
          // Check for rune drops
          const runeDrops = calculateRuneDrops(enemy.id, enemy.position);
          runeDrops.forEach(drop => {
            if (drop.runeType === 'critical') {
              addCriticalRune(drop.position);
            } else if (drop.runeType === 'critDamage') {
              addCritDamageRune(drop.position);
            }
          });
        }
        
        // Update previous state
        previousEnemyStates.current.set(enemy.id, {
          health: enemy.health,
          position: enemy.position.clone()
        });
      });
      
      // CRITICAL FIX: Clean up dead enemy states to prevent memory leaks
      for (const [enemyId] of previousEnemyStates.current) {
        if (!aliveEnemyIds.has(enemyId)) {
          previousEnemyStates.current.delete(enemyId);
        }
      }

      // ADDITIONAL CLEANUP: Remove old entries periodically to prevent buildup
      if (Math.random() < 0.1) { // 10% chance each check (every 2 seconds)
        for (const [enemyId, state] of previousEnemyStates.current) {
          // Clean up dead enemies that are no longer in the alive set
          if (state.health <= 0 && !aliveEnemyIds.has(enemyId)) {
            previousEnemyStates.current.delete(enemyId);
          }
        }
      }
    };

    checkForEnemyDeaths();
  }, [multiplayerEnemies, isInRoom, addCriticalRune, addCritDamageRune]);

  // Update cleanup
  const cleanup = useCallback(() => {
    setLocalEnemies(prev => {
      prev.forEach(removeEnemy);
      return [];
    });
    groupPool.clear();
    
    // CRITICAL: Clear all accumulated state Maps/Sets to prevent memory leaks
    previousEnemyStates.current.clear();
    setSlowedEnemies({});
    setStunnedEnemies({});
    setKnockbackEffects({});
    setFrozenEnemyIds([]);
    setSummonedUnits([]);
    
  }, [removeEnemy, groupPool]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Listen for game reset events to trigger cleanup
  useEffect(() => {
    const handleGameReset = () => {
      cleanup();
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => {
      window.removeEventListener('gameReset', handleGameReset);
    };
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

  // Update health sync - use prop health directly
  useEffect(() => {
    if (isInRoom) {
      updatePlayerHealth(unitProps.health);
    }
  }, [unitProps.health, isInRoom, updatePlayerHealth]);

  return (
    <>
      <group>
        <CustomSky level={currentLevel} />
        <Planet />
        <Terrain />
        <InstancedVegetation />
        <DetailedTrees trees={treeData} />
        <InstancedMountains mountains={mountainData} />
        <InstancedMushrooms mushrooms={mushroomData} />
        {/* Central Pedestal */}
        <Pedestal position={[0, 0, 0]} scale={0.4} level={currentLevel} />
        {/* Three pillars in triangle formation */}
        <Pillar position={[0, 0, -5]} level={currentLevel} />
        <Pillar position={[-4.25, 0, 2.5]} level={currentLevel} />
        <Pillar position={[4.25, 0, 2.5]} level={currentLevel} />
        <group ref={playerRef}>
          <Unit {...unitComponentProps} />
        </group>

        {/* Render other multiplayer players */}
        {isInRoom && Array.from(players.values()).map(player => (
          player.id !== playerId && (
            <MultiplayerPlayer
              key={player.id}
              player={player}
              isLocalPlayer={false}
            />
          )
        ))}

        {enemies.map((enemy) => {
          // Use multiplayer enemy component for multiplayer mode
          if (isInRoom) {
            // Find the actual multiplayer enemy data
            const multiplayerEnemy = Array.from(multiplayerEnemies.values()).find(e => e.id === enemy.id);
            if (multiplayerEnemy) {
              return (
                <MultiplayerEnemyUnit
                  key={enemy.id}
                  enemy={multiplayerEnemy}
                  weaponType={unitProps.currentWeapon}
                />
              );
            }
            return null;
          }

          // Use local enemy components for single player mode
          // Get all players info for aggro system
          const allPlayersInfo = getAllPlayersInfo();

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
                allPlayers={allPlayersInfo}
                summonedUnits={summonedUnits.filter((unit): unit is SummonedUnitInfo => unit.type === 'elemental')}
                onAttackPlayer={handlePlayerDamage}
                onAttackSummonedUnit={handleSummonedUnitDamage}
                weaponType={unitProps.currentWeapon}
                isFrozen={handleFreezeStateCheck(`enemy-${enemy.id}`)}
                isStunned={handleStunStateCheck(enemy.id)}
                isSlowed={handleSlowStateCheck(`enemy-${enemy.id}`)}
                knockbackEffect={getKnockbackEffect(enemy.id)}
              />
            );
          }
          if (enemy.type === 'mage') {
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
                allPlayers={allPlayersInfo}
                summonedUnits={summonedUnits.filter((unit): unit is SummonedUnitInfo => unit.type === 'elemental')}
                onAttackPlayer={handlePlayerDamage}
                onAttackSummonedUnit={handleSummonedUnitDamage}
                weaponType={unitProps.currentWeapon}
                isFrozen={handleFreezeStateCheck(`enemy-${enemy.id}`)}
                isStunned={handleStunStateCheck(enemy.id)}
                isSlowed={handleSlowStateCheck(`enemy-${enemy.id}`)}
                knockbackEffect={getKnockbackEffect(enemy.id)}
                level={currentLevel}
                playerStunRef={playerStunRef}
                getCurrentPlayerPosition={getCurrentPlayerPosition}
              />
            );
          } else if (enemy.type === 'reaper') {
            return (
              <ReaperUnit
                key={enemy.id}
                id={enemy.id}
                initialPosition={enemy.initialPosition}
                position={enemy.position}
                health={enemy.health}
                maxHealth={enemy.maxHealth}
                onTakeDamage={handleTakeDamage}
                onPositionUpdate={handleEnemyPositionUpdate}
                playerPosition={playerPosition}
                allPlayers={allPlayersInfo}
                summonedUnits={summonedUnits.filter((unit): unit is SummonedUnitInfo => unit.type === 'elemental')}
                onAttackPlayer={handlePlayerDamage}
                onAttackSummonedUnit={handleSummonedUnitDamage}
                weaponType={unitProps.currentWeapon}
                isFrozen={handleFreezeStateCheck(`enemy-${enemy.id}`)}
                isStunned={handleStunStateCheck(enemy.id)}
                isSlowed={handleSlowStateCheck(`enemy-${enemy.id}`)}
                knockbackEffect={getKnockbackEffect(enemy.id)}
              />
            );
          } else if (enemy.type === 'fallen-titan') {
            return (
              <FallenTitanUnit
                key={enemy.id}
                id={enemy.id}
                initialPosition={enemy.initialPosition}
                position={enemy.position}
                health={enemy.health}
                maxHealth={enemy.maxHealth}
                onTakeDamage={handleTakeDamage}
                onPositionUpdate={handleEnemyPositionUpdate}
                playerPosition={playerPosition}
                allPlayers={allPlayersInfo}
                summonedUnits={summonedUnits.filter((unit): unit is SummonedUnitInfo => unit.type === 'elemental')}
                onAttackPlayer={handlePlayerDamage}
                onAttackSummonedUnit={handleSummonedUnitDamage}
                weaponType={unitProps.currentWeapon}
                isFrozen={handleFreezeStateCheck(`fallen-titan-${enemy.id}`)}
                isStunned={handleStunStateCheck(enemy.id)}
                isSlowed={handleSlowStateCheck(`fallen-titan-${enemy.id}`)}
                knockbackEffect={getKnockbackEffect(enemy.id)}
              />
            );
          } else if (enemy.type === 'ascendant') {
            return (
              <AscendantUnit
                key={enemy.id}
                id={enemy.id}
                initialPosition={enemy.initialPosition}
                position={enemy.position}
                health={enemy.health}
                maxHealth={enemy.maxHealth}
                onTakeDamage={handleTakeDamage}
                onPositionUpdate={handleEnemyPositionUpdate}
                playerPosition={playerPosition}
                allPlayers={allPlayersInfo}
                summonedUnits={summonedUnits.filter((unit): unit is SummonedUnitInfo => unit.type === 'elemental')}
                onAttackPlayer={handlePlayerDamage}
                onAttackSummonedUnit={handleSummonedUnitDamage}
                weaponType={unitProps.currentWeapon}
                isFrozen={handleFreezeStateCheck(`enemy-${enemy.id}`)}
                isStunned={handleStunStateCheck(enemy.id)}
                isSlowed={handleSlowStateCheck(`enemy-${enemy.id}`)}
                knockbackEffect={getKnockbackEffect(enemy.id)}
              />
            );
          } else if (enemy.type === 'death-knight') {
            return (
              <DeathKnightUnit
                key={enemy.id}
                id={enemy.id}
                initialPosition={enemy.initialPosition}
                position={enemy.position}
                health={enemy.health}
                maxHealth={enemy.maxHealth}
                onTakeDamage={handleTakeDamage}
                onPositionUpdate={handleEnemyPositionUpdate}
                playerPosition={playerPosition}
                allPlayers={allPlayersInfo}
                summonedUnits={summonedUnits.filter((unit): unit is SummonedUnitInfo => unit.type === 'elemental')}
                onAttackPlayer={handlePlayerDamage}
                onAttackSummonedUnit={handleSummonedUnitDamage}
                weaponType={unitProps.currentWeapon}
                isFrozen={handleFreezeStateCheck(`enemy-${enemy.id}`)}
                isStunned={handleStunStateCheck(enemy.id)}
                isSlowed={handleSlowStateCheck(`enemy-${enemy.id}`)}
                knockbackEffect={getKnockbackEffect(enemy.id)}
                playerRef={playerRef}
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
              isDying={enemy.isDying}
              onTakeDamage={handleTakeDamage}
              onPositionUpdate={handleEnemyPositionUpdate}
              playerPosition={playerPosition}
              allPlayers={allPlayersInfo}
              summonedUnits={summonedUnits.filter((unit): unit is SummonedUnitInfo => unit.type === 'elemental')}
              onAttackPlayer={handlePlayerDamage}
              onAttackSummonedUnit={handleSummonedUnitDamage}
              weaponType={unitProps.currentWeapon}
              isFrozen={handleFreezeStateCheck(`enemy-${enemy.id}`)}
              isStunned={handleStunStateCheck(enemy.id)}
              knockbackEffect={getKnockbackEffect(enemy.id)}
            />
          );
        })}
      </group>

      {/* Render summoned units */}
      <group>
        {summonedUnits.map((unit) => {
          if (unit.type === 'abyssal-abomination') {
            return (
              <AbyssalAbominationSummon
                key={unit.id}
                id={unit.id}
                position={unit.position}
                health={unit.health}
                maxHealth={unit.maxHealth}
                damage={16} // Default damage for AbyssalAbomination
                enemyData={unitComponentProps.enemyData}
                playerPosition={playerPosition}
                onDamage={(targetId: string, damage: number) => {
                  // Handle damage to enemies from summoned unit
                  handleTakeDamage(targetId, damage);
                }}
                onDeath={(abominationId: string) => {
                  // Remove the abomination from summoned units
                  setSummonedUnits(prev => prev.filter(u => u.id !== abominationId));
                }}
                onTakeDamage={(id: string, damage: number) => {
                  // Handle damage to the summoned unit
                  setSummonedUnits(prev => prev.map(u => {
                    if (u.id === id) {
                      const newHealth = Math.max(0, u.health - damage);
                      return { ...u, health: newHealth };
                    }
                    return u;
                  }));
                }}
                setDamageNumbers={setDamageNumbers}
                nextDamageNumberId={nextDamageNumberId}
              />
            );
          } else if (unit.type === 'skeleton') {
            // TODO: Implement Skeleton rendering - needs proper summoned unit component
            return null;
          } else if (unit.type === 'elemental') {
            // TODO: Implement Elemental rendering - requires more complex props
            return null;
          }
          return null;
        })}
      </group>

      {/* Render Critical Runes */}
      <group>
        {criticalRunes.map((rune) => (
          <CriticalRune
            key={rune.id}
            position={rune.position}
            playerPosition={playerPosition}
            onPickup={() => pickupCriticalRune(rune.id)}
          />
        ))}
      </group>
      
      {/* Render Critical Damage Runes */}
      <group>
        {critDamageRunes.map((rune) => (
          <CritDamageRune
            key={rune.id}
            position={rune.position}
            playerPosition={playerPosition}
            onPickup={() => pickupCritDamageRune(rune.id)}
          />
        ))}
      </group>
    </>
  );
}