// In src/Spells/Stealth/useStealthEffect.ts
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';

import { useRef } from 'react';
import { stealthManager } from './StealthManager';

interface UseStealthEffectProps {
  onStealthStart?: () => void;
  onStealthEnd?: () => void;
  duration?: number;
}

interface StealthEffectRef {
  activateStealth: () => void;
  isStealthed: boolean;
  hasShadowStrikeBuff: boolean;
  setIsStealthed: (value: boolean) => void;
  setHasShadowStrikeBuff: (value: boolean) => void;
}

export function useStealthEffect({
  onStealthStart,
  onStealthEnd,
  duration = 3500
}: UseStealthEffectProps = {}): StealthEffectRef {  
  const [isStealthed, setIsStealthed] = useState(false);
  const [hasShadowStrikeBuff, setHasShadowStrikeBuff] = useState(false);
  const stealthTimeout = useRef<NodeJS.Timeout | null>(null);

  const activateStealth = useCallback(() => {
    stealthManager.activateStealth();
    setIsStealthed(true);
    setHasShadowStrikeBuff(true);
    onStealthStart?.();
    
    clearTimeout(stealthTimeout.current!);
    
    stealthTimeout.current = setTimeout(() => {
      stealthManager.breakStealth();
      setIsStealthed(false);
      setHasShadowStrikeBuff(false);
      onStealthEnd?.();
    }, duration);
  }, [duration, onStealthStart, onStealthEnd]);

  useEffect(() => {
    return () => {
      if (stealthTimeout.current) {
        clearTimeout(stealthTimeout.current);
      }
    };
  }, []);

  return {
    activateStealth,
    isStealthed,
    hasShadowStrikeBuff,
    setIsStealthed,
    setHasShadowStrikeBuff
  };
}