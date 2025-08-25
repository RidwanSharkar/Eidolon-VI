import { useState, useRef, useCallback, useEffect } from 'react';

interface FrenzyAuraEmpoweredAttackState {
  isEmpowered: boolean;
  cooldownRemaining: number;
  isOnCooldown: boolean;
}

export function useFrenzyAuraEmpoweredAttack() {
  const [state, setState] = useState<FrenzyAuraEmpoweredAttackState>({
    isEmpowered: false,
    cooldownRemaining: 0,
    isOnCooldown: false
  });

  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const COOLDOWN_DURATION = 5000; // 5 seconds in milliseconds

  // Start the initial empowerment after component mounts
  useEffect(() => {
    // Start with empowered attack available immediately
    setState(prev => ({ ...prev, isEmpowered: true }));
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      // Capture current value to avoid stale closure warnings
      const cooldownInterval = cooldownIntervalRef.current;
      
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
      }
    };
  }, []);

  const startCooldown = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEmpowered: false,
      isOnCooldown: true,
      cooldownRemaining: COOLDOWN_DURATION
    }));

    // Clear any existing intervals
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    // Update cooldown every 100ms for smooth UI updates
    cooldownIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newRemaining = Math.max(0, prev.cooldownRemaining - 100);
        
        if (newRemaining <= 0) {
          // Cooldown finished - empower the next attack
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          
          return {
            isEmpowered: true,
            isOnCooldown: false,
            cooldownRemaining: 0
          };
        }
        
        return {
          ...prev,
          cooldownRemaining: newRemaining
        };
      });
    }, 100);
  }, []);

  const consumeEmpoweredAttack = useCallback(() => {
    if (state.isEmpowered) {
      startCooldown();
      return true;
    }
    return false;
  }, [state.isEmpowered, startCooldown]);

  // Get damage based on level
  const getEmpoweredDamage = useCallback((level: number): number => {
    switch (level) {
      case 1: return 43;
      case 2: return 59;
      case 3: return 73;
      case 4: return 89;
      case 5: return 101;
      default: return 43; // Default to level 1 damage
    }
  }, []);

  return {
    isEmpowered: state.isEmpowered,
    cooldownRemaining: state.cooldownRemaining,
    isOnCooldown: state.isOnCooldown,
    consumeEmpoweredAttack,
    getEmpoweredDamage
  };
}
