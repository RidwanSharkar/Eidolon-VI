import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FireballTrailProps {
  color: THREE.Color;
  size: number;
  meshRef: React.RefObject<THREE.Mesh>;
  opacity?: number;
}

const FireballTrail: React.FC<FireballTrailProps> = ({
  color,
  size,
  meshRef,
  opacity = 1
}) => {
  const particlesCount = 24;
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(particlesCount * 3));
  const opacitiesRef = useRef<Float32Array>(new Float32Array(particlesCount));
  const scalesRef = useRef<Float32Array>(new Float32Array(particlesCount));
  const isInitialized = useRef(false);
  
  // Add a ref to store the last known position for smoother updates
  const lastKnownPosition = useRef(new THREE.Vector3());

  // Initialize positions only once when mesh is available
  useEffect(() => {
    if (meshRef.current && !isInitialized.current) {
      const { x, y, z } = meshRef.current.position;
      lastKnownPosition.current.set(x, y, z);
      
      // Initialize all particles at the starting position
      for (let i = 0; i < particlesCount; i++) {
        positionsRef.current[i * 3] = x;
        positionsRef.current[i * 3 + 1] = y;
        positionsRef.current[i * 3 + 2] = z;
        opacitiesRef.current[i] = 0;
        scalesRef.current[i] = 0;
      }
      isInitialized.current = true;
    }
  }, [meshRef]);

  useFrame(() => {
    if (!particlesRef.current?.parent || !meshRef.current || !isInitialized.current) return;

    const currentPos = meshRef.current.position;
    
    // Only update if position has changed significantly
    if (currentPos.distanceToSquared(lastKnownPosition.current) > 0.0001) {
      lastKnownPosition.current.copy(currentPos);

      // Update particle positions
      for (let i = particlesCount - 1; i > 0; i--) {
        positionsRef.current[i * 3] = positionsRef.current[(i - 1) * 3];
        positionsRef.current[i * 3 + 1] = positionsRef.current[(i - 1) * 3 + 1];
        positionsRef.current[i * 3 + 2] = positionsRef.current[(i - 1) * 3 + 2];
      }

      // Update lead particle
      positionsRef.current[0] = currentPos.x;
      positionsRef.current[1] = currentPos.y;
      positionsRef.current[2] = currentPos.z;

      // Update geometry attributes
      if (particlesRef.current) {
        const geometry = particlesRef.current.geometry;
        geometry.attributes.position.needsUpdate = true;
      }
    }

    // Update opacities and scales with parent opacity
    for (let i = 0; i < particlesCount; i++) {
      opacitiesRef.current[i] = Math.pow((1 - i / particlesCount), 2) * 0.6 * opacity;
      scalesRef.current[i] = size * 0.5 * Math.pow((1 - i / particlesCount), 0.5);
    }

    if (particlesRef.current) {
      const geometry = particlesRef.current.geometry;
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
            gl_PointSize = scale * 20.0 * (300.0 / -mvPosition.z);
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          uniform vec3 uColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            float strength = smoothstep(0.5, 0.1, d);
            vec3 glowColor = mix(uColor, vec3(1.0), 0.4);
            gl_FragColor = vec4(glowColor, vOpacity * strength);
          }
        `}
        uniforms={{
          uColor: { value: color },
        }}
      />
    </points>
  );
};

export default FireballTrail; 