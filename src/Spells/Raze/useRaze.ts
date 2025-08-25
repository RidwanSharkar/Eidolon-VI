// src/Spells/Raze/useRaze.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { calculateRazeDamage } from '@/Spells/Raze/RazeDamage';

interface RazeStrip {
  id: number;
  startPosition: Vector3;
  direction: Vector3;
  maxDistance: number;
  startTime: number;
  width: number;
  currentDistance: number;
  isComplete: boolean;
}

interface UseRazeProps {
  onHit: (targetId: string, damage: number, isCritical?: boolean, position?: Vector3) => void;
  getEnemyData: () => Array<{ id: string; position: Vector3; health: number; isDying?: boolean }>;
  level: number;
}

export function useRaze({ onHit, getEnemyData, level }: UseRazeProps) {
  const [activeRazeStrips, setActiveRazeStrips] = useState<RazeStrip[]>([]);
  const activeRazeStripsRef = useRef<RazeStrip[]>([]);
  const damageIntervalsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const cleanupTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  
  // Store fresh references to the props to avoid stale closures
  const onHitRef = useRef(onHit);
  const getEnemyDataRef = useRef(getEnemyData);
  const levelRef = useRef(level);

  // Keep refs in sync with props and state
  useEffect(() => {
    activeRazeStripsRef.current = activeRazeStrips;
  }, [activeRazeStrips]);
  
  useEffect(() => {
    onHitRef.current = onHit;
  }, [onHit]);
  
  useEffect(() => {
    getEnemyDataRef.current = getEnemyData;
  }, [getEnemyData]);
  
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const createRazeStrip = useCallback((
    startPosition: Vector3,
    direction: Vector3,
    maxDistance: number = 18
  ) => {
    // Clean up any existing Raze strips first (only 1 at a time)
    damageIntervalsRef.current.forEach(interval => clearInterval(interval));
    cleanupTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    damageIntervalsRef.current.clear();
    cleanupTimeoutsRef.current.clear();
    
    const stripId = Date.now() + Math.random(); // Ensure unique ID
    const width = 0.8;
    const startTime = Date.now();
    
    const newStrip: RazeStrip = {
      id: stripId,
      startPosition: startPosition.clone(),
      direction: direction.clone().normalize(),
      maxDistance,
      startTime,
      width,
      currentDistance: 0,
      isComplete: false
    };

    setActiveRazeStrips([newStrip]); // Replace any existing strips

    // Set up damage interval (every 0.33 seconds)
    const damageInterval = setInterval(() => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      console.log(`[Raze Interval] Strip ${stripId}: Tick at ${elapsedTime.toFixed(1)}s`);
      
      // Find current strip state using ref to get latest state
      const currentStrip = activeRazeStripsRef.current.find(strip => strip.id === stripId);
      
      if (!currentStrip) {
        console.log(`[Raze Interval] Strip ${stripId}: No strip found in activeRazeStripsRef`);
        return;
      }
      
      // Only deal damage if strip exists and has extended at least a little
      if (currentStrip.currentDistance > 0.5) {
        console.log(`[Raze Interval] Strip ${stripId}: Dealing damage - currentDistance=${currentStrip.currentDistance}, enemies=${getEnemyData().length}`);
        
        const currentEndPosition = new Vector3()
          .copy(currentStrip.direction)
          .multiplyScalar(Math.min(currentStrip.currentDistance, currentStrip.maxDistance))
          .add(currentStrip.startPosition);

        const activeStrips = [{
          id: stripId,
          startPosition: currentStrip.startPosition,
          endPosition: currentEndPosition,
          width: currentStrip.width
        }];

        // Use refs to get fresh data on each damage tick
        const currentEnemyData = getEnemyDataRef.current();
        const currentLevel = levelRef.current;
        
        console.log(`[Raze Interval] Strip ${stripId}: Checking ${currentEnemyData.length} enemies for damage`);
        
        const hits = calculateRazeDamage(activeStrips, currentEnemyData, currentLevel);
        
        console.log(`[Raze Interval] Strip ${stripId}: Found ${hits.length} hits`);
        
        hits.forEach(hit => {
          onHitRef.current(hit.targetId, hit.damage, hit.isCritical, hit.position);
        });
      } else {
        console.log(`[Raze Interval] Strip ${stripId}: Not dealing damage - currentDistance=${currentStrip.currentDistance}`);
      }
    }, 250); // 0.33 seconds

    damageIntervalsRef.current.set(stripId, damageInterval);

    // Clean up after 5 seconds of existence
    const cleanupTimeout = setTimeout(() => {
      const damageInterval = damageIntervalsRef.current.get(stripId);
      if (damageInterval) {
        clearInterval(damageInterval);
        damageIntervalsRef.current.delete(stripId);
      }
      
      setActiveRazeStrips(prev => prev.filter(strip => strip.id !== stripId));
      cleanupTimeoutsRef.current.delete(stripId);
    }, 2000);

    cleanupTimeoutsRef.current.set(stripId, cleanupTimeout);

    return stripId;
  }, [getEnemyData]); // Remove dependencies since we're using refs

  const updateRazeStripProgress = useCallback((stripId: number, currentDistance: number) => {
    setActiveRazeStrips(prev => 
      prev.map(strip => 
        strip.id === stripId 
          ? { ...strip, currentDistance, isComplete: currentDistance >= strip.maxDistance }
          : strip
      )
    );
  }, []);

  const cleanupRazeStrip = useCallback((stripId: number) => {
    const damageInterval = damageIntervalsRef.current.get(stripId);
    if (damageInterval) {
      clearInterval(damageInterval);
      damageIntervalsRef.current.delete(stripId);
    }

    const cleanupTimeout = cleanupTimeoutsRef.current.get(stripId);
    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
      cleanupTimeoutsRef.current.delete(stripId);
    }

    setActiveRazeStrips(prev => prev.filter(strip => strip.id !== stripId));
  }, []);

  // Cleanup all intervals and timeouts when component unmounts
  const cleanupAll = useCallback(() => {
    damageIntervalsRef.current.forEach(interval => clearInterval(interval));
    cleanupTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    damageIntervalsRef.current.clear();
    cleanupTimeoutsRef.current.clear();
    setActiveRazeStrips([]);
  }, []);

  return {
    activeRazeStrips,
    createRazeStrip,
    updateRazeStripProgress,
    cleanupRazeStrip,
    cleanupAll
  };
}