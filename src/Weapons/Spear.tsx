// src/weapons/Spear.tsx

import { useRef } from 'react';
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
}

export default function Spear({ 
  isSwinging, 
  onSwingComplete, 
  enemyData,
  onHit,
  setDamageNumbers,
  nextDamageNumberId
}: SpearProps) {
  const spearRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const basePosition = [-1.18, 0.225, -0.3] as const; // POSITIONING
  const hitCountThisSwing = useRef<Record<string, number>>({});
  const lastHitDetectionTime = useRef<Record<string, number>>({});

  useFrame((_, delta) => {
    if (!spearRef.current) return;

    if (isSwinging) {
      // Reset hit counts at the start of each swing
      if (swingProgress.current === 0) {
        hitCountThisSwing.current = {};
        lastHitDetectionTime.current = {};
      }
      
      swingProgress.current += delta * 10;
      const swingPhase = Math.min(swingProgress.current / Math.PI / 1.5, 1);
      
      // Hit detection during forward thrust phase only
      if (swingPhase > 0.4 && swingPhase < 0.8 && onHit && setDamageNumbers && nextDamageNumberId) {
        enemyData?.forEach(enemy => {
          const now = Date.now();
          const lastHitTime = lastHitDetectionTime.current[enemy.id] || 0;
          
          // Debounce hit detection (200ms)
          if (now - lastHitTime < 200) return;
          
          // Check if we've already hit this enemy this swing
          if (hitCountThisSwing.current[enemy.id]) return;
          
          const spearTip = spearRef.current!.localToWorld(new Vector3(0, 1, 0.35));
          const distanceToEnemy = spearTip.distanceTo(enemy.position);
          
          if (distanceToEnemy <= 6.25) { // Spear range
            const forward = new Vector3(0, 0, 1)
              .applyQuaternion(spearRef.current!.quaternion);
            const toEnemy = new Vector3()
              .subVectors(enemy.position, spearTip)
              .normalize();
            
            const angle = forward.angleTo(toEnemy);
            
            // Narrow hit arc (30 degrees)
            if (Math.abs(angle) <= Math.PI / 6) {
              const damage = 27; // Base spear damage
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
      
      // THRUST ANIMATION
      const thrustPhase = swingPhase;
      
      const windUpAmount = -0.65; // Reduced wind-up
      const forwardThrustAmount = 3.350; // Adjusted thrust distance
      
      let thrustZ;
      if (thrustPhase < 0.25) { // Faster wind-up
        // Wind-up phase - pull back
        thrustZ = basePosition[2] + (windUpAmount * (thrustPhase / 0.2));
      } else if (thrustPhase < 0.5) { // Faster thrust
        // Forward thrust phase
        const forwardPhase = (thrustPhase - 0.2) / 0.3;
        thrustZ = basePosition[2] + windUpAmount + (forwardThrustAmount + Math.abs(windUpAmount)) * Math.sin(forwardPhase * Math.PI/2);
      } else {
        // Return phase
        const returnPhase = (thrustPhase - 0.5) / 0.5;
        thrustZ = basePosition[2] + forwardThrustAmount * (1 - returnPhase);
      }
      
      // Maintain fixed X and Y position
      spearRef.current.position.set(basePosition[0], basePosition[1], thrustZ);
      
      // Simplified rotation - only subtle tilt during thrust
      let rotationX = -Math.PI/2; // Base rotation
      if (thrustPhase < 0.2) {
        // Slight upward tilt during wind-up
        rotationX += (thrustPhase / 0.2) * 0.1;
      } else if (thrustPhase < 0.5) {
        // Level out during thrust
        rotationX += 0.1 - (((thrustPhase - 0.2) / 0.3) * 0.1);
      }
      
      spearRef.current.rotation.set(rotationX, 0, Math.PI);

    } else {
      // Simplified rest position return
      spearRef.current.rotation.x = -Math.PI/2;
      spearRef.current.rotation.y = 0;
      spearRef.current.rotation.z = Math.PI;
      
      // Smooth position return
      spearRef.current.position.x += (basePosition[0] - spearRef.current.position.x) * 0.2;
      spearRef.current.position.y += (basePosition[1] - spearRef.current.position.y) * 0.2;
      spearRef.current.position.z += (basePosition[2] - spearRef.current.position.z) * 0.2;
    }

  });

  // Create custom blade shape (adapted from scythe)
  const createBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    // Create thick back edge first
    shape.lineTo(0.15, -0.230);
    shape.bezierCurveTo(
      0.8, 0.22,    // control point 1
      1.13, 0.5,    // control point 2
      1.6, 0.6      // end point (tip)
    );
    
    // Create sharp edge
    shape.lineTo(1.125, 0.75);
    shape.bezierCurveTo(
      0.5, 0.2,
      0.225, 0.0,
      0.1, 0.7
    );
    shape.lineTo(0, 0);
    return shape;
  };

  // Inner blade shape 
  const createInnerBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    // Blade shape with symmetry
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
      position={[0, -0.4, 0.6]}  // Match other weapons' base positioning
      rotation={[-0.55, 0.15, 0]}   // Match other weapons' base rotation
      scale={[0.875, 0.8, 0.8]}  // Match other weapons' base scale
    >
      <group 
        ref={spearRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[Math.PI/2, 0, 0]}
        scale={[0.8, 0.8, 0.7]}
      >
        {/* Handle - increased length */}
        <group position={[-0.025, -0.55, 0.35]} rotation={[0, 0, -Math.PI]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.04, 2.2, 12]} /> {/* Increased length from 0.9 to 2.2 */}
            <meshStandardMaterial color="#2a3b4c" roughness={0.7} />
          </mesh>
          
          {/* Handle wrappings - adjusted spacing */}
          {[...Array(12)].map((_, i) => ( // Increased from 8 to 12 wrappings
            <mesh key={i} position={[0, 1.0 - i * 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.045, 0.016, 8, 16]} />
              <meshStandardMaterial color="#1a2b3c" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
        
        {/* Connection point - moved up */}
        <group position={[-0.025, .45, 0.35]} rotation={[Math.PI, 1.5, Math.PI]}> {/* Adjusted Y position */}
          {/* Large torus */}
          <mesh>
            <torusGeometry args={[0.26, 0.07, 16, 32]} />
            <meshStandardMaterial 
              color="#4a5b6c" 
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          
          {/* Decorative spikes around torus */}
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
          
          {/* REAL Core orb - yellow */}
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
          
          {/* Multiple glow layers for depth */}
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

          {/* Enhanced point light */}
          <pointLight 
            color={new THREE.Color(0xFF0000)}
            intensity={2}
            distance={0.5}
            decay={2}
          />
        </group>
        
        {/* Blade section with three scythe-like prongs */}
        <group position={[0, 0.75, 0.35]}>
          {/* First prong (0 degrees) */}
          <group rotation={[0, 0, 0]}>
            <group rotation={[0, 0, -1.675]} scale={[-0.6, -0.6, 0.6]}>
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

          {/* Second prong (120 degrees) */}
          <group rotation={[0, (2 * Math.PI) / 3, 0]}>
            <group rotation={[0, 0., -1.675]} scale={[-0.6, -0.6, 0.6]}>
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

          {/* Third prong (240 degrees) */}
          <group rotation={[0, (4 * Math.PI) / 3, 0]}>
            <group rotation={[0, 0, -1.675]} scale={[-0.6, -0.6, 0.6]}>
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

        {/* Blade - moved up */}
        <group position={[0, 0.65, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]} scale={[0.8, 0.8, 0.5]}> {/* Adjusted Y position */}
          {/* Base blade */}
          <mesh>
            <extrudeGeometry args={[createInnerBladeShape(), bladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFF0000)}  // Brighter purple
              emissive={new THREE.Color(0xFF0000)}
              emissiveIntensity={1.5}
              metalness={0.3}
              roughness={0.1}
            />
          </mesh>
          
          {/* BLADE Glowing core */}
          <mesh>
            <extrudeGeometry args={[createInnerBladeShape(), innerBladeExtrudeSettings]} />
            <meshStandardMaterial 
              color={new THREE.Color(0xFF0000)}  // Deep purple
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