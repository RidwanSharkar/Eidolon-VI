// src/color/DraconicWingJets.tsx

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Euler } from 'three';
import * as THREE from 'three';

interface WingJetProps {
  isActive: boolean;
  collectedBones: number;
  isLeftWing: boolean;
  parentRef: React.RefObject<Group>;
}

const DraconicWingJets: React.FC<WingJetProps> = ({ 
  isActive, 
  collectedBones, 
  isLeftWing 
}) => {
  const jetGroupRef = useRef<Group>(null);
  const [jetParticles, setJetParticles] = useState(() =>
    Array(12).fill(null).map((_, i) => ({
      id: i,
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      scale: Math.random() * 0.09 + 0.06,
      life: Math.random(),
      maxLife: Math.random() * 0.8 + 0.4
    }))
  );

  // Wing bone positions (matching BoneWings.tsx)
  const wingBonePositions = [
    // Main central arm bone
    { 
      pos: new Vector3(isLeftWing ? -0.3 : 0.3, 0.275, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 5 : Math.PI / 5), 
      scale: 1.2 
    },
    { 
      pos: new Vector3(isLeftWing ? -0.5 : 0.5, 0.45, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 3.5 : Math.PI / 3.5), 
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
      {/* Energy jets from each wing bone */}
      {wingBonePositions.slice(0, Math.min(wingBonePositions.length, collectedBones)).map((bone, i) => (
        <group
          key={`jet-${i}`}
          position={bone.pos}
          rotation={bone.rot}
          scale={bone.scale}
        >
          {/* Main energy beam */}
          <mesh position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.024, 0.3, 8]} />
            <meshStandardMaterial
              color="#4A90E2"
              emissive="#87CEEB"
              emissiveIntensity={3}
              transparent
              opacity={0.7}
              depthWrite={false}
            />
          </mesh>

          {/* Inner intense core */}
          <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.012, 0.3, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#E0F6FF"
              emissiveIntensity={4}
              transparent
              opacity={0.9}
              depthWrite={false}
            />
          </mesh>

          {/* Jet exhaust effect */}
          <mesh position={[0, 0, -0.33]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.03, 0.09, 8]} />
            <meshStandardMaterial
              color="#A5F3FC"
              emissive="#A5F3FC"
              emissiveIntensity={2}
              transparent
              opacity={0.5}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Point light for local illumination */}
          <pointLight
            color="#87CEEB"
            intensity={0.6}
            distance={0.9}
            decay={2}
            position={[0, 0, -0.15]}
          />
        </group>
      ))}

      {/* Jet particles */}
      <group>
        {jetParticles.map(particle => (
          <mesh 
            key={particle.id} 
            position={particle.position.toArray()}
            scale={[particle.scale, particle.scale, particle.scale]}
          >
            <icosahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial
              color="#E0F6FF"
              emissive="#4A90E2"
              emissiveIntensity={1.5}
              transparent
              opacity={particle.life / particle.maxLife * 0.8}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Additional ambient glow around wings */}
      <mesh scale={[0.6, 0.45, 0.3]} position={[isLeftWing ? -0.24 : 0.24, 0.15, -0.15]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#4A90E2"
          emissive="#87CEEB"
          emissiveIntensity={1.5}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default DraconicWingJets;