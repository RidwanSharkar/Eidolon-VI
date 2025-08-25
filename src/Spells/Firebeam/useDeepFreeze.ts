import { useState, useRef, useCallback, useEffect } from 'react';
import { Vector3 } from 'three';
import { WeaponSubclass } from '../../Weapons/weapons';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

export interface FreezeStack {
  enemyId: string;
  stackCount: number;
  lastStackTime: number;
}

export interface FrozenEnemy {
  enemyId: string;
  freezeStartTime: number;
  freezeDuration: number; // 4 seconds = 4000ms
}

interface UseDeepFreezeProps {
  currentSubclass?: WeaponSubclass;
  setActiveEffects?: (callback: (prev: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    enemyId?: string;
  }>) => Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    enemyId?: string;
  }>) => void;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
    isDying?: boolean;
  }>;
  level?: number; // Add level prop to check if Deep Freeze should be active
  // Multiplayer props
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
}

const STACK_THRESHOLD = 3; // Every 3 Firebeam hits adds a stack
const FREEZE_STACK_REQUIREMENT = 2; // 2 stacks to freeze (matches weapon description)
const FREEZE_DURATION = 4000; // 4 seconds
const STACK_DECAY_TIME = 10000; // 10 seconds - stacks decay if no new damage

export function useDeepFreeze({
  currentSubclass,
  setActiveEffects,
  enemyData,
  level = 1,
  // Multiplayer props
  sendEffect,
  isInRoom = false,
  isPlayer = false
}: UseDeepFreezeProps) {
  const [freezeStacks, setFreezeStacks] = useState<Map<string, FreezeStack>>(new Map());
  const [frozenEnemies, setFrozenEnemies] = useState<Map<string, FrozenEnemy>>(new Map());
  const firebeamHitCount = useRef<Map<string, number>>(new Map()); // Track hits per enemy

  // Check if Deep Freeze is unlocked (Frost subclass passive at level 3+)
  const isDeepFreezeActive = currentSubclass === WeaponSubclass.FROST && level >= 3;

  // Clean up stacks and frozen enemies when enemies die
  useEffect(() => {
    const aliveEnemyIds = new Set(enemyData.filter(enemy => enemy.health > 0 && !enemy.isDying).map(enemy => enemy.id));
    
    setFreezeStacks(prevStacks => {
      const newStacks = new Map(prevStacks);
      for (const enemyId of newStacks.keys()) {
        if (!aliveEnemyIds.has(enemyId)) {
          newStacks.delete(enemyId);
        }
      }
      return newStacks;
    });

    setFrozenEnemies(prevFrozen => {
      const newFrozen = new Map(prevFrozen);
      let hasDeadFrozenEnemies = false;
      for (const enemyId of newFrozen.keys()) {
        if (!aliveEnemyIds.has(enemyId)) {
          newFrozen.delete(enemyId);
          hasDeadFrozenEnemies = true;

        }
      }
      
      // Remove visual effects for dead frozen enemies
      if (hasDeadFrozenEnemies && setActiveEffects) {
        setActiveEffects(prev => 
          prev.filter(effect => 
            effect.type !== 'deepFreeze' || 
            !effect.enemyId || 
            aliveEnemyIds.has(effect.enemyId)
          )
        );
      }
      
      return newFrozen;
    });

    // Also clean up hit count tracker
    const currentHitCount = firebeamHitCount.current;
    for (const enemyId of currentHitCount.keys()) {
      if (!aliveEnemyIds.has(enemyId)) {
        currentHitCount.delete(enemyId);
      }
    }
  }, [enemyData, setActiveEffects]);

  // Freeze an enemy
  const freezeEnemy = useCallback((enemyId: string, enemyPosition: Vector3, startTime: number) => {

    
    setFrozenEnemies(prevFrozen => {
      const newFrozen = new Map(prevFrozen);
      newFrozen.set(enemyId, {
        enemyId,
        freezeStartTime: startTime,
        freezeDuration: FREEZE_DURATION
      });
      return newFrozen;
    });

    // Create visual freeze effect
    if (setActiveEffects) {
      // Get the most current enemy position from enemyData to avoid positioning behind enemy
      const currentEnemy = enemyData.find(enemy => enemy.id === enemyId);
      const currentPosition = currentEnemy ? currentEnemy.position.clone() : enemyPosition.clone();
      
      const freezePosition = currentPosition;
      freezePosition.y += 1;
      
      const effectId = Date.now() + Math.random(); // Ensure unique ID
      
      setActiveEffects(prev => [...prev, {
        id: effectId,
        type: 'deepFreeze',
        position: freezePosition,
        direction: new Vector3(0, 0, 0),
        duration: FREEZE_DURATION,
        startTime: startTime,
        enemyId: enemyId
      }]);

      // Send deep freeze effect to other players in multiplayer
      if (isInRoom && isPlayer && sendEffect) {
        sendEffect({
          type: 'deepFreeze',
          position: freezePosition.clone(),
          direction: new Vector3(0, 0, 0),
          duration: FREEZE_DURATION,
          weaponType: 'sabres',
          subclass: 'frost'
        });
      }
    }

    // Note: Cleanup is handled by the isEnemyFrozen check and death cleanup
    // No setTimeout needed here to avoid conflicts
  }, [setActiveEffects, enemyData, isInRoom, isPlayer, sendEffect]);

  // Handle Firebeam hit - this is called every time Firebeam damages an enemy
  const handleFirebeamHit = useCallback((enemyId: string, enemyPosition: Vector3) => {
    if (!isDeepFreezeActive) return;

    // Don't stack on already frozen enemies
    if (frozenEnemies.has(enemyId)) return;

    const currentTime = Date.now();
    const currentHitCount = firebeamHitCount.current.get(enemyId) || 0;
    const newHitCount = currentHitCount + 1;
    
    firebeamHitCount.current.set(enemyId, newHitCount);

    // Every 3 hits, add a freeze stack
    if (newHitCount % STACK_THRESHOLD === 0) {
      setFreezeStacks(prevStacks => {
        const newStacks = new Map(prevStacks);
        const currentStack = newStacks.get(enemyId);
        const newStackCount = (currentStack?.stackCount || 0) + 1;

        newStacks.set(enemyId, {
          enemyId,
          stackCount: newStackCount,
          lastStackTime: currentTime
        });

        // Check if enemy should be frozen (3 stacks)
        if (newStackCount >= FREEZE_STACK_REQUIREMENT) {

          freezeEnemy(enemyId, enemyPosition, currentTime);
          // Remove stacks after freezing
          newStacks.delete(enemyId);
          firebeamHitCount.current.delete(enemyId);
        } else {

        }

        return newStacks;
      });
    }
  }, [freezeEnemy, frozenEnemies, isDeepFreezeActive]);

  // Check if an enemy is currently frozen
  const isEnemyFrozen = useCallback((enemyId: string): boolean => {
    const frozenData = frozenEnemies.get(enemyId);
    if (!frozenData) return false;

    const currentTime = Date.now();
    const elapsedTime = currentTime - frozenData.freezeStartTime;
    
    if (elapsedTime >= frozenData.freezeDuration) {
      // Clean up expired freeze and reset stacks
      setFrozenEnemies(prevFrozen => {
        const newFrozen = new Map(prevFrozen);
        newFrozen.delete(enemyId);
        return newFrozen;
      });
      
      // Reset freeze stacks and hit count for this enemy
      setFreezeStacks(prevStacks => {
        const newStacks = new Map(prevStacks);
        newStacks.delete(enemyId);
        return newStacks;
      });
      firebeamHitCount.current.delete(enemyId);
      
      // Remove visual effect for this expired freeze
      if (setActiveEffects) {
        setActiveEffects(prev => prev.filter(effect => 
          effect.type !== 'deepFreeze' || effect.enemyId !== enemyId
        ));
      }
      

      return false;
    }

    return true;
  }, [frozenEnemies, setActiveEffects]);

  // Get the multiplier for Glacial Shard damage (2x when frozen)
  const getGlacialShardDamageMultiplier = useCallback((enemyId: string): number => {
    return isEnemyFrozen(enemyId) ? 2 : 1;
  }, [isEnemyFrozen]);

  // Get freeze stack count for an enemy
  const getEnemyFreezeStacks = useCallback((enemyId: string): number => {
    return freezeStacks.get(enemyId)?.stackCount || 0;
  }, [freezeStacks]);

  // Clean up expired stacks and frozen states periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      
      // Clean up expired freeze stacks
      setFreezeStacks(prevStacks => {
        const newStacks = new Map(prevStacks);
        let hasChanges = false;
        
        for (const [enemyId, stackData] of newStacks) {
          if (currentTime - stackData.lastStackTime > STACK_DECAY_TIME) {
            newStacks.delete(enemyId);
            firebeamHitCount.current.delete(enemyId);
            hasChanges = true;
          }
        }
        
        return hasChanges ? newStacks : prevStacks;
      });

      // Clean up expired frozen enemies and their visual effects
      setFrozenEnemies(prevFrozen => {
        const newFrozen = new Map(prevFrozen);
        let hasExpiredFreezes = false;
        const expiredEnemyIds: string[] = [];
        
        for (const [enemyId, frozenData] of newFrozen) {
          const elapsedTime = currentTime - frozenData.freezeStartTime;
          if (elapsedTime >= frozenData.freezeDuration) {
            newFrozen.delete(enemyId);
            expiredEnemyIds.push(enemyId);
            hasExpiredFreezes = true;
          }
        }
        
        // Remove visual effects for expired freezes
        if (hasExpiredFreezes && setActiveEffects) {
          setActiveEffects(prev => prev.filter(effect => 
            effect.type !== 'deepFreeze' || 
            !effect.enemyId || 
            !expiredEnemyIds.includes(effect.enemyId)
          ));
        }
        
        return hasExpiredFreezes ? newFrozen : prevFrozen;
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [setActiveEffects]);

  // Get all frozen enemy IDs for easier access
  const getFrozenEnemyIds = useCallback((): string[] => {
    const currentTime = Date.now();
    const frozenIds: string[] = [];
    
    frozenEnemies.forEach((frozenData, enemyId) => {
      const elapsedTime = currentTime - frozenData.freezeStartTime;
      if (elapsedTime < frozenData.freezeDuration) {
        frozenIds.push(enemyId);
      }
    });
    
    return frozenIds;
  }, [frozenEnemies]);

  return {
    handleFirebeamHit,
    isEnemyFrozen,
    getGlacialShardDamageMultiplier,
    getEnemyFreezeStacks,
    getFrozenEnemyIds,
    freezeStacks: Array.from(freezeStacks.values()),
    frozenEnemies: Array.from(frozenEnemies.values()),
    isDeepFreezeActive
  };
}