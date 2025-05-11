import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useReigniteManager } from './useReigniteManager';
import { ChargeStatus } from '@/color/ChargedOrbitals';
import { useFrame } from '@react-three/fiber';

interface ReigniteProps {
  parentRef: React.RefObject<Group>;
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
  isActive?: boolean; // Determines if the effect is active
}

export interface ReigniteRef {
  processKill: (position?: Vector3) => void;
}

const Reignite = forwardRef<ReigniteRef, ReigniteProps>(({
  parentRef,
  setCharges,
  isActive = true // Default to true for backward compatibility
}, ref) => {
  const groupRef = useRef<Group>(null);
  const [showExplosion, setShowExplosion] = useState(false);
  const explosionScaleRef = useRef(0.1);
  const explosionStartTimeRef = useRef(0);
  const EXPLOSION_DURATION = 0.75; // Explosion duration in seconds

  const { restoreCharge } = useReigniteManager({
    setCharges,
  });

  // Simplified process kill function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processKillWithEffect = (position?: Vector3) => {
    // We're simplifying so we don't use position, but we keep the parameter
    // for API compatibility
    if (!isActive) {
      console.log(`[Reignite] Kill detected but Reignite not active (not using Spear with passive)`);
      return;
    }
    
    console.log(`[Reignite] Calling restoreCharge() to replenish orbs`);
    
    // Restore charge immediately
    restoreCharge();
    
    // Show explosion effect
    setShowExplosion(true);
    explosionScaleRef.current = 0.1;
    explosionStartTimeRef.current = Date.now();
  };

  useImperativeHandle(ref, () => ({
    processKill: processKillWithEffect
  }));

  useFrame(() => {
    if (groupRef.current && parentRef.current) {
      // Position the effect at the player's position
      groupRef.current.position.copy(parentRef.current.position);
      groupRef.current.position.y = 1; // Slightly above ground
    }

    // Animate the explosion if it's active
    if (showExplosion) {
      const elapsed = (Date.now() - explosionStartTimeRef.current) / 1000;
      
      if (elapsed < EXPLOSION_DURATION) {
        // Calculate scale based on elapsed time - start small, expand quickly, then slow
        const progress = elapsed / EXPLOSION_DURATION;
        
        // Use a non-linear scale function for more dynamic effect
        // Fast expansion at first, slowing down towards the end
        explosionScaleRef.current = 3 * Math.pow(progress, 0.5) * (1 - progress * 0.5);
      } else {
        setShowExplosion(false);
      }
    }
  });

  // Don't render anything if not active
  if (!isActive) return null;

  return (
    <group ref={groupRef}>
      {/* Simple explosion effect */}
      {showExplosion && (
        <mesh>
          <sphereGeometry args={[explosionScaleRef.current, 24, 24]} />
          <meshStandardMaterial
            color="#ff3300"
            emissive="#ff0000"
            emissiveIntensity={2}
            transparent
            opacity={1 - (explosionScaleRef.current / 3)} // Fade out as it expands
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Optional glow light */}
      {showExplosion && (
        <pointLight
          color="#ff3300"
          intensity={5 * (1 - explosionScaleRef.current / 3)}
          distance={5}
          decay={2}
        />
      )}
    </group>
  );
});

// Add display name to fix linter error
Reignite.displayName = 'Reignite';

export default Reignite;