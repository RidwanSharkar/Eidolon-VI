// src/versus/CustomSkeleton.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Group, Mesh, MeshStandardMaterial, SphereGeometry, CylinderGeometry, BoxGeometry, TorusGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import BonePlate from '../gear/BonePlate';
import SkullShield from '../Weapons/SkullShield';
import BoneSabre from '../Weapons/BoneSabre';
import { registerGlobalSharedResource } from '../Scene/EffectPools';

interface CustomSkeletonProps {
  position: [number, number, number];
  isAttacking: boolean;
  isWalking: boolean;
  onHit?: (damage: number) => void;
}

// MEMORY FIX: Centralized cached materials - created once, reused everywhere
const CACHED_MATERIALS = {
  standardBone: new MeshStandardMaterial({
    color: "#d8e8d8",
    roughness: 0.4,
    metalness: 0.3
  }),
  lightBone: new MeshStandardMaterial({
    color: "#e8e8e8",
    roughness: 0.4,
    metalness: 0.3
  }),
  pelvisBone: new MeshStandardMaterial({
    color: "#c4d4c4",
    roughness: 0.5,
    metalness: 0.2
  }),
  armorPlate: new MeshStandardMaterial({
    color: "#d4d4d4",
    roughness: 0.5,
    metalness: 0.4
  }),
  armorRidge: new MeshStandardMaterial({
    color: "#c0c0c0",
    roughness: 0.3,
    metalness: 0.5
  }),
  eyeCore: new MeshStandardMaterial({
    color: "#00FF00",
    emissive: "#00FF00",
    emissiveIntensity: 3
  }),
  eyeInnerGlow: new MeshStandardMaterial({
    color: "#00FF00",
    emissive: "#00FF00",
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.75
  }),
  eyeOuterGlow: new MeshStandardMaterial({
    color: "#00FF00",
    emissive: "#00FF00",
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.7
  }),
  jaw: new MeshStandardMaterial({
    color: "#d8d8d8",
    roughness: 0.5,
    metalness: 0.2
  })
};

// MEMORY FIX: Centralized cached geometries
const CACHED_GEOMETRIES = {
  joint: new SphereGeometry(0.06, 8, 8),
  smallBone: new CylinderGeometry(0.04, 0.032, 1, 6),
  skull: new SphereGeometry(0.22, 8, 8),
  facePlate: new BoxGeometry(0.28, 0.28, 0.1),
  cheekbone: new BoxGeometry(0.08, 0.12, 0.15),
  eyeCore: new SphereGeometry(0.02, 8, 8),
  eyeInner: new SphereGeometry(0.035, 8, 8),
  eyeOuter: new SphereGeometry(0.05, 6, 2),
  pelvis: new CylinderGeometry(0.21, 0.20, 0.2, 8),
  pelvisJoint: new SphereGeometry(0.075, 8, 8),
  neck: new CylinderGeometry(0.04, 0.04, 0.2, 6),
  footPlate: new BoxGeometry(0.15, 0.02, 0.4),
  shoulderBase: new CylinderGeometry(0.123, 0.19, 0.175, 6, 1, false, 0, Math.PI * 2),
  armorPlate: new BoxGeometry(0.12, 0.19, 0.02),
  armorRidge: new BoxGeometry(0.035, 0.24, 0.015),
  rimTop: new TorusGeometry(0.065, 0.02, 3, 5),
  rimMid: new TorusGeometry(0.16, 0.02, 4, 5),
  rimBottom: new TorusGeometry(0.20, 0.02, 4, 5),
  rimHover: new TorusGeometry(0.125, 0.0175, 6, 6),
  kneeJoint: new SphereGeometry(0.08, 12, 12),
  elbowJoint: new SphereGeometry(0.12, 12, 12),
  handBase: new BoxGeometry(0.2, 0.15, 0.08),
  jawCylinder: new CylinderGeometry(0.08, 0.08, 0.2, 5)
};

// Register for global disposal
let registeredCustomSkeletonResources = false;
const registerCustomSkeletonResources = () => {
  if (registeredCustomSkeletonResources || typeof window === 'undefined') return;
  try {
    registerGlobalSharedResource(() => {
      Object.values(CACHED_GEOMETRIES).forEach(geo => geo.dispose());
      Object.values(CACHED_MATERIALS).forEach(mat => mat.dispose());
    }, 'CustomSkeleton');
    registeredCustomSkeletonResources = true;
  } catch (error) {
    console.warn('Failed to register CustomSkeleton resources:', error);
  }
};

// Legacy aliases for compatibility
const standardBoneMaterial = CACHED_MATERIALS.standardBone;
const jointGeometry = CACHED_GEOMETRIES.joint;
const smallBoneGeometry = CACHED_GEOMETRIES.smallBone;


function BoneLegModel() {
  // MEMORY FIX: Simplified version using cached geometries and materials
  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={smallBoneGeometry} material={standardBoneMaterial} scale={[width/0.04, length, width/0.04]} />
  );

  const createJoint = (size: number) => (
    <mesh geometry={jointGeometry} material={standardBoneMaterial} scale={[size/0.06, size/0.06, size/0.06]} />
  );

  const createParallelBones = (length: number, spacing: number) => (
    <group>
      <group position={[spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.04)}
      </group>
      <group position={[-spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.04)}
      </group>
      <group position={[0, length/2, 0]}>
        {createJoint(0.06)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.06)}
      </group>
    </group>
  );

  return (
    <group>
      {/* Upper leg */}
      <group>
        {createParallelBones(0.65, 0.05)}
        
        {/* Knee joint - MEMORY FIX: Using cached geometry and material */}
        <group position={[0, -0.35, 0]}>
          <mesh geometry={CACHED_GEOMETRIES.kneeJoint} material={CACHED_MATERIALS.standardBone} />
          
          {/* Lower leg */}
          <group position={[0, -0.15, 0]}>
            {createParallelBones(0.7, 0.06)}
            
            {/* Ankle */}
            <group position={[0, -0.25, 0]} rotation={[Math.PI/2, 0, 0]}>
              {createJoint(0.06)}
              
              {/* Foot structure - MEMORY FIX: Using cached geometry and material */}
              <group position={[0, -0.015, 0.1]}>
                <mesh geometry={CACHED_GEOMETRIES.footPlate} material={CACHED_MATERIALS.standardBone} />
                
                {/* Toe bones */}
                {[-0.05, 0, 0.05].map((offset, i) => (
                  <group key={i} position={[offset, 0.15, 0.25]} rotation={[-Math.PI, 0, 0]}>
                    <group>
                      {createParallelBones(0.15, 0.02)}
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

function BossClawModel({ isLeftHand = false }: { isLeftHand?: boolean }) {
  // MEMORY FIX: Reuse cached geometries and materials
  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={smallBoneGeometry} material={standardBoneMaterial} scale={[width/0.04, length, width/0.04]} />
  );

  const createJoint = (size: number) => (
    <mesh geometry={jointGeometry} material={standardBoneMaterial} scale={[size/0.06, size/0.06, size/0.06]} />
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
        {createJoint(0.08)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.08)}
      </group>
    </group>
  );

  return (
    <group>
      <group>
        {createParallelBones(1.3, 0.15)}
        
        <group position={[0.25, -0.85, 0.21]}> 
          {/* MEMORY FIX: Using cached geometry and material */}
          <mesh geometry={CACHED_GEOMETRIES.elbowJoint} material={CACHED_MATERIALS.lightBone} />
          
          <group rotation={[-0.7, -0, Math.PI / 5]}>
            {createParallelBones(0.8, 0.12)}
            
            <group position={[0, -0.5, 0]} rotation={[0, 0, Math.PI / 5.5]}>
              {createJoint(0.09)}
              
              <group position={[0, -0.1, 0]}>
                {/* MEMORY FIX: Using cached geometry and material */}
                <mesh geometry={CACHED_GEOMETRIES.handBase} material={CACHED_MATERIALS.lightBone} />

                {/* Only render sabre if it's the left hand */}
                {!isLeftHand && (
                  <group position={[0, -0.2, 0.3]} rotation={[Math.PI/1.5, 0, -Math.PI/4]} scale={[1.8, 2.5, 1.8]}>
                    <BoneSabre />
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





function ShoulderPlate() {
  // MEMORY FIX: Using cached geometries and materials
  return (
    <group>
      <group>
        {/* Base plate */}
        <mesh geometry={CACHED_GEOMETRIES.shoulderBase} material={CACHED_MATERIALS.lightBone} />

        {/* Overlapping armor plates - reduced to 4 */}
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh position={[0.11, 0, 0]} rotation={[0, Math.PI / 6, 0]} geometry={CACHED_GEOMETRIES.armorPlate} material={CACHED_MATERIALS.armorPlate} />
            <mesh position={[0.07, 0.05, 0.0]} rotation={[0, Math.PI / 6, 0]} geometry={CACHED_GEOMETRIES.armorRidge} material={CACHED_MATERIALS.armorRidge} />
          </group>
        ))}

        {/* Top rim */}
        <mesh position={[0, 0.22, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]} geometry={CACHED_GEOMETRIES.rimTop} material={CACHED_MATERIALS.armorPlate} />
        {/* Mid rim */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]} geometry={CACHED_GEOMETRIES.rimMid} material={CACHED_MATERIALS.armorPlate} />
        {/* Bottom rim */}
        <mesh position={[0, -0.10, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]} geometry={CACHED_GEOMETRIES.rimBottom} material={CACHED_MATERIALS.armorPlate} />
        {/* Hover rim */}
        <mesh position={[0, 0.10, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]} geometry={CACHED_GEOMETRIES.rimHover} material={CACHED_MATERIALS.armorPlate} />
      </group>
    </group>
  );
}

export default function CustomSkeleton({ position, isAttacking, isWalking, onHit }: CustomSkeletonProps) {
  const groupRef = useRef<Group>(null);
  const [walkCycle, setWalkCycle] = useState(0);
  const [attackCycle, setAttackCycle] = useState(0);
  const attackAnimationRef = useRef<NodeJS.Timeout>();

  const walkSpeed = 4;
  const attackSpeed = 1.35;

  // Register resources for global disposal on mount
  useEffect(() => {
    registerCustomSkeletonResources();
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isWalking) {
      setWalkCycle((prev) => (prev + delta * walkSpeed) % (Math.PI * 2));
      
      const walkHeightOffset = Math.abs(Math.sin(walkCycle) * 0.1);
      
      if (groupRef.current) {
        groupRef.current.position.y = position[1] - walkHeightOffset;
      }
      
      // Enhanced walking animation with knee joints
      ['LeftLeg', 'RightLeg'].forEach(part => {
        const limb = groupRef.current?.getObjectByName(part) as Mesh;
        if (limb) {
          const isRight = part.includes('Right');
          const phase = isRight ? walkCycle : walkCycle + Math.PI;
          
          // Upper leg movement
          const upperLegAngle = Math.sin(phase) * 0.4; // Increased range of motion
          limb.rotation.x = upperLegAngle;

          // Find and animate the knee joint
          const lowerLeg = limb.children[0]?.children[1]; // Access the lower leg group
          if (lowerLeg) {
            // Knee flexion happens when leg is moving backward and lifting
            const kneePhase = phase + Math.PI / 4; // Offset to sync with leg movement
            const baseKneeAngle = 0.2; // Minimum bend
            const kneeFlexion = Math.max(0, Math.sin(kneePhase)); // Only bend, don't hyperextend
            const kneeAngle = baseKneeAngle + kneeFlexion * 0.8; // Increased range of motion

            lowerLeg.rotation.x = kneeAngle;
            
            // Add slight inward/outward rotation during stride
            const twistAngle = Math.sin(phase) * 0.1;
            lowerLeg.rotation.y = twistAngle;
          }

          // Add slight hip rotation
          const hipTwist = Math.sin(phase) * 0.05;
          limb.rotation.y = hipTwist;
        }
      });

      // Modified arm swing animation for boss claws - adjusted for hunched posture
      ['LeftArm', 'RightArm'].forEach(part => {
        const limb = groupRef.current?.getObjectByName(part) as Mesh;
        if (limb) {
          const isRight = part.includes('Right');
          const phase = isRight ? walkCycle + Math.PI : walkCycle;
          
          // Hunched arm movement - arms naturally hang forward more
          const baseHunchedAngle = 0.1; // Base forward lean for hunched posture
          const armSwing = Math.sin(phase) * 0.08; // Slightly reduced swing
          limb.rotation.x = baseHunchedAngle + armSwing;
          
          // Add slight side-to-side movement for more natural hunched gait
          const armSway = Math.sin(phase) * 0.03;
          limb.rotation.z = (isRight ? -0.15 : 0.15) + armSway;
        }
      });
    }

    if (isAttacking) {
      setAttackCycle((prev) => prev + delta * attackSpeed);
      const progress = Math.min(attackCycle, Math.PI / 2);
      const armAngle = Math.sin(progress) * Math.PI;

      const rightArm = groupRef.current.getObjectByName('RightArm') as Mesh;
      if (rightArm) {
        rightArm.rotation.x = -armAngle;
      }


      // Deal damage at the peak of the animation (around halfway through)
      if (attackCycle > Math.PI / 4 && onHit && !attackAnimationRef.current) {
        attackAnimationRef.current = setTimeout(() => {
          attackAnimationRef.current = undefined;
        }, 0); // 500ms delay to sync with animation
      }

      if (attackCycle > Math.PI / 2) {
        setAttackCycle(0);
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
    <>
      <group ref={groupRef} position={[position[0], position[1] + 1, position[2]]} scale={[0.8, 0.8, 0.8]}>
        
        <group name="Body" position={[0, 1.05, 0.15]} scale={[0.85, 0.8, 0.8]} rotation={[0.2, 0, 0]}>
          <BonePlate />
        </group>


      {/* SKULL POSITIONING - adjusted for hunched posture */}
      <group name="Head" position={[0, 1.7, 0.35]} scale={[ 0.75, 0.8, 0.8]} rotation={[0.15, 0, 0]}>
        {/* Main skull shape - MEMORY FIX: Using cached geometries and materials */}
        <group>
          {/* Back of cranium */}
          <mesh position={[0, 0, -0.05]} geometry={CACHED_GEOMETRIES.skull} material={CACHED_MATERIALS.standardBone} />
          
          {/* Front face plate */}
          <mesh position={[0, -0.02, 0.12]} geometry={CACHED_GEOMETRIES.facePlate} material={CACHED_MATERIALS.standardBone} />

          {/* Cheekbones */}
          <group>
            <mesh position={[0.12, -0.08, 0.1]} geometry={CACHED_GEOMETRIES.cheekbone} material={CACHED_MATERIALS.standardBone} />
            <mesh position={[-0.12, -0.08, 0.1]} geometry={CACHED_GEOMETRIES.cheekbone} material={CACHED_MATERIALS.standardBone} />
          </group>

          {/* Jaw structure */}
          <group position={[0, -0.15, 0.05]}>
            {/* Lower jaw - more angular and pointed */}
            <mesh position={[0, -0.08, 0.08]} rotation={[0, Math.PI/5, 0]} geometry={CACHED_GEOMETRIES.jawCylinder} material={CACHED_MATERIALS.jaw} />
          </group>
        </group>

        {/* EYES - MEMORY FIX: Using cached geometries and materials */}
        <group position={[0, 0.05, 0.14]}>
          {/* Left eye */}
          <group position={[-0.07, 0, 0]}>
            <mesh geometry={CACHED_GEOMETRIES.eyeCore} material={CACHED_MATERIALS.eyeCore} />
            <mesh scale={1.2} geometry={CACHED_GEOMETRIES.eyeInner} material={CACHED_MATERIALS.eyeInnerGlow} />
            <mesh scale={1.4} geometry={CACHED_GEOMETRIES.eyeOuter} material={CACHED_MATERIALS.eyeOuterGlow} />
            <pointLight color="#00FF00" intensity={0.5} distance={1} decay={2} />
          </group>

          {/* Right eye */}
          <group position={[0.07, 0, 0]}>
            <mesh geometry={CACHED_GEOMETRIES.eyeCore} material={CACHED_MATERIALS.eyeCore} />
            <mesh scale={1.2} geometry={CACHED_GEOMETRIES.eyeInner} material={CACHED_MATERIALS.eyeInnerGlow} />
            <mesh scale={1.4} geometry={CACHED_GEOMETRIES.eyeOuter} material={CACHED_MATERIALS.eyeOuterGlow} />
            <pointLight color="#00FF00" intensity={0.5} distance={1} decay={1} />
          </group>
        </group>
      </group>

      {/* Add shoulder plates just before the arms - adjusted for hunched posture */}
      <group position={[-0.34, 1.45, 0.12]} rotation={[-0.15, -Math.PI - 0.4, -0.25]}>
        <ShoulderPlate />
      </group>
      <group position={[0.34, 1.45, 0.12]} rotation={[-0.15, Math.PI -0.4, 0.25]}>
        <ShoulderPlate />
      </group>

      {/* arms with scaled boss claws - adjusted for hunched posture */}
      <group name="LeftArm" position={[-0.35, 1.3, 0.08]} scale={[-0.45, 0.45, 0.45]} rotation={[0.1, Math.PI/3, 0.15]}>
        <BossClawModel isLeftHand={true} />
      </group>
      <group name="RightArm" position={[0.35, 1.5, 0.18]} scale={[0.45, 0.45, 0.45]} rotation={[0.1, -Math.PI/2.5, -0.15]}>
        <BossClawModel isLeftHand={false} />
      </group>

      {/* Skull Shield attached to left hand area - adjusted for hunched posture */}
      <group position={[-0.45, 1.22, 0.35]} rotation={[0.1, -Math.PI/3, Math.PI/8]} scale={[0.95, -0.95, 1.175]}>
        <SkullShield isShieldActive={true} />
      </group>
      {/* Pelvis structure - MEMORY FIX: Using cached geometries and materials */}
      <group position={[0, 0.6, 0]} scale={[1.4, 1, 0.8]}>
        {/* Main pelvic bowl */}
        <mesh geometry={CACHED_GEOMETRIES.pelvis} material={CACHED_MATERIALS.pelvisBone} />

        {/* Pelvic joints */}
        {[-1, 1].map((side) => (
          <group key={side} position={[0.15 * side, -0.1, 0]}>
            <mesh geometry={CACHED_GEOMETRIES.pelvisJoint} material={CACHED_MATERIALS.pelvisBone} />
          </group>
        ))}
      </group>

      {/* Legs - tilted slightly like Death Knight for hunched stance */}
      <group name="LeftLeg" position={[0.2, 0.2725, -0.05]} rotation={[0.04, -0.04, 0]}>
        <BoneLegModel />
      </group>
      <group name="RightLeg" position={[-0.2, 0.2725, -0.05]} rotation={[0.04, 0.04, 0]}>
        <BoneLegModel />
      </group>

        {/* Neck connection - adjusted for hunched posture - MEMORY FIX: Using cached geometry and material */}
        <group position={[0, 1.25, 0.18]} rotation={[0.2, 0, 0]}>
          <mesh geometry={CACHED_GEOMETRIES.neck} material={CACHED_MATERIALS.standardBone} />
        </group>
      </group>

    </>
  );
} 