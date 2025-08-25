// src/Spells/Eviscerate/Eviscerate.tsx

import React, { useCallback } from 'react';
import { Vector3, Group } from 'three';
import EviscerateSlashEffect from './EviscerateSlashEffect';

interface EviscerateLProps {
  slashPhase: 'none' | 'first' | 'second';
  effectDirection: Vector3;
  parentRef: React.RefObject<Group>;
}

const Eviscerate: React.FC<EviscerateLProps> = ({
  slashPhase,
  effectDirection,
  parentRef
}) => {
  const handleFirstSlashComplete = useCallback(() => {
    // Effect completion is handled by the parent hook
  }, []);

  const handleSecondSlashComplete = useCallback(() => {
    // Effect completion is handled by the parent hook
  }, []);

  // Create proper position and direction like Oathstrike does
  const createEffectPosition = useCallback(() => {
    if (!parentRef.current) return new Vector3();
    const position = parentRef.current.position.clone();
    position.y += 1.25; // Same Y offset as Oathstrike
    return position;
  }, [parentRef]);

  return (
    <>
      {/* First slash effect - diagonal slash (45 degrees) */}
      {(slashPhase === 'first' || slashPhase === 'second') && parentRef.current && (
        <EviscerateSlashEffect
          key="eviscerate-first-slash"
          position={createEffectPosition()}
          direction={effectDirection}
          onComplete={handleFirstSlashComplete}
          parentRef={parentRef}
          rotationOffset={Math.PI / 2} // 45 degrees for first diagonal
        />
      )}
      
      {/* Second slash effect - opposite diagonal slash (-45 degrees) for X pattern */}
      {slashPhase === 'second' && parentRef.current && (
        <EviscerateSlashEffect
          key="eviscerate-second-slash"
          position={createEffectPosition()}
          direction={effectDirection}
          onComplete={handleSecondSlashComplete}
          parentRef={parentRef}
          rotationOffset={-Math.PI / 2} // -45 degrees for opposite diagonal
        />
      )}
    </>
  );
};

export default Eviscerate;
