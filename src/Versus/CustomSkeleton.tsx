// src/versus/CustomSkeleton.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Group, Mesh, MeshStandardMaterial, SphereGeometry, CylinderGeometry, ConeGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import BonePlate from '../gear/BonePlate';

interface CustomSkeletonProps {
  position: [number, number, number];
  isAttacking: boolean;
  isWalking: boolean;
  onHit?: (damage: number) => void;
}

// Add these at the top of the file to reuse materials
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

// Cache geometries that are reused frequently
const jointGeometry = new SphereGeometry(0.06, 8, 8);
const smallBoneGeometry = new CylinderGeometry(0.04, 0.032, 1, 6);
const clawGeometry = new ConeGeometry(0.02, 0.15, 6);

function BoneLegModel() {
  // Simplified version that reuses geometries and materials
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
        
        {/* Knee joint */}
        <group position={[0, -0.35, 0]}>
          <mesh>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
          </mesh>
          
          {/* Lower leg */}
          <group position={[0, -0.15, 0]}>
            {createParallelBones(0.7, 0.06)}
            
            {/* Ankle */}
            <group position={[0, -0.25, 0]} rotation={[Math.PI/2, 0, 0]}>
              {createJoint(0.06)}
              
              {/* Foot structure */}
              <group position={[0, -0.015, 0.1]}>
                {/* Main foot plate */}
                <mesh>
                  <boxGeometry args={[0.15, 0.02, 0.4]} />
                  <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
                </mesh>
                
                {/* Toe bones */}
                {[-0.05, 0, 0.05].map((offset, i) => (
                  <group key={i} position={[offset, 0.15, 0.25]} rotation={[-Math.PI, 0, 0]}>
                    {/* Toe bone segments */}
                    <group>
                      {createParallelBones(0.15, 0.02)}
                      
                      {/* Toe claws */}
                      <group position={[0, -0.1, 0]} rotation={[Math.PI/6, 0, 0]}>
                        <mesh>
                          <coneGeometry args={[0.02, 0.15, 6]} />
                          <meshStandardMaterial 
                            color="#d4d4d4"
                            roughness={0.3}
                            metalness={0.4}
                          />
                        </mesh>
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

function BossClawModel({ isLeftHand = false }: { isLeftHand?: boolean }) {
  // Reuse geometries and materials
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
          <mesh>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial 
              color="#e8e8e8"
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
          
          <group rotation={[-0.7, -0, Math.PI / 5]}>
            {createParallelBones(0.8, 0.12)}
            
            <group position={[0, -0.5, 0]} rotation={[0, 0, Math.PI / 5.5]}>
              {createJoint(0.09)}
              
              <group position={[0, -0.1, 0]}>
                <mesh>
                  <boxGeometry args={[0.2, 0.15, 0.08]} />
                  <meshStandardMaterial color="#e8e8e8" roughness={0.4} />
                </mesh>
                {[-0.08, 0, 0.08].map((offset, i) => ( // Reduced from 5 fingers to 3
                  <group 
                    key={i} 
                    position={[offset, -0.1, 0]}
                    rotation={[0, 0, (i - 1) * Math.PI / 8]}
                  >
                    {createBoneSegment(0.5, 0.02)}
                    <group position={[0.025, -0.3, 0]} rotation={[0, 0, Math.PI + Math.PI / 16]}>
                      <mesh geometry={clawGeometry} material={darkBoneMaterial} />
                    </group>
                  </group>
                ))}

                {/* Only render sword if it's the left hand */}
                {!isLeftHand && (
                  <group position={[0, -0.2, 0.3]} rotation={[Math.PI/2, 0, 0]} scale={[0.8, 0.8, 0.8]}>
                    <BoneSwordModel />
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


function BoneSwordModel() {
  const redMaterial = {
    color: "#FF4C4C",
    emissive: "#4ECB7E",
    emissiveIntensity: 0.5,
    roughness: 0.4,
    metalness: 0.6
  };

  return (
    <group rotation={[0, -1.05, -Math.PI / 2.5]} position={[+0.3, -0.1, 0.75]} scale={[0.9, 0.9, 1.2]}>
      {/* Sword Handle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.125, 0.125, 3.35, 8]} />
        <meshStandardMaterial 
          color="#8b0000"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Handle Guard */}
      <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, -Math.PI / 2, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, .125 ]} />
        <meshStandardMaterial 
          color="#4ECB7E"
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Blade Base */}
      <mesh position={[0, +1, 0]}>
        <cylinderGeometry args={[0.325, 0.125, 2.9, 4]} />
        <meshStandardMaterial 
          {...redMaterial}
        />
      </mesh>

      {/* Blade Tip */}
      <mesh position={[0, 3.45, 0]}>
        <coneGeometry args={[0.325, 2, 4]} />
        <meshStandardMaterial 
          {...redMaterial}
        />
      </mesh>

      {/* Add a subtle glow effect */}
      <pointLight 
        color="#FF4D00"
        intensity={0.5}
        distance={2}
        decay={2}
      />
    </group>
  );
}


function ShoulderPlate() {
  // Reduce the number of overlapping plates
  return (
    <group>
      {/* Main shoulder plate with layered armor design */}
      <group>
        {/* Base plate */}
        <mesh>
          <cylinderGeometry args={[0.123, 0.19, 0.175, 6, 1, false, 0, Math.PI*2]} />
          <meshStandardMaterial 
            color="#e8e8e8"
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>

        {/* Overlapping armor plates */}
        {[0, 1, 2, 3].map((i) => ( // Reduced from 6 plates to 4
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh position={[0.11, 0, 0]} rotation={[0, Math.PI / 6, 0]}>
              <boxGeometry args={[0.12, 0.19, 0.02]} />
              <meshStandardMaterial 
                color="#d4d4d4"
                roughness={0.5}
                metalness={0.4}
              />
            </mesh>
            
            {/* Decorative ridge on each plate */}
            <mesh position={[0.07, 0.05, 0.0]} rotation={[0, Math.PI / 6, 0]}>
              <boxGeometry args={[0.035, 0.24, 0.015]} />
              <meshStandardMaterial 
                color="#c0c0c0"
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
          </group>
        ))}

        {/* Top rim */}
        <mesh position={[0, 0.22, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]}>
          <torusGeometry args={[0.065, 0.02, 3, 5]} />
          <meshStandardMaterial 
            color="#d4d4d4"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>

                {/* bottom rim */}
                <mesh position={[0, 0, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]}>
          <torusGeometry args={[0.16, 0.02, 4, 5]} />
          <meshStandardMaterial 
            color="#d4d4d4"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
                {/* bottom rim */}
                <mesh position={[0, -0.10, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]}>
          <torusGeometry args={[0.20, 0.02, 4, 5]} />
          <meshStandardMaterial 
            color="#d4d4d4"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>


        {/* h0ver rim */}
        <mesh position={[0, 0.10, 0]} rotation={[Math.PI/2, Math.PI, Math.PI/2]}>
          <torusGeometry args={[0.125, 0.0175, 6, 6]} />
          <meshStandardMaterial 
            color="#d4d4d4"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
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
  const attackSpeed = 3;

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

      // Modified arm swing animation for boss claws
      ['LeftArm', 'RightArm'].forEach(part => {
        const limb = groupRef.current?.getObjectByName(part) as Mesh;
        if (limb) {
          const isRight = part.includes('Right');
          const phase = isRight ? walkCycle + Math.PI : walkCycle;
          
          // Simpler rotation for the entire claw structure
          const armAngle = Math.sin(phase) * 0.1;
          limb.rotation.x = armAngle;
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
    <group ref={groupRef} position={[position[0], position[1] + 1, position[2]]}>
      
      <group name="Body" position={[0, 1.05, 0]} scale={[0.95, 0.8, 0.8]} rotation={[-0.2, 0, 0]}>
        <BonePlate />
      </group>


      {/* SKULL POSITIONING */}
      <group name="Head" position={[0, 1.775, 0.1]} scale={[ 0.75, 0.8, 0.8]}>
        {/* Main skull shape */}
        <group>
          {/* Back of cranium */}
          <mesh position={[0, 0, -0.05]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
          </mesh>
          
          {/* Front face plate */}
          <mesh position={[0, -0.02, 0.12]}>
            <boxGeometry args={[0.28, 0.28, 0.1]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
          </mesh>

          {/* Cheekbones */}
          <group>
            <mesh position={[0.12, -0.08, 0.1]}>
              <boxGeometry args={[0.08, 0.12, 0.15]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[-0.12, -0.08, 0.1]}>
              <boxGeometry args={[0.08, 0.12, 0.15]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
            </mesh>
          </group>

          {/* Jaw structure */}
          <group position={[0, -0.15, 0.05]}>

            
            {/* Lower jaw - more angular and pointed */}
            <mesh position={[0, -0.08, 0.08]} rotation={[0, Math.PI/5, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.2, 5]} />
              <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
            </mesh>
          </group>

          {/* Upper teeth row */}
          <group position={[0.025, -0.25, 0.2175]} >
            {[-0.03, -0.06, -0.09, -0, 0.03].map((offset, i) => (
              <group key={i} position={[offset, 0, 0]} rotation={[0.5, 0, 0]}>
                <mesh>
                  <coneGeometry args={[0.03, 0.075, 3]} />
                  <meshStandardMaterial 
                    color="#e8e8e8"
                    roughness={0.3}
                    metalness={0.4}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* Lower teeth row */}
          <group position={[0, -0.18, 0.2]}>
            {[-0.06, -0.02, 0.02, 0.06].map((offset, i) => (
              <group key={i} position={[offset, 0, 0]} rotation={[2.5, 0, 0]}>
                <mesh>
                  <coneGeometry args={[0.01, 0.08, 3]} />
                  <meshStandardMaterial 
                    color="#e8e8e8"
                    roughness={0.3}
                    metalness={0.4}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* EYES============================= */}

        {/* Eye sockets with glow effect */}
        <group position={[0, 0.05, 0.14]}>
          {/* Left eye */}
          <group position={[-0.07, 0, 0]}>
            {/* Core eye */}
            <mesh>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#2FFF00" emissive="#2FFF00" emissiveIntensity={3} />
            </mesh>
            {/* Inner glow */}
            <mesh scale={1.2}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial 
                color="#2FFF00"
                emissive="#2FFF00"
                emissiveIntensity={1}
                transparent
                opacity={0.75}
              />
            </mesh>
            {/* Outer glow */}
            <mesh scale={1.4}>
              <sphereGeometry args={[0.05, 6.5, 2]} />
              <meshStandardMaterial 
                color="#2FFF00"
                emissive="#2FFF00"
                emissiveIntensity={1}
                transparent
                opacity={0.7}
              />
            </mesh>
            {/* Point light for dynamic glow */}
            <pointLight 
              color="#FF4C4C"
              intensity={0.5}
              distance={1}
              decay={2}
            />
          </group>



          {/* Right eye */}
          <group position={[0.07, 0, 0]}>
            {/* Core eye */}
            <mesh>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#2FFF00" emissive="#2FFF00" emissiveIntensity={3} />
            </mesh>
            {/* Inner glow */}
            <mesh scale={1.2}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial 
                color="#2FFF00"
                emissive="#2FFF00"
                emissiveIntensity={1}
                transparent
                opacity={0.75}
              />
            </mesh>
            {/* Outer glow */}
            <mesh scale={1.4}>
              <sphereGeometry args={[0.05, 6.5, 2]} />
              <meshStandardMaterial 
                color="#2FFF00"
                emissive="#2FFF00"
                emissiveIntensity={1}
                transparent
                opacity={.7}
              />
            </mesh>
            {/* Point light for dynamic glow */}
            <pointLight 
              color="#FF4C4C"
              intensity={0.5}
              distance={1}
              decay={1}
            />
          </group>
        </group>
      </group>

      {/* Add shoulder plates just before the arms */}
      <group position={[-0.34, 1.475, 0]} rotation={[-0.35, -Math.PI - 0.4, -0.35]}>
        <ShoulderPlate />
      </group>
      <group position={[0.34, 1.475, 0]} rotation={[-0.35, Math.PI -0.4, 0.35]}>
        <ShoulderPlate />
      </group>

      {/* arms with scaled boss claws */}
      <group name="LeftArm" position={[-0.35, 1.325, 0]} scale={[-0.45, 0.45, 0.45]} rotation={[0, Math.PI/3, 0]}>
        <BossClawModel isLeftHand={true} />
      </group>
      <group name="RightArm" position={[0.35, 1.525, 0.1]} scale={[0.45, 0.45, 0.45]} rotation={[0, -Math.PI/2.5, 0]}>
        <BossClawModel isLeftHand={false} />
      </group>
      {/* Pelvis structure */}
      <group position={[0, 0.6, 0]} scale={[1.4, 1, 0.8]}>
        {/* Main pelvic bowl */}
        <mesh>
          <cylinderGeometry args={[0.21, 0.20, 0.2, 8]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
        </mesh>

   


        {/* Pelvic joints */}
        {[-1, 1].map((side) => (
          <group key={side} position={[0.15 * side, -0.1, 0]}>
            <mesh>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Legs - keep same ground position but connect to higher pelvis */}
      <group name="LeftLeg" position={[0.2, 0.2725, 0]}>
        <BoneLegModel />
      </group>
      <group name="RightLeg" position={[-0.2, 0.2725, 0]}>
        <BoneLegModel />
      </group>

      {/* Neck connection - keep current position */}
      <group position={[0, 1.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 6]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
} 