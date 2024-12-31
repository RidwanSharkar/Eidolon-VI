import React, { useRef, useState, useEffect } from 'react';
import { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';

interface CustomSkeletonProps {
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
    color: "#ff0000",
    emissive: "#660000",
    emissiveIntensity: 0.5,
    roughness: 0.4,
    metalness: 0.6
  };

  return (
    <group rotation={[0, -1.05, -Math.PI / 2.5]} position={[+0.3, -0.1, 0.75]}>
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
          color="#a00000"
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Blade Base */}
      <mesh position={[0, +2, 0]}>
        <cylinderGeometry args={[0.325, 0.125, 2.5, 4]} />
        <meshStandardMaterial 
          {...redMaterial}
        />
      </mesh>

      {/* Blade Tip */}
      <mesh position={[0, 4.1, 0]}>
        <coneGeometry args={[0.325, 1.7, 4]} />
        <meshStandardMaterial 
          {...redMaterial}
        />
      </mesh>

      {/* Add a subtle glow effect */}
      <pointLight 
        color="#ff0000"
        intensity={0.5}
        distance={2}
        decay={2}
      />
    </group>
  );
}

function ShoulderPlate() {
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
      
      {/* Decorative spikes */}
      {[0, 0.2, 0.1].map((offset, i) => (
        <group key={i} position={[0, 0.25, offset-0.1]} rotation={[0, 0, 0]}>
          <mesh>
            <coneGeometry args={[0.04, 0.225, 5]} />
            <meshStandardMaterial 
              color="#d4d4d4"
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function CustomSkeleton({ position, isAttacking, isWalking, onHit }: CustomSkeletonProps) {
  const groupRef = useRef<Group>(null);
  const [walkCycle, setWalkCycle] = useState(0);
  const [attackCycle, setAttackCycle] = useState(0);
  const attackAnimationRef = useRef<NodeJS.Timeout>();

  const walkSpeed = 2.5;
  const attackSpeed = 3;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isWalking) {
      setWalkCycle((prev) => (prev + delta * walkSpeed) % (Math.PI * 2));
      
      //BUGGED BUT USEFUL FOR RISING FROM GROUND EFFECT
      // Calculate the vertical offset caused by walking
      const walkHeightOffset = Math.abs(Math.sin(walkCycle) * 0.1); // This captures the natural up/down motion
      
      // Compensate for the height change by adjusting the root position
      if (groupRef.current) {
        // Keep the base position constant by subtracting the offset
        groupRef.current.position.y = position[1] - walkHeightOffset;
      }
      
      // Enhanced walking animation with joint mechanics
      ['LeftLeg', 'RightLeg'].forEach(part => {
        const limb = groupRef.current?.getObjectByName(part) as Mesh;
        if (limb) {
          const isRight = part.includes('Right');
          const phase = isRight ? walkCycle : walkCycle + Math.PI;
          
          // Upper leg movement
          const upperLegAngle = Math.sin(phase) * 0.4;
          limb.rotation.x = upperLegAngle;

          // Lower leg movement (knee joint)
          const lowerLeg = limb.children[0]?.children[1];
          if (lowerLeg) {
            const kneePhase = phase + Math.PI / 4;
            const baseKneeAngle = 0.2;
            const kneeFlexion = Math.max(0, Math.sin(kneePhase));
            const kneeAngle = baseKneeAngle + kneeFlexion * 0.8;

            lowerLeg.rotation.x = kneeAngle;
            
            const twistAngle = Math.sin(phase) * 0.1;
            lowerLeg.rotation.y = twistAngle;
          }

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
        }, 1000); // 500ms delay to sync with animation
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
      {/* Ribcage/Torso - keep current position */}
      <group name="Body" position={[0, 1.45, 0]} scale={0.85}>
        {/* Spine */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 1.6, 6]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Ribs */}
        {[-0.5, -0.25, 0, 0.25, 0.5].map((y, i) => (
          <group key={i} position={[0, y, 0]}>
            {/* Left rib */}
            <group rotation={[0, 0, -Math.PI / 3]}>
              <mesh position={[0.1, 0, 0]} rotation={[1, Math.PI / 2, 0]}>
                <torusGeometry args={[0.18, 0.015, 8, 12, Math.PI * 1]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
              </mesh>
            </group>
            {/* Right rib */}
            <group rotation={[0, 0, Math.PI / 3]}>
              <mesh position={[-0.1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <torusGeometry args={[0.18, 0.015, 8, 12, Math.PI * 1]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* Skull - keep current position */}
      <group name="Head" position={[0, 2.0, 0]}>
        {/* Main skull shape */}
        <group>
          {/* Back of cranium */}
          <mesh position={[0, 0, -0.05]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
          </mesh>
          
          {/* Front face plate */}
          <mesh position={[0, -0.02, 0.12]}>
            <boxGeometry args={[0.28, 0.3, 0.12]} />
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
                  <coneGeometry args={[0.02, 0.075, 3]} />
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

        {/* Eye sockets with glow effect */}
        <group position={[0, 0.05, 0.14]}>
          {/* Left eye */}
          <group position={[-0.07, 0, 0]}>
            {/* Core eye */}
            <mesh>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#000000" emissive="#ff0000" emissiveIntensity={3} />
            </mesh>
            {/* Inner glow */}
            <mesh scale={1.2}>
            <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial 
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={1}
                transparent
                opacity={1}
              />
            </mesh>
            {/* Outer glow */}
            <mesh scale={1.4}>
            <sphereGeometry args={[0.05, 6.5, 2]} />
              <meshStandardMaterial 
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={1}
                transparent
                opacity={1}
              />
            </mesh>
            {/* Point light for dynamic glow */}
            <pointLight 
              color="#ff0000"
              intensity={1}
              distance={0.5}
              decay={2}
            />
          </group>

          {/* Right eye */}
          <group position={[0.07, 0, 0]}>
            {/* Core eye */}
            <mesh>
              <sphereGeometry args={[0.02, 8, 8]} />
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
                opacity={1}
              />
            </mesh>
            {/* Outer glow */}
            <mesh scale={1.3}>
              <sphereGeometry args={[0.05, 6.5, 2]} />
              <meshStandardMaterial 
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={1}
                transparent
                opacity={1}
              />
            </mesh>
            {/* Point light for dynamic glow */}
            <pointLight 
              color="#ff0000"
              intensity={1}
              distance={1}
              decay={2}
            />
          </group>
        </group>
      </group>

      {/* Add shoulder plates just before the arms */}
      <group position={[-0.35, 1.6, 0]} rotation={[-0.35, -Math.PI - 0.4, -0.35]}>
        <ShoulderPlate />
      </group>
      <group position={[0.35, 1.6, 0]} rotation={[-0.35, Math.PI -0.4, 0.35]}>
        <ShoulderPlate />
      </group>

      {/* arms with scaled boss claws */}
      <group name="LeftArm" position={[-0.35, 1.525, 0]} scale={[-0.4, 0.4, 0.4]} rotation={[0, Math.PI/2, 0]}>
        <BossClawModel isLeftHand={true} />
      </group>
      <group name="RightArm" position={[0.35, 1.525, 0.1]} scale={[0.4, 0.4, 0.4]} rotation={[0, -Math.PI/2.5, 0]}>
        <BossClawModel isLeftHand={false} />
      </group>

      {/* Pelvis - moved higher up */}
      <group position={[0, 0.7, 0]}> {/* Moved up from 0.4 to 0.7 */}
        <mesh>
          <cylinderGeometry args={[0.26, 0.25, 0.15, 8]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* Legs - keep same ground position but connect to higher pelvis */}
      <group name="LeftLeg" position={[0.2, 0.3, 0]}>
        <BoneLegModel />
      </group>
      <group name="RightLeg" position={[-0.2, 0.3, 0]}>
        <BoneLegModel />
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