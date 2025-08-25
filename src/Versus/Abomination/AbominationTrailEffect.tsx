import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AbominationTrailEffectProps {
  parentRef: React.RefObject<THREE.Group>;
}

const AbominationTrailEffect: React.FC<AbominationTrailEffectProps> = ({ parentRef }) => {
  const particlesCount = 7;
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(particlesCount * 3));
  const opacitiesRef = useRef<Float32Array>(new Float32Array(particlesCount));
  const scalesRef = useRef<Float32Array>(new Float32Array(particlesCount));
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!particlesRef.current?.parent || !parentRef.current) return;
    
    timeRef.current += delta;
    const position = parentRef.current.position;
    
    // Create a spherical pattern
    for (let i = 0; i < particlesCount; i++) {
      // Spherical coordinates
      const phi = Math.acos(-1 + (2 * i) / particlesCount);
      const theta = Math.sqrt(particlesCount * Math.PI) * phi + timeRef.current;
      const radius = 0.8 + Math.sin(timeRef.current * 2 + i * 0.2) * 0.1; // Larger radius
      
      // Convert to Cartesian coordinates
      positionsRef.current[i * 3] = position.x + radius * Math.cos(theta) * Math.sin(phi);
      positionsRef.current[i * 3 + 1] = position.y + radius * Math.sin(theta) * Math.sin(phi);
      positionsRef.current[i * 3 + 2] = position.z + radius * Math.cos(phi);

      // Opacity and Scale
      opacitiesRef.current[i] = Math.pow((1 - i / particlesCount), 1.2) * 0.3;
      scalesRef.current[i] = 0.4 * Math.pow((1 - i / particlesCount), 0.5);
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
            gl_PointSize = scale * 25.0 * (300.0 / -mvPosition.z); // Larger point size
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            float strength = smoothstep(0.5, 0.1, d);
            vec3 glowColor = mix(vec3(0.2, 0.6, 1.0), vec3(0.4, 0.8, 1.0), 0.4); // Slightly different light blue shade
            gl_FragColor = vec4(glowColor, vOpacity * strength);
          }
        `}
      />
    </points>
  );
};

export default AbominationTrailEffect; 