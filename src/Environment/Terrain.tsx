import { Mesh, Shape } from 'three';
import React, { useRef, useEffect } from 'react';

export default function Terrain() {
  const terrainRef = useRef<Mesh>(null);
  const octagonRef = useRef<Shape | null>(null);

  // Initialize octagon shape
  useEffect(() => {
    if (!octagonRef.current) {
      const shape = new Shape();
      const radius = 50;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        if (i === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
      }
      shape.closePath();
      octagonRef.current = shape;
    }
  }, []);

  return (
    <group>
      {/* Main terrain */}
      <mesh ref={terrainRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {octagonRef.current && <shapeGeometry args={[octagonRef.current]} />}
        <meshStandardMaterial 
          color="#ACB7BA"  // Light off-white base color
          roughness={0.7}
          metalness={0.1}
          emissive="#ACB7BA"  // Subtle blue-ish glow
          emissiveIntensity={0.15}
        />
      </mesh>



    </group>
  );
}