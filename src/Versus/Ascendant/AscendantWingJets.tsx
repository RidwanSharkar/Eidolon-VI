// src/color/DraconicWingJets.tsx

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Euler } from 'three';

// MEMORY FIX: Shared vectors and euler to prevent creating new objects every render/frame
const SHARED_WING_POSITION = new Vector3(0, -0.3, 0);
const SHARED_WING_ROTATION = new Euler(0, Math.PI, 0);


interface WingJetProps {
  isActive: boolean;
  collectedBones: number;
  isLeftWing: boolean;
  parentRef: React.RefObject<Group>;
}

const AscendantWingJets: React.FC<WingJetProps> = ({ 
  isActive, 
  isLeftWing 
}) => {
  const jetGroupRef = useRef<Group>(null);

  // MEMORY FIX: Removed particle simulation that was updating state every frame
  // but wasn't being rendered. This saves significant CPU cycles.
  useFrame((_, delta) => {
    if (!isActive || !jetGroupRef.current) return;
    // Rotate the entire jet group for dynamic effect
    jetGroupRef.current.rotation.z += delta * 0.5;
  });

  if (!isActive) return null;

  return (
    <group
      ref={jetGroupRef}
      rotation={SHARED_WING_ROTATION}
      position={SHARED_WING_POSITION}
    >
      {/* Additional ambient glow around wings */}
      <mesh scale={[0.6, 0.45, 0.3]} position={[isLeftWing ? -0.24 : 0.24, 0.15, -0.15]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#E24A4A"
          emissive="#FF6666"
          emissiveIntensity={1.5}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default AscendantWingJets;