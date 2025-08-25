// src/Versus/DeathKnight/DeathKnightTrailEffect.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DeathKnightTrailEffectProps {
  parentRef: React.RefObject<THREE.Group>;
  isLeftShoulder?: boolean;
}

const DeathKnightTrailEffect: React.FC<DeathKnightTrailEffectProps> = ({ 
  parentRef, 
  isLeftShoulder = false 
}) => {
  const particlesCount = 2; // More particles than regular reaper for death knight
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(particlesCount * 3));
  const opacitiesRef = useRef<Float32Array>(new Float32Array(particlesCount));
  const scalesRef = useRef<Float32Array>(new Float32Array(particlesCount));
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!particlesRef.current?.parent || !parentRef.current) return;
    
    timeRef.current += delta;
    const deathKnightPosition = parentRef.current.position;
    
    // Create a more concentrated spiral pattern for death knight
    for (let i = 0; i < particlesCount; i++) {
      const angle = (i / particlesCount) * Math.PI * 2 + timeRef.current * 1.5;
      const radius = 0.06 + Math.sin(timeRef.current * 3 + i * 0.3) * 0.05; // Half the radius
      
      // Offset based on which shoulder (left or right)
      const shoulderOffset = isLeftShoulder ? -0.385 : 0.385;
      
      positionsRef.current[i * 3] = deathKnightPosition.x + shoulderOffset + Math.cos(angle) * radius;
      positionsRef.current[i * 3 + 1] = deathKnightPosition.y + 0.3 + Math.sin(timeRef.current * 2 + i * 0.2) * 0.075; // Half the Y movement
      positionsRef.current[i * 3 + 2] = deathKnightPosition.z + 0.22 + Math.sin(angle) * radius;

      // More concentrated opacity and scale for death knight
      opacitiesRef.current[i] = Math.pow((1 - i / particlesCount), 1.2) * 0.35;
      scalesRef.current[i] = 0.225 * Math.pow((1 - i / particlesCount), 0.5); // Half the scale
    }

    if (particlesRef.current) {
      const geometry = particlesRef.current.geometry;
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.opacity.needsUpdate = true;
      geometry.attributes.scale.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positionsRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={particlesCount}
          array={opacitiesRef.current}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={particlesCount}
          array={scalesRef.current}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float opacity;
          attribute float scale;
          varying float vOpacity;
          void main() {
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = scale * 11.0 * (300.0 / -mvPosition.z); // Half the point size
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            float strength = smoothstep(0.5, 0.1, d);
            vec3 glowColor = mix(vec3(0.86, 0.63, 0.86), vec3(0.85, 0.44, 0.84), 0.4); // Light purple colors (plum to orchid)
            gl_FragColor = vec4(glowColor, vOpacity * strength);
          }
        `}
      />
    </points>
  );
};

export default DeathKnightTrailEffect;
