// src/versus/SkeletalMage/CustomSkeletonMage.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import BonePlate from '@/Gear/BonePlate';

interface CustomSkeletonMageProps {
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
        
        <group position={[0.25, -0.85, 0.21]} scale={[0.8, 0.8, 1.1]}> 
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

                {/* Add staff if it's NOT the left hand (since the model is mirrored) */}
                {!isLeftHand && (
                  <group position={[0, 0, 0.1]} rotation={[Math.PI, Math.PI/4, Math.PI/1.65]} scale={[2.5, 2.5, 2.5]}>
                    <StaffModel isLeftHand={true} />
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
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
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
        <mesh position={[0, 0.22, 0]} rotation={[Math.PI*2, Math.PI*2, Math.PI/2]}>
          <torusGeometry args={[0.1, 0.025, 3, 5]} />
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

function StaffModel({ isLeftHand = false }: { isLeftHand?: boolean }) {
  return (
    <group rotation={[0, 0, isLeftHand ? Math.PI  : -Math.PI / 3]}>
      {/* Staff handle */}
      <mesh>
        <cylinderGeometry args={[0.03, 0.04, 2.8, 8]} />
        <meshStandardMaterial 
          color="#4a2105"
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Staff ornaments */}
      {[0.3, 0.6, 0.9].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh>
            <torusGeometry args={[0.075, 0.03, 3, 16]} />
            <meshStandardMaterial 
              color="#c0c0c0"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}

      

      {/* Crystal top */}
      <group position={[0, 1.25, 0]}>
        {/* Crystal core */}
        <mesh>
          <octahedronGeometry args={[0.2]} />
          <meshStandardMaterial 
            color="#4169E1"
            emissive="#4169E1"
            emissiveIntensity={1.75}
            transparent
            opacity={0.875}
          />
        </mesh>

        {/* Crystal glow */}
        <pointLight 
          color="#4169E1"
          intensity={1}
          distance={3}
          decay={2}
        />

        {/* Floating crystal shards */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (Math.PI * 2 * i) / 4;
          return (
            <group 
              key={i} 
              rotation={[0, angle, 0]}
              position={[
                0.3 * Math.cos(angle), // X position on circle
                0.1 * Math.sin(i * Math.PI), // Y position for up/down float
                0.3 * Math.sin(angle)  // Z position on circle
              ]}
            >
              <mesh>
                <octahedronGeometry args={[0.045]} />
                <meshStandardMaterial 
                  color="#4169E1"
                  emissive="#4169E1"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function MageRobe() {
  return (
    <group>
      {/* Main robe body */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.17, 0.4, 1.625, 8]} />
        <meshStandardMaterial 
          color="#2a0845"
          roughness={0.7}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Robe trim */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.23, 8]} />
        <meshStandardMaterial 
          color="#6b0fb3"
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>


      {/* Shoulder cape pieces */}
      {[-1, 1].map((side) => (
        <group 
          key={side}
          position={[0.3 * side, 1.175, -0]}
          rotation={[0, 0, 0.52 * side]}
        >
          <mesh>
            <cylinderGeometry args={[0.0775, 0.115, 0.275, 6]} />
            <meshStandardMaterial 
              color="#2a0845"
              roughness={0.7}
              transparent
              opacity={0.75}
            />
          </mesh>
        </group>
      ))}

      {/* Shoulder cape pieces */}
      {[-1, 1].map((side) => (
        <group 
          key={side}
          position={[0.3 * side, 0.5, 0]}
          rotation={[0, 5, 0.1 * side]}
        >
          <mesh>
            <cylinderGeometry args={[0.1, 0.125, 0.3, 6]} />
            <meshStandardMaterial 
              color="#2a0845"
              roughness={0.7}
              transparent
              opacity={0.75}
            />
          </mesh>
        </group>
      ))}

    </group>
  );
}

export default function CustomSkeletonMage({ position, isAttacking, isWalking, onHit }: CustomSkeletonMageProps) {
  const groupRef = useRef<Group>(null);
  const [walkCycle, setWalkCycle] = useState(0);
  const [attackCycle, setAttackCycle] = useState(0);
  const attackAnimationRef = useRef<NodeJS.Timeout>();

  const walkSpeed = 3;
  const attackSpeed = 0.6;

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
          const armAngle = Math.sin(phase) * 0.3;
          limb.rotation.x = armAngle;
        }
      });
    }

    if (isAttacking) {
      setAttackCycle((prev) => prev + delta * attackSpeed);
      const progress = Math.min(attackCycle, Math.PI / 4);
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

      if (attackCycle > Math.PI / 4) {
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
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      <group position={[0, 0.75, 0]}>
        <MageRobe />
      </group>

      <group name="Body" position={[0, 1.15, 0]} scale={[0.95, 0.8, 0.8]} rotation={[-0.2, 0, 0]}>
        <BonePlate />
      </group>





      {/* Add magical floating runes around the character */}
      <group>
        {[0, 1, 2].map((i) => (
          <group 
            key={i} 
            rotation={[0, (Math.PI * 2 * i) / 3, 0]}
            position={[0, 1.35, 0]}
          >
            <mesh>
              <ringGeometry args={[0.6, 0.70, 32]} />
              <meshStandardMaterial 
                color="#4169E1"
                emissive="#4169E1"
                emissiveIntensity={1.5}
                transparent
                opacity={0.4}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Add ambient magical particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group 
          key={i} 
          position={[
            Math.sin(i * Math.PI / 4) * 0.2,
            1.25 + Math.cos(i * Math.PI / 2) * 0.3,
            Math.cos(i * Math.PI / 4) * 0.5
          ]}
        >
          <mesh>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshStandardMaterial 
              color="#4169E1"
              emissive="#4169E1"
              emissiveIntensity={2}
              transparent
              opacity={0.7}
            />
          </mesh>
          <pointLight 
            color="#4169E1"
            intensity={0.5}
            distance={1}
            decay={2}
          />
        </group>
      ))}

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
      <group position={[-0.34, 1.475, 0]} rotation={[-0.15, -Math.PI - 0.4, -0.35]}>
        <ShoulderPlate />
      </group>
      <group position={[0.34, 1.475, 0]} rotation={[-0.15, Math.PI -0.4, 0.35]}>
        <ShoulderPlate />
      </group>

      {/* arms with scaled boss claws */}
      <group name="LeftArm" position={[-0.35, 1.325, 0]} scale={[-0.4, 0.4, 0.4]} rotation={[0, Math.PI/3, 0]}>
        <BossClawModel isLeftHand={true} />
      </group>
      <group name="RightArm" position={[0.35, 1.325, 0.1]} scale={[0.4, 0.4, 0.4]} rotation={[0, -Math.PI/2.5, 0]}>
        <BossClawModel isLeftHand={false} />
      </group>
      {/* Pelvis structure */}
      <group position={[0, 0.7, 0]} scale={[1.4, 1, 0.8]}>
        {/* Main pelvic bowl */}
        <mesh>
          <cylinderGeometry args={[0.21, 0.20, 0.2, 8]} />
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

      {/* Legs - keep same ground position but connect to higher pelvis */}
      <group name="LeftLeg" position={[0.2, 0.3, 0]}>
        <BoneLegModel />
      </group>
      <group name="RightLeg" position={[-0.2, 0.3, 0]}>
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