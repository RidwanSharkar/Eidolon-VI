import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

const VEGETATION_COUNT = 400; // Number of vegetation patches
const LEAVES_PER_PATCH = 7; // Number of leaves per patch

export default function InstancedVegetation() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  // Create a simple leaf shape using a triangle
  const leafGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.2, 0, 0,    // left point
      0.2, 0, 0,     // right point
      0, 0.4, 0      // top point
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  // Material for the leaves with slight variation in color
  const leafMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a4d1a'),
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
    });
  }, []);

  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const mesh = instancedMeshRef.current;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    // Create patches of vegetation
    for (let i = 0; i < VEGETATION_COUNT; i++) {
      // Random position within a radius
      const radius = 45; // Slightly less than terrain radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      
      position.set(
        Math.cos(angle) * distance,
        0.01, // Slightly above ground to prevent z-fighting
        Math.sin(angle) * distance
      );

      // Create a patch of leaves
      for (let j = 0; j < LEAVES_PER_PATCH; j++) {
        const patchIndex = i * LEAVES_PER_PATCH + j;
        
        // Random offset within the patch
        const patchOffset = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          0,
          (Math.random() - 0.5) * 0.5
        );
        const finalPosition = position.clone().add(patchOffset);

        // More randomized rotation
        const tiltAmount = Math.PI * 2 ; // Maximum 60-degree tilt from vertical
        rotation.set(
          -Math.PI / 2 + (Math.random() - 0.5) * tiltAmount, // Random tilt in X
          Math.random() * Math.PI * 2,                       // Random rotation around Y
          (Math.random() - 0.5) * tiltAmount                 // Random tilt in Z
        );
        quaternion.setFromEuler(rotation);

        // Random scale variation
        const baseScale = 0.4 + Math.random() * 0.4;
        scale.set(baseScale, baseScale, baseScale);

        matrix.compose(finalPosition, quaternion, scale);
        mesh.setMatrixAt(patchIndex, matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[leafGeometry, leafMaterial, VEGETATION_COUNT * LEAVES_PER_PATCH]}
      receiveShadow
      castShadow
    />
  );
} 