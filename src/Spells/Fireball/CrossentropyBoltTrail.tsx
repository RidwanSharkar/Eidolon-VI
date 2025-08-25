import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CrossentropyBoltTrailProps {
  color: THREE.Color;
  size: number;
  mesh1Ref: React.RefObject<THREE.Mesh>;
  mesh2Ref: React.RefObject<THREE.Mesh>;
  opacity?: number;
}

const CrossentropyBoltTrail: React.FC<CrossentropyBoltTrailProps> = ({
  color,
  size,
  mesh1Ref,
  mesh2Ref,
  opacity = 1
}) => {
  const particlesCount = 18;
  const particles1Ref = useRef<THREE.Points>(null);
  const particles2Ref = useRef<THREE.Points>(null);
  const positions1Ref = useRef<Float32Array>(new Float32Array(particlesCount * 3));
  const positions2Ref = useRef<Float32Array>(new Float32Array(particlesCount * 3));
  const opacities1Ref = useRef<Float32Array>(new Float32Array(particlesCount));
  const opacities2Ref = useRef<Float32Array>(new Float32Array(particlesCount));
  const scales1Ref = useRef<Float32Array>(new Float32Array(particlesCount));
  const scales2Ref = useRef<Float32Array>(new Float32Array(particlesCount));
  const isInitialized = useRef(false);
  
  // ref to store the last known positions for smoother updates
  const lastKnownPosition1 = useRef(new THREE.Vector3());
  const lastKnownPosition2 = useRef(new THREE.Vector3());

  // Initialize positions only once when meshes are available
  useEffect(() => {
    if (mesh1Ref.current && mesh2Ref.current && !isInitialized.current) {
      const { x: x1, y: y1, z: z1 } = mesh1Ref.current.position;
      const { x: x2, y: y2, z: z2 } = mesh2Ref.current.position;
      lastKnownPosition1.current.set(x1, y1, z1);
      lastKnownPosition2.current.set(x2, y2, z2);
      
      // Initialize all particles at the starting positions
      for (let i = 0; i < particlesCount; i++) {
        positions1Ref.current[i * 3] = x1;
        positions1Ref.current[i * 3 + 1] = y1;
        positions1Ref.current[i * 3 + 2] = z1;
        positions2Ref.current[i * 3] = x2;
        positions2Ref.current[i * 3 + 1] = y2;
        positions2Ref.current[i * 3 + 2] = z2;
        opacities1Ref.current[i] = 0;
        opacities2Ref.current[i] = 0;
        scales1Ref.current[i] = 0;
        scales2Ref.current[i] = 0;
      }
      isInitialized.current = true;
    }
  }, [mesh1Ref, mesh2Ref]);

  useFrame(() => {
    if (!particles1Ref.current?.parent || !particles2Ref.current?.parent || 
        !mesh1Ref.current || !mesh2Ref.current || !isInitialized.current) return;

    const currentPos1 = mesh1Ref.current.position;
    const currentPos2 = mesh2Ref.current.position;
    
    // Only update if positions have changed significantly
    if (currentPos1.distanceToSquared(lastKnownPosition1.current) > 0.0001 ||
        currentPos2.distanceToSquared(lastKnownPosition2.current) > 0.0001) {
      lastKnownPosition1.current.copy(currentPos1);
      lastKnownPosition2.current.copy(currentPos2);

      // Update particle positions for both trails
      for (let i = particlesCount - 1; i > 0; i--) {
        positions1Ref.current[i * 3] = positions1Ref.current[(i - 1) * 3];
        positions1Ref.current[i * 3 + 1] = positions1Ref.current[(i - 1) * 3 + 1];
        positions1Ref.current[i * 3 + 2] = positions1Ref.current[(i - 1) * 3 + 2];
        positions2Ref.current[i * 3] = positions2Ref.current[(i - 1) * 3];
        positions2Ref.current[i * 3 + 1] = positions2Ref.current[(i - 1) * 3 + 1];
        positions2Ref.current[i * 3 + 2] = positions2Ref.current[(i - 1) * 3 + 2];
      }

      // Update lead particles
      positions1Ref.current[0] = currentPos1.x;
      positions1Ref.current[1] = currentPos1.y;
      positions1Ref.current[2] = currentPos1.z;
      positions2Ref.current[0] = currentPos2.x;
      positions2Ref.current[1] = currentPos2.y;
      positions2Ref.current[2] = currentPos2.z;

      // Update geometry attributes
      if (particles1Ref.current && particles2Ref.current) {
        const geometry1 = particles1Ref.current.geometry;
        const geometry2 = particles2Ref.current.geometry;
        geometry1.attributes.position.needsUpdate = true;
        geometry2.attributes.position.needsUpdate = true;
      }
    }

    // Update opacities and scales with parent opacity
    for (let i = 0; i < particlesCount; i++) {
      opacities1Ref.current[i] = Math.pow((1 - i / particlesCount), 2) * 0.6 * opacity;
      opacities2Ref.current[i] = Math.pow((1 - i / particlesCount), 2) * 0.6 * opacity;
      scales1Ref.current[i] = size * 0.5 * Math.pow((1 - i / particlesCount), 0.5);
      scales2Ref.current[i] = size * 0.5 * Math.pow((1 - i / particlesCount), 0.5);
    }

    if (particles1Ref.current && particles2Ref.current) {
      const geometry1 = particles1Ref.current.geometry;
      const geometry2 = particles2Ref.current.geometry;
      geometry1.attributes.opacity.needsUpdate = true;
      geometry1.attributes.scale.needsUpdate = true;
      geometry2.attributes.opacity.needsUpdate = true;
      geometry2.attributes.scale.needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={particles1Ref}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesCount}
            array={positions1Ref.current}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-opacity"
            count={particlesCount}
            array={opacities1Ref.current}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-scale"
            count={particlesCount}
            array={scales1Ref.current}
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
      <points ref={particles2Ref}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesCount}
            array={positions2Ref.current}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-opacity"
            count={particlesCount}
            array={opacities2Ref.current}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-scale"
            count={particlesCount}
            array={scales2Ref.current}
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
    </>
  );
};

export default CrossentropyBoltTrail; 