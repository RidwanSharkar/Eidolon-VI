// src/color/DraconicWingJets.tsx

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Euler } from 'three';


interface WingJetProps {
  isActive: boolean;
  collectedBones: number;
  isLeftWing: boolean;
  parentRef: React.RefObject<Group>;
}

const AscendantWingJets: React.FC<WingJetProps> = ({ 
  isActive, 
  collectedBones, 
  isLeftWing 
}) => {
  const jetGroupRef = useRef<Group>(null);
  const [, setJetParticles] = useState(() =>
    Array(12).fill(null).map((_, i) => ({
      id: i,
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      scale: Math.random() * 0.09 + 0.06,
      life: Math.random(),
      maxLife: Math.random() * 0.8 + 0.4
    }))
  );

  // Wing bone positions (matching AscendantBoneWings.tsx)
  const wingBonePositions = [
    // Main central arm bone
    { 
      pos: new Vector3(isLeftWing ? -0.3 : 0.3, 0.275, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / -5 : Math.PI / -5), 
      scale: 1.2 
    },
    { 
      pos: new Vector3(isLeftWing ? -0.5 : 0.5, 0.45, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / -3.5 : Math.PI / -3.5), 
      scale: 1.4 
    },
    
    // Upper wing section
    { 
      pos: new Vector3(isLeftWing ? -0.65 : 0.65, 0.6, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 2.5 : Math.PI / 2.5), 
      scale: 1.0 
    },
    { 
      pos: new Vector3(isLeftWing ? -0.85 : 0.85, 0.72, 0.1), 
      rot: new Euler(0.1, 0, isLeftWing ? -Math.PI / 2.2 : Math.PI / 2.2), 
      scale: 1.0 
    },
    { 
      pos: new Vector3(isLeftWing ? -1.05 : 1.05, 0.8, 0.2), 
      rot: new Euler(0.2, 0, isLeftWing ? -Math.PI / 2 : Math.PI / 2), 
      scale: 0.9 
    },
    { 
      pos: new Vector3(isLeftWing ? -1.2 : 1.2, 0.9, 0.2), 
      rot: new Euler(0.2, 0, isLeftWing ? -Math.PI / 1.8 : Math.PI / 1.8), 
      scale: 0.8 
    },
    { 
      pos: new Vector3(isLeftWing ? -1.3 : 1.3, 0.75, 0.2), 
      rot: new Euler(0.05, 0, isLeftWing ? -Math.PI / -0.475 : Math.PI / -0.475), 
      scale: 1.0 
    },

    // Lower wing section
    { 
      pos: new Vector3(isLeftWing ? -1.13 : 1.13, 0.445, 0.17), 
      rot: new Euler(0.2, 0, isLeftWing ? -Math.PI / -0.45 : Math.PI / -0.45), 
      scale: 0.8 
    },
  ];

  useFrame((_, delta) => {
    if (!isActive || !jetGroupRef.current) return;

    // Animate jet particles
    setJetParticles(prev => prev.map(particle => {
      // Update particle life
      particle.life -= delta * 2;
      
      // Reset particle if it died
      if (particle.life <= 0) {
        const boneIndex = Math.floor(Math.random() * Math.min(wingBonePositions.length, collectedBones));
        const bone = wingBonePositions[boneIndex];
        
        // Start from bone position
        particle.position.copy(bone.pos);
        particle.position.y -= 0.3; // Offset for parent positioning
        
        // Jet direction based on bone rotation and wing side
        const jetDirection = new Vector3(
          isLeftWing ? -1 : 1, // Outward from body
          -0.3, // Slightly downward
          -0.8  // Backward thrust
        ).normalize();
        
        particle.velocity.copy(jetDirection).multiplyScalar(2 + Math.random() * 3);
        particle.life = particle.maxLife;
      } else {
        // Move particle
        particle.position.add(particle.velocity.clone().multiplyScalar(delta));
        
        // Add some turbulence
        particle.velocity.x += (Math.random() - 0.5) * 0.02;
        particle.velocity.y += (Math.random() - 0.5) * 0.02;
      }
      
      return particle;
    }));

    // Rotate the entire jet group for dynamic effect
    jetGroupRef.current.rotation.z += delta * 0.5;
  });

  if (!isActive) return null;

  return (
    <group 
      ref={jetGroupRef}
      rotation={new Euler(0, Math.PI, 0)}
      position={new Vector3(0, -0.3, 0)}
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