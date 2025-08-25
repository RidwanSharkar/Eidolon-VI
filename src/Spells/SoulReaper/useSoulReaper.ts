import { useRef, useCallback, useState } from 'react';
import { Group, Vector3 } from 'three';
import { Enemy } from '@/Versus/enemy';

interface UseSoulReaperProps {
  parentRef: React.RefObject<Group>;
  enemyData: Enemy[];
  onDamage: (targetId: string, damage: number, position?: Vector3) => void;
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
}

interface SoulReaperState {
  targetId: string | null;
  targetPosition: Vector3 | null;
  isMarked: boolean;
  markStartTime: number | null;
  swordDropping: boolean;
  skeletonSummons: Array<{
    id: string;
    position: Vector3;
    health: number;
    maxHealth: number;
  }>;
}

export function useSoulReaper({
  parentRef,
  enemyData,
  onDamage,
  setDamageNumbers,
  nextDamageNumberId,
}: UseSoulReaperProps) {
  
  const [state, setState] = useState<SoulReaperState>({
    targetId: null,
    targetPosition: null,
    isMarked: false,
    markStartTime: null,
    swordDropping: false,
    skeletonSummons: []
  });

  const constants = useRef({
    MARK_DURATION: 2000, // 2 seconds
    DAMAGE: 350,
    MAX_SKELETONS: 2,
    SKELETON_HEALTH: 64,
    SKELETON_DAMAGE: 32,
    TARGETING_RANGE: 25,
    COOLDOWN: 5000 // 5 seconds
  }).current;

  const [lastCastTime, setLastCastTime] = useState(0);

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

  // Handle sword impact
  const handleSwordImpact = useCallback(() => {
    if (!state.targetId || !state.targetPosition) return;

    // Find the target enemy
    const target = enemyData.find(enemy => enemy.id === state.targetId);
    
    // Deal damage
    onDamage(state.targetId, constants.DAMAGE, state.targetPosition);
    
    // Add damage number
    setDamageNumbers(prev => [...prev, {
      id: nextDamageNumberId.current++,
      damage: constants.DAMAGE,
      position: state.targetPosition!.clone().add(new Vector3(0, 1, 0)),
      isCritical: false,
      isSoulReaper: true
    }]);

    // Check if enemy was killed and summon skeleton
    if (target && target.health <= constants.DAMAGE) {
      // Remove oldest skeleton if at max capacity
      setState(prev => {
        const newSummons = [...prev.skeletonSummons];
        
        if (newSummons.length >= constants.MAX_SKELETONS) {
          newSummons.shift(); // Remove oldest
        }
        
        // Add new skeleton
        newSummons.push({
          id: `skeleton-${Date.now()}`,
          position: state.targetPosition!.clone(),
          health: constants.SKELETON_HEALTH,
          maxHealth: constants.SKELETON_HEALTH
        });

        return {
          ...prev,
          skeletonSummons: newSummons,
          swordDropping: false,
          targetId: null,
          targetPosition: null,
          markStartTime: null
        };
      });
    } else {
      // Reset state if no kill
      setState(prev => ({
        ...prev,
        swordDropping: false,
        targetId: null,
        targetPosition: null,
        markStartTime: null
      }));
    }
  }, [state.targetId, state.targetPosition, enemyData, onDamage, constants, setDamageNumbers, nextDamageNumberId]);

  // Cast SoulReaper ability
  const castSoulReaper = useCallback((): boolean => {
    const now = Date.now();
    
    // Check cooldown
    if (now - lastCastTime < constants.COOLDOWN) return false;
    
    // Don't cast if already marked or sword dropping
    if (state.isMarked || state.swordDropping) return false;

    const target = findNearestEnemy();
    if (!target) return false;

    setLastCastTime(now);
    setState(prev => ({
      ...prev,
      targetId: target.id,
      targetPosition: target.position.clone(),
      isMarked: true,
      markStartTime: now
    }));

    // Start countdown for sword drop
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isMarked: false,
        swordDropping: true
      }));

      // Handle sword impact after drop animation
      setTimeout(() => {
        handleSwordImpact();
      }, 1000); // Sword drop animation time
      
    }, constants.MARK_DURATION);

    return true;
  }, [state.isMarked, state.swordDropping, findNearestEnemy, lastCastTime, constants, handleSwordImpact]);

  // Handle skeleton death
  const handleSkeletonDeath = useCallback((skeletonId: string) => {
    setState(prev => ({
      ...prev,
      skeletonSummons: prev.skeletonSummons.filter(skeleton => skeleton.id !== skeletonId)
    }));
  }, []);

  // Get current skeleton count
  const getSkeletonCount = useCallback(() => {
    return state.skeletonSummons.length;
  }, [state.skeletonSummons.length]);

  // Check if ability is on cooldown
  const isOnCooldown = useCallback(() => {
    return Date.now() - lastCastTime < constants.COOLDOWN;
  }, [lastCastTime, constants.COOLDOWN]);

  // Get remaining cooldown time
  const getRemainingCooldown = useCallback(() => {
    const elapsed = Date.now() - lastCastTime;
    return Math.max(0, constants.COOLDOWN - elapsed);
  }, [lastCastTime, constants.COOLDOWN]);

  return {
    state,
    castSoulReaper,
    handleSkeletonDeath,
    getSkeletonCount,
    isOnCooldown,
    getRemainingCooldown,
    constants
  };
}