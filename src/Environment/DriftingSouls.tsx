import React, { useMemo } from 'react';
import { Color, Texture } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Function to create a wispy texture
const createWispTexture = (): Texture => {
  const size = 308;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  if (context) {
    // Clear canvas with full transparency
    context.clearRect(0, 0, size, size);

    // Create a more gradual gradient
    const gradient = context.createRadialGradient(
      size / 2, size / 2, 0,      // Inner circle center
      size / 2, size / 2, size / 2 // Outer circle center and radius
    );
    
    // More gradual color stops for smoother fade-out
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');   // Less opaque center
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.3)'); // Softer mid transition
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)'); // Extended fade
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)');// Very soft outer edge
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');     // Complete transparency

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
};

interface StarProps {
  count?: number;
  radius?: number;
}

const Stars: React.FC<StarProps> = ({ 
  count = 2000, 
  radius = 100 
}) => {
  const wispTexture = useMemo(() => createWispTexture(), []);

  // Generate random star positions
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Calculate random spherical coordinates
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random()); // Cube root for more uniform distribution
      
      // Convert to Cartesian coordinates
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Extremely green color with much higher intensity
      const color = new Color();
      color.setHSL(0.33 + Math.random() * 0.02, // Even more concentrated green hue
                  1.0,                           // Maximum saturation
                  0.8 + Math.random() * 0.2);    // Brighter to compensate for atmosphere
      
      // Boost the green channel even further
      colors[i * 3] = color.r * 0.3;      // Reduce red
      colors[i * 3 + 1] = color.g * 1.5;  // Boost green
      colors[i * 3 + 2] = color.b * 0.3;  // Reduce blue
      
      // Even larger sizes
      sizes[i] = Math.random() * 8 + 4; // Increased size range from 4 to 12
    }
    
    return { positions, colors, sizes };
  }, [count, radius]);

  const pointsRef = React.useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      // Add subtle rotation to stars
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={positions.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={positions.sizes}
          itemSize={1}
          normalized
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.0}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        map={wispTexture}
      />
    </points>
  );
};

export default Stars; 