import React, { useRef, useState, useEffect } from 'react';
import { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import BonePlate from '../../Gear/BonePlate';
import DragonSkull from '../../Gear/DragonSkull';

interface CustomAbominationProps {
  position: [number, number, number];
  isAttacking: boolean;
  isWalking: boolean;
  onHit?: (damage: number) => void;
}

function BoneLegModel() {
  const createBoneSegment = (length: number, width: number) => (
    <mesh>
      <cylinderGeometry args={[width, width * 0.8, length, 8]} />
      <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
    </mesh>
  );

  const createJoint = (size: number) => (
    <mesh>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
    </mesh>
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
  const createBoneSegment = (length: number, width: number) => (
    <mesh>
      <cylinderGeometry args={[width, width * 0.8, length, 8]} />
      <meshStandardMaterial 
        color="#e8e8e8"
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );

  const createJoint = (size: number) => (
    <mesh>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial 
        color="#e8e8e8"
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
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
                {[-0.08, -0.04, 0, 0.04, 0.08].map((offset, i) => (
                  <group 
                    key={i} 
                    position={[offset, -0.1, 0]}
                    rotation={[0, 0, (i - 2) * Math.PI / 10]}
                  >
                    {createBoneSegment(0.5, 0.02)}
                    <group position={[0.025, -0.3, 0]} rotation={[0, 0, Math.PI + Math.PI / 16]}>
                      <mesh>
                        <coneGeometry args={[0.03, 0.3, 6]} />
                        <meshStandardMaterial 
                          color="#d4d4d4"
                          roughness={0.3}
                          metalness={0.4}
                        />
                      </mesh>
                    </group>
                  </group>
                ))}

                {/* Only render sword if it's the left hand */}
                {!isLeftHand && (
                  <group position={[0, -0.2, 0.3]} rotation={[Math.PI/2, 0, 0]} scale={[0.8, 0.8, 0.8]}>
      
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
  const createSpike = (scale = 1) => (
    <group scale={[scale, scale, scale]}>
      {/* Base segment */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 6]} />
        <meshStandardMaterial 
          color="#e8e8e8"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Middle segment with slight curve */}
      <mesh position={[0, 0.1, 0.02]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.12, 6]} />
        <meshStandardMaterial 
          color="#e8e8e8"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Sharp tip */}
      <mesh position={[0, 0.2, 0.04]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.03, 0.15, 6]} />
        <meshStandardMaterial 
          color="#d4d4d4"
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Decorative ridges */}
      {[0, Math.PI/3, Math.PI*2/3, Math.PI, Math.PI*4/3, Math.PI*5/3].map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[0.04, 0.05, 0]}>
            <boxGeometry args={[0.01, 0.12, 0.02]} />
            <meshStandardMaterial 
              color="#d4d4d4"
              roughness={0.5}
              metalness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );

  return (
    <group>
      {/* Main shoulder plate */}
      <mesh>
        <cylinderGeometry args={[0.125, 0.2, 0.30, 6, 1, false, 0, Math.PI*2]} />
        <meshStandardMaterial 
          color="#e8e8e8"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      
      {/* Enhanced spikes with different sizes and angles */}
      <group position={[0, 0.25, 0]}>
        {/* Center spike */}
        <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
          {createSpike(1.2)}
        </group>
        
        {/* Side spikes */}
        <group position={[0, -0.05, 0.15]} rotation={[-0.2, 0, 0]}>
          {createSpike(0.9)}
        </group>
        <group position={[0, -0.05, -0.15]} rotation={[0.2, 0, 0]}>
          {createSpike(0.9)}
        </group>
        
        {/* Smaller corner spikes */}
        <group position={[0, -0.1, 0.25]} rotation={[-0.4, 0, 0]}>
          {createSpike(0.7)}
        </group>
        <group position={[0, -0.1, -0.25]} rotation={[0.4, 0, 0]}>
          {createSpike(0.7)}
        </group>
      </group>
    </group>
  );
}

export default function CustomAbomination({ position, isAttacking, isWalking, onHit }: CustomAbominationProps) {
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
      
      // Enhanced walking animation for all legs
      [
        'LeftFrontLeg', 'RightFrontLeg',
        'LeftMiddleFrontLeg', 'RightMiddleFrontLeg',
        'LeftMiddleBackLeg', 'RightMiddleBackLeg',
        'LeftBackLeg', 'RightBackLeg'
      ].forEach((part, index) => {
        const limb = groupRef.current?.getObjectByName(part) as Mesh;
        if (limb) {
          const isRight = part.includes('Right');
          // Offset each pair of legs by a quarter of the cycle
          const phaseOffset = (index % 4) * Math.PI / 2;
          const phase = isRight ? walkCycle + phaseOffset : walkCycle + Math.PI + phaseOffset;
          
          // Rest of the leg animation logic remains the same
          const upperLegAngle = Math.sin(phase) * 0.4;
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
      
      // Define different timings and angles for each arm pair
      const armPairs = [
        { 
          left: 'LeftLowerBackArm', 
          right: 'RightLowerBackArm', 
          delay: 0,
          rotationY: Math.sin(progress) * Math.PI * 0.5 // Horizontal swing
        },
        { 
          left: 'LeftMiddleBackArm', 
          right: 'RightMiddleBackArm', 
          delay: 0.2,
          rotationY: Math.sin(Math.max(0, progress - 0.2)) * Math.PI * 0.5
        },
        { 
          left: 'LeftUpperBackArm', 
          right: 'RightUpperBackArm', 
          delay: 0.4,
          rotationY: Math.sin(Math.max(0, progress - 0.4)) * Math.PI * 0.5
        }
      ];

      armPairs.forEach(({ left, right, rotationY }) => {
        const leftArm = groupRef.current?.getObjectByName(left) as Mesh;
        const rightArm = groupRef.current?.getObjectByName(right) as Mesh;
        
        if (leftArm && rightArm) {
          // Left arm swings from inside to outside
          leftArm.rotation.y = -Math.PI * 2 - rotationY;
          // Right arm swings from inside to outside (mirrored)
          rightArm.rotation.y = -Math.PI * 2 + rotationY;
        }
      });

      // Deal damage at the peak of the animation
      if (attackCycle > Math.PI / 4 && onHit && !attackAnimationRef.current) {
        attackAnimationRef.current = setTimeout(() => {
          attackAnimationRef.current = undefined;
        }, 0);
      }

      if (attackCycle > Math.PI / 2) {
        setAttackCycle(0);
      }
    } else {
      // Reset rotations when not attacking
      const defaultRotations = [
        { left: 'LeftLowerBackArm', right: 'RightLowerBackArm', y: Math.PI * 2.2 },
        { left: 'LeftMiddleBackArm', right: 'RightMiddleBackArm', y: Math.PI * 2.1 },
        { left: 'LeftUpperBackArm', right: 'RightUpperBackArm', y: Math.PI * 2 }
      ];

      defaultRotations.forEach(({ left, right, y }) => {
        const leftArm = groupRef.current?.getObjectByName(left) as Mesh;
        const rightArm = groupRef.current?.getObjectByName(right) as Mesh;
        
        if (leftArm && rightArm) {
          leftArm.rotation.y = y;
          rightArm.rotation.y = -y;
        }
      });
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
    <group ref={groupRef} position={[position[0], position[1], position[2]]} scale={[1.75, 1.75, 1.75]}>
      
      <group name="Body" position={[0, 1.15, 0]} scale={[1.25, 0.8, 1.25]} rotation={[-0.2, 0, 0]}>
        <BonePlate />
      </group>

      

      <group scale={[0.7, 0.7, 0.7]} position={[0, 1.45, +0.05]} rotation={[0.65, 0, 0]}>
        <DragonSkull />
      </group>


      {/* SKULL POSITIONING */}
      <group name="Head" position={[0, 1.775, 0.2]} scale={[ 0.75, 0.8, 0.8]}>
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

      {/* Front Arms (Original) */}
      <group name="LeftFrontArm" position={[-0.35, 1.325, 0]} scale={[-0.4, 0.4, 0.4]} rotation={[0, Math.PI/3, 0]}>
        <BossClawModel isLeftHand={true} />
      </group>
      <group name="RightFrontArm" position={[0.35, 1.525, 0.1]} scale={[0.4, 0.4, 0.4]} rotation={[0, -Math.PI/2.5, 0]}>
        <BossClawModel isLeftHand={false} />
      </group>

      {/* Back Arms (Larger) */}
      {/* Upper Back Arms */}
      <group name="LeftUpperBackArm" position={[-0.75, 1.5, -0.5]} scale={[-0.6, 0.6, 0.6]} rotation={[0.3, Math.PI*2, -0.5]}>
        <BossClawModel isLeftHand={true} />
      </group>
      <group name="RightUpperBackArm" position={[0.75, 1.5, -0.5]} scale={[0.6, 0.6, 0.6]} rotation={[0.3, -Math.PI*2, 0.5]}>
        <BossClawModel isLeftHand={false} />
      </group>

      {/* Middle Back Arms */}
      <group name="LeftMiddleBackArm" position={[-0.65, 1.375, -0.3]} scale={[-0.55, 0.55, 0.55]} rotation={[0.2, Math.PI*2.1, -.4]}>
        <BossClawModel isLeftHand={true} />
      </group>
      <group name="RightMiddleBackArm" position={[0.65, 1.375, -0.3]} scale={[0.55, 0.55, 0.55]} rotation={[0.2, -Math.PI*2.1, 0.4]}>
        <BossClawModel isLeftHand={false} />
      </group>

      {/* Lower Back Arms */}
      <group name="LeftLowerBackArm" position={[-0.48, 1.1, -0.2]} scale={[-0.65, 0.65, 0.65]} rotation={[0.1, Math.PI*2.2, 0]}>
        <BossClawModel isLeftHand={true} />
      </group>
      <group name="RightLowerBackArm" position={[0.48, 1.1, -0.2]} scale={[0.65, 0.65, 0.65]} rotation={[0.1, -Math.PI*2.2, 0]}>
        <BossClawModel isLeftHand={false} />
      </group>

      {/* Multiple Legs */}
      {/* Front Legs (Original) */}
      <group name="LeftFrontLeg" position={[0.2, 0.3, 0.1]}>
        <BoneLegModel />
      </group>
      <group name="RightFrontLeg" position={[-0.2, 0.3, 0.1]}>
        <BoneLegModel />
      </group>

      {/* Middle Front Legs */}
      <group name="LeftMiddleFrontLeg" position={[0.25, 0.3, -0.1]} rotation={[0, -0.2, 0]}>
        <BoneLegModel />
      </group>
      <group name="RightMiddleFrontLeg" position={[-0.25, 0.3, -0.1]} rotation={[0, 0.2, 0]}>
        <BoneLegModel />
      </group>

      {/* Middle Back Legs */}
      <group name="LeftMiddleBackLeg" position={[0.3, 0.3, -0.3]} rotation={[0, -0.4, 0]}>
        <BoneLegModel />
      </group>
      <group name="RightMiddleBackLeg" position={[-0.3, 0.3, -0.3]} rotation={[0, 0.4, 0]}>
        <BoneLegModel />
      </group>

      {/* Back Legs */}
      <group name="LeftBackLeg" position={[0.35, 0.3, -0.5]} rotation={[0, -0.6, 0]}>
        <BoneLegModel />
      </group>
      <group name="RightBackLeg" position={[-0.35, 0.3, -0.5]} rotation={[0, 0.6, 0]}>
        <BoneLegModel />
      </group>

      {/* Pelvis structure */}
      <group position={[0, 0.7, -0.25]} scale={[1.1, 1, 1.25]}>
        {/* Main pelvic bowl */}
        <mesh>
          <cylinderGeometry args={[0.35, 0.34, 0.2, 8]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
        </mesh>

   

        {/* Sacral vertebrae */}
        <group position={[0, 0.15, -0.16]} rotation={[0.1, 0, 0]}>
          {[0.15, 0.27, 0.39, 0.51, 0.63].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <cylinderGeometry args={[0.0225, 0.0225, 0.03, 6]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
            </mesh>
          ))}
        </group>

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
    </group>
  );
} 