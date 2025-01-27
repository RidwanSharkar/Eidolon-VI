import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface MountainData {
  position: THREE.Vector3;
  scale: number;
}

interface InstancedMountainsProps {
  mountains: MountainData[];
}

const InstancedMountains: React.FC<InstancedMountainsProps> = ({ mountains }) => {
  const baseRef = useRef<THREE.InstancedMesh>(null);
  const secondaryRef = useRef<THREE.InstancedMesh>(null);
  const peakRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!baseRef.current || !secondaryRef.current || !peakRef.current) return;

    const matrix = new THREE.Matrix4();

    // Handle base mountains
    mountains.forEach((mountain, i) => {
      matrix.makeTranslation(
        mountain.position.x,
        mountain.position.y,
        mountain.position.z
      );
      const scaleMatrix = new THREE.Matrix4().makeScale(
        mountain.scale,
        mountain.scale,
        mountain.scale
      );
      matrix.multiply(scaleMatrix);
      baseRef.current?.setMatrixAt(i, matrix);
    });

    // Handle secondary mountains
    mountains.forEach((mountain, i) => {
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(0, 0.5, 0.1)
      );
      
      // Calculate offset based on mountain scale
      const offsetX = -4 * mountain.scale;
      const offsetY = -5 * mountain.scale;
      const offsetZ = -2 * mountain.scale;
      
      matrix.makeTranslation(
        mountain.position.x + offsetX,
        mountain.position.y + offsetY,
        mountain.position.z + offsetZ
      );
      
      const scaleMatrix = new THREE.Matrix4().makeScale(
        mountain.scale,
        mountain.scale,
        mountain.scale
      );
      
      matrix.multiply(rotationMatrix).multiply(scaleMatrix);
      secondaryRef.current?.setMatrixAt(i, matrix);
    });

    // Handle peaks
    mountains.forEach((mountain, i) => {
      matrix.makeTranslation(
        mountain.position.x,
        mountain.position.y + (14 * mountain.scale),
        mountain.position.z
      );
      const scaleMatrix = new THREE.Matrix4().makeScale(
        mountain.scale * 0.9,
        mountain.scale,
        mountain.scale * 0.9
      );
      matrix.multiply(scaleMatrix);
      peakRef.current?.setMatrixAt(i, matrix);
    });

    // Update matrices
    baseRef.current.instanceMatrix.needsUpdate = true;
    secondaryRef.current.instanceMatrix.needsUpdate = true;
    peakRef.current.instanceMatrix.needsUpdate = true;
  }, [mountains]);

  return (
    <group>
      <instancedMesh
        args={[undefined, undefined, mountains.length]}
        ref={baseRef}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[23, 35, 12]} />
        <meshPhysicalMaterial
          color="#2a2a2a"
          metalness={0.1}
          roughness={1}
          emissive="#222222"
          flatShading={true}
          clearcoat={0.1}
          clearcoatRoughness={0.8}
        />
      </instancedMesh>

      <instancedMesh
        args={[undefined, undefined, mountains.length]}
        ref={secondaryRef}
        castShadow
      >
        <coneGeometry args={[24, 28, 12]} />
        <meshPhysicalMaterial
          color="#252525"
          metalness={0.05}
          roughness={1}
          flatShading={true}
          clearcoat={0.1}
          clearcoatRoughness={0.9}
        />
      </instancedMesh>

      <instancedMesh
        args={[undefined, undefined, mountains.length]}
        ref={peakRef}
        castShadow
      >
        <coneGeometry args={[5, 8, 12]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.1}
          roughness={0.3}
          flatShading={true}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
          envMapIntensity={1.5}
        />
      </instancedMesh>
    </group>
  );
};

export default InstancedMountains; 