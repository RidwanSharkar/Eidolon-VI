import React, { useRef, useMemo } from 'react';
import {
  TextureLoader,
  LinearFilter,
  Mesh,
  Group,
  SphereGeometry,
  RingGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Frustum,
  Matrix4,
  Sphere,
  Vector3,
  DoubleSide,
  BackSide
} from 'three';
import { useLoader, useFrame } from '@react-three/fiber';

const Planet: React.FC = () => {
  const texture = useLoader(TextureLoader, '/textures/ring-alpha.jpg');
  const ringTexture = useMemo(() => {
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }, [texture]);
  const ringRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  // Memoize geometries with reduced segments for better performance
  const sphereGeometry = useMemo(() => new SphereGeometry(1, 24, 24), []);
  const ringGeometry = useMemo(() => new RingGeometry(1.4, 2.1, 48), []);
  
  // Memoize materials
  const planetMaterial = useMemo(() => new MeshStandardMaterial({
    color: "#B8E0D2",
    roughness: 0.7,
    metalness: 0.2,
    emissive: "#B8E0D2",
    emissiveIntensity: 0.675
  }), []);

  const glowMaterial = useMemo(() => new MeshBasicMaterial({
    color: "#4dff90",
    transparent: true,
    opacity: 0.5
  }), []);

  // Cache frustum and matrices to reduce garbage collection
  const frustum = useMemo(() => new Frustum(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  const sphere = useMemo(() => new Sphere(new Vector3(), 24 * Math.sqrt(3)), []);

  // Cleanup geometries and materials on unmount
  React.useEffect(() => {
    return () => {
      sphereGeometry.dispose();
      ringGeometry.dispose();
      planetMaterial.dispose();
      glowMaterial.dispose();
    };
  }, [sphereGeometry, ringGeometry, planetMaterial, glowMaterial]);

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
          side={DoubleSide}
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
          side={BackSide}
        />
      </mesh>


    </group>
  );
};

export default Planet; 