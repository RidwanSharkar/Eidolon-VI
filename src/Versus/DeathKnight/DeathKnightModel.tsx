// src/Versus/DeathKnight/DeathKnightModel.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Group, Mesh, MeshStandardMaterial, SphereGeometry, CylinderGeometry, ConeGeometry, Shape, ExtrudeGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import BonePlate from '@/gear/BonePlate';
import DeathKnightSword from './DeathKnightSword';
import DeathKnightTrailEffect from './DeathKnightTrailEffect';

interface DeathKnightModelProps {
  position: [number, number, number];
  isAttacking: boolean;
  isWalking: boolean;
  onHit?: (damage: number) => void;
  isUsingDeathGrasp?: boolean;
  isUsingFrostStrike?: boolean;
  onDeathGraspStart?: () => void;
  onFrostStrikeStart?: () => void;
}

// Reuse Materials - light purple theme
const standardBoneMaterial = new MeshStandardMaterial({
  color: "#d0d0d0", // Keep bone color neutral
  roughness: 0.5,
  metalness: 0.4
});

const darkBoneMaterial = new MeshStandardMaterial({
  color: "#b8b8b8", // Keep bone color neutral
  roughness: 0.4,
  metalness: 0.5
});

// Cache geometries that are reused frequently (scaled for death knight)
const jointGeometry = new SphereGeometry(0.066, 8, 8); // 1.1x larger than skeleton
const largeBoneGeometry = new CylinderGeometry(0.044, 0.035, 1.1, 6); // 1.1x larger than skeleton  
const clawGeometry = new ConeGeometry(0.022, 0.165, 6); // 1.1x larger than skeleton

// Simplified blade decoration component with light purple
function BladeDecoration({ scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }: { 
  scale?: number; 
  position?: [number, number, number]; 
  rotation?: [number, number, number]; 
}) {
  // Create a simplified blade shape
  const bladeShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.15, -0.05);
    shape.bezierCurveTo(0.3, 0.08, 0.5, 0.18, 0.6, 0.2);
    shape.lineTo(0.4, 0.28);
    shape.bezierCurveTo(0.2, 0.08, 0.08, 0.0, 0.04, 0.25);
    shape.lineTo(0, 0);
    return shape;
  }, []);

  const bladeExtrudeSettings = useMemo(() => ({
    steps: 2,
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 12
  }), []);

  const bladeGeometry = useMemo(() => new ExtrudeGeometry(bladeShape, bladeExtrudeSettings), [bladeShape, bladeExtrudeSettings]);

  const bladeMaterial = useMemo(() => new MeshStandardMaterial({
    color: "#DDA0DD", // Light purple (plum)
    emissive: "#DDA0DD",
    emissiveIntensity: 0.8,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 1.0
  }), []);

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <mesh geometry={bladeGeometry} material={bladeMaterial} />
    </group>
  );
}

function DeathKnightLegModel() {
  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={largeBoneGeometry} material={standardBoneMaterial} scale={[width/0.044, length/1.1, width/0.044]} />
  );

  const createJoint = (size: number) => (
    <mesh geometry={jointGeometry} material={standardBoneMaterial} scale={[size/0.066, size/0.066, size/0.066]} />
  );

  const createParallelBones = (length: number, spacing: number) => (
    <group>
      <group position={[spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.044)}
      </group>
      <group position={[-spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.044)}
      </group>
      <group position={[0, length/2, 0]}>
        {createJoint(0.066)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.066)}
      </group>
    </group>
  );

  return (
    <group>
      {/* Upper leg - scaled for death knight */}
      <group>
        {createParallelBones(0.715, 0.055)} {/* 1.1x scale */}
        
        {/* Knee joint */}
        <group position={[0, -0.385, 0]}>
          <mesh>
            <sphereGeometry args={[0.088, 12, 12]} />
            <meshStandardMaterial color="#d0d0d0" roughness={0.5} metalness={0.4} />
          </mesh>
          
          {/* Lower leg */}
          <group position={[0, -0.165, 0]}>
            {createParallelBones(0.77, 0.066)}
            
            {/* Ankle */}
            <group position={[0, -0.275, 0]} rotation={[Math.PI/2, 0, 0]}>
              {createJoint(0.066)}
              
              {/* Foot structure - light purple boots */}
              <group position={[0, -0.017, 0.11]}>
                <mesh>

                </mesh>
                
                {/* Light purple boots with proper orientation */}
                <group position={[0, 0, 0]}>
                  {/* Main boot body - light purple */}
                  <mesh position={[0, 0.044, 0.055]}>
                    <boxGeometry args={[0.175, 0.21, 0.55]} />
                    <meshStandardMaterial 
                      color="#DDA0DD" 
                      roughness={0.3} 
                      metalness={0.8}
                    />
                  </mesh>

                  {/* Forward extending foot portion - scaled smaller and lowered */}
                  <mesh position={[0, 0.325, 0.25]} rotation={[0.65, 0, 0]}>
                    <boxGeometry args={[0.15, 0.225, 0.055]} />
                    <meshStandardMaterial 
                      color="#DDA0DD" 
                      roughness={0.3} 
                      metalness={0.8}
                    />
                  </mesh>

                  {/* Foot top plate for better definition - adjusted to match smaller foot */}
                  <mesh position={[0, 0.23, 0.25]}>
                    <boxGeometry args={[0.14, 0.25, 0.018]} />
                    <meshStandardMaterial 
                      color="#DA70D6" 
                      roughness={0.2} 
                      metalness={0.9}
                    />
                  </mesh>

                  {/* Enhanced boot sole with treads - corrected to extend along foot length */}
                  <mesh position={[0, 0.25, 0.35]}>
                    <boxGeometry args={[0.175, 0.325, 0.044]} />
                    <meshStandardMaterial 
                      color="#DA70D6" 
                      roughness={0.8} 
                      metalness={0.4}
                    />
                  </mesh>

                  {/* Side armor reinforcement - corrected to run along foot length */}
                  {[-1, 1].map((side) => (
                    <mesh key={side} position={[side * 0.1125, 0.125, 0.275]}>
                      <boxGeometry args={[0.0175, 0.40, 0.14]} />
                      <meshStandardMaterial 
                        color="#DA70D6" 
                        roughness={0.2} 
                        metalness={0.9}
                      />
                    </mesh>
                  ))}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function DeathKnightClawModel() {
  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={largeBoneGeometry} material={standardBoneMaterial} scale={[width/0.044, length/1.1, width/0.044]} />
  );

  const createJoint = (size: number) => (
    <mesh geometry={jointGeometry} material={standardBoneMaterial} scale={[size/0.066, size/0.066, size/0.066]} />
  );

  const createParallelBones = (length: number, spacing: number) => (
    <group>
      <group position={[spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.066)}
      </group>
      <group position={[-spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.066)}
      </group>
      <group position={[0, length/2, 0]}>
        {createJoint(0.088)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.088)}
      </group>
    </group>
  );

  return (
    <group>
      <group>
        {createParallelBones(1.43, 0.165)} {/* 1.1x scale */}
        
        <group position={[0.275, -0.935, 0.231]}> 
          <mesh>
            <sphereGeometry args={[0.132, 12, 12]} />
            <meshStandardMaterial 
              color="#d0d0d0"
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>
          
          <group rotation={[-0.7, -0, Math.PI / 5]}>
            {createParallelBones(0.88, 0.132)}
            
            <group position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 5.5]}>
              {createJoint(0.099)}
              
              <group position={[0, -0.11, 0]}>
                <mesh>
                  <boxGeometry args={[0.22, 0.165, 0.088]} />
                  <meshStandardMaterial color="#d0d0d0" roughness={0.5} />
                </mesh>
                
                {/* Three fingers */}
                {[-0.088, 0, 0.088].map((offset, i) => (
                  <group 
                    key={i} 
                    position={[offset, -0.11, 0]}
                    rotation={[0, 0, (i - 1) * Math.PI / 8]}
                  >
                    {createBoneSegment(0.55, 0.022)}
                    <group position={[0.0275, -0.33, 0]} rotation={[0, 0, Math.PI + Math.PI / 16]}>
                      <mesh geometry={clawGeometry} material={darkBoneMaterial} />
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

function DeathKnightShoulderPlate({ isLeftShoulder = false }: { isLeftShoulder?: boolean }) {
  return (
    <group>
      <group>
        {/* Main shoulder pauldron - light purple theme */}
        <mesh>
          <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.9]} />
          <meshStandardMaterial 
            color="#DDA0DD"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>

        {/* Layered armor plates - light purple style */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i /7) * Math.PI * 2;
          const radius = 0.18 + (i % 2) * 0.02;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              <mesh position={[radius, -0.033 * i, 0]} rotation={[0.1, 0, 0]}>
                <boxGeometry args={[0.1, 0.165 - i * 0.011, 0.033]} />
                <meshStandardMaterial 
                  color={i % 2 === 0 ? "#DDA0DD" : "#DA70D6"}
                  roughness={0.3}
                  metalness={0.8}
                />
              </mesh>
            </group>
          );
        })}

        {/* Elaborate shoulder spikes - light purple style */}
        {[0, 1, 2].map((i) => {
          const angle = (i / 3) * Math.PI * 2;
          const height = 0.12 + i * 0.02;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              <mesh position={[0.20, 0.15, 0]} rotation={[0.2, 0, 0]}>
                <coneGeometry args={[0.022, height, 8]} />
                <meshStandardMaterial 
                  color="#DA70D6"
                  roughness={0.2}
                  metalness={0.9}
                />
              </mesh>
              
              {/* Spike bases */}
              <mesh position={[0.20, 0.08, 0]}>
                <cylinderGeometry args={[0.033, 0.022, 0.055, 8]} />
                <meshStandardMaterial 
                  color="#DDA0DD"
                  roughness={0.3}
                  metalness={0.8}
                />
              </mesh>
            </group>
          );
        })}

        {/* Decorative trim rings - light purple */}
        <mesh position={[0, 0.165, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.165, 0.016, 6, 12]} />
          <meshStandardMaterial 
            color="#DA70D6"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        <mesh position={[0, 0.055, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.198, 0.022, 8, 16]} />
          <meshStandardMaterial 
            color="#D8BFD8"
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>

        <mesh position={[0, -0.066, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.22, 0.018, 8, 16]} />
          <meshStandardMaterial 
            color="#DA70D6"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Central shoulder emblem */}
        <group position={[0, 0.088, 0.18]}>
          <mesh>
            <cylinderGeometry args={[0.055, 0.055, 0.022, 8]} />
            <meshStandardMaterial 
              color="#D8BFD8"
              roughness={0.1}
              metalness={0.95}
            />
          </mesh>
          
          {/* Emblem details */}
          <mesh position={[0, 0, 0.011]}>
            <cylinderGeometry args={[0.033, 0.033, 0.011, 6]} />
            <meshStandardMaterial 
              color="#DDA0DD"
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>

          {/* Central spike */}
          <mesh position={[0, 0.022, 0]}>
            <coneGeometry args={[0.016, 0.044, 6]} />
            <meshStandardMaterial 
              color="#DA70D6"
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        </group>

        {/* Shoulder guard extensions */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.165, -0.044, 0]} rotation={[0, side * Math.PI/8, side * 0.1]}>
            <mesh>
              <boxGeometry args={[0.088, 0.132, 0.055]} />
              <meshStandardMaterial 
                color="#DDA0DD"
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
            
            {/* Guard trim */}
            <mesh position={[0, 0, 0.028]}>
              <boxGeometry args={[0.099, 0.143, 0.011]} />
              <meshStandardMaterial 
                color="#DA70D6"
                roughness={0.2}
                metalness={0.9}
              />
            </mesh>
          </group>
        ))}

        {/* Decorative blade patterns on shoulder plates */}
        {[-1, 1].map((side) => {
          // For left shoulder, invert the blade directions for symmetry
          const bladeMultiplier = isLeftShoulder ? -side : side;
          return (
            <group key={`blade-${side}`}>
              {/* Secondary blade decoration on front - larger */}
              <BladeDecoration 
                scale={0.4}
                position={[side * 0.15, 0.08, 0.2]}
                rotation={[Math.PI/4, bladeMultiplier * Math.PI/8, bladeMultiplier * Math.PI/16]}
              />
              
              {/* Side accent blade - larger and more visible */}
              <BladeDecoration 
                scale={0.3}
                position={[side * 0.22, 0.15, 0.1]}
                rotation={[Math.PI/6, bladeMultiplier * Math.PI/4, bladeMultiplier * Math.PI/8]}
              />
              
              {/* Additional prominent blade on shoulder edge */}
              <BladeDecoration 
                scale={0.5}
                position={[side * 0.25, 0.12, 0.05]}
                rotation={[0, bladeMultiplier * Math.PI/3, bladeMultiplier * Math.PI/4]}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
}

export default function DeathKnightModel({ 
  position, 
  isAttacking, 
  isWalking, 
  onHit,
  isUsingDeathGrasp = false,
  isUsingFrostStrike = false,
  onDeathGraspStart,
  onFrostStrikeStart
}: DeathKnightModelProps) {
  const groupRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const [walkCycle, setWalkCycle] = useState(0);
  const [attackCycle, setAttackCycle] = useState(0);
  const [deathGraspCycle, setDeathGraspCycle] = useState(0);
  const [frostStrikeCycle, setFrostStrikeCycle] = useState(0);
  const attackAnimationRef = useRef<NodeJS.Timeout>();
  const deathGraspAnimationRef = useRef<NodeJS.Timeout>();
  const frostStrikeAnimationRef = useRef<NodeJS.Timeout>();

  const walkSpeed = 3.25; // Similar to regular skeleton but slightly slower
  const attackSpeed = 2.25; // Faster attack animation for quicker downswing

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isWalking) {
      setWalkCycle((prev) => (prev + delta * walkSpeed) % (Math.PI * 2));
      
      const walkHeightOffset = Math.abs(Math.sin(walkCycle) * 0.15); // Slightly more pronounced
      
      if (groupRef.current) {
        groupRef.current.position.y = position[1] + 1.1 - walkHeightOffset;
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
      if (!isAttacking && !isUsingDeathGrasp && !isUsingFrostStrike) {
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

    // Attack animation - prioritize over other animations to prevent interference
    if (isAttacking && !isUsingDeathGrasp && !isUsingFrostStrike) {
      setAttackCycle((prev) => prev + delta * attackSpeed);
      const progress = Math.min(attackCycle, Math.PI * 2); // Extended cycle for longer animation
      
      // Two-handed attack animation - both arms move together
      const leftArm = groupRef.current.getObjectByName('LeftArm') as Mesh;
      const rightArm = groupRef.current.getObjectByName('RightArm') as Mesh;
      
      // Get shoulder plates for animation
      const leftShoulder = groupRef.current.children.find(child => 
        child.position.x < 0 && Math.abs(child.position.y - 1.496) < 0.1
      );
      const rightShoulder = groupRef.current.children.find(child => 
        child.position.x > 0 && Math.abs(child.position.y - 1.496) < 0.1
      );
      
      if (leftArm && rightArm) {
        if (progress < Math.PI * 0.5) {
          // Wind-up phase: both arms raise extremely high for massive arc - keep original timing
          const windupPhase = progress / (Math.PI * 0.5);
          const windupAngle = Math.sin(windupPhase * Math.PI/2) * Math.PI * 1.3; // Consistent wide arc (234 degrees)
          
          leftArm.rotation.x = -windupAngle;
          rightArm.rotation.x = -windupAngle;
          
          // More pronounced inward rotation for gripping
          leftArm.rotation.z = windupPhase * 0.7;
          rightArm.rotation.z = -windupPhase * 0.7;
          
          // Enhanced shoulder plate movement during wind-up
          if (leftShoulder) {
            leftShoulder.rotation.x = windupPhase * 0.5;
            leftShoulder.rotation.z = windupPhase * 0.3;
          }
          if (rightShoulder) {
            rightShoulder.rotation.x = windupPhase * 0.5;
            rightShoulder.rotation.z = -windupPhase * 0.3;
          }
        } else if (progress < Math.PI * 0.9) {
          // Strike phase: FASTER devastating downward slam with guaranteed massive arc
          const strikePhase = (progress - Math.PI * 0.5) / (Math.PI * 0.4); // Shorter phase for faster downswing
          const maxWindupAngle = Math.PI * 1.3; // Guaranteed consistent peak angle
          
          // Use exponential curve for faster, more impactful downswing
          const strikeCurve = Math.pow(strikePhase, 0.7); // Faster than sin curve
          const strikeAngle = -maxWindupAngle + (strikeCurve * Math.PI * 2.0); // Guaranteed massive swing arc
          
          leftArm.rotation.x = strikeAngle;
          rightArm.rotation.x = strikeAngle;
          
          // Maintain grip during strike with dramatic movement
          leftArm.rotation.z = 0.7 * (1 - strikePhase * 0.8);
          rightArm.rotation.z = -0.7 * (1 - strikePhase * 0.8);
          
          // Dynamic shoulder plate movement during strike
          if (leftShoulder) {
            leftShoulder.rotation.x = 0.5 * (1 - strikePhase) + strikePhase * (-0.4);
            leftShoulder.rotation.z = 0.3 * (1 - strikePhase);
          }
          if (rightShoulder) {
            rightShoulder.rotation.x = 0.5 * (1 - strikePhase) + strikePhase * (-0.4);
            rightShoulder.rotation.z = -0.3 * (1 - strikePhase);
          }
        } else {
          // Recovery phase: return to neutral position
          const recoveryPhase = (progress - Math.PI * 0.9) / (Math.PI * 1.1);
          const maxStrikeAngle = -Math.PI * 1.3 + Math.PI * 2.0; // Calculate the final strike angle
          const recoveryAngle = maxStrikeAngle * (1 - Math.sin(recoveryPhase * Math.PI/2)); // Smooth recovery
          
          leftArm.rotation.x = recoveryAngle;
          rightArm.rotation.x = recoveryAngle;
          
          // Gradual return to neutral grip
          leftArm.rotation.z = 0.7 * 0.2 * (1 - recoveryPhase);
          rightArm.rotation.z = -0.7 * 0.2 * (1 - recoveryPhase);
          
          // Shoulder plates return to neutral
          if (leftShoulder) {
            leftShoulder.rotation.x = -0.4 * (1 - recoveryPhase);
            leftShoulder.rotation.z = 0;
          }
          if (rightShoulder) {
            rightShoulder.rotation.x = -0.4 * (1 - recoveryPhase);
            rightShoulder.rotation.z = 0;
          }
        }
      }

      // Deal damage at the peak of the strike (during strike phase)
      if (attackCycle > Math.PI * 0.7 && attackCycle < Math.PI * 0.8 && onHit && !attackAnimationRef.current) {
        attackAnimationRef.current = setTimeout(() => {
          attackAnimationRef.current = undefined;
        }, 0);
      }

      if (attackCycle > Math.PI * 2) {
        setAttackCycle(0);
        // Reset arm positions to ensure clean state
        if (leftArm && rightArm) {
          leftArm.rotation.x = 0;
          rightArm.rotation.x = 0;
          leftArm.rotation.z = 0;
          rightArm.rotation.z = 0;
        }
        // Reset shoulder plate positions
        if (leftShoulder) {
          leftShoulder.rotation.x = 0;
          leftShoulder.rotation.z = 0;
        }
        if (rightShoulder) {
          rightShoulder.rotation.x = 0;
          rightShoulder.rotation.z = 0;
        }
      }
    } else if (!isAttacking) {
      // Clear the timeout and reset attack cycle if attack is interrupted
      if (attackAnimationRef.current) {
        clearTimeout(attackAnimationRef.current);
        attackAnimationRef.current = undefined;
      }
      // Reset attack cycle to prevent stuck states
      setAttackCycle(0);
    }

    // Death Grasp animation - right hand raising
    if (isUsingDeathGrasp) {
      setDeathGraspCycle((prev) => prev + delta * 3); // Faster animation
      const progress = Math.min(deathGraspCycle, Math.PI);
      
      const rightArm = groupRef.current.getObjectByName('RightArm') as Mesh;
      
      if (rightArm) {
        if (progress < Math.PI/2) {
          // Raise right hand phase
          const raisePhase = progress / (Math.PI/2);
          const raiseAngle = -Math.PI/2 * raisePhase; // Raise arm up
          
          rightArm.rotation.x = raiseAngle;
          rightArm.rotation.z = -raisePhase * 0.2; // Slight inward rotation
        } else {
          // Hold position and trigger grasp
          rightArm.rotation.x = -Math.PI/2;
          rightArm.rotation.z = -0.2;
          
          // Trigger death grasp at peak
          if (deathGraspCycle > Math.PI * 0.6 && onDeathGraspStart && !deathGraspAnimationRef.current) {
            deathGraspAnimationRef.current = setTimeout(() => {
              deathGraspAnimationRef.current = undefined;
              onDeathGraspStart();
            }, 0);
          }
        }
      }

      if (deathGraspCycle > Math.PI * 1.5) {
        setDeathGraspCycle(0);
        // Reset arm positions
        if (rightArm) {
          rightArm.rotation.x = 0;
          rightArm.rotation.z = 0;
        }
      }
    } else {
      // Clear the timeout if death grasp is interrupted
      if (deathGraspAnimationRef.current) {
        clearTimeout(deathGraspAnimationRef.current);
        deathGraspAnimationRef.current = undefined;
      }
    }

    // Frost Strike animation - both hands raise for spell casting
    if (isUsingFrostStrike) {
      setFrostStrikeCycle((prev) => prev + delta * 2.5);
      const progress = Math.min(frostStrikeCycle, Math.PI);
      
      const leftArm = groupRef.current.getObjectByName('LeftArm') as Mesh;
      const rightArm = groupRef.current.getObjectByName('RightArm') as Mesh;
      
      if (leftArm && rightArm) {
        if (progress < Math.PI/3) {
          // Raise both hands phase for spellcasting
          const raisePhase = progress / (Math.PI/3);
          const raiseAngle = -Math.PI/3 * raisePhase; // Raise arms up for casting
          
          leftArm.rotation.x = raiseAngle;
          rightArm.rotation.x = raiseAngle;
          
          // Spread arms slightly for spell casting pose
          leftArm.rotation.z = raisePhase * 0.3;
          rightArm.rotation.z = -raisePhase * 0.3;
        } else if (progress < Math.PI * 0.7) {
          // Hold casting position and trigger frost strike
          leftArm.rotation.x = -Math.PI/3;
          rightArm.rotation.x = -Math.PI/3;
          leftArm.rotation.z = 0.3;
          rightArm.rotation.z = -0.3;
          
          // Add light purple glow effect to hands during casting
          if (frostStrikeCycle > Math.PI * 0.4 && onFrostStrikeStart && !frostStrikeAnimationRef.current) {
            frostStrikeAnimationRef.current = setTimeout(() => {
              frostStrikeAnimationRef.current = undefined;
              onFrostStrikeStart();
            }, 0);
          }
        } else {
          // Lower hands phase
          const lowerPhase = (progress - Math.PI * 0.7) / (Math.PI * 0.3);
          const lowerAngle = -Math.PI/3 * (1 - lowerPhase);
          
          leftArm.rotation.x = lowerAngle;
          rightArm.rotation.x = lowerAngle;
          leftArm.rotation.z = 0.3 * (1 - lowerPhase);
          rightArm.rotation.z = -0.3 * (1 - lowerPhase);
        }
      }

      if (frostStrikeCycle > Math.PI) {
        setFrostStrikeCycle(0);
        // Reset arm positions
        if (leftArm && rightArm) {
          leftArm.rotation.x = 0;
          rightArm.rotation.x = 0;
          leftArm.rotation.z = 0;
          rightArm.rotation.z = 0;
        }
      }
    } else {
      // Clear the timeout if frost strike is interrupted
      if (frostStrikeAnimationRef.current) {
        clearTimeout(frostStrikeAnimationRef.current);
        frostStrikeAnimationRef.current = undefined;
      }
    }
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (attackAnimationRef.current) {
        clearTimeout(attackAnimationRef.current);
      }
      if (deathGraspAnimationRef.current) {
        clearTimeout(deathGraspAnimationRef.current);
      }
      if (frostStrikeAnimationRef.current) {
        clearTimeout(frostStrikeAnimationRef.current);
      }
    };
  }, []);

  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1] + 1.0, position[2]]} // Fixed base position
      scale={[0.85, 0.95, 0.85]} // Scaled for death knight size (1.1x skeleton)
    >
      {/* Body - death knight armor */}
      <group name="Body" position={[0, 1.176, 0.176]} scale={[0.935, 0.935, 0.935]} rotation={[0.2, 0, 0]}>
        <BonePlate />
      </group>

      {/* Head - death knight skull with light purple eyes */}
      <group name="Head" position={[0, 1.54, 0.44]} scale={[0.825, 0.825, 0.825]} rotation={[0.15, 0, 0]}>
        {/* Main skull shape */}
        <group>
          {/* Back of cranium */}
          <mesh position={[0, 0, -0.05]}>
            <sphereGeometry args={[0.26, 8, 8]} />
            <meshStandardMaterial color="#d0d0d0" roughness={0.5} metalness={0.4} />
          </mesh>
          
          {/* Front face plate */}
          <mesh position={[0, -0.02, 0.12]}>
            <boxGeometry args={[0.34, 0.34, 0.12]} />
            <meshStandardMaterial color="#d0d0d0" roughness={0.5} metalness={0.4} />
          </mesh>

          {/* Death knight jaw */}
          <group position={[0, -0.18, 0.05]}>
            <mesh position={[0, -0.10, 0.10]} rotation={[0, Math.PI/5, 0]}>
              <cylinderGeometry args={[0.10, 0.10, 0.24, 5]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.6} metalness={0.3} />
            </mesh>
          </group>

          {/* Glowing light purple eyes */}
          <group position={[0, 0.05, 0.14]}>
            {/* Left eye */}
            <group position={[-0.09, 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color="#DDA0DD" emissive="#DDA0DD" emissiveIntensity={4} />
              </mesh>
              <pointLight 
                color="#DDA0DD"
                intensity={0.8}
                distance={2}
                decay={2}
              />
            </group>

            {/* Right eye */}
            <group position={[0.09, 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color="#DDA0DD" emissive="#DDA0DD" emissiveIntensity={4} />
              </mesh>
              <pointLight 
                color="#DDA0DD"
                intensity={0.8}
                distance={2}
                decay={2}
              />
            </group>
          </group>

          {/* Light purple helmet */}
          <group position={[0, 0.1, 0]}>
            {/* Main helmet bowl */}
            <mesh position={[0, 0.05, -0.02]}>
              <sphereGeometry args={[0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial 
                color="#DDA0DD" 
                roughness={0.3} 
                metalness={0.8}
              />
            </mesh>

            {/* Helmet visor/face guard */}
            <mesh position={[0, -0.05, 0.15]}>
              <boxGeometry args={[0.32, 0.25, 0.08]} />
              <meshStandardMaterial 
                color="#DDA0DD" 
                roughness={0.3} 
                metalness={0.8}
              />
            </mesh>

            {/* Side helmet guards */}
            <mesh position={[-0.18, -0.02, 0.08]}>
              <boxGeometry args={[0.06, 0.22, 0.15]} />
              <meshStandardMaterial 
                color="#DDA0DD" 
                roughness={0.3} 
                metalness={0.8}
              />
            </mesh>
            <mesh position={[0.18, -0.02, 0.08]}>
              <boxGeometry args={[0.06, 0.22, 0.15]} />
              <meshStandardMaterial 
                color="#DDA0DD" 
                roughness={0.3} 
                metalness={0.8}
              />
            </mesh>

            {/* Helmet crest/ridge */}
            <mesh position={[0, 0.12, -0.05]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.08, 0.04, 0.25]} />
              <meshStandardMaterial 
                color="#DA70D6" 
                roughness={0.2} 
                metalness={0.9}
              />
            </mesh>

          </group>
        </group>
      </group>

      {/* Shoulder plates - light purple armor */}
      <group position={[-0.385, 1.496, 0.22]} rotation={[0.2, -Math.PI - 0.1, -0.1]}>
        <DeathKnightShoulderPlate isLeftShoulder={true} />
      </group>
      <group position={[0.385, 1.496, 0.22]} rotation={[0.2, Math.PI - 0.1, 0.1]}>
        <DeathKnightShoulderPlate isLeftShoulder={false} />
      </group>

      {/* Death Knight Trail Effects at shoulders */}
      <DeathKnightTrailEffect parentRef={groupRef} isLeftShoulder={true} />
      <DeathKnightTrailEffect parentRef={groupRef} isLeftShoulder={false} />

      {/* Arms - death knight proportions */}
      <group 
        name="LeftArm" 
        ref={leftArmRef}
        position={[-0.45, 1.45, 0.263]} 
        scale={[0.5, 0.5, 0.5]} 
        rotation={[0.1, Math.PI/6, 0.2]}
      >
        <DeathKnightClawModel />
      </group>
      
      {/* Sword attached to right hand */}
      <group 
        name="RightArm" 
        ref={rightArmRef}
        position={[0.45, 1.45, 0.163]} 
        scale={[0.5, 0.5, 0.5]} 
        rotation={[0.1, -Math.PI/2.5, -0.2]}
      >
        <DeathKnightClawModel />
        {/* Light purple sword attached to the hand */}
        <group position={[0.31, 0, 0.5]}>
          <group position={[0, -0.22, 0]}>
            <group position={[0, -0.44, 0]}>
              <group position={[0, 0.088, 0.832]} rotation={[Math.PI, Math.PI/1.5, 0.35]} scale={[0.75, 1.0, 0.75]}>
                <DeathKnightSword />
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Pelvis structure - death knight proportions with light purple kilt */}
      <group position={[0, 0.625, +0.05]} scale={[1.1, 1.1, 1.1]} rotation={[0.1, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.20, 0.18, 8]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* Pelvic joints */}
        {[-1, 1].map((side) => (
          <group key={side} position={[0.18 * side, -0.09, 0]}>
            <mesh>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color="#c0c0c0" roughness={0.6} metalness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Plate mail girdle with light purple armored kilt */}
        <group position={[0, 0, 0]}>
          {/* Main girdle belt */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.275, 0.275, 0.08, 16]} />
            <meshStandardMaterial 
              color="#DDA0DD" 
              roughness={0.3} 
              metalness={0.8}
            />
          </mesh>

          {/* Armored kilt plates - arranged in a circle */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.sin(angle) * 0.22;
            const z = Math.cos(angle) * 0.22;
            return (
              <group key={i} position={[x, -0.06, z]} rotation={[0, -angle, 0]}>
                {/* Individual kilt plate */}
                <mesh position={[0, 0.05, 0]} rotation={[0.1, 0, 0]}>
                  <boxGeometry args={[0.25, 0.375, 0.02]} />
                  <meshStandardMaterial 
                    color="#DDA0DD" 
                    roughness={0.3} 
                    metalness={0.8}
                  />
                </mesh>
                
                {/* Plate trim */}
                <mesh position={[0, -0.15, 0.01]} rotation={[0.1, 0, 0]}>
                  <boxGeometry args={[0.09, 0.18, 0.01]} />
                  <meshStandardMaterial 
                    color="#DA70D6" 
                    roughness={0.2} 
                    metalness={0.9}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* Legs - death knight stance */}
      <group name="LeftLeg" position={[0.154, 0.484, -0.088]} rotation={[0.0425, -0.0425, 0]}>
        <DeathKnightLegModel />
      </group>
      <group name="RightLeg" position={[-0.154, 0.484, -0.088]} rotation={[0.0425, 0.0425, 0]}>
        <DeathKnightLegModel />
      </group>

      {/* Neck connection - death knight proportions */}
      <group position={[0, 1.408, 0.176]}>
        <mesh>
          <cylinderGeometry args={[0.066, 0.066, 0.165, 6]} />
          <meshStandardMaterial color="#d0d0d0" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>
    </group>
  );
}