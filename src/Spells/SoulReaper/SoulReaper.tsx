import React, { useRef, useCallback, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Group, Vector3 } from 'three';
import { Enemy } from '@/Versus/enemy';
import SoulReaperMark from '@/Spells/SoulReaper/SoulReaperMark';
import SoulReaperSword from '@/Spells/SoulReaper/SoulReaperSword';
import AbysalSkeletonSummon from '@/Spells/SoulReaper/AbysalSkeletonSummon';
import { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

interface SoulReaperProps {
  parentRef: React.RefObject<Group>;
  enemyData: Enemy[];
  onDamage: (targetId: string, damage: number, position?: Vector3) => void;
  onTakeDamage: (id: string, damage: number) => void;
  setDamageNumbers: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isSoulReaper?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isSoulReaper?: boolean;
  }>) => void;
  nextDamageNumberId: React.MutableRefObject<number>;
  onSkeletonCountChange?: (count: number) => void;
  onSkeletonUpdate?: (skeletons: Array<{
    id: string;
    position: Vector3;
    health: number;
    maxHealth: number;
  }>) => void;
  charges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;
  level?: number;
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
}

interface SoulReaperState {
  targetId: string | null;
  targetPosition: Vector3 | null;
  isMarked: boolean;
  markStartTime: number | null;
  swordDropping: boolean;
  swordVisible: boolean; // Track if sword should be visible
  skeletonSummons: Array<{
    id: string;
    position: Vector3;
    health: number;
    maxHealth: number;
  }>;
  chainTargets: Array<{
    id: string;
    position: Vector3;
    isMarked: boolean;
    markStartTime: number;
    isDropping: boolean;
    swordVisible: boolean; // Track if chain sword should be visible
    generation: number; // Track chain generation to prevent infinite loops
  }>;
}

export interface SoulReaperRef {
  castSoulReaper: () => boolean;
  getSkeletonCount: () => number;
}

const SoulReaper = forwardRef<SoulReaperRef, SoulReaperProps>(({
  parentRef,
  enemyData,
  onDamage,
  onTakeDamage,
  setDamageNumbers,
  nextDamageNumberId,
  onSkeletonCountChange,
  onSkeletonUpdate,
  charges,
  setCharges,
  level = 1,
  sendEffect,
  isInRoom,
  isPlayer,
}, ref) => {
  const [state, setState] = useState<SoulReaperState>({
    targetId: null,
    targetPosition: null,
    isMarked: false,
    markStartTime: null,
    swordDropping: false,
    swordVisible: false,
    skeletonSummons: [],
    chainTargets: []
  });

  const constants = useRef({
    MARK_DURATION: 2000, // 2 seconds
    COOLDOWN: 5000, // 6 seconds
    MAX_SKELETONS: 1, // Only 1 skeleton at a time
    SKELETON_HEALTH: 56,
    SKELETON_DAMAGE: 48,
    TARGETING_RANGE: 15,
    CHAIN_RANGE: 5, // Range for chain reaction
    MAX_CHAIN_TARGETS: 2, // Number of enemies to chain to per kill
    MAX_CHAIN_GENERATIONS: 1 // Prevent infinite loops
  }).current;

  // Level-based damage calculation
  const getDamageForLevel = useCallback((currentLevel: number): number => {
    switch (currentLevel) {
      case 1: return 275;
      case 2: return 325;
      case 3: return 375;
      case 4: return 425;
      case 5: return 475;
      default: return 275;
    }
  }, []);

  const [lastCastTime, setLastCastTime] = useState(0);

  // Consume 2 orb charges (similar to Oathstrike)
  const consumeCharges = useCallback(() => {
    // Find two available charges
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length < 2) {
      return false;
    }

    // Consume two charges
    setCharges(prev => prev.map((charge, index) => {
      if (
        index === availableCharges[0].id - 1 || 
        index === availableCharges[1].id - 1
      ) {
        return {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        };
      }
      return charge;
    }));

    // Start cooldown recovery for each charge individually
    for (let i = 0; i < 2; i++) {
      if (availableCharges[i].id) {
        setTimeout(() => {
          setCharges(prev => prev.map((c, index) => 
            index === availableCharges[i].id - 1
              ? { ...c, available: true, cooldownStartTime: null }
              : c
          ));
        }, ORBITAL_COOLDOWN);
      }
    }

    return true;
  }, [charges, setCharges]);

  // Find nearest enemy for targeting
  const findNearestEnemy = useCallback((): Enemy | null => {
    if (!parentRef.current) return null;

    const playerPosition = parentRef.current.position;
    let closestEnemy: Enemy | null = null;
    let closestDistance = constants.TARGETING_RANGE;

    for (const enemy of enemyData) {
      if (enemy.health <= 0 || enemy.isDying || enemy.deathStartTime) continue;
      
      const distance = playerPosition.distanceTo(enemy.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    return closestEnemy;
  }, [parentRef, enemyData, constants.TARGETING_RANGE]);

  // Find nearby enemies for chain reaction
  const findNearbyEnemies = useCallback((centerPosition: Vector3, excludeIds: string[] = []): Enemy[] => {
    const nearbyEnemies: Enemy[] = [];
    
    for (const enemy of enemyData) {
      if (enemy.health <= 0 || enemy.isDying || enemy.deathStartTime) continue;
      if (excludeIds.includes(enemy.id)) continue;
      
      // Check if enemy is already marked or being targeted
      const isAlreadyTargeted = state.chainTargets.some(target => target.id === enemy.id) || 
                               (state.targetId === enemy.id);
      if (isAlreadyTargeted) continue;
      
      const distance = centerPosition.distanceTo(enemy.position);
      if (distance <= constants.CHAIN_RANGE) {
        nearbyEnemies.push(enemy);
      }
    }
    
    // Sort by distance and return up to MAX_CHAIN_TARGETS
    nearbyEnemies.sort((a, b) => {
      const distA = centerPosition.distanceTo(a.position);
      const distB = centerPosition.distanceTo(b.position);
      return distA - distB;
    });
    
    return nearbyEnemies.slice(0, constants.MAX_CHAIN_TARGETS);
  }, [enemyData, constants.CHAIN_RANGE, constants.MAX_CHAIN_TARGETS, state.chainTargets, state.targetId]);

  // Trigger chain reaction
  const triggerChainReaction = useCallback((killPosition: Vector3, generation: number = 1) => {
    if (generation > constants.MAX_CHAIN_GENERATIONS) {

      return;
    }
    
    const nearbyEnemies = findNearbyEnemies(killPosition, []);
    if (nearbyEnemies.length === 0) {

      return;
    }
    
    // Additional validation: only chain to enemies that are still alive
    const validNearbyEnemies = nearbyEnemies.filter(enemy => 
      enemy.health > 0 && !enemy.isDying && !enemy.deathStartTime
    );
    
    if (validNearbyEnemies.length === 0) {

      return;
    }
    

    
    const now = Date.now();
    const newChainTargets = validNearbyEnemies.map(enemy => ({
      id: enemy.id,
      position: enemy.position.clone(),
      isMarked: true,
      markStartTime: now,
      isDropping: false,
      swordVisible: true, // Show sword immediately for chain targets
      generation
    }));
    
    setState(prev => ({
      ...prev,
      chainTargets: [...prev.chainTargets, ...newChainTargets]
    }));
    
    // Schedule damage for chain targets
    newChainTargets.forEach(target => {
      // Apply damage after mark duration
      setTimeout(() => {
        const chainTarget = enemyData.find(enemy => enemy.id === target.id);
        
        // Check if target is still alive - if not, don't spread and just clean up
        if (!chainTarget || chainTarget.health <= 0 || chainTarget.isDying || chainTarget.deathStartTime) {

          // Remove chain target without spreading
          setState(prev => ({
            ...prev,
            chainTargets: prev.chainTargets.filter(ct => ct.id !== target.id)
          }));
          return;
        }


        
        // Store pre-damage health to check for kill
        const preImpactHealth = chainTarget.health;
        const currentPosition = chainTarget.position.clone();
        
        // Calculate level-based damage
        const damage = getDamageForLevel(level);
        
        // Deal damage
        onDamage(target.id, damage, currentPosition);
        
        // Add damage number
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: damage,
          position: currentPosition.clone().add(new Vector3(0, 1, 0)),
          isCritical: false,
          isSoulReaper: true
        }]);
        
        // Check if enemy will be killed by this damage
        const willBeKilled = preImpactHealth <= damage;
        
        if (willBeKilled) {
          // Trigger another chain reaction
          triggerChainReaction(currentPosition, target.generation + 1);
          
          // Only summon skeleton if none exists on the map
          setState(prev => {
            let newSummons = prev.skeletonSummons;
            
            // Only create new skeleton if we don't have one already
            if (prev.skeletonSummons.length === 0) {
              newSummons = [{
                id: `skeleton-${Date.now()}-${Math.random()}`,
                position: currentPosition,
                health: constants.SKELETON_HEALTH,
                maxHealth: constants.SKELETON_HEALTH
              }];
              
              // Notify about skeleton count change
              onSkeletonCountChange?.(newSummons.length);
              
              // Report skeleton updates to parent
              onSkeletonUpdate?.(newSummons);
              

            } else {

            }

            const newState = {
              ...prev,
              skeletonSummons: newSummons,
              chainTargets: prev.chainTargets.filter(ct => ct.id !== target.id)
            };
            
            return newState;
          });
        } else {
          // Remove chain target if no kill
          setState(prev => ({
            ...prev,
            chainTargets: prev.chainTargets.filter(ct => ct.id !== target.id)
          }));
        }
      }, constants.MARK_DURATION);
      
      // Start sword dropping animation 0.5 seconds before damage to sync animation
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          chainTargets: prev.chainTargets.map(ct => 
            ct.id === target.id 
              ? { ...ct, isMarked: false, isDropping: true }
              : ct
          )
        }));
      }, constants.MARK_DURATION - 500); // Start sword drop 0.5 seconds before damage
    });
  }, [getDamageForLevel, level, constants.MAX_CHAIN_GENERATIONS, constants.MARK_DURATION, constants.SKELETON_HEALTH, enemyData, findNearbyEnemies, onDamage, onSkeletonCountChange, onSkeletonUpdate, setDamageNumbers, nextDamageNumberId]);

  // Cast SoulReaper ability
  const castSoulReaper = useCallback((): boolean => {
    const now = Date.now();
    
    // Check cooldown
    if (now - lastCastTime < constants.COOLDOWN) {

      return false;
    }
    
    // Don't cast if already marked or sword dropping
    if (state.isMarked || state.swordDropping) return false;

    // Check if we have enough orb charges
    if (!consumeCharges()) {

      return false;
    }

    const target = findNearestEnemy();
    if (!target) {

      return false;
    }

    const markStartTime = now;
    setLastCastTime(now);

    // Send SoulReaper effect to other players in multiplayer
    if (isInRoom && isPlayer && sendEffect && parentRef.current) {
      sendEffect({
        type: 'soulReaper',
        position: target.position.clone(),
        direction: new Vector3(0, 1, 0), // Upward direction for mark
        duration: constants.MARK_DURATION, // 2 seconds duration
        markDuration: constants.MARK_DURATION,
        weaponType: 'scythe',
        subclass: 'abyssal'
      });
    }

    setState(prev => ({
      ...prev,
      targetId: target.id,
      targetPosition: target.position.clone(),
      isMarked: true,
      markStartTime,
      swordVisible: true // Show sword immediately when mark is created
    }));

    return true;
  }, [ constants.MARK_DURATION, state.isMarked, state.swordDropping, findNearestEnemy, lastCastTime, constants.COOLDOWN, consumeCharges, isInRoom, isPlayer, sendEffect, parentRef]);

  // Clean up invalid chain targets (only those that are sword dropping)
  useEffect(() => {
    setState(prev => {
      // Only clean up chain targets that are in sword dropping state and have invalid enemies
      const validChainTargets = prev.chainTargets.filter(ct => {
        // If still marked, keep it (damage timer will handle cleanup)
        if (ct.isMarked) return true;
        
        // If sword dropping, check if enemy is still valid
        if (ct.isDropping) {
          const enemy = enemyData.find(e => e.id === ct.id);
          const isValid = enemy && enemy.health > 0 && !enemy.isDying && !enemy.deathStartTime;
          if (!isValid) {

          }
          return isValid;
        }
        
        return true;
      });
      
      // Clean up main target sword dropping state if enemy is invalid
      let newSwordDropping = prev.swordDropping;
      if (prev.swordDropping && prev.targetId) {
        const mainTarget = enemyData.find(e => e.id === prev.targetId);
        if (!mainTarget || mainTarget.health <= 0 || mainTarget.isDying || mainTarget.deathStartTime) {

          newSwordDropping = false;
        }
      }
      
      // Only update if there are changes
      if (validChainTargets.length !== prev.chainTargets.length || newSwordDropping !== prev.swordDropping) {
        return {
          ...prev,
          chainTargets: validChainTargets,
          swordDropping: newSwordDropping
        };
      }
      
      return prev;
    });
  }, [enemyData]);

  // Handle damage application after mark duration (independent of sword animation)
  useEffect(() => {
    if (!state.isMarked || !state.markStartTime || !state.targetId) return;



    // Capture current data to avoid dependency issues
    const currentEnemyData = [...enemyData];
    const currentTargetId = state.targetId;
    const currentOnDamage = onDamage;
    const currentSetDamageNumbers = setDamageNumbers;
    const currentNextDamageNumberId = nextDamageNumberId;
    const currentTriggerChainReaction = triggerChainReaction;
    const currentOnSkeletonCountChange = onSkeletonCountChange;
    const currentOnSkeletonUpdate = onSkeletonUpdate;

    const damageTimer = setTimeout(() => {
      // Apply damage immediately after mark duration
      const target = currentEnemyData.find(enemy => enemy.id === currentTargetId);
      
      // Check if target is still alive - if not, don't spread and just clean up
      if (!target || target.health <= 0 || target.isDying || target.deathStartTime) {

        // Clean up state without spreading
        setState(prev => ({
          ...prev,
          isMarked: false,
          targetId: null,
          targetPosition: null,
          markStartTime: null,
          swordVisible: false,
          swordDropping: false // Reset sword dropping state
        }));
        return;
      }


      
      // Store pre-damage health to check for kill
      const preImpactHealth = target.health;
      const currentPosition = target.position.clone();
      
      // Calculate level-based damage
      const damage = getDamageForLevel(level);
      
      // Deal damage
      currentOnDamage(currentTargetId, damage, currentPosition);
      
      // Add damage number
      currentSetDamageNumbers(prev => [...prev, {
        id: currentNextDamageNumberId.current++,
        damage: damage,
        position: currentPosition.clone().add(new Vector3(0, 1, 0)),
        isCritical: false,
        isSoulReaper: true
      }]);
      
      // Check if enemy will be killed by this damage
      const willBeKilled = preImpactHealth <= damage;
      
      if (willBeKilled) {
                  // Trigger chain reaction
          currentTriggerChainReaction(currentPosition, 1);
        
        // Only summon skeleton if none exists on the map
        setState(prev => {
          let newSummons = prev.skeletonSummons;
          
          // Only create new skeleton if we don't have one already
          if (prev.skeletonSummons.length === 0) {
            newSummons = [{
              id: `skeleton-${Date.now()}`,
              position: currentPosition,
              health: constants.SKELETON_HEALTH,
              maxHealth: constants.SKELETON_HEALTH
            }];
            
            // Notify about skeleton count change
            currentOnSkeletonCountChange?.(newSummons.length);
            
            // Report skeleton updates to parent
            currentOnSkeletonUpdate?.(newSummons);
            

          } else {

          }

          const newState = {
            ...prev,
            skeletonSummons: newSummons,
            isMarked: false,
            targetId: null,
            targetPosition: null,
            markStartTime: null,
            swordVisible: false,
            swordDropping: false // Reset sword dropping state
          };
          
          return newState;
        });
      } else {
        // Reset state if no kill
        setState(prev => ({
          ...prev,
          isMarked: false,
          targetId: null,
          targetPosition: null,
          markStartTime: null,
          swordVisible: false,
          swordDropping: false // Reset sword dropping state
        }));
      }
    }, constants.MARK_DURATION);

    // Start sword dropping animation 0.5 seconds before damage to sync animation
    const swordTimer = setTimeout(() => {
      // Only start sword drop if we still have a valid target position
      setState(prev => {
        if (prev.targetId || prev.targetPosition) {
          return {
            ...prev,
            swordDropping: true
          };
        }
        return prev;
      });
    }, constants.MARK_DURATION - 500); // Start sword drop 0.5 seconds before damage

    return () => {
      clearTimeout(damageTimer);
      clearTimeout(swordTimer);
    };
  }, [state.isMarked, state.markStartTime, state.targetId, constants.MARK_DURATION, getDamageForLevel, level, constants.MAX_SKELETONS, constants.SKELETON_HEALTH]); // eslint-disable-line react-hooks/exhaustive-deps -- callbacks and enemyData intentionally excluded to prevent infinite loop

  // Handle sword impact for main target (visual effect only)
  const handleSwordImpact = useCallback(() => {

    // Just reset the sword dropping state - damage was already applied
    setState(prev => ({
      ...prev,
      swordDropping: false,
      swordVisible: false
    }));
  }, []);

  // Handle chain sword impact (visual effect only)
  const handleChainSwordImpact = useCallback((chainTargetId: string) => {

    // Just remove the chain target from dropping state - damage was already applied
    setState(prev => ({
      ...prev,
      chainTargets: prev.chainTargets.filter(ct => ct.id !== chainTargetId)
    }));
  }, []);

  // Handle skeleton death
  const handleSkeletonDeath = useCallback((skeletonId: string) => {
    setState(prev => {
      const newSummons = prev.skeletonSummons.filter(skeleton => skeleton.id !== skeletonId);
      
      // Notify about skeleton count change
      onSkeletonCountChange?.(newSummons.length);
      
      // Report skeleton updates to parent
      onSkeletonUpdate?.(newSummons);
      
      return {
        ...prev,
        skeletonSummons: newSummons
      };
    });
  }, [onSkeletonCountChange, onSkeletonUpdate]);

  // Get current skeleton count
  const getSkeletonCount = useCallback(() => {
    return state.skeletonSummons.length;
  }, [state.skeletonSummons.length]);

  // Expose interface
  useImperativeHandle(ref, () => ({
    castSoulReaper,
    getSkeletonCount
  }));

  return (
    <group>
      {/* Soul Reaper Mark */}
      {state.isMarked && state.targetId && (
        <SoulReaperMark
          targetId={state.targetId}
          enemyData={enemyData}
          fallbackPosition={state.targetPosition}
          duration={constants.MARK_DURATION}
          startTime={state.markStartTime!}
        />
      )}

      {/* Soul Reaper Sword - Main Target */}
      {state.swordVisible && state.targetId && state.targetPosition && (
        <SoulReaperSword
          targetId={state.targetId}
          enemyData={enemyData}
          fallbackPosition={state.targetPosition}
          onImpact={handleSwordImpact}
          shouldDrop={state.swordDropping}
        />
      )}

      {/* Soul Reaper Marks and Swords - Chain Targets */}
      {state.chainTargets.map(chainTarget => (
        <React.Fragment key={chainTarget.id}>
          {chainTarget.isMarked && (
            <SoulReaperMark
              targetId={chainTarget.id}
              enemyData={enemyData}
              fallbackPosition={chainTarget.position}
              duration={constants.MARK_DURATION}
              startTime={chainTarget.markStartTime}
            />
          )}
          {chainTarget.swordVisible && (
            <SoulReaperSword
              targetId={chainTarget.id}
              enemyData={enemyData}
              fallbackPosition={chainTarget.position}
              onImpact={() => handleChainSwordImpact(chainTarget.id)}
              shouldDrop={chainTarget.isDropping}
            />
          )}
        </React.Fragment>
      ))}

      {/* Skeleton Summons */}
      {state.skeletonSummons.map(skeleton => (
        <AbysalSkeletonSummon
          key={skeleton.id}
          id={skeleton.id}
          position={skeleton.position}
          health={skeleton.health}
          maxHealth={skeleton.maxHealth}
          damage={constants.SKELETON_DAMAGE}
          enemyData={enemyData}
          playerPosition={parentRef.current?.position || new Vector3(0, 0, 0)}
          onDamage={onDamage}
          onDeath={handleSkeletonDeath}
          onTakeDamage={onTakeDamage}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
        />
      ))}
    </group>
  );
});

SoulReaper.displayName = 'SoulReaper';

export default SoulReaper;