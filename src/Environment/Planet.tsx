import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';

const Planet: React.FC = () => {
  const texture = useLoader(THREE.TextureLoader, '/textures/ring-alpha.jpg');
  const ringTexture = useMemo(() => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }, [texture]);
  const ringRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Memoize geometries with reduced segments for better performance
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1, 24, 24), []);
  const ringGeometry = useMemo(() => new THREE.RingGeometry(1.4, 2.1, 48), []);
  
  // Memoize materials
  const planetMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#B8E0D2",
    roughness: 0.7,
    metalness: 0.2,
    emissive: "#B8E0D2",
    emissiveIntensity: 0.675
  }), []);

  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#4dff90",
    transparent: true,
    opacity: 0.5
  }), []);

  // Cache frustum and matrices to reduce garbage collection
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), 24 * Math.sqrt(3)), []);

  // Rotate the ring slowly
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.006;
    }
    
    // Apply frustum culling
    if (groupRef.current) {
      // Update frustum check with cached objects
      matrix.multiplyMatrices(
        state.camera.projectionMatrix,
        state.camera.matrixWorldInverse
      );
      frustum.setFromProjectionMatrix(matrix);
      
      sphere.center.copy(groupRef.current.position);
      groupRef.current.visible = frustum.intersectsSphere(sphere);
    }
  });

  return (
    <group ref={groupRef} position={[100, 80, -150]} scale={[24, 24, 24]} rotation={[1.0, 0.1, 0.1]}>
      {/* Main planet sphere */}
      <mesh geometry={sphereGeometry} material={planetMaterial} />

      {/* Planet Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.8, 0, 0]} geometry={ringGeometry}>
        <meshStandardMaterial
          map={ringTexture}
          color="#A8DBFF"
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          alphaMap={ringTexture}
          roughness={0.7}
          metalness={0.2}
          emissive="#77FFC0"
          emissiveIntensity={1.1}
        />
      </mesh>

      {/* Inner glow */}
      <mesh scale={[1.05, 1.05, 1.05]} geometry={sphereGeometry} material={glowMaterial} />

      {/* Outer glow */}
      <mesh scale={[1.1, 1.1, 1.1]} geometry={sphereGeometry}>
        <meshBasicMaterial
          color="#4dff90"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>


    </group>
  );
};

export default Planet; 