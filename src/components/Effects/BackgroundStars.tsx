import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BackgroundStars: React.FC = () => {
  const points = useRef<THREE.Points>(null);
  
  // Generate random positions for stars
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, []);

  // Create and memoize the geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    return geo;
  }, [particles]);

  // Animate the stars
  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.getElapsedTime() * 0.05;
      points.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry {...geometry} />
      <pointsMaterial
        size={0.7}
        sizeAttenuation
        transparent
        alphaMap={new THREE.TextureLoader().load('/circle.png')}
        alphaTest={0.001}
        color="#ffffff"
        fog={false}
      />
    </points>
  );
};

export default BackgroundStars;