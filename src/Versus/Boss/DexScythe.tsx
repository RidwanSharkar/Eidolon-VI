import { useRef,  } from 'react';
import { Group, Shape,  } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ScytheProps {
  isSwinging: boolean;
  onSwingComplete: () => void;
  parentRef: React.RefObject<Group>;
}

interface ScytheProps {
  isSwinging: boolean;
  onSwingComplete: () => void;
  parentRef: React.RefObject<Group>;
}
export default function DexScythe({ isSwinging, onSwingComplete, }: ScytheProps) {
  const scytheRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const basePosition = [-1.055, 1.10, 0.35] as const;
  
  useFrame((_, delta) => {
    if (isSwinging && scytheRef.current) {
      swingProgress.current += delta * 6;
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.5, 1);
      
      // Complete swing earlier to prevent extra rotation
      if (swingProgress.current >= Math.PI * 0.5) {
        swingProgress.current = 0;
        scytheRef.current.rotation.set(0, 0, 0);
        scytheRef.current.position.set(...basePosition);
        onSwingComplete();
        return;
      }
      
      // SWING ANIMATION
      const forwardPhase = swingPhase <= 0.25
        ? swingPhase * 2
        : (0.5 - (swingPhase - 0.25));
      
      const pivotX = basePosition[0] + Math.sin(forwardPhase * Math.PI) * -2.0;
      const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -1.2;
      const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 0.9;
      
      scytheRef.current.position.set(pivotX, pivotY, pivotZ);
      
      const rotationX = Math.sin(forwardPhase * Math.PI) * (Math.PI / 4);
      const rotationY = Math.sin(forwardPhase * Math.PI) * (Math.PI / 2);
      const rotationZ = Math.sin(forwardPhase * Math.PI) * (Math.PI / 4);
      
      scytheRef.current.rotation.set(rotationX, rotationY, rotationZ);
    } else if (!isSwinging && scytheRef.current) {
      scytheRef.current.rotation.x *= 0.85;
      scytheRef.current.rotation.y *= 0.85;
      scytheRef.current.rotation.z *= 0.85;
      
      scytheRef.current.position.x += (basePosition[0] - scytheRef.current.position.x) * 0.20;
      scytheRef.current.position.y += (basePosition[1] - scytheRef.current.position.y) * 0.20;
      scytheRef.current.position.z += (basePosition[2] - scytheRef.current.position.z) * 0.20;
    }
  });

  // Create custom blade shape
  const createBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    // Create thick back edge first
    shape.lineTo(0.15, -0.230); // Slightly thicker at the base   COOL SPOT TO REMOVE VERTEX SET 0 PARAMETER
    shape.bezierCurveTo(
      0.8, 0.22,    // control point 1
      1.13, 0.5,    // control point 2
      1.6, 0.6    // end point (tip)
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

  const bladeExtradeSettings = {
    steps: 1,
    depth: 0.00010,
    bevelEnabled: true,
    bevelThickness: 0.030,
    bevelSize: 0.035,
    bevelSegments: 1,
    curveSegments: 16
  };

  return (
    <group 
      ref={scytheRef} 
      position={[basePosition[0], basePosition[1], basePosition[2]]}
      rotation={[0, 0, Math.PI]}
      scale={[1, 1, 1.]}
    >
      {/* Handle HEIGHT  */}
      <group position={[0, -0.7, 0]} rotation={[0, 0, -Math.PI]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 2.5, 12]} /> {/* Reduced from 3.2 to 2.4 */}
          <meshStandardMaterial color="#2c1810" roughness={0.7} />
        </mesh>
        
        {/* Decorative wrappings handle */}
        {[...Array(7)].map((_, i) => ( // Reduced from 12 to 8 wrappings
          <mesh key={i} position={[0, 0.81 - i * 0.3, 0]} rotation={[Math.PI/2, 0, 0]}> {/* Adjusted starting position */}
            <torusGeometry args={[0.06, 0.01, 8, 16]} />
            <meshStandardMaterial color="#8B4513" metalness={0.3} roughness={0.7} />
          </mesh>
        ))}
      </group>
      
      {/* Blade connector  */}
      <group position={[0, 0.35, 0]} rotation={[Math.PI / 1, 0, Math.PI]}>
        {/* Base connector */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
          <meshStandardMaterial color="#2c1810" roughness={0.6} />
        </mesh>

        {/* Rotating glow rings */}
        <group rotation-x={useFrame((state) => state.clock.getElapsedTime() * 2)}>
        <mesh position-y={-0.075} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.145, 0.02, 16, 32]} />
            <meshStandardMaterial
              color="#ff3300"
              emissive="#ff3300"
              emissiveIntensity={1.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* Second ring rotating opposite direction */}
        <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={0.03} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.175, 0.02, 16, 32]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={1.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* Static outer glow */}
        <mesh>
          <cylinderGeometry args={[0.13, 0.11, 0.32, 8]} />
          <meshStandardMaterial
            color="#ff1a1a"
            emissive="#ff1a1a"
            emissiveIntensity={1.5}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
      
      {/* BLADE with glowing effect */}
      <group position={[0, 0.375, 1.175]} rotation={[-1.0, -Math.PI / 2, Math.PI / 2.2]}>
        {/* Base blade */}
        <mesh>
          <extrudeGeometry args={[createBladeShape(), { ...bladeExtradeSettings, depth: 0.03 }]} />
          <meshStandardMaterial 
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={1.25}
            metalness={0.8}
            roughness={0.1}
            opacity={0.5}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}