// src/Spells/Eviscerate/useEviscerate.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Vector3, Group } from 'three';

export interface UseEviscerateLashReturn {
  isActive: boolean;
  triggerEviscerate: (playerPosition: Vector3, playerDirection: Vector3) => void;
  slashPhase: 'none' | 'first' | 'second';
  charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>;
  setCharges: React.Dispatch<React.SetStateAction<Array<{ id: number; available: boolean; cooldownStartTime: number | null }>>>;
  effectDirection: Vector3;
}

interface UseEviscerateLashProps {
  onHit: (targetId: string, damage: number) => void;
  parentRef: React.RefObject<Group>;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  setDamageNumbers: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isEviscerate?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isEviscerate?: boolean;
  }>) => void;
  nextDamageNumberId: { current: number };
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
  onApplyStunEffect?: (enemyId: string, duration?: number) => void;
  onChargesChange?: (charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>) => void;
}

const EVISCERATE_STUN_DURATION = 3000; // 3 seconds
const EVISCERATE_CHARGE_COOLDOWN = 10000; // 10 seconds
const EVISCERATE_INTERNAL_COOLDOWN = 1000; // 1 second internal cooldown to prevent spamming

export const useEviscerate = ({
  onHit,
  parentRef,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  setActiveEffects,
  onApplyStunEffect,
  onChargesChange
}: UseEviscerateLashProps): UseEviscerateLashReturn => {
  const [isActive, setIsActive] = useState(false);
  const [slashPhase, setSlashPhase] = useState<'none' | 'first' | 'second'>('none');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUsageTime = useRef<number>(0);
  
  // Store direction when ability is triggered
  const [effectDirection, setEffectDirection] = useState<Vector3>(new Vector3(0, 0, 1));
  
  // Initialize 2 charges for Eviscerate
  const [charges, setCharges] = useState<Array<{ id: number; available: boolean; cooldownStartTime: number | null }>>(() => {
    const initialCharges = [
      { id: 1, available: true, cooldownStartTime: null },
      { id: 2, available: true, cooldownStartTime: null }
    ];
    return initialCharges;
  });

  // Use a ref to track current charges for the setTimeout callback
  const chargesRef = useRef(charges);
  chargesRef.current = charges;

  // Reset charges when game resets
  useEffect(() => {
    const handleGameReset = () => {
      const resetCharges = [
        { id: 1, available: true, cooldownStartTime: null },
        { id: 2, available: true, cooldownStartTime: null }
      ];
      setCharges(resetCharges);
      chargesRef.current = resetCharges;
      setIsActive(false);
      setSlashPhase('none');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, []);

  // Debug logging for charge changes
  useEffect(() => {
    
    // Additional debugging: log each charge individually
    charges.forEach((charge, index) => {
      console.log(`[Eviscerate] Charge ${index + 1}:`, {
        id: charge.id,
        available: charge.available,
        cooldownStartTime: charge.cooldownStartTime,
        timeUntilAvailable: charge.cooldownStartTime ? 
          Math.max(0, EVISCERATE_CHARGE_COOLDOWN - (Date.now() - charge.cooldownStartTime)) : 0
      });
    });
  }, [charges]);


  // Notify parent component when charges change
  useEffect(() => {
    if (onChargesChange) {
      onChargesChange(charges);
    }
  }, [charges, onChargesChange]);

  const damageEnemiesInRange = useCallback((position: Vector3, direction: Vector3) => {
    const BASE_DAMAGE = 117;
    const RANGE = 4.0; // Similar to sabres Q range
    const stunnedEnemies: string[] = [];

    enemyData.forEach(enemy => {
      const distance = position.distanceTo(enemy.position);
      if (distance <= RANGE) {
        // Check if enemy is roughly in front of the player
        const dirToEnemy = enemy.position.clone().sub(position).normalize();
        const dotProduct = direction.dot(dirToEnemy);
        
        if (dotProduct > 0.3) { // Enemy is in front cone
          // Calculate backstab bonus - same logic as stealth attacks
          const playerToEnemy = enemy.position.clone().sub(position).normalize();
          const enemyFacing = new Vector3(0, 0, 1); // Assume enemies face forward initially
          const backstabDotProduct = playerToEnemy.dot(enemyFacing);
          
          let finalDamage = BASE_DAMAGE;
          let isCritical = false;
          
          // Backstab detection: if player is behind enemy (dot product > 0.5)
          if (backstabDotProduct > 0.5) {
            finalDamage = BASE_DAMAGE * 2; // Double damage for backstab
            isCritical = true;
          }
          
          onHit(`enemy-${enemy.id}`, finalDamage);
          
          // Add damage number with appropriate styling
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: finalDamage,
            position: enemy.position.clone().add(new Vector3(0, 1, 0)),
            isCritical,
            isEviscerate: true
          }]);
          
          // Apply stun effect to this enemy
          stunnedEnemies.push(enemy.id);
        }
      }
    });
    
    // Apply stun effects to all hit enemies
    stunnedEnemies.forEach(enemyId => {
      const enemy = enemyData.find(e => e.id === enemyId);
      if (enemy) {
        // Apply stun effect to Scene/enemy AI system
        if (onApplyStunEffect) {
          onApplyStunEffect(enemyId, EVISCERATE_STUN_DURATION);
        }

        // Create visual stun effect
        if (setActiveEffects) {
          const stunPosition = enemy.position.clone();
          stunPosition.y += 1;
          
          const effectId = Date.now() + Math.random(); // Ensure unique ID
          
          setActiveEffects(prev => [...prev, {
            id: effectId,
            type: 'evisceratestun', // New stun type for Eviscerate
            position: stunPosition,
            direction: new Vector3(0, 0, 0),
            duration: EVISCERATE_STUN_DURATION,
            startTime: Date.now(),
            enemyId: enemyId
          }]);
        }
      }
    });
  }, [enemyData, onHit, setDamageNumbers, nextDamageNumberId, setActiveEffects, onApplyStunEffect]);

  const triggerEviscerate = useCallback((playerPosition: Vector3, playerDirection: Vector3) => {
    
    if (!parentRef.current) return; // Prevent null ref
    
    // Add internal cooldown to prevent spamming (1 second)
    const now = Date.now();
    if (now - lastUsageTime.current < EVISCERATE_INTERNAL_COOLDOWN) {
      return;
    }
    
    // Check if we have any available charges
    const availableCharges = chargesRef.current.filter(charge => charge.available);
    
    // Additional validation: ensure charges array is properly structured
    if (!chargesRef.current || chargesRef.current.length !== 2) {
      return;
    }
    
    if (availableCharges.length === 0) {
      return;
    }
    
    // Update last usage time
    lastUsageTime.current = now;
    
    // Store the direction for the visual effects
    setEffectDirection(playerDirection.clone());
    
    // Consume one charge
    const chargeToConsume = availableCharges[0];
    
    setCharges(prev => {
      const newCharges = prev.map(charge => 
        charge.id === chargeToConsume.id ? {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        } : charge
      );
      
      // Update the ref immediately to ensure the setTimeout callback has the correct state
      chargesRef.current = newCharges;
      
      return newCharges;
    });
    
    // Start cooldown recovery for this charge using useRef to avoid closure issues
    const chargeId = chargeToConsume.id;
    
    // Store the timer reference to ensure it can be cleared if needed
    const recoveryTimer = setTimeout(() => {
      
      setCharges(prev => {
        const newCharges = prev.map(charge => 
          charge.id === chargeId ? {
            ...charge,
            available: true,
            cooldownStartTime: null
          } : charge
        );
        
        // Update the ref immediately to ensure consistency
        chargesRef.current = newCharges;
        
        return newCharges;
      });
    }, EVISCERATE_CHARGE_COOLDOWN);
    
    // Store the timer reference for potential cleanup
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = recoveryTimer;
    
    setIsActive(true);
    setSlashPhase('first');
    
    // Create position like Oathstrike does
    const effectPosition = playerPosition.clone();
    effectPosition.y += 1; // Same Y offset as Oathstrike
    
    // Add first slash effect to activeEffects (like Oathstrike does)
    if (setActiveEffects) {
      setActiveEffects(prev => [...prev, {
        id: Date.now() + Math.random(), // Unique ID
        type: 'eviscerate-first',
        position: effectPosition,
        direction: playerDirection.clone(),
        duration: 200, // 0.2 seconds
        startTime: Date.now()
      }]);
    }
    
    // Damage enemies with first slash
    damageEnemiesInRange(playerPosition, playerDirection);
    
    // Second slash after 0.1 second delay (shorter for rapid succession)
    timeoutRef.current = setTimeout(() => {
      setSlashPhase('second');
      
      // Add second slash effect to activeEffects
      if (setActiveEffects) {
        setActiveEffects(prev => [...prev, {
          id: Date.now() + Math.random(), // Unique ID
          type: 'eviscerate-second',
          position: effectPosition,
          direction: playerDirection.clone(),
          duration: 200, // 0.2 seconds
          startTime: Date.now()
        }]);
      }
      
      // Damage enemies with second slash
      damageEnemiesInRange(playerPosition, playerDirection);
      
      // End the ability after second slash completes
      setTimeout(() => {
        setIsActive(false);
        setSlashPhase('none');
      }, 200); // Match new animation duration (0.2 seconds)
      
    }, 100); // 0.1 second delay for rapid succession
    
  }, [damageEnemiesInRange, parentRef, setActiveEffects, setCharges]);

  return {
    isActive,
    triggerEviscerate,
    slashPhase,
    charges,
    setCharges,
    effectDirection
  };
};
