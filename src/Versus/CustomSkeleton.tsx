import React, { useRef, useState } from 'react';
import { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';

interface CustomSkeletonProps {
  position: [number, number, number];
  isAttacking: boolean;
  isWalking: boolean;
  onHit?: (damage: number) => void;
}

export default function CustomSkeleton({ position, isAttacking, isWalking }: CustomSkeletonProps) {
  const groupRef = useRef<Group>(null);
  const [walkCycle, setWalkCycle] = useState(0);
  const [attackCycle, setAttackCycle] = useState(0);

  const walkSpeed = 2;
  const attackSpeed = 3;

  // Helper function to create a double-jointed limb with adjusted proportions
  const createJointedLimb = (isArm: boolean = false) => (
    <group>
      {/* Upper section */}
      <group>
        {createBonePiece(isArm ? 0.6 : 0.85, isArm ? 0.025 : 0.03)} 
        {/* Lower section */}
        <group position={[0, isArm ? -0.3 : -0.425, 0]}> 
          {createBonePiece(isArm ? 0.5 : 0.75, isArm ? 0.02 : 0.025)} 
        </group>
      </group>
    </group>
  );

  // Helper function to create a bone piece
  const createBonePiece = (length: number = 0.4, radius: number = 0.02) => (
    <group>
      {/* Main bone shaft */}
      <mesh>
        <cylinderGeometry args={[radius, radius * 0.75, length, 6]} />
        <meshStandardMaterial 
          color="#e8e8e8"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      
      {/* Upper joint */}
      <mesh position={[0, length/2, 0]}>
        <sphereGeometry args={[radius * 1.75, 6, 6]} />
        <meshStandardMaterial 
          color="#d8d8d8"
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Lower joint */}
      <mesh position={[0, -length/2, 0]}>
        <sphereGeometry args={[radius * 1.5, 6, 6]} />
        <meshStandardMaterial 
          color="#d8d8d8"
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
    </group>
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isWalking) {
      setWalkCycle((prev) => (prev + delta * walkSpeed) % (Math.PI * 2));
      
      // Enhanced walking animation with joint mechanics
      ['LeftLeg', 'RightLeg'].forEach(part => {
        const limb = groupRef.current?.getObjectByName(part) as Mesh;
        if (limb) {
          const isRight = part.includes('Right');
          const phase = isRight ? walkCycle : walkCycle + Math.PI; // Opposite legs
          
          // Upper leg movement
          const upperLegAngle = Math.sin(phase) * 0.6;
          limb.rotation.x = upperLegAngle;

          // Lower leg movement (knee joint)
          const lowerLeg = limb.children[0]?.children[1];
          if (lowerLeg) {
            // Knee bends more when leg is lifting and straightens when pushing
            const kneeAngle = Math.sin(phase * 2) * 0.4 + 0.2;
            lowerLeg.rotation.x = kneeAngle;
          }
        }
      });

      // Arm swing animation
      ['LeftArm', 'RightArm'].forEach(part => {
        const limb = groupRef.current?.getObjectByName(part) as Mesh;
        if (limb) {
          const isRight = part.includes('Right');
          // Arms swing opposite to legs
          const phase = isRight ? walkCycle + Math.PI : walkCycle;
          
          // Upper arm movement
          const upperArmAngle = Math.sin(phase) * 0.4;
          limb.rotation.x = upperArmAngle;

          // Lower arm movement (elbow joint)
          const lowerArm = limb.children[0]?.children[1];
          if (lowerArm) {
            // Slight elbow bend during swing
            const elbowAngle = Math.sin(phase * 2) * 0.2;
            lowerArm.rotation.x = elbowAngle;
          }
        }
      });
    }

    if (isAttacking) {
      setAttackCycle((prev) => prev + delta * attackSpeed);
      const progress = Math.min(attackCycle, Math.PI / 2);
      const armAngle = Math.sin(progress) * Math.PI / 2; // Increased swing range

      const rightArm = groupRef.current.getObjectByName('RightArm') as Mesh;
      if (rightArm) {
        rightArm.rotation.x = -armAngle;
        // Add secondary joint movement for attack
        const lowerJoint = rightArm.children[0]?.children[1];
        if (lowerJoint) {
          lowerJoint.rotation.x = armAngle * 0.5;
        }
      }

      if (attackCycle > Math.PI / 2) {
        setAttackCycle(0);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Ribcage/Torso - keep current position */}
      <group name="Body" position={[0, 1.2, 0]} scale={0.85}>
        {/* Spine */}
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Ribs */}
        {[-0.5, -0.25, 0, 0.25, 0.5].map((y, i) => (
          <group key={i} position={[0, y, 0]}>
            {/* Left rib */}
            <group rotation={[0, 0, -Math.PI / 3]}>
              <mesh position={[0.1, 0, 0]} rotation={[1, Math.PI / 2, 0]}>
                <torusGeometry args={[0.18, 0.015, 8, 12, Math.PI * 0.75]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
              </mesh>
            </group>
            {/* Right rib */}
            <group rotation={[0, 0, Math.PI / 3]}>
              <mesh position={[-0.1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <torusGeometry args={[0.18, 0.015, 8, 12, Math.PI * 0.75]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* Skull - keep current position */}
      <group name="Head" position={[0, 2.0, 0]}>
        {/* Cranium */}
        <mesh>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Jaw */}
        <mesh position={[0, -0.12, 0.05]}>
          <boxGeometry args={[0.17, 0.08, 0.22]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
        </mesh>
        
        {/* Eye sockets with glow effect */}
        <group position={[0, 0.05, 0.14]}>
          {/* Left eye */}
          <group position={[-0.07, 0, 0]}>
            {/* Core eye */}
            <mesh>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#000000" emissive="#ff0000" emissiveIntensity={3} />
            </mesh>
            {/* Inner glow */}
            <mesh scale={1.2}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial 
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={2}
                transparent
                opacity={0.4}
              />
            </mesh>
            {/* Outer glow */}
            <mesh scale={1.4}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial 
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={1}
                transparent
                opacity={0.2}
              />
            </mesh>
            {/* Point light for dynamic glow */}
            <pointLight 
              color="#ff0000"
              intensity={0.5}
              distance={0.5}
              decay={2}
            />
          </group>

          {/* Right eye */}
          <group position={[0.07, 0, 0]}>
            {/* Core eye */}
            <mesh>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#000000" emissive="#ff0000" emissiveIntensity={3} />
            </mesh>
            {/* Inner glow */}
            <mesh scale={1.2}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial 
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={2}
                transparent
                opacity={0.4}
              />
            </mesh>
            {/* Outer glow */}
            <mesh scale={1.4}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial 
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={1}
                transparent
                opacity={0.2}
              />
            </mesh>
            {/* Point light for dynamic glow */}
            <pointLight 
              color="#ff0000"
              intensity={0.5}
              distance={0.5}
              decay={2}
            />
          </group>
        </group>
      </group>

      {/* Arms - lowered slightly */}
      <group name="LeftArm" position={[-0.45, 1.4, 0]}>
        {createJointedLimb(true)}
      </group>
      <group name="RightArm" position={[0.45, 1.4, 0]}>
        {createJointedLimb(true)}
      </group>

      {/* Pelvis - moved higher up */}
      <group position={[0, 0.7, 0]}> {/* Moved up from 0.4 to 0.7 */}
        <mesh>
          <cylinderGeometry args={[0.3, 0.25, 0.2, 8]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* Legs - keep same ground position but connect to higher pelvis */}
      <group name="LeftLeg" position={[-0.25, 0.3, 0]}>
        {createJointedLimb()}
      </group>
      <group name="RightLeg" position={[0.25, 0.3, 0]}>
        {createJointedLimb()}
      </group>

      {/* Neck connection - keep current position */}
      <group position={[0, 1.8, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 6]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
} 