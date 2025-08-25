// src/weapons/Sabres.tsx
  import { useRef, useState, useEffect } from 'react';
  import { Group, Shape, Vector3 } from 'three';
  import { useFrame } from '@react-three/fiber';
  import FireballTrail from '../Spells/Fireball/FireballTrail';

  import * as THREE from 'three';

  const lerp = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
  };
    
  interface SabresProps {
      isSwinging: boolean;
      onSwingComplete: () => void;
      onLeftSwingStart: () => void;
      onRightSwingStart: () => void;
      isBowCharging: boolean;
      isFirebeaming?: boolean;
      hasActiveAbility?: boolean;
      leftTargetPosition?: Vector3 | null;
      rightTargetPosition?: Vector3 | null;
    }
  
  
  export default function Sabre({ isSwinging, onSwingComplete, onLeftSwingStart, onRightSwingStart, isBowCharging, isFirebeaming = false, hasActiveAbility = false, leftTargetPosition = null, rightTargetPosition = null }: SabresProps) {
    // Refs and states for the left sabre
    const leftSabreRef = useRef<Group>(null);
    const leftSwingProgress = useRef(0);
  
    // Refs and states for the right sabre
    const rightSabreRef = useRef<Group>(null);
    const rightSwingProgress = useRef(0);
  
    const leftBasePosition = [-0.8, 0.75, 0.65] as const;
    const rightBasePosition = [0.8, 0.75, 0.65] as const;
  
    // Ref for tracking right swing delay
    const rightSwingDelay = useRef(0);
  
    // Ref to track swing completion
    const isSwingComplete = useRef(false);
  
    // Ref for left swing delay
    const leftSwingDelay = useRef(0);
  
    // Refs for Orbs (Avalanche)
    const leftOrbRef = useRef<THREE.Mesh>(null);
    const rightOrbRef = useRef<THREE.Mesh>(null);
  
    // Modify the state management for explosions
    const [explosions, setExplosions] = useState<Array<{
      id: number;
      position: Vector3;
    }>>([]);
  
    useFrame((_, delta) => {
      if (leftSabreRef.current && rightSabreRef.current) {
        if (isBowCharging || isFirebeaming) {
          // SHEATHING POSITIONS
          const leftSheathPosition = [-0.8, -0.2, 0.5];
          const rightSheathPosition = [0.8, -0.2, 0.5];
          
          // Smoothly move to sheathed positions
          leftSabreRef.current.position.x += (leftSheathPosition[0] - leftSabreRef.current.position.x) * 0.3;
          leftSabreRef.current.position.y += (leftSheathPosition[1] - leftSabreRef.current.position.y) * 0.3;
          leftSabreRef.current.position.z += (leftSheathPosition[2] - leftSabreRef.current.position.z) * 0.3;
          
          rightSabreRef.current.position.x += (rightSheathPosition[0] - rightSabreRef.current.position.x) * 0.3;
          rightSabreRef.current.position.y += (rightSheathPosition[1] - rightSabreRef.current.position.y) * 0.3;
          rightSabreRef.current.position.z += (rightSheathPosition[2] - rightSabreRef.current.position.z) * 0.3;
          
          // Full rotation plus a bit more to point downward
          leftSabreRef.current.rotation.x = lerp(leftSabreRef.current.rotation.x*1.05,   Math.PI * 0.37, 0.3);  // ~216 degrees
          leftSabreRef.current.rotation.z = lerp(leftSabreRef.current.rotation.z,   Math.PI * 1.65, 0.20);  // Same side angle
          
          rightSabreRef.current.rotation.x = lerp(rightSabreRef.current.rotation.x*1.05,   Math.PI * 0.37, 0.3); // ~216 degrees
          rightSabreRef.current.rotation.z = lerp(rightSabreRef.current.rotation.z,   -Math.PI * 1.65, 0.2); // Same side angle

          // Reset swing states when channeling icebeam
          leftSwingProgress.current = 0;
          rightSwingProgress.current = 0;
          leftSwingDelay.current = 0;
          rightSwingDelay.current = 0;
          isSwingComplete.current = false;

        } else if (isSwinging) {
          // Reset isSwingComplete when starting a new swing
          if (leftSwingProgress.current === 0 && rightSwingProgress.current === 0) {
            isSwingComplete.current = false;
          }
          
          // Handle left sabre swing with delay
          if (leftSabreRef.current) {
            if (leftSwingDelay.current < 0.15) {  // 0.15 seconds delay
              leftSwingDelay.current += delta;
            } else {
              if (leftSwingProgress.current === 0) {
                onLeftSwingStart();
              }
              leftSwingProgress.current += delta * 10;
  
              const swingPhase = Math.min(leftSwingProgress.current / Math.PI, 1);
  
              // Adjusted left sabre movement to swing towards front center
              const pivotX = leftBasePosition[0] + Math.sin(swingPhase * Math.PI) * 1.2 -0.45;  //  X movement
              const pivotY = leftBasePosition[1] + 
                (Math.sin(swingPhase * Math.PI * 2) * -0.25);  //  Y movement
              const pivotZ = leftBasePosition[2] + 
                (Math.sin(swingPhase * Math.PI) * 2);  //  forward movement
  
              leftSabreRef.current.position.set(pivotX, pivotY, pivotZ);
  
              // Left sabre specific rotations
              const leftRotationX = Math.sin(swingPhase * Math.PI) * (Math.PI * 0.65);
              const leftRotationY = Math.sin(swingPhase * Math.PI) * (Math.PI * 0.3);
              const leftRotationZ = Math.sin(swingPhase * Math.PI) * (Math.PI * -0.1);
  
              leftSabreRef.current.rotation.set(leftRotationX, leftRotationY, leftRotationZ);
  
              if (leftSwingProgress.current >= Math.PI) {
                leftSwingProgress.current = 0;
                leftSwingDelay.current = 0;
                leftSabreRef.current.rotation.set(0, 0, 0);
                leftSabreRef.current.position.set(...leftBasePosition);
              }
            }
          }
          // Handle right sabre swing (starts immediately)
          if (rightSabreRef.current) {
            if (rightSwingProgress.current === 0) {
              onRightSwingStart();
            }
            rightSwingProgress.current += delta * 9;
  
            const swingPhase = Math.min(rightSwingProgress.current / Math.PI, 1);
  
            // Adjusted right sabre movement to mirror left sabre
            const pivotX = rightBasePosition[0] - Math.sin(swingPhase * Math.PI) * 1.2 + 0.45;  // Mirror of left X movement
            const pivotY = rightBasePosition[1] + 
              (Math.sin(swingPhase * Math.PI * 2) * -0.25);  // Same Y movement
            const pivotZ = rightBasePosition[2] + 
              (Math.sin(swingPhase * Math.PI) * 2);  // Same forward movement
  
            rightSabreRef.current.position.set(pivotX, pivotY, pivotZ);
  
            // Right sabre specific rotations
            const rightRotationX = Math.sin(swingPhase * Math.PI) * (Math.PI * 0.5);
            const rightRotationY = -Math.sin(swingPhase * Math.PI) * (Math.PI * 0.3);
            const rightRotationZ = Math.sin(swingPhase * Math.PI) * (Math.PI * 0.2);

  
            rightSabreRef.current.rotation.set(rightRotationX, rightRotationY, rightRotationZ);
  
            if (rightSwingProgress.current >= Math.PI) {
              rightSwingProgress.current = 0;
              rightSwingDelay.current = 0;
              rightSabreRef.current.rotation.set(0, 0, 0);
              rightSabreRef.current.position.set(...rightBasePosition);
              isSwingComplete.current = true;
              onSwingComplete();
            }
          }
        } else {
          // Return to original combat positions
          leftSabreRef.current.position.x += (leftBasePosition[0] - leftSabreRef.current.position.x) * 0.20;
          leftSabreRef.current.position.y += (leftBasePosition[1] - leftSabreRef.current.position.y) * 0.20;
          leftSabreRef.current.position.z += (leftBasePosition[2] - leftSabreRef.current.position.z) * 0.20;
          
          rightSabreRef.current.position.x += (rightBasePosition[0] - rightSabreRef.current.position.x) * 0.20;
          rightSabreRef.current.position.y += (rightBasePosition[1] - rightSabreRef.current.position.y) * 0.20;
          rightSabreRef.current.position.z += (rightBasePosition[2] - rightSabreRef.current.position.z) * 0.20;
          
          // Reset all rotations
          leftSabreRef.current.rotation.x *= 0.85;
          leftSabreRef.current.rotation.y *= 0.85;
          leftSabreRef.current.rotation.z *= 0.85;
          
          rightSabreRef.current.rotation.x *= 0.85;
          rightSabreRef.current.rotation.y *= 0.85;
          rightSabreRef.current.rotation.z *= 0.85;

          // Reset swing states when idle
          if (!isSwinging) {
            leftSwingProgress.current = 0;
            rightSwingProgress.current = 0;
            leftSwingDelay.current = 0;
            rightSwingDelay.current = 0;
            isSwingComplete.current = false;
          }
        }
      }
    });
  
    //===================================================================================================
    // Create custom sabre blade shape (scimitar)
    const createBladeShape = () => {
      const shape = new Shape();
  
      // Start at center
      shape.moveTo(0, 0);
  
      // Ornate guard shape
      shape.lineTo(-0.15, 0.1);
      shape.lineTo(-0.2, 0);  // Deeper notch
      shape.lineTo(-0.2, -0.05);
      shape.lineTo(0, 0);
  
      // Mirror for right side of guard
      shape.lineTo(0.15, 0.1);
      shape.lineTo(0.2, 0);   // Deeper notch
      shape.lineTo(0.3, 0.0);
      shape.lineTo(0, 0);
  
      // Elegant curved blade shape
      shape.lineTo(0, 0.05);
      // Graceful curve up
      shape.quadraticCurveTo(0.3, 0.15, 0.5, 0.2);
      shape.quadraticCurveTo(0.7, 0.25, 0.9, 0.15);
      // Sharp elegant tip
      shape.quadraticCurveTo(1.0, 0.1, 1.1, 0);
      // Sweeping bottom curve with notch
      shape.quadraticCurveTo(1.0, -0.05, 0.8, -0.1);
      // Distinctive notch
      shape.lineTo(0.7, -0.15);
      shape.lineTo(0.65, -0.1);
      // Continue curve to handle
      shape.quadraticCurveTo(0.4, -0.08, 0.2, -0.05);
      shape.quadraticCurveTo(0.1, -0.02, 0, 0);
  
      return shape;
    };
  
    // Make inner blade shape match outer blade
    const createInnerBladeShape = () => {
      const shape = new Shape();
  
      // Start at center
      shape.moveTo(0, 0);
  
      // Ornate guard shape (slightly smaller)
      shape.lineTo(-0.13, 0.08);
      shape.lineTo(-0.18, 0);
      shape.lineTo(-0.08, -0.04);
      shape.lineTo(0, 0);
  
      // Mirror for right side
      shape.lineTo(0.13, 0.08);
      shape.lineTo(0.18, 0);
      shape.lineTo(0.08, -0.04);
      shape.lineTo(0, 0);
  
      // Elegant curved blade shape (slightly smaller)
      shape.lineTo(0, 0.04);
      // Graceful curve up
      shape.quadraticCurveTo(0.28, 0.13, 0.48, 0.18);
      shape.quadraticCurveTo(0.68, 0.23, 0.88, 0.13);
      // Sharp elegant tip
      shape.quadraticCurveTo(0.98, 0.08, 1.08, 0);
      // Sweeping bottom curve with notch
      shape.quadraticCurveTo(0.98, -0.04, 0.78, -0.08);
      // Distinctive notch
      shape.lineTo(0.68, -0.13);
      shape.lineTo(0.63, -0.08);
      // Continue curve to handle
      shape.quadraticCurveTo(0.38, -0.06, 0.18, -0.04);
      shape.quadraticCurveTo(0.08, -0.02, 0, 0);
  
      return shape;
    };
  
    // Update blade extrude settings for an even thinner blade
    const bladeExtrudeSettings = {
      steps: 2,
      depth: 0.02, 
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.01,
      bevelSegments: 3,
    };
  
    const innerBladeExtrudeSettings = {
      ...bladeExtrudeSettings,
      depth: 0.025,
      bevelThickness: 0.003,
      bevelSize: 0.004,
      bevelOffset: 0,
    };

    //===================================================================================================
  
    // Handle explosions when targets are hit
    useEffect(() => {
      if (hasActiveAbility && leftTargetPosition && leftSwingProgress.current > 0) {
        setExplosions(prev => [...prev, {
          id: Math.random(),
          position: leftTargetPosition
        }]);
      }
    }, [hasActiveAbility, leftTargetPosition]);

    useEffect(() => {
      if (hasActiveAbility && rightTargetPosition && rightSwingProgress.current > 0) {
        setExplosions(prev => [...prev, {
          id: Math.random(),
          position: rightTargetPosition
        }]);
      }
    }, [hasActiveAbility, rightTargetPosition]);

    return (
      <>
        <group 
          position={[0, -0.6, 0.5]} 
          rotation={[-0.55 , 0, 0]}
          scale={[0.775, 0.775, 0.775]}
        >
          {/* Left Sabre */}
          <group 
            ref={leftSabreRef} 
            position={[leftBasePosition[0], leftBasePosition[1], leftBasePosition[2]]}
            rotation={[0, 0, Math.PI]}
            scale={[1, 1, 0.875]}
          >
            {/* Handle */}
            <group position={[0.2, -0.125, 0]} rotation={[0, 0, -Math.PI]}>
              <mesh>
                <cylinderGeometry args={[0.015, 0.02, 0.45, 12]} />
                <meshStandardMaterial color="#2a3b4c" roughness={0.7} />
              </mesh>
              
              {/* Handle wrappings */}
              {[...Array(4)].map((_, i) => (
                <mesh key={i} position={[0, 0.175 - i * 0.065, 0]}>
                  <torusGeometry args={[0.0225, 0.004, 8, 16]} />
                  <meshStandardMaterial color="#1a2b3c" metalness={0.6} roughness={0.4} />
                </mesh>
              ))}
            </group>
            
            {/* Blade */}
            <group position={[0.2, 0.3, 0.0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
              {/* Base blade */}
              <mesh>
                <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
                <meshStandardMaterial 
                  color="#0066ff"
                  emissive="#0088ff"
                  emissiveIntensity={3}
                  metalness={0.9}
                  roughness={0.2}
                  opacity={0.9}
                  transparent
                />
              </mesh>
              
              {/* Outer ethereal glow */}
              <mesh position={[0, 0, -0.02]}>  {/* Offset to center */}
                <extrudeGeometry args={[createInnerBladeShape(), {
                  ...innerBladeExtrudeSettings,
                  depth: 0.06
                }]} />
                <meshStandardMaterial 
                  color="#0033ff"
                  emissive="#0066ff"
                  emissiveIntensity={8}
                  metalness={0.7}
                  roughness={0.1}
                  opacity={0.4}
                  transparent
                />
              </mesh>
              
              {/* Point light for local illumination */}
              <pointLight
                color="#0088ff"
                intensity={5}
                distance={2}
                decay={2}
              />

              {/* Only render orbs and trails if active ability is unlocked */}
              {hasActiveAbility && (
                <>
                  <mesh ref={leftOrbRef} position={[-0.15, 0, 0]}>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <meshStandardMaterial
                      color="#0066ff"
                      emissive="#0088ff"
                      emissiveIntensity={3}
                      transparent
                      opacity={0.9}
                    />
                  </mesh>
                  
                  <FireballTrail
                    meshRef={leftOrbRef}
                    color={new THREE.Color("#0088ff")}
                    size={0.04}
                    opacity={0.6}
                  />
                </>
              )}
            </group>
          </group>

          {/* Right Sabre */}
          <group 
            ref={rightSabreRef} 
            position={[rightBasePosition[0], rightBasePosition[1], rightBasePosition[2]]}
            rotation={[0, 0, Math.PI]}
            scale={[1, 1, 0.875]}
          >
            {/* Handle */}
            <group position={[-0.2, -0.125, 0]} rotation={[0, 0, -Math.PI]}>
              <mesh>
                <cylinderGeometry args={[0.015, 0.02, 0.45, 12]} />
                <meshStandardMaterial color="#2a3b4c" roughness={0.7} />
              </mesh>
              
              {/* Handle wrappings */}
              {[...Array(4)].map((_, i) => (
                <mesh key={i} position={[0, 0.175 - i * 0.065, 0]}>
                  <torusGeometry args={[0.0225, 0.004, 8, 16]} />
                  <meshStandardMaterial color="#1a2b3c" metalness={0.6} roughness={0.4} />
                </mesh>
              ))}
            </group>
            
            {/* Blade */}
            <group position={[-0.2, 0.3, 0.]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
              {/* Base blade */}
              <mesh>
                <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
                <meshStandardMaterial 
                  color="#0066ff"
                  emissive="#0088ff"
                  emissiveIntensity={2}
                  metalness={0.9}
                  roughness={0.2}
                  opacity={0.9}
                  transparent
                />
              </mesh>
              
              
              {/* Outer ethereal glow */}
              <mesh position={[0, 0, -0.02]}>  {/* Offset to center */}
                <extrudeGeometry args={[createInnerBladeShape(), {
                  ...innerBladeExtrudeSettings,
                  depth: 0.06
                }]} />
                <meshStandardMaterial 
                  color="#0033ff"
                  emissive="#0066ff"
                  emissiveIntensity={3.5}
                  metalness={0.7}
                  roughness={0.1}
                  opacity={0.4}
                  transparent
                />
              </mesh>

              
              {/* Point light for local illumination */}
              <pointLight
                color="#0088ff"
                intensity={1.5}
                distance={2}
                decay={2}
              />

              {/* Only render orbs and trails if active ability is unlocked */}
              {hasActiveAbility && (
                <>
                  <mesh ref={rightOrbRef} position={[-0.15, 0, 0]}>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <meshStandardMaterial
                      color="#0066ff"
                      emissive="#0088ff"
                      emissiveIntensity={3}
                      transparent
                      opacity={0.9}
                    />
                  </mesh>
                  
                  <FireballTrail
                    meshRef={rightOrbRef}
                    color={new THREE.Color("#0088ff")}
                    size={0.04}
                    opacity={0.6}
                  />
                </>
              )}
            </group>
          </group>
        </group>

        {/* Add frost explosions */}
        {explosions.map(explosion => (
          <FrostExplosion
            key={explosion.id}
            position={explosion.position}
            onComplete={() => {
              setExplosions(prev => prev.filter(e => e.id !== explosion.id));
            }}
          />
        ))}
      </>
    );
  }

  // FROST ORBS 
  const FrostExplosion: React.FC<{ position: Vector3; onComplete: () => void }> = ({ position, onComplete }) => {
    const [particles, setParticles] = useState(() => 
      Array(15).fill(null).map(() => ({
        position: new Vector3(
          position.x + (Math.random() - 0.5) * 0.2,
          position.y,
          position.z + (Math.random() - 0.5) * 0.2
        ),
        velocity: new Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 3,
          (Math.random() - 0.5) * 2
        ),
        scale: Math.random() * 0.3 + 0.1,
        life: 1.0
      }))
    );

    useFrame((_, delta) => {
      setParticles(prev => {
        const updated = prev.map(particle => {
          particle.velocity.y -= delta * 5;
          particle.position.add(particle.velocity.multiplyScalar(delta));
          particle.life -= delta * 1.5;
          return particle;
        }).filter(particle => particle.life > 0);
        
        if (updated.length === 0) {
          onComplete();
        }
        return updated;
      });
    });

    return (
      <group>
        {particles.map((particle, i) => (
          <mesh key={i} position={particle.position.toArray()} scale={[particle.scale, particle.scale, particle.scale]}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#A5F3FC"
              emissive="#A5F3FC"
              emissiveIntensity={1.5}
              transparent
              opacity={particle.life * 0.7}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    );
  };