// src/Spells/ConcussiveBlow/useConcussiveBlow.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { Vector3 } from 'three';
import { WeaponSubclass } from '@/Weapons/weapons';

interface ActiveEffect {
  id: number;
  type: string;
  position: Vector3;
  direction: Vector3;
  duration?: number;
  startTime?: number;
  enemyId?: string;
}

export interface ConcussiveHit {
  enemyId: string;
  hitTime: number;
  burstAttackNumber: number; // Which attack in the burst (0, 1)
}

export interface StunnedEnemy {
  enemyId: string;
  stunStartTime: number;
  stunDuration: number; // 2.5 seconds = 2500ms
}

interface UseConcussiveBlowProps {
  currentSubclass?: WeaponSubclass;
  setActiveEffects?: (callback: (prev: ActiveEffect[]) => ActiveEffect[]) => void;
  onApplyStunEffect?: (enemyId: string, duration?: number) => void;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
    isDying?: boolean;
  }>;
}

const STUN_DURATION = 2500; // 2 seconds
const BURST_TIMEOUT = 1250; // 1 second window for burst attacks
const REQUIRED_CRITS_FOR_STUN = 2; // 2 critical hits needed

export function useConcussiveBlow({
  currentSubclass,
  setActiveEffects,
  onApplyStunEffect,
  enemyData
}: UseConcussiveBlowProps) {
  
  const [stunnedEnemies, setStunnedEnemies] = useState<Map<string, StunnedEnemy>>(new Map());
  const criticalHitsPerBurst = useRef<Map<string, ConcussiveHit[]>>(new Map()); // Track crits per enemy per burst
  const currentBurstId = useRef<string | null>(null); // Track current burst sequence

  // Check if Concussive Blow is active (Storm subclass passive)
  const isConcussiveBlowActive = currentSubclass === WeaponSubclass.STORM;

  // Clean up stunned enemies when they die
  useEffect(() => {
    if (!enemyData) return;
    
    const aliveEnemyIds = new Set(enemyData.map(enemy => enemy.id));
    
    setStunnedEnemies(prevStunned => {
      const updatedStunned = new Map(prevStunned);
      
      for (const [enemyId] of updatedStunned) {
        if (!aliveEnemyIds.has(enemyId)) {
          updatedStunned.delete(enemyId);
        }
      }
      
      return updatedStunned;
    });

    // Also clean up critical hit tracking for dead enemies
    const currentHits = criticalHitsPerBurst.current;
    for (const [enemyId] of currentHits) {
      if (!aliveEnemyIds.has(enemyId)) {
        currentHits.delete(enemyId);
      }
    }
  }, [enemyData]);

  // Stun an enemy
  const stunEnemy = useCallback((enemyId: string, enemyPosition: Vector3, startTime: number) => {
    
    setStunnedEnemies(prevStunned => {
      const newStunned = new Map(prevStunned);
      newStunned.set(enemyId, {
        enemyId,
        stunStartTime: startTime,
        stunDuration: STUN_DURATION
      });
      return newStunned;
    });

    // Apply stun effect to Scene/enemy AI system
    if (onApplyStunEffect) {
      onApplyStunEffect(enemyId, STUN_DURATION);
    }

    // Create visual stun effect
    if (setActiveEffects) {
      const stunPosition = enemyPosition.clone();
      stunPosition.y += 1;
      
      const effectId = Date.now() + Math.random(); // Ensure unique ID
      
      setActiveEffects(prev => [...prev, {
        id: effectId,
        type: 'concussiveStun',
        position: stunPosition,
        direction: new Vector3(0, 0, 0),
        duration: STUN_DURATION,
        startTime: startTime,
        enemyId: enemyId
      }]);

      // Create lightning strike effect at enemy position
      const lightningEffectId = Date.now() + Math.random() + 0.1; // Ensure unique ID
      
      setActiveEffects(prev => [...prev, {
        id: lightningEffectId,
        type: 'concussiveLightning',
        position: enemyPosition.clone(),
        direction: new Vector3(0, 0, 0),
        duration: 600, // 0.6 seconds
        startTime: startTime,
        enemyId: enemyId
      }]);
    }
  }, [setActiveEffects, onApplyStunEffect]);

  // Start a new burst sequence
  const startBurstSequence = useCallback(() => {
    
    if (!isConcussiveBlowActive) {
      return;
    }
    
    const burstId = `burst_${Date.now()}`;
    currentBurstId.current = burstId;
  
    
    // Clear old critical hit data for this burst
    criticalHitsPerBurst.current.clear();
  }, [isConcussiveBlowActive]);

  // Handle critical hit from spear burst attack
  const handleCriticalHit = useCallback((enemyId: string, enemyPosition: Vector3, burstAttackNumber: number) => {
    
    if (!isConcussiveBlowActive || !currentBurstId.current) {
      return;
    }
    
    const now = Date.now();
    
    // Get current hits for this enemy
    const enemyHits = criticalHitsPerBurst.current.get(enemyId) || [];
    
    // Add new critical hit
    const newHit: ConcussiveHit = {
      enemyId,
      hitTime: now,
      burstAttackNumber
    };
    
    // Filter out old hits that are outside the burst window
    const validHits = enemyHits.filter(hit => 
      now - hit.hitTime < BURST_TIMEOUT
    );
    
    validHits.push(newHit);
    criticalHitsPerBurst.current.set(enemyId, validHits);
    
    
    // Check if we have enough crits for stun (2 crits from the same burst)
    if (validHits.length >= REQUIRED_CRITS_FOR_STUN) {
      // Make sure we have crits from both attacks (0 and 1)
      const hasFirstAttackCrit = validHits.some(hit => hit.burstAttackNumber === 0);
      const hasSecondAttackCrit = validHits.some(hit => hit.burstAttackNumber === 1);
      
      if (hasFirstAttackCrit && hasSecondAttackCrit) {
        stunEnemy(enemyId, enemyPosition, now);
        
        // Clear hits for this enemy since they're now stunned
        criticalHitsPerBurst.current.delete(enemyId);
      }
    }
  }, [isConcussiveBlowActive, stunEnemy]);

  // Check if an enemy is currently stunned
  const isEnemyStunned = useCallback((enemyId: string): boolean => {
    const stunnedEnemy = stunnedEnemies.get(enemyId);
    if (!stunnedEnemy) return false;
    
    const now = Date.now();
    const elapsed = now - stunnedEnemy.stunStartTime;
    
    if (elapsed >= stunnedEnemy.stunDuration) {
      // Stun has expired, remove from map
      setStunnedEnemies(prev => {
        const newMap = new Map(prev);
        newMap.delete(enemyId);
        return newMap;
      });
      return false;
    }
    
    return true;
  }, [stunnedEnemies]);

  // Get all currently stunned enemy IDs
  const getStunnedEnemyIds = useCallback((): string[] => {
    const now = Date.now();
    const stunnedIds: string[] = [];
    
    stunnedEnemies.forEach((stunnedEnemy, enemyId) => {
      const elapsed = now - stunnedEnemy.stunStartTime;
      if (elapsed < stunnedEnemy.stunDuration) {
        stunnedIds.push(enemyId);
      }
    });
    
    return stunnedIds;
  }, [stunnedEnemies]);

  return {
    isEnemyStunned,
    getStunnedEnemyIds,
    handleCriticalHit,
    startBurstSequence,
    stunnedEnemies: Array.from(stunnedEnemies.values()),
    isConcussiveBlowActive
  };
}
