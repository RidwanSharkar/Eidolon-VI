import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IncinerateEmpowermentProps {
  position: THREE.Vector3;
  isEmpowered: boolean; // When true, show the empowerment effect
}

export function IncinerateEmpowerment({  isEmpowered }: IncinerateEmpowermentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  // Create particle system for fiery effect
  const particleSystem = useMemo(() => {
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Create particles in a cylindrical pattern around the player
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 0.5;
      const height = Math.random() * 2 - 1;
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      // Fiery colors - orange to red
      colors[i3] = 1.0; // Red
      colors[i3 + 1] = 0.3 + Math.random() * 0.4; // Green (orange tint)
      colors[i3 + 2] = 0.0; // Blue
      
      sizes[i] = 0.1 + Math.random() * 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 1.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;
        uniform float time;
        
        void main() {
          vColor = color;
          vSize = size;
          
          vec3 pos = position;
          // Add some floating motion
          pos.y += sin(time * 2.0 + position.x * 10.0) * 0.1;
          pos.x += cos(time * 1.5 + position.z * 8.0) * 0.05;
          pos.z += sin(time * 1.8 + position.x * 6.0) * 0.05;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float opacity;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;
          
          float alpha = 1.0 - distance * 2.0;
          alpha *= opacity;
          
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return { geometry, material };
  }, []);

  useFrame((state) => {
    if (!isEmpowered) return;

    const time = state.clock.elapsedTime;

    // Animate particles
    if (particlesRef.current) {
      const material = particlesRef.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value = time;
    }

    // Animate rings
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y = time * 2;
      (innerRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(time * 4) * 0.2;
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.y = -time * 1.5;
      (outerRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(time * 3) * 0.2;
    }
  });

  if (!isEmpowered) return null;

  return (
    <group ref={groupRef}>
      {/* Particle system */}
      <points ref={particlesRef} geometry={particleSystem.geometry} material={particleSystem.material} />
      
      {/* Inner ring */}
      <mesh ref={innerRingRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial
          color="#ff4500"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Outer ring */}
      <mesh ref={outerRingRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.8, 32]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Central glow */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
