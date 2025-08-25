import { useRef, useCallback, useEffect, useMemo } from 'react';
import { Vector3 } from 'three';
import { useFirebeam } from '@/Spells/Firebeam/useFirebeam';
import { useFirebeamPersistentManager } from '@/Spells/Firebeam/useFirebeamPersistentManager';
import { useDeepFreeze } from '@/Spells/Firebeam/useDeepFreeze';
import { Enemy } from '@/Versus/enemy';
import { WeaponSubclass } from '@/Weapons/weapons';
import * as THREE from 'three';
import { DamageNumber } from '../../Unit/useDamageNumbers';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

interface FirebeamManagerProps {
  parentRef: React.RefObject<THREE.Group>;
  onHit: (targetId: string, damage: number) => void;
  enemyData: Enemy[];
  setActiveEffects: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    parentRef?: React.RefObject<THREE.Group>;
    enemyId?: string;
  }>>>;
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
  setDamageNumbers: React.Dispatch<React.SetStateAction<DamageNumber[]>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  isFirebeaming: boolean;
  onFirebeamEnd?: () => void;
  currentSubclass?: WeaponSubclass;
  level?: number; // Add level prop for Deep Freeze
  // Multiplayer props
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
}

export const useFirebeamManager = ({
  parentRef,
  onHit,
  enemyData,
  setActiveEffects,
  charges,
  setCharges,
  setDamageNumbers,
  nextDamageNumberId,
  isFirebeaming,
  onFirebeamEnd,
  currentSubclass,
  level = 1,
  // Multiplayer props
  sendEffect,
  isInRoom = false,
  isPlayer = false
}: FirebeamManagerProps) => {
  const nextEffectId = useRef(0);
  const currentEffectId = useRef<number | null>(null);
  const lastDamageTime = useRef<Record<string, number>>({});
  const firebeamStartTime = useRef<number | null>(null);
  const damageInterval = useRef<NodeJS.Timeout | null>(null);
  // Add ref to track active state independently of React state
  const isFirebeamingRef = useRef(false);
  const { activateFirebeam, deactivateFirebeam } = useFirebeam({ onHit, parentRef });
  
  // Initialize Deep Freeze system
  const { handleFirebeamHit, isEnemyFrozen, getFrozenEnemyIds } = useDeepFreeze({
    currentSubclass,
    setActiveEffects,
    enemyData,
    level,
    // Multiplayer props
    sendEffect,
    isInRoom,
    isPlayer
  });

  // Cache vector instances to prevent garbage collection
  const beamPos2D = useMemo(() => new Vector3(), []);
  const enemyPos2D = useMemo(() => new Vector3(), []);
  const beamDirection2D = useMemo(() => new Vector3(), []);
  const enemyDirection = useMemo(() => new Vector3(), []);
  const projectedPoint = useMemo(() => new Vector3(), []);

  // Use the persistent manager for charge consumption
  useFirebeamPersistentManager({
    parentRef,
    charges,
    setCharges,
    isFirebeaming,
    onFirebeamEnd
  });

  // Check for available charges
  const hasAvailableCharges = charges.some(charge => charge.available);

  const stopFirebeam = useCallback(() => {

    isFirebeamingRef.current = false; // Set ref first
    
    if (currentEffectId.current !== null) {
      setActiveEffects(prev => prev.filter(effect => effect.id !== currentEffectId.current));
      currentEffectId.current = null;
    }
    
    if (damageInterval.current) {
      clearInterval(damageInterval.current);
      damageInterval.current = null;
    }
    
    firebeamStartTime.current = null;
    lastDamageTime.current = {};
    deactivateFirebeam();
  }, [deactivateFirebeam, setActiveEffects]);

  const dealDamageToEnemies = useCallback(() => {
    // Check if firebeam should be active - use ref for immediate state check
    if (!isFirebeamingRef.current || !parentRef.current) {

      return;
    }



    const currentTime = Date.now();
    const timeActive = firebeamStartTime.current ? (currentTime - firebeamStartTime.current) / 1000 : 0;
    
    // Calculate damage scaling - increases every second held
    const baseDamage = 43;
    const damageMultiplier = 1 + Math.floor(timeActive) * 0.5; // +50% damage per second held
    const baseFinalDamage = Math.floor(baseDamage * damageMultiplier);
    
    // Apply 2x damage multiplier against frozen enemies (Deep Freeze passive)
    const freezeMultiplier = currentSubclass === WeaponSubclass.FROST ? 2 : 1;
    const finalDamage = baseFinalDamage;



    // Get current beam position and direction from parent
    const position = parentRef.current.position.clone();
    position.y += 1;
    const direction = new Vector3(0, 0, 1).applyQuaternion(parentRef.current.quaternion);

    // Optimize enemy hit detection
    enemyData.forEach(enemy => {
      if (enemy.health <= 0 || enemy.isDying) {

        return;
      }
      
      const now = Date.now();
      const lastHit = lastDamageTime.current[enemy.id] || 0;
      
      // Deal damage every 250ms
      if (now - lastHit < 250) {

        return;
      }
      
      // Reuse vector instances
      beamPos2D.set(position.x, 0, position.z);
      enemyPos2D.set(enemy.position.x, 0, enemy.position.z);
      beamDirection2D.copy(direction).setY(0).normalize();
      enemyDirection.copy(enemyPos2D).sub(beamPos2D);
      
      const projectedDistance = enemyDirection.dot(beamDirection2D);


      if (projectedDistance <= 0 || projectedDistance > 20) {

        return;
      }
      
      projectedPoint.copy(beamPos2D).add(beamDirection2D.multiplyScalar(projectedDistance));
      const perpendicularDistance = enemyPos2D.distanceTo(projectedPoint);
      
      if (perpendicularDistance < 1.375) {
        // Apply freeze damage multiplier for this specific enemy
        const enemyIsFrozen = isEnemyFrozen(enemy.id);
        const enemyFinalDamage = enemyIsFrozen ? finalDamage * freezeMultiplier : finalDamage;
        

        onHit(enemy.id, enemyFinalDamage);
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: enemyFinalDamage,
          position: enemy.position.clone(),
          isCritical: damageMultiplier > 2 || enemyIsFrozen, // Critical display if 2x+ damage OR frozen
          isFirebeam: true
        }]);
        
        // Track Firebeam hit for Deep Freeze system
        handleFirebeamHit(enemy.id, enemy.position);
        
        lastDamageTime.current[enemy.id] = now;
      } else {

      }
    });


  }, [currentSubclass, isEnemyFrozen, parentRef, enemyData, onHit, setDamageNumbers, nextDamageNumberId, beamPos2D, enemyPos2D, beamDirection2D, enemyDirection, projectedPoint, handleFirebeamHit]);

  const startFirebeam = useCallback(() => {

    if (!hasAvailableCharges || isFirebeaming) return false;

    // Activate the visual firebeam effect
    const firebeamData = activateFirebeam();

    if (!firebeamData) {

      return false;
    }

    const effectId = nextEffectId.current++;

    currentEffectId.current = effectId;
    firebeamStartTime.current = Date.now();
    isFirebeamingRef.current = true; // Set ref immediately



    setActiveEffects(prev => [...prev, {
      id: effectId,
      type: 'firebeam',
      position: new Vector3(), // Dummy values - will be overridden by parentRef
      direction: new Vector3(0, 0, 1), // Dummy values - will be overridden by parentRef
      parentRef: parentRef
    }]);

    // Clear any existing interval
    if (damageInterval.current) {
      clearInterval(damageInterval.current);
      damageInterval.current = null;
    }

    // Start damage interval immediately and then every 50ms
    dealDamageToEnemies();
    damageInterval.current = setInterval(() => {
      dealDamageToEnemies();
    }, 50); // Check every 50ms for smooth damage



    return true;
  }, [isFirebeaming, hasAvailableCharges, activateFirebeam, setActiveEffects, parentRef, dealDamageToEnemies]);

  // Handle firebeam state changes - stop when charges run out or firebeaming stops
  useEffect(() => {

    
    // Sync ref with React state
    isFirebeamingRef.current = isFirebeaming;
    
    // Stop firebeam when isFirebeaming becomes false or no charges available
    if (!isFirebeaming && damageInterval.current) {

      stopFirebeam();
    }
  }, [isFirebeaming, hasAvailableCharges, stopFirebeam]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {

      stopFirebeam();
    };
  }, [stopFirebeam]);

  return {
    startFirebeam,
    stopFirebeam,
    isEnemyFrozen,
    getFrozenEnemyIds
  };
}; 