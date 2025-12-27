import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, AdditiveBlending, OctahedronGeometry, SphereGeometry, TorusGeometry, CylinderGeometry, ConeGeometry } from 'three';
import { MathUtils, Mesh } from 'three';
import ElementalVortex from './ElementalVortex';

// MEMORY FIX: Create static geometries once
const ELEMENTAL_GEOMETRIES = {
  body: new OctahedronGeometry(0.8, 0),
  head: new OctahedronGeometry(0.4, 0),
  shoulder: new SphereGeometry(0.325, 16, 16),
  shoulderRing: new TorusGeometry(0.4, 0.05, 8, 16),
  arm: new CylinderGeometry(0.15, 0.15, 1.0, 6),
  aura: new SphereGeometry(1.35, 16, 16),
  iceSpike: new ConeGeometry(0.1, 0.8, 6),
  iceSpikeSmall: new ConeGeometry(0.08, 0.6, 6),
  icicleOrbital: new ConeGeometry(0.075, 0.3, 6)
};

interface ElementalModelProps {
  isAttacking?: boolean;
}

export default function ElementalModel({ isAttacking = false }: ElementalModelProps) {
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(timeRef.current * 2) * 0.1;
      
      // Only rotate when not attacking (parent will handle facing target when attacking)
      if (!isAttacking) {
        groupRef.current.rotation.y += delta * 0.5;
      }
      
      // Left arm attack animation - similar to Death Knight
      const leftArm = groupRef.current.getObjectByName('LeftArm') as Mesh;
      if (leftArm) {
        if (isAttacking) {
          // Raise left arm for spell casting (similar to Death Knight Frost Strike)
          const targetRotation = -Math.PI / 3; // Raise arm up for casting
          const currentRotation = leftArm.rotation.x;
          const lerpFactor = 8 * delta; // Fast animation speed
          
          leftArm.rotation.x = MathUtils.lerp(currentRotation, targetRotation, lerpFactor);
          leftArm.rotation.z = MathUtils.lerp(leftArm.rotation.z, 0.2, lerpFactor); // Slight outward rotation
        } else {
          // Return to neutral position
          const currentRotation = leftArm.rotation.x;
          const currentZ = leftArm.rotation.z;
          const lerpFactor = 6 * delta; // Slightly slower return
          
          leftArm.rotation.x = MathUtils.lerp(currentRotation, 0, lerpFactor);
          leftArm.rotation.z = MathUtils.lerp(currentZ, 0, lerpFactor);
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main body - ice crystal structure - MEMORY FIX: Use shared geometry */}
      <mesh position={[0, 1.15, 0]} geometry={ELEMENTAL_GEOMETRIES.body}>
        <meshStandardMaterial
          color="#4FC3F7"
          emissive="#29B6F6"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Head - MEMORY FIX: Use shared geometry */}
      <mesh position={[0, 1.85, 0]} geometry={ELEMENTAL_GEOMETRIES.head}>
        <meshStandardMaterial
          color="#81D4FA"
          emissive="#4FC3F7"
          emissiveIntensity={0.4}
          transparent
          opacity={0.85}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Left Shoulder - MEMORY FIX: Use shared geometry */}
      <mesh position={[-0.7, 1.5, 0]} geometry={ELEMENTAL_GEOMETRIES.shoulder}>
        <meshStandardMaterial
          color="#81D4FA"
          emissive="#4FC3F7"
          emissiveIntensity={0.3}
          transparent
          opacity={0.85}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Left Shoulder Ring - MEMORY FIX: Use shared geometry */}
      <mesh position={[-0.7, 1.5, 0]} rotation={[Math.PI / 2, -Math.PI / 4, 0]} geometry={ELEMENTAL_GEOMETRIES.shoulderRing}>
        <meshStandardMaterial
          color="#E1F5FE"
          emissive="#B3E5FC"
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Left Arm - animated for attacks - MEMORY FIX: Use shared geometry */}
      <mesh 
        name="LeftArm"
        position={[-0.7, 1.0, 0.4]} 
        rotation={[0, 0, 0]} // Default down position
        geometry={ELEMENTAL_GEOMETRIES.arm}
      >
        <meshStandardMaterial
          color="#4FC3F7"
          emissive="#29B6F6"
          emissiveIntensity={0.2}
          transparent
          opacity={0.675}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Right Shoulder - MEMORY FIX: Use shared geometry */}
      <mesh position={[0.7, 1.5, 0]} geometry={ELEMENTAL_GEOMETRIES.shoulder}>
        <meshStandardMaterial
          color="#81D4FA"
          emissive="#4FC3F7"
          emissiveIntensity={0.3}
          transparent
          opacity={0.85}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Right Shoulder Ring - MEMORY FIX: Use shared geometry */}
      <mesh position={[0.7, 1.5, 0]} rotation={[Math.PI / 2,  Math.PI / 4, 0]} geometry={ELEMENTAL_GEOMETRIES.shoulderRing}>
        <meshStandardMaterial
          color="#E1F5FE"
          emissive="#B3E5FC"
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Right Arm - stays down - MEMORY FIX: Use shared geometry */}
      <mesh position={[0.7, 1.0, 0]} rotation={[0, 0, 0]} geometry={ELEMENTAL_GEOMETRIES.arm}>
        <meshStandardMaterial
          color="#4FC3F7"
          emissive="#29B6F6"
          emissiveIntensity={0.2}
          transparent
          opacity={0.675}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>



      {/* Water aura effect - MEMORY FIX: Use shared geometry */}
      <mesh position={[0, 1.0, 0]} geometry={ELEMENTAL_GEOMETRIES.aura}>
        <meshStandardMaterial
          color="#29B6F6"
          emissive="#0277BD"
          emissiveIntensity={0.1}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>


      {/* Attack animation - ice spikes when attacking - MEMORY FIX: Use shared geometries */}
      {isAttacking && (
        <>
          <mesh position={[0, 1.2, 1.5]} rotation={[Math.PI / 2, 0, 0]} geometry={ELEMENTAL_GEOMETRIES.iceSpike}>
            <meshStandardMaterial
              color="#E1F5FE"
              emissive="#81D4FA"
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          
          <mesh position={[0.5, 1.2, 1.3]} rotation={[Math.PI / 2, 0, Math.PI / 6]} geometry={ELEMENTAL_GEOMETRIES.iceSpikeSmall}>
            <meshStandardMaterial
              color="#E1F5FE"
              emissive="#81D4FA"
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          
          <mesh position={[-0.5, 1.2, 1.3]} rotation={[Math.PI / 2, 0, -Math.PI / 6]} geometry={ELEMENTAL_GEOMETRIES.iceSpikeSmall}>
            <meshStandardMaterial
              color="#E1F5FE"
              emissive="#81D4FA"
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          <ElementalVortex parentRef={groupRef} />
        </>
      )}

      {/* Horizontal Icicle Orbital Ring (XZ plane) - MEMORY FIX: Use shared geometry */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + timeRef.current * 1.2;
        const radius = 0.8;
        const x = Math.cos(angle) * radius;
        const y = 1.5 + Math.sin(angle) * radius; // Vertical orbital motion
        const z = Math.cos(timeRef.current * 1.5 + i) * 0.2; // Slight Z variation

        return (
          <group
            key={`horizontal-${i}`}
            position={[x, y, z]}
            rotation={[
              Math.PI/2,
              angle + Math.PI ,
              -Math.PI/2
            ]}
          >
            <mesh geometry={ELEMENTAL_GEOMETRIES.icicleOrbital}>
              <meshStandardMaterial
                color="#CCFFFF"
                emissive="#CCFFFF"
                emissiveIntensity={0.8}
                transparent
                opacity={1.0}
              />
            </mesh>
          </group>
        );
      })}

      {/* Vertical Icicle Orbital Ring (XY plane) - Perpendicular to horizontal - MEMORY FIX: Use shared geometry */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + timeRef.current * 1.2 + Math.PI / 8; // Slight offset
        const radius = 0.8;
        const x = Math.cos(angle) * radius;
        const y = 1.5 + Math.sin(angle) * radius; // Vertical orbital motion
        const z = Math.cos(timeRef.current * 1.5 + i) * 0.2; // Slight Z variation

        return (
          <group
            key={`vertical-${i}`}
            position={[x, y, z]}
            rotation={[
              Math.PI / 2,
              angle,
              0
            ]}
          >
            <mesh geometry={ELEMENTAL_GEOMETRIES.icicleOrbital}>
              <meshStandardMaterial
                color="#AAEEFF"
                emissive="#AAEEFF"
                emissiveIntensity={0.8}
                transparent
                opacity={1.0}
              />
            </mesh>
          </group>
        );
      })}

      {/* Point light for glow effect */}
      <pointLight
        color="#4FC3F7"
        intensity={0.5}
        distance={3}
        decay={2}
      />
    </group>
  );
} 