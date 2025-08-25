// src/Versus/Ascendant/AscendantModel.tsx
import React, { useRef } from 'react';
import { Group, MeshStandardMaterial, SphereGeometry, CylinderGeometry, ConeGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import BoneTail from '../../gear/BoneTail';
import BonePlate from '../../gear/BonePlate';  
import AscendantBoneWings from './AscendantBoneWings';  
import AscendantBoneVortex from './AscendantBoneVortex';  
import DragonSkull from '../../gear/DragonSkull';  
import AscendantTrailEffect from './AscendantTrailEffect';
import * as THREE from 'three';
import AscendantBoneAura from './AscendantBoneAura';
import AscendantWingJets from './AscendantWingJets';

interface AscendantModelProps {
  isAttacking: boolean;
  onHit?: (damage: number) => void;
  attackingHand?: 'left' | 'right' | null;
  onLightningStart?: (hand: 'left' | 'right') => void;
}

// Materials for the arms
const standardBoneMaterial = new MeshStandardMaterial({
  color: "#e8e8e8",
  roughness: 0.4,
  metalness: 0.3
});

const darkBoneMaterial = new MeshStandardMaterial({
  color: "#d4d4d4",
  roughness: 0.3,
  metalness: 0.4
});

// Cache geometries for arm components - scaled to match Boss proportions
const armJointGeometry = new SphereGeometry(0.06, 6, 6);
const armBoneGeometry = new CylinderGeometry(0.06, 0.048, 1, 4);
const clawGeometry = new ConeGeometry(0.03, 0.15, 6);

function AscendantArm({ isRaised = false }: { isRaised?: boolean }) {
  const armRef = useRef<Group>(null);
  
  // Smooth animation for raising/lowering the arm
  useFrame((_, delta) => {
    if (!armRef.current) return;
    
    const targetRotation = isRaised ? -Math.PI/3 : 0; // More natural arm raise angle
    const currentRotation = armRef.current.rotation.x;
    const lerpFactor = 5 * delta; // Animation speed
    
    armRef.current.rotation.x = THREE.MathUtils.lerp(currentRotation, targetRotation, lerpFactor);
  });

  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={armBoneGeometry} material={standardBoneMaterial} scale={[width/0.06, length, width/0.06]} />
  );

  const createJoint = (size: number) => (
    <mesh geometry={armJointGeometry} material={standardBoneMaterial} scale={[size/0.06, size/0.06, size/0.06]} />
  );

  const createParallelBones = (length: number, spacing: number) => (
    <group>
      <group position={[spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.06)}
      </group>
      <group position={[-spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.06)}
      </group>
      <group position={[0, length/2, 0]}>
        {createJoint(0.075)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.075)}
      </group>
    </group>
  );

  return (
    <group ref={armRef}>
      {/* Upper arm - proportioned like Boss arms */}
      <group>
        {createParallelBones(1.0, 0.15)}
        
        {/* Elbow joint */}
        <group position={[0, -0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
          </mesh>
          
          {/* Forearm */}
          <group position={[0, -0.35, 0.275]} rotation={[-0.7, 0, 0]}>
            {createParallelBones(0.8, 0.12)}
            
            {/* Wrist/Hand */}
            <group position={[0, -0.5, 0]} rotation={[0, 0, 0]}>
              {createJoint(0.09)}
              
              {/* Hand structure - similar to Boss claw proportions */}
              <group position={[0, -0.1, 0]} scale={[1.2, 1.2, 1.2]}>
                <mesh>
                  <boxGeometry args={[0.2, 0.15, 0.08]} />
                  <meshStandardMaterial color="#e8e8e8" roughness={0.4} />
                </mesh>
                
                {/* Fingers for spell casting */}
                {[-0.08, -0.04, 0, 0.04, 0.08].map((offset, i) => (
                  <group 
                    key={i} 
                    position={[offset, -0.1, 0]}  
                    rotation={[0, 0, (i - 2) * Math.PI / 10]}
                  >
                    {createBoneSegment(0.5, 0.02)}
                    <group position={[0.025, -0.3, 0]} rotation={[0, 0, Math.PI/8]} scale={[1.2, 1.2, 1.2]}>
                      <mesh geometry={clawGeometry} material={darkBoneMaterial} />
                    </group>
                  </group>
                ))}

                {/* Palm energy glow when raised (for lightning casting) */}
                {isRaised && (
                  <group position={[0, -0.05, 0.1]}>
                    <mesh>
                      <sphereGeometry args={[0.06, 8, 8]} />
                      <meshStandardMaterial
                        color="#FF0000"
                        emissive="#FF0000"
                        emissiveIntensity={2}
                        transparent
                        opacity={0.8}
                      />
                    </mesh>
                    <pointLight 
                      color="#FF0000"
                      intensity={1.5}
                      distance={2}
                      decay={2}
                    />
                  </group>
                )}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function AscendantModel({ 
  isAttacking, 
  attackingHand = null,
  onLightningStart 
}: AscendantModelProps) {
  const groupRef = useRef<Group>(null);
  const attackCycleRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isAttacking && attackingHand) {
      attackCycleRef.current += delta * 4; // Animation speed
      
      // Trigger lightning at specific phase
      if (attackCycleRef.current > Math.PI/3 && attackCycleRef.current < Math.PI/2 && onLightningStart) {
        onLightningStart(attackingHand);
      }
      
      if (attackCycleRef.current >= Math.PI) {
        attackCycleRef.current = 0;
      }
    } else {
      attackCycleRef.current = 0;
    }
  });

  return (
    <group ref={groupRef} scale={[1.275, 1.275, 1.275]}> {/* Slightly larger than Reaper */}
      {/* Reaper Skull - slightly larger */}
      <group scale={[0.8, 0.8, 0.8]} position={[0, 1.35, 0.2]} rotation={[0.5, 0, 0]}>
        <DragonSkull />
      </group>

      {/* Scaled Bone Plate */}
      <group scale={[1.1, 1.0, 0.9]} position={[0, 1.1, 0]} rotation={[0.3, 0, 0]}>
        <BonePlate />
      </group>

      {/* Scaled Wings - slightly larger */}
      <group scale={[1.175, 1.275, -0.9]} position={[0, 0.775, 0]}>
        {/* Left Wing */}
        <group rotation={[0, Math.PI / 5, 0]}>
          <AscendantBoneWings 
            collectedBones={15} 
            isLeftWing={true}
            parentRef={groupRef} 
          />
          {/* Ascendant Wing Jets - Left */}
          <AscendantWingJets 
            isActive={true}
            collectedBones={15}
            isLeftWing={true}
            parentRef={groupRef}
          />
        </group>
        
        {/* Right Wing */}
        <group rotation={[0, -Math.PI / 5, 0]}>
          <AscendantBoneWings 
            collectedBones={15} 
            isLeftWing={false}
            parentRef={groupRef} 
          />
          {/* Ascendant Wing Jets - Right */}
          <AscendantWingJets 
            isActive={true}
            collectedBones={15}
            isLeftWing={false}
            parentRef={groupRef}
          />
        </group>
      </group>

      {/* Scaled Tail */}
      <group scale={[1.3, 1.3, 1.3]} position={[0, 1.25, 0.14]}>
        <BoneTail />
      </group>

      {/* Add Glowing Core Effect */}
      <group position={[0, 1, 0]} scale={[0.7, 0.7, 0.7]}>
        <AscendantTrailEffect parentRef={groupRef} />
      </group>

      <group position={[0, 1.5, 0.25]} scale={[0.4, 0.4, 0.4]}>
        <AscendantTrailEffect parentRef={groupRef} />
      </group>


      <group position={[0, 1.8, 0.35]} scale={[0.4, 0.4, 0.4]}>
        <AscendantTrailEffect parentRef={groupRef} />
      </group>


      {/* Bone Vortex Effects */}
      <group scale={[1.45, 1.9, 1.45]} position={[0, -0.25, 0]}>
        {/* Front and Back Vortexes only */}
        <group position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
          <AscendantBoneVortex parentRef={groupRef} />
        </group>
        <group position={[0, 0, -0.1]} rotation={[0, Math.PI, 0]}>
          <AscendantBoneVortex parentRef={groupRef} />
        </group>
      </group>

      {/* Left Arm - positioned and scaled like Boss claws */}
      <group 
        position={[-0.5, 1.4, 0.1]} 
        rotation={[0, Math.PI/6, 0]}
        scale={[0.45, 0.375, 0.45]}
      >
        <AscendantArm 
          isRaised={isAttacking && attackingHand === 'left'} 
        />
      </group>

      {/* Right Arm - positioned and scaled like Boss claws */}
      <group 
        position={[0.5, 1.4, 0.1]} 
        rotation={[0, -Math.PI/6, 0]}
        scale={[0.45, 0.375, 0.45]}
      >
        <AscendantArm 
          isRaised={isAttacking && attackingHand === 'right'} 
        />
      </group>

      {/* Left Shoulder Sphere */}
      <mesh position={[-0.5, 1.7, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color="#CC0000"
          emissive="#FF0000"
          emissiveIntensity={0.4}
          transparent
          opacity={0.9}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Left Shoulder Ring */}
      <mesh position={[-0.5, 1.7, 0]} rotation={[Math.PI / 2, -Math.PI / 4, 0]}>
        <torusGeometry args={[0.325, 0.05, 8, 16]} />
        <meshStandardMaterial
          color="#FF4444"
          emissive="#FF0000"
          emissiveIntensity={0.6}
          transparent
          opacity={0.95}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Right Shoulder Sphere */}
      <mesh position={[0.5, 1.7, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color="#CC0000"
          emissive="#FF0000"
          emissiveIntensity={0.4}
          transparent
          opacity={0.9}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Right Shoulder Ring */}
      <mesh position={[0.5, 1.7, 0]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <torusGeometry args={[0.325, 0.05, 8, 16]} />
        <meshStandardMaterial
          color="#FF4444"
          emissive="#FF0000"
          emissiveIntensity={0.6}
          transparent
          opacity={0.95}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Bone Aura */}
      <group position={[0, 0.12, 0]} scale={[0.65, 0.65, 0.65]}>
        <AscendantBoneAura parentRef={groupRef} />
      </group>

      {/* Enhanced red energy aura for Ascendant */}
      <group position={[0, 1.2, 0]}>
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial
            color="#440000"
            emissive="#660000"
            emissiveIntensity={0.5}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

 

    </group>
  );
}