import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Group } from 'three';
import { useReigniteManager } from './useReigniteManager';
import { ChargeStatus } from '@/color/ChargedOrbitals';
import { useFrame } from '@react-three/fiber';


interface ReigniteProps {
  parentRef: React.RefObject<Group>;
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
}

export interface ReigniteRef {
  processKill: () => void;
}

const Reignite = forwardRef<ReigniteRef, ReigniteProps>(({
  parentRef,
  setCharges,
}, ref) => {
  const auraRef = useRef<Group>(null);
  const rotationSpeed = 0.10; 

  const { restoreCharge } = useReigniteManager({
    setCharges,
  });

  useImperativeHandle(ref, () => ({
    processKill: restoreCharge
  }));

  useFrame(() => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.015, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.008;
    }
  });

  return (
    <group ref={auraRef}>
      {/* Rotating inner elements */}
      <group rotation={[0, 0, 0]} position={[0, 0.005, 0]}>
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, rotation + Date.now() * 0.001]}>
            <ringGeometry args={[0.85, 1.0, 3]} />
            <meshStandardMaterial
              color="#ff3300"
              emissive="#ff0000"
              emissiveIntensity={2.5}
              transparent
              opacity={0.65}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Circle */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.925, 0.5, -0.175, 32]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#cc0000"
          emissiveIntensity={1.2}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

Reignite.displayName = 'Reignite';

export default Reignite;