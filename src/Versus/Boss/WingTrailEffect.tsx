import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WingTrailEffectProps {
  parentRef: React.RefObject<THREE.Group>;
  offset: THREE.Vector3;
}

const WingTrailEffect: React.FC<WingTrailEffectProps> = ({ parentRef, offset }) => {
  const particlesCount = 18;
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(particlesCount * 3));
  const opacitiesRef = useRef<Float32Array>(new Float32Array(particlesCount));
  const scalesRef = useRef<Float32Array>(new Float32Array(particlesCount));
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!particlesRef.current?.parent || !parentRef.current) return;
    
    timeRef.current += delta;
    const localPosition = offset.clone();
    
    // Create a more elongated, comet-like trail pattern
    for (let i = 0; i < particlesCount; i++) {
      const t = i / particlesCount;
      const angle = t * Math.PI * 0.5 + timeRef.current;
      
      // Reduced spread for thinner trail
      const xSpread = Math.cos(angle) * 0.02;
      const ySpread = Math.sin(timeRef.current + i * 0.2) * 0.02;
      const trailLength = (1 - t) * 0.8; // Longer trail
      
      positionsRef.current[i * 3] = localPosition.x + xSpread;
      positionsRef.current[i * 3 + 1] = localPosition.y + ySpread;
      positionsRef.current[i * 3 + 2] = localPosition.z - trailLength;

      // More dramatic opacity falloff
      opacitiesRef.current[i] = Math.pow((1 - t), 2) * 0.6;
      
      // Gradually decreasing particle scale for pointed effect
      scalesRef.current[i] = 0.12 * Math.pow((1 - t), 1.2);
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
        depthTest={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        vertexShader={`
          attribute float opacity;
          attribute float scale;
          varying float vOpacity;
          void main() {
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = scale * 40.0 * (300.0 / -mvPosition.z);
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5, 0.2)); // More pointed shape
            float strength = smoothstep(0.5, 0.05, d);
            vec3 glowColor = mix(vec3(0.8, 0.1, 0.1), vec3(1.0, 0.3, 0.3), 0.4);
            gl_FragColor = vec4(glowColor, vOpacity * strength);
          }
        `}
      />
    </points>
  );
};

export default WingTrailEffect; 