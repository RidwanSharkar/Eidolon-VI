import { useCallback, useRef } from 'react';
import { ChargeStatus, ORBITAL_COOLDOWN } from './ChargedOrbitals';

interface OrbRegenerationQueue {
  chargeId: number;
  startTime: number;
}

interface UseOrbRegenerationProps {
  setCharges: React.Dispatch<React.SetStateAction<ChargeStatus[]>>;
}

export function useOrbRegeneration({ setCharges }: UseOrbRegenerationProps) {
  const regenerationQueue = useRef<OrbRegenerationQueue[]>([]);
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const clearAllTimeouts = useCallback(() => {
    activeTimeouts.current.forEach(timeout => clearTimeout(timeout));
    activeTimeouts.current.clear();
    regenerationQueue.current = [];
  }, []);

  const addToRegenerationQueue = useCallback((chargeId: number) => {
    const now = Date.now();
    
    // Add to queue
    regenerationQueue.current.push({
      chargeId,
      startTime: now
    });

    // Sort queue by start time to maintain order
    regenerationQueue.current.sort((a, b) => a.startTime - b.startTime);

    // Calculate delay based on position in queue
    const queuePosition = regenerationQueue.current.findIndex(item => item.chargeId === chargeId);
    const delay = ORBITAL_COOLDOWN + (queuePosition * ORBITAL_COOLDOWN);

    const timeout = setTimeout(() => {
      // Remove from active timeouts
      activeTimeouts.current.delete(timeout);
      
      // Remove from queue
      regenerationQueue.current = regenerationQueue.current.filter(item => item.chargeId !== chargeId);
      
      // Restore the charge
      setCharges(prev => prev.map(charge => 
        charge.id === chargeId
          ? { ...charge, available: true, cooldownStartTime: null }
          : charge
      ));
    }, delay);

    activeTimeouts.current.add(timeout);
  }, [setCharges]);

  const consumeOrbs = useCallback((count: number, charges: ChargeStatus[]) => {
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length < count) {
      return false;
    }

    const now = Date.now();
    const chargesToConsume = availableCharges.slice(0, count);

    // Update charges state immediately
    setCharges(prev => prev.map(charge => {
      const shouldConsume = chargesToConsume.some(c => c.id === charge.id);
      return shouldConsume
        ? { ...charge, available: false, cooldownStartTime: now }
        : charge;
    }));

    // Add each consumed charge to the regeneration queue
    chargesToConsume.forEach(charge => {
      addToRegenerationQueue(charge.id);
    });

    return true;
  }, [setCharges, addToRegenerationQueue]);

  const consumeSingleOrb = useCallback((charges: ChargeStatus[]) => {
    return consumeOrbs(1, charges);
  }, [consumeOrbs]);

  return {
    consumeOrbs,
    consumeSingleOrb,
    addToRegenerationQueue,
    clearAllTimeouts
  };
}
