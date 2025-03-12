import React, { forwardRef, useImperativeHandle } from 'react';
import { Group } from 'three';
import { useReigniteManager } from './useReigniteManager';
import { ChargeStatus } from '@/color/ChargedOrbitals';

interface ReigniteProps {
  parentRef: React.RefObject<Group>;
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
}

export interface ReigniteRef {
  processKill: () => void;
}

const Reignite = forwardRef<ReigniteRef, ReigniteProps>(({
  charges,
  setCharges,
}, ref) => {
  const { restoreCharge } = useReigniteManager({
    charges,
    setCharges,
  });

  useImperativeHandle(ref, () => ({
    processKill: restoreCharge
  }));

  // This component doesn't render anything visually
  return null;
});

Reignite.displayName = 'Reignite';

export default Reignite;