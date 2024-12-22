import { useRef } from 'react';
import { Group, Shape } from 'three';
import { useFrame } from '@react-three/fiber';

interface StaffProps {
  isSwinging: boolean;
  onSwingComplete: () => void;
  parentRef: React.RefObject<Group>;
}

export default function Staff({ isSwinging, onSwingComplete }: StaffProps) {
  const staffRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const basePosition = [-1.33, 1.25, 0.75] as const;
  
  useFrame((_, delta) => {
    if (isSwinging && staffRef.current) {
      swingProgress.current += delta * 6;
      const swingPhase = Math.min(swingProgress.current / Math.PI, 1);
      
      const forwardPhase = swingPhase <= 0.5 
        ? swingPhase * 2 // 0 to 1 during first half
        : (1 - ((swingPhase - 0.5) * 2)); // 1 back to 0 during second half
      
      const pivotX = basePosition[0] + Math.sin(forwardPhase * Math.PI) * 2.0;
      const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -0.5;
      const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 1.5;
      
      staffRef.current.position.set(pivotX, pivotY, pivotZ);
      
      const rotationX = Math.sin(forwardPhase * Math.PI) * (Math.PI / 4);
      const rotationY = Math.sin(forwardPhase * Math.PI) * (Math.PI / 2);
      const rotationZ = Math.sin(forwardPhase * Math.PI) * (Math.PI / 3);
      
      staffRef.current.rotation.set(rotationX, rotationY, rotationZ);
      
      if (swingProgress.current >= Math.PI) {
        swingProgress.current = 0;
        staffRef.current.rotation.set(0, 0, 0);
        staffRef.current.position.set(...basePosition);
        onSwingComplete();
      }
    } else if (!isSwinging && staffRef.current) {
      staffRef.current.rotation.x *= 0.85;
      staffRef.current.rotation.y *= 0.85;
      staffRef.current.rotation.z *= 0.85;
      
      staffRef.current.position.x += (basePosition[0] - staffRef.current.position.x) * 0.20;
      staffRef.current.position.y += (basePosition[1] - staffRef.current.position.y) * 0.20;
      staffRef.current.position.z += (basePosition[2] - staffRef.current.position.z) * 0.20;
    }
  });

  const createBladeShape = () => {
    const shape = new Shape();
    
    shape.moveTo(0, 0);
    
    shape.lineTo(0.2, 0.05);
    shape.bezierCurveTo(
      0.7, 0.2,
      1.35, 0.6,
      1.55, 0.5
    );
    
    shape.lineTo(1.125, 1.125);
    shape.bezierCurveTo(
      0.7, 0.4,
      0.3, 0.15,
      0.4, 0.75
    );
    shape.lineTo(0, 0);
  
    return shape;
  };

  const bladeExtradeSettings = {
    steps: 1,
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.02,
    bevelSegments: 3
  };

  return (
    <group 
      ref={staffRef} 
      position={[basePosition[0], basePosition[1], basePosition[2]]}
      rotation={[0, 0, Math.PI]}
      scale={[1.1, 1.1, 1.1]}
    >
      {/* Handle */}
      <group position={[0, -.7, 0]} rotation={[0, 0, -Math.PI]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.05, 1.5, 12]} />
          <meshStandardMaterial color="#2c1810" roughness={0.7} />
        </mesh>
        
        {/* Decorative wrappings */}
        {[...Array(8)].map((_, i) => (
          <mesh key={i} position={[0, 0.8 - i * 0.3, 0]}>
            <torusGeometry args={[0.06, 0.01, 8, 16]} />
            <meshStandardMaterial color="#8B4513" metalness={0.3} roughness={0.7} />
          </mesh>
        ))}
      </group>
      
      {/* Blade connector - only color changes */}
      <group position={[0, 0.30, 0]} rotation={[Math.PI / 1, 0, Math.PI]}>
        {/* Base connector remains same ... */}

        {/* Rotating glow rings - changed to red */}
        <group rotation-x={useFrame((state) => state.clock.getElapsedTime() * 2)}>
          <mesh>
            <torusGeometry args={[0.15, 0.01, 16, 32]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={2}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* Second ring - changed to red */}
        <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={0.1}>
            <torusGeometry args={[0.13, 0.01, 16, 32]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={1.5}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>

        {/* Static outer glow - changed to red */}
        <mesh>
          <cylinderGeometry args={[0.14, 0.11, 0.32, 8]} />
          <meshStandardMaterial
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={1}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
      
      {/* Enhanced blade - changed to red */}
      <group position={[0, 0.5, 1.3]} rotation={[-0.9, -Math.PI / 2, Math.PI / 2]}>
        {/* Base blade */}
        <mesh>
          <extrudeGeometry args={[createBladeShape(), bladeExtradeSettings]} />
          <meshStandardMaterial 
            color="#f26767"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        
        {/* Primary glow layer */}
        <mesh>
          <extrudeGeometry args={[createBladeShape(), { ...bladeExtradeSettings, depth: 0.021 }]} />
          <meshStandardMaterial 
            color="#f26767"
            emissive="#ff0000"
            emissiveIntensity={2.5}
            metalness={0.9}
            roughness={0.2}
            opacity={0.7}
            transparent
          />
        </mesh>
        
        {/* Outer glow layer */}
        <mesh>
          <extrudeGeometry args={[createBladeShape(), { ...bladeExtradeSettings, depth: 0.022 }]} />
          <meshStandardMaterial 
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={1.5}
            metalness={0.8}
            roughness={0.1}
            opacity={0.3}
            transparent
          />
        </mesh>
      </group>
    </group>
  );
} 