// src/Versus/FallenTitan/FallenTitanModel.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Group, Mesh, MeshStandardMaterial, SphereGeometry, CylinderGeometry, ConeGeometry, BoxGeometry, TorusGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import BonePlate from '../../gear/BonePlate';
import FallenTitanSword from './FallenTitanSword';
import DragonSkull from '@/gear/DragonSkull';
import { registerGlobalSharedResource } from '../../Scene/EffectPools';


interface FallenTitanModelProps {
  position: [number, number, number];
  isAttacking: boolean;
  isWalking: boolean;
  onHit?: (damage: number) => void;
}

// MEMORY FIX: Create shared geometries at module level
const TITAN_GEOMETRIES = {
  // Joint geometries
  jointSmall: new SphereGeometry(0.18, 8, 8),
  jointMedium: new SphereGeometry(0.24, 12, 12),
  jointLarge: new SphereGeometry(0.36, 12, 12),
  jointPelvis: new SphereGeometry(0.11, 8, 8),
  
  // Bone geometries
  largeBone: new CylinderGeometry(0.12, 0.096, 3, 6),
  claw: new ConeGeometry(0.06, 0.45, 6),
  neck: new CylinderGeometry(0.06, 0.06, 0.3, 6),
  
  // Skull parts
  cranium: new SphereGeometry(0.26, 8, 8),
  facePlate: new BoxGeometry(0.34, 0.34, 0.12),
  jaw: new CylinderGeometry(0.10, 0.10, 0.24, 5),
  eye: new SphereGeometry(0.025, 8, 8),
  
  // Shoulder plate parts
  shoulderBase: new CylinderGeometry(0.369, 0.57, 0.525, 6),
  shoulderPlate: new BoxGeometry(0.36, 0.57, 0.06),
  shoulderRidge: new BoxGeometry(0.105, 0.72, 0.045),
  shoulderRimSmall: new TorusGeometry(0.195, 0.06, 3, 5),
  shoulderRimMed: new TorusGeometry(0.48, 0.06, 4, 5),
  shoulderRimLarge: new TorusGeometry(0.60, 0.06, 4, 5),
  shoulderRimHover: new TorusGeometry(0.375, 0.0525, 6, 6),
  
  // Pelvis
  pelvisBowl: new CylinderGeometry(0.31, 0.30, 0.24, 8),
  
  // Foot/claw parts
  footPlate: new BoxGeometry(0.45, 0.06, 1.2),
  toeClaw: new ConeGeometry(0.06, 0.45, 6),
  
  // Hand parts
  handBase: new BoxGeometry(0.6, 0.45, 0.24),
};

// Shared materials
const TITAN_MATERIALS = {
  standardBone: new MeshStandardMaterial({
    color: "#d0d0d0",
    roughness: 0.5,
    metalness: 0.4
  }),
  darkBone: new MeshStandardMaterial({
    color: "#b8b8b8",
    roughness: 0.4,
    metalness: 0.5
  }),
  pelvisBone: new MeshStandardMaterial({
    color: "#c0c0c0",
    roughness: 0.6,
    metalness: 0.3
  }),
  eyeGlow: new MeshStandardMaterial({
    color: "#FF0000",
    emissive: "#FF0000",
    emissiveIntensity: 4
  }),
};

// Lazy registration of global shared resources (client-side only)
let registeredTitanResources = false;
const registerTitanResources = () => {
  if (registeredTitanResources || typeof window === 'undefined') return;
  try {
    registerGlobalSharedResource(() => {
      Object.values(TITAN_GEOMETRIES).forEach(geo => geo.dispose());
      Object.values(TITAN_MATERIALS).forEach(mat => mat.dispose());
    }, 'FallenTitanModel');
    registeredTitanResources = true;
  } catch (error) {
    console.warn('Failed to register Titan resources:', error);
  }
};

// Legacy aliases for backward compatibility
const standardBoneMaterial = TITAN_MATERIALS.standardBone;
const darkBoneMaterial = TITAN_MATERIALS.darkBone;
const jointGeometry = TITAN_GEOMETRIES.jointSmall;
const largeBoneGeometry = TITAN_GEOMETRIES.largeBone;
const clawGeometry = TITAN_GEOMETRIES.claw;

function TitanLegModel() {
  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={TITAN_GEOMETRIES.largeBone} material={TITAN_MATERIALS.standardBone} scale={[width/0.12, length/3, width/0.12]} />
  );

  const createJoint = (size: number) => (
    <mesh geometry={TITAN_GEOMETRIES.jointSmall} material={TITAN_MATERIALS.standardBone} scale={[size/0.18, size/0.18, size/0.18]} />
  );

  const createParallelBones = (length: number, spacing: number) => (
    <group>
      <group position={[spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.12)}
      </group>
      <group position={[-spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.12)}
      </group>
      <group position={[0, length/2, 0]}>
        {createJoint(0.18)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.18)}
      </group>
    </group>
  );

  return (
    <group>
      {/* Upper leg - thicker and larger */}
      <group>
        {createParallelBones(1.95, 0.15)} {/* 3x scale */}
        
        {/* Knee joint */}
        <group position={[0, -1.05, 0]}>
          <mesh geometry={TITAN_GEOMETRIES.jointMedium} material={TITAN_MATERIALS.standardBone} />
          
          {/* Lower leg */}
          <group position={[0, -0.45, 0]}>
            {createParallelBones(2.1, 0.18)}
            
            {/* Ankle */}
            <group position={[0, -0.75, 0]} rotation={[Math.PI/2, 0, 0]}>
              {createJoint(0.18)}
              
              {/* Foot structure - larger and more imposing */}
              <group position={[0, -0.045, 0.3]}>
                <mesh geometry={TITAN_GEOMETRIES.footPlate} material={TITAN_MATERIALS.standardBone} />
                
                {/* Toe bones */}
                {[-0.15, 0, 0.15].map((offset, i) => (
                  <group key={i} position={[offset, 0.45, 0.75]} rotation={[-Math.PI, 0, 0]}>
                    <group>
                      {createParallelBones(0.45, 0.06)}
                      
                      {/* Toe claws */}
                      <group position={[0, -0.3, 0]} rotation={[Math.PI/6, 0, 0]}>
                        <mesh geometry={TITAN_GEOMETRIES.toeClaw} material={TITAN_MATERIALS.darkBone} />
                      </group>
                    </group>
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function TitanClawModel() {
  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={TITAN_GEOMETRIES.largeBone} material={TITAN_MATERIALS.standardBone} scale={[width/0.12, length/3, width/0.12]} />
  );

  const createJoint = (size: number) => (
    <mesh geometry={TITAN_GEOMETRIES.jointSmall} material={TITAN_MATERIALS.standardBone} scale={[size/0.18, size/0.18, size/0.18]} />
  );

  const createParallelBones = (length: number, spacing: number) => (
    <group>
      <group position={[spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.18)}
      </group>
      <group position={[-spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.18)}
      </group>
      <group position={[0, length/2, 0]}>
        {createJoint(0.24)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.24)}
      </group>
    </group>
  );

  return (
    <group>
      <group>
        {createParallelBones(3.9, 0.45)} {/* 3x scale */}
        
        <group position={[0.75, -2.55, 0.63]}> 
          <mesh geometry={TITAN_GEOMETRIES.jointLarge} material={TITAN_MATERIALS.standardBone} />
          
          <group rotation={[-0.7, -0, Math.PI / 5]}>
            {createParallelBones(2.4, 0.36)}
            
            <group position={[0, -1.5, 0]} rotation={[0, 0, Math.PI / 5.5]}>
              {createJoint(0.27)}
              
              <group position={[0, -0.3, 0]}>
                <mesh geometry={TITAN_GEOMETRIES.handBase} material={TITAN_MATERIALS.standardBone} />
                
                {/* Three large fingers */}
                {[-0.24, 0, 0.24].map((offset, i) => (
                  <group 
                    key={i} 
                    position={[offset, -0.3, 0]}
                    rotation={[0, 0, (i - 1) * Math.PI / 8]}
                  >
                    {createBoneSegment(1.5, 0.06)}
                    <group position={[0.075, -0.9, 0]} rotation={[0, 0, Math.PI + Math.PI / 16]}>
                      <mesh geometry={TITAN_GEOMETRIES.claw} material={TITAN_MATERIALS.darkBone} />
                    </group>
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function TitanShoulderPlate() {
  return (
    <group>
      <group>
        {/* Base plate - larger */}
        <mesh geometry={TITAN_GEOMETRIES.shoulderBase} material={TITAN_MATERIALS.standardBone} />

        {/* Overlapping armor plates */}
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh position={[0.33, 0, 0]} rotation={[0, Math.PI / 6, 0]} geometry={TITAN_GEOMETRIES.shoulderPlate} material={TITAN_MATERIALS.darkBone} />
            
            {/* Decorative ridge */}
            <mesh position={[0.21, 0.15, 0.0]} rotation={[0, Math.PI / 6, 0]} geometry={TITAN_GEOMETRIES.shoulderRidge}>
              <meshStandardMaterial 
                color="#a0a0a0"
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>
          </group>
        ))}

        {/* Rims - scaled up */}
        <mesh position={[0, 0.66, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]} geometry={TITAN_GEOMETRIES.shoulderRimSmall} material={TITAN_MATERIALS.darkBone} />

        <mesh position={[0, 0, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]} geometry={TITAN_GEOMETRIES.shoulderRimMed} material={TITAN_MATERIALS.darkBone} />

        <mesh position={[0, -0.30, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]} geometry={TITAN_GEOMETRIES.shoulderRimLarge} material={TITAN_MATERIALS.darkBone} />

        <mesh position={[0, 0.30, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]} geometry={TITAN_GEOMETRIES.shoulderRimHover} material={TITAN_MATERIALS.darkBone} />
      </group>
    </group>
  );
}

export default function FallenTitanModel({ 
  position, 
  isAttacking, 
  isWalking, 
  onHit 
}: FallenTitanModelProps) {
  // Register shared resources on first use
  useEffect(() => {
    registerTitanResources();
  }, []);

  const groupRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const [walkCycle, setWalkCycle] = useState(0);
  const [attackCycle, setAttackCycle] = useState(0);
  const attackAnimationRef = useRef<NodeJS.Timeout>();

  const walkSpeed = 2; // Slower than regular skeleton
  const attackSpeed = 2; // Slower attack animation

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isWalking) {
      setWalkCycle((prev) => (prev + delta * walkSpeed) % (Math.PI * 2));
      
      const walkHeightOffset = Math.abs(Math.sin(walkCycle) * 0.15); // Slightly more pronounced
      
      if (groupRef.current) {
        groupRef.current.position.y = position[1] + 2.5 - walkHeightOffset;
      }
      
      // Enhanced walking animation for massive legs with hunched posture
      ['LeftLeg', 'RightLeg'].forEach(part => {
        const limb = groupRef.current?.getObjectByName(part) as Mesh;
        if (limb) {
          const isRight = part.includes('Right');
          const phase = isRight ? walkCycle : walkCycle + Math.PI;
          
          // Upper leg movement - ape-like with wider stance and more bend
          const baseAngle = 0.2; // Permanent slight bend for hunched posture
          const upperLegAngle = baseAngle + Math.sin(phase) * 0.25;
          limb.rotation.x = upperLegAngle;

          // Knee joint animation - more pronounced for hunched gait
          const lowerLeg = limb.children[0]?.children[1];
          if (lowerLeg) {
            const kneePhase = phase + Math.PI / 4;
            const baseKneeAngle = 0.3; // More bent knees for hunched posture
            const kneeFlexion = Math.max(0, Math.sin(kneePhase));
            const kneeAngle = baseKneeAngle + kneeFlexion * 0.8;

            lowerLeg.rotation.x = kneeAngle;
            
            // More pronounced side-to-side movement for ape-like gait
            const twistAngle = Math.sin(phase) * 0.12;
            lowerLeg.rotation.y = twistAngle;
          }

          // Wider hip movement for hunched gait
          const hipTwist = Math.sin(phase) * 0.08;
          limb.rotation.y = hipTwist;
          
          // Add slight outward splay for ape-like stance
          const baseHipSplay = isRight ? -0.1 : 0.1;
          limb.rotation.z = baseHipSplay;
        }
      });

      // Subtle arm movement while walking (when not attacking) - ape-like swinging
      if (!isAttacking) {
        ['LeftArm', 'RightArm'].forEach(part => {
          const limb = groupRef.current?.getObjectByName(part) as Mesh;
          if (limb) {
            const isRight = part.includes('Right');
            const phase = isRight ? walkCycle + Math.PI : walkCycle;
            
            // Base hunched position with subtle swinging
            const baseArmAngle = 0.2; // Arms naturally hang forward
            const armSwing = Math.sin(phase) * 0.08; // Slightly more pronounced than before
            limb.rotation.x = baseArmAngle + armSwing;
            
            // Add slight side-to-side sway for ape-like movement
            const armSway = Math.sin(phase) * 0.04;
            limb.rotation.z = (isRight ? -0.4 : 0.4) + armSway;
          }
        });
      }
    }

    if (isAttacking) {
      setAttackCycle((prev) => prev + delta * attackSpeed);
      const progress = Math.min(attackCycle, Math.PI);
      
      // Two-handed attack animation - both arms move together
      const leftArm = groupRef.current.getObjectByName('LeftArm') as Mesh;
      const rightArm = groupRef.current.getObjectByName('RightArm') as Mesh;
      
      if (leftArm && rightArm) {
        if (progress < Math.PI/2) {
          // Wind-up phase: both arms raise up (like divine smite) - reversed rotation
          const windupPhase = progress / (Math.PI/2);
          const windupAngle = Math.PI/2 * windupPhase; // Raise arms up (reversed)
          
          leftArm.rotation.x = -windupAngle;
          rightArm.rotation.x = -windupAngle;
          
          // Slight inward rotation for gripping
          leftArm.rotation.z = windupPhase * 0.3;
          rightArm.rotation.z = -windupPhase * 0.3;
        } else {
          // Strike phase: vicious downward slam
          const strikePhase = (progress - Math.PI/2) / (Math.PI/2);
          const strikeAngle = -Math.PI/2 + (strikePhase * Math.PI * 1.2); // Powerful downward swing
          
          leftArm.rotation.x = strikeAngle;
          rightArm.rotation.x = strikeAngle;
          
          // Maintain grip during strike
          leftArm.rotation.z = 0.3 * (1 - strikePhase * 0.5);
          rightArm.rotation.z = -0.3 * (1 - strikePhase * 0.5);
        }
      }

      // Deal damage at the peak of the strike
      if (attackCycle > Math.PI * 0.7 && onHit && !attackAnimationRef.current) {
        attackAnimationRef.current = setTimeout(() => {
          attackAnimationRef.current = undefined;
        }, 0);
      }

      if (attackCycle > Math.PI) {
        setAttackCycle(0);
        // Reset arm positions
        if (leftArm && rightArm) {
          leftArm.rotation.x = 0;
          rightArm.rotation.x = 0;
          leftArm.rotation.z = 0;
          rightArm.rotation.z = 0;
        }
      }
    } else {
      // Clear the timeout if attack is interrupted
      if (attackAnimationRef.current) {
        clearTimeout(attackAnimationRef.current);
        attackAnimationRef.current = undefined;
      }
    }
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (attackAnimationRef.current) {
        clearTimeout(attackAnimationRef.current);
      }
    };
  }, []);

  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1] + 2.5, position[2]]} // Fixed base position
      scale={[0.875, 0.875, 0.875]} // Increased scale for proper titan size
    >

      <group scale={[1.0, 1.0, 1.0]} position={[0, 2.9, 0.4]} rotation={[0.5, 0, 0]}>
        <DragonSkull />
      </group>
      
      {/* Body - more hunched over */}
      <group name="Body" position={[0, 2.8, 0.4]} scale={[2, 2, 2]} rotation={[0.5, 0, 0]}>
        <BonePlate />
      </group>

      {/* Head - larger and more imposing */}
      <group name="Head" position={[0, 3.6, 1.2]} scale={[1.4, 1.3, 1.3]} rotation={[0.3, 0, 0]}>
        {/* Main skull shape */}
        <group>
          {/* Back of cranium */}
          <mesh position={[0, 0, -0.05]} geometry={TITAN_GEOMETRIES.cranium} material={TITAN_MATERIALS.standardBone} />
          
          {/* Front face plate */}
          <mesh position={[0, -0.02, 0.12]} geometry={TITAN_GEOMETRIES.facePlate} material={TITAN_MATERIALS.standardBone} />

          {/* Larger, more menacing jaw */}
          <group position={[0, -0.18, 0.05]}>
            <mesh position={[0, -0.10, 0.10]} rotation={[0, Math.PI/5, 0]} geometry={TITAN_GEOMETRIES.jaw} material={TITAN_MATERIALS.pelvisBone} />
          </group>

          {/* Glowing red eyes - more menacing */}
          <group position={[0, 0.05, 0.14]}>
            {/* Left eye */}
            <group position={[-0.09, 0, 0]}>
              <mesh geometry={TITAN_GEOMETRIES.eye} material={TITAN_MATERIALS.eyeGlow} />
              <pointLight 
                color="#FF0000"
                intensity={0.8}
                distance={2}
                decay={2}
              />
            </group>

            {/* Right eye */}
            <group position={[0.09, 0, 0]}>
              <mesh geometry={TITAN_GEOMETRIES.eye} material={TITAN_MATERIALS.eyeGlow} />
              <pointLight 
                color="#FF0000"
                intensity={0.8}
                distance={2}
                decay={2}
              />
            </group>
          </group>
        </group>
      </group>

      {/* Shoulder plates - wider apart and forward for hunched posture */}
      <group position={[-0.9, 3.4, 0.5]} rotation={[0.4, -Math.PI - 0.2, -0.2]}>
        <TitanShoulderPlate />
      </group>
      <group position={[0.9, 3.4, 0.5]} rotation={[0.4, Math.PI - 0.2, 0.2]}>
        <TitanShoulderPlate />
      </group>

      {/* Arms - positioned for hunched posture and two-handed weapon grip */}
      <group 
        name="LeftArm" 
        ref={leftArmRef}
        position={[-0.85, 2.55, 0.825]} 
        scale={[0.65, 0.5, 0.65]} 
        rotation={[0.2, Math.PI/4, 0.4]} // More forward lean for hunched posture
      >
        <TitanClawModel />
      </group>
      


      {/* Sword attached to right hand */}
      <group 
        name="RightArm" 
        ref={rightArmRef}
        position={[0.85, 2.55, 0.825]} 
        scale={[0.65, 0.5, 0.65]} 
        rotation={[0.2, -Math.PI/4, -0.4]} // More forward lean for hunched posture
      >
        <TitanClawModel />
        {/* Sword attached to the hand */}
        <group position={[0.25, -0.85, 0.21]}>
          <group position={[0, -0.5, 0]}>
            <group position={[0, -0.1, 0]}>
              <group position={[0, -0.2, 0.3]} rotation={[Math.PI, Math.PI/2, 0.35]} scale={[1.75, 1.75, 1.75]}>
                <FallenTitanSword />
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Pelvis structure - more robust and positioned for hunched stance */}
      <group position={[0, 1.8, -0.1]} scale={[1.6, 1.2, 1.1]} rotation={[-0.2, 0, 0]}>
        <mesh geometry={TITAN_GEOMETRIES.pelvisBowl} material={TITAN_MATERIALS.pelvisBone} />

        {/* Pelvic joints */}
        {[-1, 1].map((side) => (
          <group key={side} position={[0.22 * side, -0.12, 0]}>
            <mesh geometry={TITAN_GEOMETRIES.jointPelvis} material={TITAN_MATERIALS.pelvisBone} />
          </group>
        ))}
      </group>

      {/* Legs - massive and imposing, positioned for hunched stance */}
      <group name="LeftLeg" position={[0.35, 1.1, -0.2]} rotation={[0.1, -0.1, 0]}>
        <TitanLegModel />
      </group>
      <group name="RightLeg" position={[-0.35, 1.1, -0.2]} rotation={[0.1, 0.1, 0]}>
        <TitanLegModel />
      </group>

      {/* Neck connection - adjusted for hunched posture */}
      <group position={[0, 3.2, 0.4]}>
        <mesh geometry={TITAN_GEOMETRIES.neck} material={TITAN_MATERIALS.standardBone} />
      </group>
    </group>
  );
}