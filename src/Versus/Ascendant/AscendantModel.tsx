// src/Versus/Ascendant/AscendantModel.tsx
import React, { useRef } from 'react';
import { Group, MeshStandardMaterial, SphereGeometry, CylinderGeometry, ConeGeometry, BoxGeometry, TorusGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import BonePlate from '../../gear/BonePlate';  
import AscendantBoneWings from './AscendantBoneWings';  
import AscendantBoneVortex from './AscendantBoneVortex';  
import DragonSkull from '../../gear/DragonSkull';  
import AscendantTrailEffect from './AscendantTrailEffect';
import {
  AdditiveBlending,
  Material,
  MathUtils,
  Mesh,
  Object3D
} from 'three';
import AscendantBoneAura from './AscendantBoneAura';
import AscendantWingJets from './AscendantWingJets';

interface AscendantModelProps {
  isAttacking: boolean;
  onHit?: (damage: number) => void;
  attackingHand?: 'left' | 'right' | null;
  onLightningStart?: (hand: 'left' | 'right') => void;
}

// MEMORY FIX: Shared geometries for all AscendantModel instances
const SHARED_GEOMETRIES = {
  armJoint: new SphereGeometry(0.06, 6, 6),
  armBone: new CylinderGeometry(0.06, 0.048, 1, 4),
  claw: new ConeGeometry(0.03, 0.15, 6),
  elbowJoint: new SphereGeometry(0.12, 12, 12),
  handBox: new BoxGeometry(0.2, 0.15, 0.08),
  palmGlow: new SphereGeometry(0.06, 8, 8),
  // MEMORY FIX: Add shoulder geometries
  shoulderSphere: new SphereGeometry(0.25, 16, 16),
  shoulderRing: new TorusGeometry(0.325, 0.05, 8, 16),
  energyAura: new SphereGeometry(0.8, 16, 16)
};

// MEMORY FIX: Shared materials for all AscendantModel instances
const SHARED_MATERIALS = {
  standardBone: new MeshStandardMaterial({
    color: "#e8e8e8",
    roughness: 0.4,
    metalness: 0.3
  }),
  darkBone: new MeshStandardMaterial({
    color: "#d4d4d4",
    roughness: 0.3,
    metalness: 0.4
  }),
  palmGlow: new MeshStandardMaterial({
    color: "#FF0000",
    emissive: "#FF0000",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8
  }),
  // MEMORY FIX: Add shoulder materials
  shoulderSphere: new MeshStandardMaterial({
    color: "#CC0000",
    emissive: "#FF0000",
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.9,
    metalness: 0.7,
    roughness: 0.3
  }),
  shoulderRing: new MeshStandardMaterial({
    color: "#FF4444",
    emissive: "#FF0000",
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.95,
    metalness: 0.8,
    roughness: 0.2
  }),
  energyAura: new MeshStandardMaterial({
    color: "#440000",
    emissive: "#660000",
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.15,
    blending: AdditiveBlending
  })
};

// Mark all as shared to prevent disposal
Object.values(SHARED_GEOMETRIES).forEach(geo => {
  geo.userData = { shared: true };
});
Object.values(SHARED_MATERIALS).forEach(mat => {
  mat.userData = { shared: true };
});

function AscendantArm({ isRaised = false }: { isRaised?: boolean }) {
  const armRef = useRef<Group>(null);
  
  // Smooth animation for raising/lowering the arm
  useFrame((_, delta) => {
    if (!armRef.current) return;
    
    const targetRotation = isRaised ? -Math.PI/3 : 0; // More natural arm raise angle
    const currentRotation = armRef.current.rotation.x;
    const lerpFactor = 5 * delta; // Animation speed
    
    armRef.current.rotation.x = MathUtils.lerp(currentRotation, targetRotation, lerpFactor);
  });

  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={SHARED_GEOMETRIES.armBone} material={SHARED_MATERIALS.standardBone} scale={[width/0.06, length, width/0.06]} />
  );

  const createJoint = (size: number) => (
    <mesh geometry={SHARED_GEOMETRIES.armJoint} material={SHARED_MATERIALS.standardBone} scale={[size/0.06, size/0.06, size/0.06]} />
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
          <mesh geometry={SHARED_GEOMETRIES.elbowJoint} material={SHARED_MATERIALS.standardBone} />
          
          {/* Forearm */}
          <group position={[0, -0.35, 0.275]} rotation={[-0.7, 0, 0]}>
            {createParallelBones(0.8, 0.12)}
            
            {/* Wrist/Hand */}
            <group position={[0, -0.5, 0]} rotation={[0, 0, 0]}>
              {createJoint(0.09)}
              
              {/* Hand structure - similar to Boss claw proportions */}
              <group position={[0, -0.1, 0]} scale={[1.2, 1.2, 1.2]}>
                <mesh geometry={SHARED_GEOMETRIES.handBox} material={SHARED_MATERIALS.standardBone} />
                
                {/* Fingers for spell casting */}
                {[-0.08, -0.04, 0, 0.04, 0.08].map((offset, i) => (
                  <group 
                    key={i} 
                    position={[offset, -0.1, 0]}  
                    rotation={[0, 0, (i - 2) * Math.PI / 10]}
                  >
                    {createBoneSegment(0.5, 0.02)}
                    <group position={[0.025, -0.3, 0]} rotation={[0, 0, Math.PI/8]} scale={[1.2, 1.2, 1.2]}>
                      <mesh geometry={SHARED_GEOMETRIES.claw} material={SHARED_MATERIALS.darkBone} />
                    </group>
                  </group>
                ))}

                {/* Palm energy glow when raised (for lightning casting) */}
                {isRaised && (
                  <group position={[0, -0.05, 0.1]}>
                    <mesh geometry={SHARED_GEOMETRIES.palmGlow} material={SHARED_MATERIALS.palmGlow} />
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

  // Cleanup Three.js resources on unmount
  React.useEffect(() => {
    // Capture the current ref value to use in cleanup
    const currentGroupRef = groupRef.current;

    return () => {
      if (currentGroupRef) {
        currentGroupRef.traverse((child: Object3D) => {
          if (child instanceof Mesh) {
            // Dispose geometries (but not shared ones)
            if (child.geometry && !child.geometry.userData?.shared) {
              child.geometry.dispose();
            }

            // Dispose materials
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((material: Material) => material.dispose());
              } else {
                (child.material as Material).dispose();
              }
            }
          }
        });
      }
    };
  }, []);

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

      {/* Left Shoulder Sphere - MEMORY FIX: Use shared geometry and material */}
      <mesh position={[-0.5, 1.7, 0]} geometry={SHARED_GEOMETRIES.shoulderSphere} material={SHARED_MATERIALS.shoulderSphere} />

      {/* Left Shoulder Ring - MEMORY FIX: Use shared geometry and material */}
      <mesh position={[-0.5, 1.7, 0]} rotation={[Math.PI / 2, -Math.PI / 4, 0]} geometry={SHARED_GEOMETRIES.shoulderRing} material={SHARED_MATERIALS.shoulderRing} />

      {/* Right Shoulder Sphere - MEMORY FIX: Use shared geometry and material */}
      <mesh position={[0.5, 1.7, 0]} geometry={SHARED_GEOMETRIES.shoulderSphere} material={SHARED_MATERIALS.shoulderSphere} />

      {/* Right Shoulder Ring - MEMORY FIX: Use shared geometry and material */}
      <mesh position={[0.5, 1.7, 0]} rotation={[Math.PI / 2, Math.PI / 4, 0]} geometry={SHARED_GEOMETRIES.shoulderRing} material={SHARED_MATERIALS.shoulderRing} />

      {/* Bone Aura */}
      <group position={[0, 0.12, 0]} scale={[0.65, 0.65, 0.65]}>
        <AscendantBoneAura parentRef={groupRef} />
      </group>

      {/* Enhanced red energy aura for Ascendant - MEMORY FIX: Use shared geometry and material */}
      <group position={[0, 1.2, 0]}>
        <mesh geometry={SHARED_GEOMETRIES.energyAura} material={SHARED_MATERIALS.energyAura} />
      </group>

 

    </group>
  );
}