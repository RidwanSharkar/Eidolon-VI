// src/weapons/Spear.tsx

import { useRef, useEffect } from 'react';
import { Group, Shape, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DamageNumber } from '@/Unit/useDamageNumbers';

interface SpearProps {
  isSwinging: boolean;
  onSwingComplete?: () => void;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  onHit?: (targetId: string, damage: number) => void;
  setDamageNumbers?: (callback: (prev: DamageNumber[]) => DamageNumber[]) => void;
  nextDamageNumberId?: { current: number };
  isWhirlwinding?: boolean;
  fireballCharges?: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
}

export default function Spear({ 
  isSwinging, 
  onSwingComplete, 
  enemyData,
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  isWhirlwinding = false,
  fireballCharges = []
}: SpearProps) {
  const spearRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const basePosition = [-1.18, 0.225, -0.3] as const; // POSITIONING
  const hitCountThisSwing = useRef<Record<string, number>>({});
  const lastHitDetectionTime = useRef<Record<string, number>>({});
  const whirlwindRotation = useRef(0);
  const whirlwindSpeed = useRef(0);
  const prevWhirlwindState = useRef(false);

  // Check if whirlwind should be active based on charges
  const hasAvailableCharges = fireballCharges.some(charge => charge.available);
  const shouldWhirlwind = isWhirlwinding && hasAvailableCharges;

  // Track whirlwind state changes
  useEffect(() => {
    // If whirlwind is active but there are no charges, force deceleration
    if (isWhirlwinding && !hasAvailableCharges && whirlwindSpeed.current > 0) {
      whirlwindSpeed.current = Math.max(whirlwindSpeed.current - 5, 0);
    }
    
    prevWhirlwindState.current = shouldWhirlwind;
  }, [isWhirlwinding, hasAvailableCharges, shouldWhirlwind]);

  useFrame((_, delta) => {
    if (!spearRef.current) return;

    // Handle whirlwind spinning animation
    if (shouldWhirlwind) {
      // Accelerate rotation speed when whirlwind is active
      whirlwindSpeed.current = Math.min(whirlwindSpeed.current + delta * 15, 35);
      
      // Update rotation based on speed
      whirlwindRotation.current += delta * whirlwindSpeed.current;
      
      // Orbit parameters
      const orbitRadius = 2.5; // Radius of orbit circle
      const angle = whirlwindRotation.current;
      
      // Positional calculations
      const orbitalX = Math.cos(angle) * orbitRadius;
      const orbitalZ = Math.sin(angle) * orbitRadius;
      
      // Constant height above ground plane
      const fixedHeight = 0.4; // Keep this constant to ensure level movement
      
      // Set absolute rotation each frame - don't accumulate
      // This is the key to keeping it perfectly level
      // We'll use a fixed rotation sequence applied fresh each frame
      
      // The spear needs to:
      // 1. Lay flat on the XZ plane (parallel to ground)
      // 2. Point outward from center (tip away from center)
      
      spearRef.current.rotation.set(
        Math.PI/3,      // X rotation: 90 degrees to lay flat on ground
        -angle + Math.PI,              // Y rotation: will be applied separately
        1               // Z rotation: no roll
      );
      
      // Rotate around Y axis to make it follow the circle
      // Make the handle point toward center, blade outward
      spearRef.current.rotateY(-angle + Math.PI);
      
      // Apply position after rotation is set
      spearRef.current.position.set(orbitalX, fixedHeight, orbitalZ);
      
      return;
    } else if (whirlwindSpeed.current > 0) {
      // Deceleration when whirlwind ends or no charges available
      whirlwindSpeed.current = Math.max(0, whirlwindSpeed.current - delta * 30);
      
      // Continue rotation but slowing down
      whirlwindRotation.current += delta * whirlwindSpeed.current;
      
      // If we're almost stopped, return to normal position
      if (whirlwindSpeed.current < 0.5) {
        whirlwindSpeed.current = 0;
        
        // Reset position smoothly
        spearRef.current.position.x += (basePosition[0] - spearRef.current.position.x) * 0.75;
        spearRef.current.position.y += (basePosition[1] - spearRef.current.position.y) * 0.75;
        spearRef.current.position.z += (basePosition[2] - spearRef.current.position.z) * 0.75;
        
        // Reset rotation smoothly
        spearRef.current.rotation.x += (-Math.PI/2 - spearRef.current.rotation.x) * 0.75;
        spearRef.current.rotation.y += (0 - spearRef.current.rotation.y) * 0.75;
        spearRef.current.rotation.z += (Math.PI - spearRef.current.rotation.z) * 0.75;
      } else {
        // Continue orbital movement while slowing down
        const orbitRadius = 2.5; // Radius of orbit circle
        const angle = whirlwindRotation.current;
        
        const orbitalX = Math.cos(angle) * orbitRadius;
        const orbitalZ = Math.sin(angle) * orbitRadius;
        const fixedHeight = 0.4;
        
        spearRef.current.rotation.set(
          Math.PI/3,
          -angle + Math.PI,
          1
        );
        
        spearRef.current.rotateY(-angle + Math.PI);
        spearRef.current.position.set(orbitalX, fixedHeight, orbitalZ);
      }
      
      return;
    }

    if (isSwinging) {
      if (swingProgress.current === 0) {
        hitCountThisSwing.current = {};
        lastHitDetectionTime.current = {};
      }
      
      swingProgress.current += delta * 15;
      const swingPhase = Math.min(swingProgress.current / Math.PI / 1.5, 1);
      
      if (swingPhase > 0.4 && swingPhase < 0.8 && onHit && setDamageNumbers && nextDamageNumberId) {
        enemyData?.forEach(enemy => {
          const now = Date.now();
          const lastHitTime = lastHitDetectionTime.current[enemy.id] || 0;
          
          if (now - lastHitTime < 200) return;
          
          if (hitCountThisSwing.current[enemy.id]) return;
          
          const spearTip = spearRef.current!.localToWorld(new Vector3(0, 1, 0.35));
          
          const forward = new Vector3(0, 0, 1)
            .applyQuaternion(spearRef.current!.quaternion)
            .normalize();
          
          const toEnemy = new Vector3()
            .subVectors(enemy.position, spearTip);
          
          const projection = toEnemy.dot(forward);
          
          if (projection > 0 && projection <= 8) {
            const closestPoint = new Vector3()
              .copy(spearTip)
              .add(forward.clone().multiplyScalar(projection));
            
            const distanceFromLine = new Vector3()
              .subVectors(enemy.position, closestPoint)
              .length();
            
            if (distanceFromLine <= 1) {
              const damage = 29;
              onHit(enemy.id, damage);
              
              setDamageNumbers(prev => [...prev, {
                id: nextDamageNumberId.current++,
                damage,
                position: enemy.position.clone(),
                isCritical: false
              }]);
              
              hitCountThisSwing.current[enemy.id] = 1;
              lastHitDetectionTime.current[enemy.id] = now;
            }
          }
        });
      }
      
      if (swingProgress.current >= Math.PI * 0.75) {
        swingProgress.current = 0;
        hitCountThisSwing.current = {};
        lastHitDetectionTime.current = {};
        spearRef.current.rotation.set(0, 0, Math.PI);
        spearRef.current.position.set(...basePosition);
        onSwingComplete?.();
        return;
      }
      
      const thrustPhase = swingPhase;
      
      const windUpAmount = -0.65;
      const forwardThrustAmount = 3.350;
      
      let thrustZ;
      if (thrustPhase < 0.25) {
        thrustZ = basePosition[2] + (windUpAmount * (thrustPhase / 0.2));
      } else if (thrustPhase < 0.5) {
        const forwardPhase = (thrustPhase - 0.2) / 0.3;
        thrustZ = basePosition[2] + windUpAmount + (forwardThrustAmount + Math.abs(windUpAmount)) * Math.sin(forwardPhase * Math.PI/2);
      } else {
        const returnPhase = (thrustPhase - 0.5) / 0.5;
        thrustZ = basePosition[2] + forwardThrustAmount * (1 - returnPhase);
      }
      
      spearRef.current.position.set(basePosition[0], basePosition[1], thrustZ);
      
      let rotationX = -Math.PI/2;
      if (thrustPhase < 0.2) {
        rotationX += (thrustPhase / 0.2) * 0.1;
      } else if (thrustPhase < 0.5) {
        rotationX += 0.1 - (((thrustPhase - 0.2) / 0.3) * 0.1);
      }
      
      spearRef.current.rotation.set(rotationX, 0, Math.PI);

    } else {
      // Normal idle state - only apply if not transitioning from whirlwind
      if (whirlwindSpeed.current === 0) {
        spearRef.current.rotation.x = -Math.PI/2;
        spearRef.current.rotation.y = 0;
        spearRef.current.rotation.z = Math.PI;
        
        spearRef.current.position.x += (basePosition[0] - spearRef.current.position.x) * 0.2;
        spearRef.current.position.y += (basePosition[1] - spearRef.current.position.y) * 0.2;
        spearRef.current.position.z += (basePosition[2] - spearRef.current.position.z) * 0.2;
      }
    }

  });

  const createBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    shape.lineTo(0.15, -0.230);
    shape.bezierCurveTo(
      0.8, 0.22,
      1.13, 0.5,
      1.8, 1.6
    );
    
    shape.lineTo(1.125, 0.75);
    shape.bezierCurveTo(
      0.5, 0.2,
      0.225, 0.0,
      0.1, 0.7
    );
    shape.lineTo(0, 0);
    return shape;
  };

  const createInnerBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    shape.lineTo(0, 0.06);   
    shape.lineTo(0.15, 0.15); 
    shape.quadraticCurveTo(1.2, 0.12, 1.5, 0.15); 
    shape.quadraticCurveTo(2.0, 0.08, 2.15, 0);    
    shape.quadraticCurveTo(2.0, -0.08, 1.5, -0.15); 
    shape.quadraticCurveTo(1.2, -0.12, 0.15, -0.15);
    shape.lineTo(0, -0.05);  
    shape.lineTo(0, 0);
    
    return shape;
  };

  const bladeExtrudeSettings = {
    steps: 2,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.02,
    bevelOffset: 0.04,
    bevelSegments: 2
  };

  const innerBladeExtrudeSettings = {
    ...bladeExtrudeSettings,
    depth: 0.06,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 6
  };

  return (
    <group 
      position={[0, -0.4, 0.6]}
      rotation={[-0.55, 0.15, 0]}
      scale={[0.875, 0.8, 0.8]}
    >
      <group 
        ref={spearRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[Math.PI/2, 0, 0]}
        scale={[0.8, 0.8, 0.7]}
      >
        <group position={[-0.025, -0.55, 0.35]} rotation={[0, 0, -Math.PI]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.04, 2.2, 12]} />
            <meshStandardMaterial color="#2a3b4c" roughness={0.7} />
          </mesh>
          
          {[...Array(12)].map((_, i) => (
            <mesh key={i} position={[0, 1.0 - i * 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.045, 0.016, 8, 16]} />
              <meshStandardMaterial color="#1a2b3c" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
        
        <group position={[-0.025, .45, 0.35]} rotation={[Math.PI, 1.5, Math.PI]}>
          <mesh>
            <torusGeometry args={[0.26, 0.07, 16, 32]} />
            <meshStandardMaterial 
              color="#4a5b6c" 
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          
          {[...Array(8)].map((_, i) => (
            <mesh 
              key={`spike-${i}`} 
              position={[
                0.25 * Math.cos(i * Math.PI / 4),
                0.25 * Math.sin(i * Math.PI / 4),
                0
              ]}
              rotation={[0, 0, i * Math.PI / 4 - Math.PI / 2]}
            >
              <coneGeometry args={[0.070, 0.55, 3]} />
              <meshStandardMaterial 
                color="#4a5b6c"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          ))}
          
          <mesh>
            <sphereGeometry args={[0.155, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFF0000)}         // Pure yellow
              emissive={new THREE.Color(0xFF0000)}      // Yellow emission
              emissiveIntensity={2}                    // for orange 
              transparent
              opacity={1}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFF0000)}
              emissive={new THREE.Color(0xFF0000)}
              emissiveIntensity={40}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[0.145, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFF0000)}
              emissive={new THREE.Color(0xFF0000)}
              emissiveIntensity={35}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          <mesh>
            <sphereGeometry args={[.175, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color(0xFF0000)}
              emissive={new THREE.Color(0xFF0000)}
              emissiveIntensity={30}
              transparent
              opacity={0.4}
            />
          </mesh>

          <pointLight 
            color={new THREE.Color(0xFF0000)}
            intensity={2}
            distance={0.5}
            decay={2}
          />
        </group>
        
        <group position={[0, 0.75, 0.35]}>
          <group rotation={[0, 0, 0]}>
            <group rotation={[0, 0, 0.7]} scale={[0.55, 0.55, -0.55]}>
              <mesh>
                <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
                <meshStandardMaterial 
                  color={new THREE.Color(0xFF0000)}
                  emissive={new THREE.Color(0xFF0000)}
                  emissiveIntensity={1.55}
                  metalness={0.8}
                  roughness={0.1}
                  opacity={0.8}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>

          <group rotation={[0, (2 * Math.PI) / 3, Math.PI/2]}>
            <group rotation={[0, 0., 5.33]} scale={[0.55, 0.55, -0.55]}>
              <mesh>
                <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
                <meshStandardMaterial 
                  color={new THREE.Color(0xFF0000)}
                  emissive={new THREE.Color(0xFF0000)}
                  emissiveIntensity={1.55}
                  metalness={0.8}
                  roughness={0.1}
                  opacity={0.8}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>

          <group rotation={[0, (4 * Math.PI) / 3, Math.PI/2]}>
            <group rotation={[0, 0, 5.33]} scale={[0.55, 0.55, -0.55]}>
              <mesh>
                <extrudeGeometry args={[createBladeShape(), bladeExtrudeSettings]} />
                <meshStandardMaterial 
                  color={new THREE.Color(0xFF0000)}
                  emissive={new THREE.Color(0xFF0000)}
                  emissiveIntensity={1.55}
                  metalness={0.8}
                  roughness={0.1}
                  opacity={0.8}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        </group>

        <group position={[0, 0.65, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]} scale={[0.8, 0.8, 0.5]}>
          <mesh>
            <extrudeGeometry args={[createInnerBladeShape(), bladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFF0000)}
              emissive={new THREE.Color(0xFF0000)}
              emissiveIntensity={1.5}
              metalness={0.3}
              roughness={0.1}
            />
          </mesh>
          
          <mesh>
            <extrudeGeometry args={[createInnerBladeShape(), innerBladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFF0000)}
              emissive={new THREE.Color(0xFF0000)}
              emissiveIntensity={1}
              metalness={0.2}
              roughness={0.1}
              opacity={0.8}
              transparent
            />
          </mesh>

        </group>

      </group>
    </group>
  );
}