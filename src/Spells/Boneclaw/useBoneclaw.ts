import { useState, useCallback, useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { calculateBoneclawHits } from '@/Spells/Boneclaw/BoneclawDamage';

interface UseBoneclawProps {
  onHit: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isBoneclaw?: boolean) => void;
  enemyData: Array<{ id: string; position: Vector3; health: number }>;
  onKillingBlow?: (position: Vector3) => void; // New prop for skeleton summoning
  onChargesChange?: (charges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>) => void;
  level?: number; // Add level parameter for damage scaling
}

const BONECLAW_CHARGE_COOLDOWN = 8000; // 8 seconds per charge
const BONECLAW_INTERNAL_COOLDOWN = 1000; // 1 second internal cooldown to prevent spamming

export function useBoneclaw({ onHit, enemyData, onKillingBlow, onChargesChange, level = 1 }: UseBoneclawProps) {
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
  }>>([]);
  
  const [activeScratchEffects, setActiveScratchEffects] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
  }>>([]);

  // Initialize 2 charges for Boneclaw
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

  // Track last usage time for internal cooldown
  const lastUsageTime = useRef<number>(0);

  // Reset charges when game resets
  useEffect(() => {
    const handleGameReset = () => {
      const resetCharges = [
        { id: 1, available: true, cooldownStartTime: null },
        { id: 2, available: true, cooldownStartTime: null }
      ];
      setCharges(resetCharges);
      chargesRef.current = resetCharges;
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, []);

  useEffect(() => {
    // Additional debugging: log each charge individually
    charges.forEach((charge, index) => {
      console.log(`[Boneclaw] Charge ${index + 1}:`, {
        id: charge.id,
        available: charge.available,
        cooldownStartTime: charge.cooldownStartTime,
        timeUntilAvailable: charge.cooldownStartTime ? 
          Math.max(0, BONECLAW_CHARGE_COOLDOWN - (Date.now() - charge.cooldownStartTime)) : 0
      });
    });
  }, [charges]);

  // Log initial charge state when component mounts
  useEffect(() => {
  }, [charges]);

  // Notify parent component when charges change
  useEffect(() => {
    if (onChargesChange) {
      onChargesChange(charges);
    }
  }, [charges, onChargesChange]);

  const triggerBoneclaw = useCallback((position: Vector3, direction: Vector3) => {
    // Add internal cooldown to prevent spamming (1 second)
    const now = Date.now();
    if (now - lastUsageTime.current < BONECLAW_INTERNAL_COOLDOWN) {
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
    }, BONECLAW_CHARGE_COOLDOWN);
    
    // Log the timer setup for debugging
    console.log(`[Boneclaw] Recovery timer ${recoveryTimer} set for charge ${chargeId}`);

    
    // Now execute the Boneclaw ability with level-based damage
    const hits = calculateBoneclawHits(position, direction, enemyData, new Set<string>(), level);
    
    hits.forEach(hit => {
      // Check if this hit will kill the enemy
      const targetEnemy = enemyData.find(enemy => enemy.id === hit.targetId);
      const willKill = targetEnemy && targetEnemy.health <= hit.damage;
      
      onHit(
        hit.targetId, 
        hit.damage, 
        hit.isCritical, 
        hit.position,
        true 
      );
      
      // If this is a killing blow, trigger skeleton summoning
      if (willKill && onKillingBlow) {
        onKillingBlow(hit.position);
      }
    });

    setActiveEffects(prev => [...prev, {
      id: Date.now(),
      position: position.clone(),
      direction: direction.clone()
    }]);
  }, [enemyData, onHit, onKillingBlow, level, setCharges]);

  const createScratchEffect = useCallback((position: Vector3, direction: Vector3) => {
    setActiveScratchEffects(prev => [...prev, {
      id: Date.now(),
      position: position.clone().add(direction.clone().multiplyScalar(2)),
      direction: direction.clone()
    }]);
  }, []);

  const removeEffect = useCallback((id: number) => {
    setActiveEffects(prev => prev.filter(effect => effect.id !== id));
  }, []);

  const removeScratchEffect = useCallback((id: number) => {
    setActiveScratchEffects(prev => prev.filter(effect => effect.id !== id));
  }, []);

  return {
    activeEffects,
    activeScratchEffects,
    triggerBoneclaw,
    createScratchEffect,
    removeEffect,
    removeScratchEffect,
    charges,
    setCharges
  };
}