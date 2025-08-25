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
    console.log('[Boneclaw] Initializing charges:', initialCharges);
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

  // Debug logging for charge changes
  useEffect(() => {
    console.log('[Boneclaw] Charges updated:', charges);
    console.log('[Boneclaw] Available charges count:', charges.filter(c => c.available).length);
    console.log('[Boneclaw] ChargesRef.current updated to:', chargesRef.current);
    
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
    console.log('[Boneclaw] Component mounted, initial charges:', charges);
    console.log('[Boneclaw] Initial chargesRef.current:', chargesRef.current);
  }, [charges]);

  // Notify parent component when charges change
  useEffect(() => {
    if (onChargesChange) {
      onChargesChange(charges);
    }
  }, [charges, onChargesChange]);

  const triggerBoneclaw = useCallback((position: Vector3, direction: Vector3) => {
    console.log('[Boneclaw] triggerBoneclaw called with:', { position, direction, level });
    console.log('[Boneclaw] Current charges state:', chargesRef.current);
    
    // Add internal cooldown to prevent spamming (1 second)
    const now = Date.now();
    if (now - lastUsageTime.current < BONECLAW_INTERNAL_COOLDOWN) {
      console.log('[Boneclaw] Too soon after last usage, internal cooldown active');
      return;
    }
    
    // Check if we have any available charges
    const availableCharges = chargesRef.current.filter(charge => charge.available);
    console.log(`[Boneclaw] Available charges: ${availableCharges.length}/${chargesRef.current.length}`, chargesRef.current);
    console.log(`[Boneclaw] Available charges details:`, availableCharges);
    
    // Additional validation: ensure charges array is properly structured
    if (!chargesRef.current || chargesRef.current.length !== 2) {
      console.error('[Boneclaw] Invalid charges array structure:', chargesRef.current);
      return;
    }
    
    if (availableCharges.length === 0) {
      console.log('[Boneclaw] No charges available');
      return;
    }
    
    // Update last usage time
    lastUsageTime.current = now;
    
    // Consume one charge
    const chargeToConsume = availableCharges[0];
    console.log(`[Boneclaw] Consuming charge ${chargeToConsume.id}`);
    
    setCharges(prev => {
      console.log(`[Boneclaw] setCharges callback - prev state:`, prev);
      const newCharges = prev.map(charge => 
        charge.id === chargeToConsume.id ? {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        } : charge
      );
      console.log(`[Boneclaw] After consumption - new charges:`, newCharges);
      console.log(`[Boneclaw] Charge ${chargeToConsume.id} marked as unavailable`);
      console.log(`[Boneclaw] Remaining available charges:`, newCharges.filter(c => c.available).length);
      
      // Update the ref immediately to ensure the setTimeout callback has the correct state
      chargesRef.current = newCharges;
      
      return newCharges;
    });
    
    // Start cooldown recovery for this charge using useRef to avoid closure issues
    const chargeId = chargeToConsume.id;
    console.log(`[Boneclaw] Setting recovery timer for charge ${chargeId} in ${BONECLAW_CHARGE_COOLDOWN}ms`);
    
    // Store the timer reference to ensure it can be cleared if needed
    const recoveryTimer = setTimeout(() => {
      console.log(`[Boneclaw] Recovering charge ${chargeId} after cooldown`);
      console.log(`[Boneclaw] Before recovery - charges:`, chargesRef.current);
      
      setCharges(prev => {
        const newCharges = prev.map(charge => 
          charge.id === chargeId ? {
            ...charge,
            available: true,
            cooldownStartTime: null
          } : charge
        );
        console.log(`[Boneclaw] After recovery - new charges:`, newCharges);
        console.log(`[Boneclaw] Charge ${chargeId} is now available again`);
        
        // Update the ref immediately to ensure consistency
        chargesRef.current = newCharges;
        
        return newCharges;
      });
    }, BONECLAW_CHARGE_COOLDOWN);
    
    // Log the timer setup for debugging
    console.log(`[Boneclaw] Recovery timer ${recoveryTimer} set for charge ${chargeId}`);
    console.log(`[Boneclaw] Timer will expire at:`, new Date(Date.now() + BONECLAW_CHARGE_COOLDOWN).toISOString());
    
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