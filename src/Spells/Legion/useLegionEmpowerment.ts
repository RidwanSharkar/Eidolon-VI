import { useState, useRef, useCallback, useEffect } from 'react';

interface LegionEmpowermentState {
  isEmpowered: boolean;
  timeRemaining: number;
}

export interface LegionEmpowermentRef {
  isEmpowered: boolean;
  timeRemaining: number;
  activateEmpowerment: () => void;
}

export function useLegionEmpowerment() {
  const [state, setState] = useState<LegionEmpowermentState>({
    isEmpowered: false,
    timeRemaining: 0
  });

  const empowermentIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const EMPOWERMENT_DURATION = 10000; // 10 seconds in milliseconds

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      const empowermentInterval = empowermentIntervalRef.current;
      if (empowermentInterval) {
        clearInterval(empowermentInterval);
      }
    };
  }, []);

  const activateEmpowerment = useCallback(() => {
    console.log('[useLegionEmpowerment] Activating empowerment for 10 seconds');
    setState({
      isEmpowered: true,
      timeRemaining: EMPOWERMENT_DURATION
    });

    // Clear any existing intervals
    if (empowermentIntervalRef.current) {
      clearInterval(empowermentIntervalRef.current);
    }

      // Update timer every 100ms for smooth UI updates
  empowermentIntervalRef.current = setInterval(() => {
    setState(prev => {
      const newRemaining = Math.max(0, prev.timeRemaining - 100);
      
      if (newRemaining <= 0) {
        // Empowerment finished
        if (empowermentIntervalRef.current) {
          clearInterval(empowermentIntervalRef.current);
          empowermentIntervalRef.current = null;
        }
        
        console.log('[useLegionEmpowerment] Empowerment expired');
        return {
          isEmpowered: false,
          timeRemaining: 0
        };
      }
      
      return {
        ...prev,
        timeRemaining: newRemaining
      };
    });
  }, 100);
  }, []);

  return {
    isEmpowered: state.isEmpowered,
    timeRemaining: state.timeRemaining,
    activateEmpowerment
  };
}
