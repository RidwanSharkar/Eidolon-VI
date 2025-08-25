import React, { useRef, useEffect, useMemo } from 'react';
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

  // Create varied peak geometries for natural snowtop variation
  const peakGeometries = useMemo(() => {
    return mountains.map((_, index) => {
      // Use index as seed for consistent variation per mountain
      const seed = index * 0.618033988749; // Golden ratio for good distribution
      
      // Create more detailed cone geometry with higher resolution
      const geometry = new THREE.ConeGeometry(5, 8, 16, 8); // More segments for detail
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Add natural variation to the peak shape with multiple noise layers
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        // Only modify vertices that are not at the very top or bottom
        if (y > -3.5 && y < 3.5) {
          // Create multiple layers of noise for more realistic terrain
          const noiseX1 = Math.sin(x * 0.5 + seed) * Math.cos(z * 0.3 + seed * 2);
          const noiseZ1 = Math.cos(x * 0.3 + seed * 3) * Math.sin(z * 0.5 + seed * 4);
          
          // Add finer detail noise
          const noiseX2 = Math.sin(x * 1.2 + seed * 5) * Math.cos(z * 0.8 + seed * 6) * 0.3;
          const noiseZ2 = Math.cos(x * 0.9 + seed * 7) * Math.sin(z * 1.1 + seed * 8) * 0.3;
          
          // Apply variation that's stronger at the snow line (middle of the peak)
          const heightFactor = 1 - Math.abs(y) / 2; // Stronger variation in middle
          const variation = 0.4 + Math.sin(seed * 10) * 0.3; // More dramatic variation
          
          positions[i] += (noiseX1 + noiseX2) * variation * heightFactor;
          positions[i + 2] += (noiseZ1 + noiseZ2) * variation * heightFactor;
          
          // Add subtle height variation for more natural ridges
          positions[i + 1] += Math.sin(x * 0.2 + z * 0.2 + seed) * 0.2 * heightFactor;
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals(); // Recompute normals for proper lighting
      
      return geometry;
    });
  }, [mountains]);

  useEffect(() => {
    if (!baseRef.current || !secondaryRef.current) return;

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

    // Update matrices
    baseRef.current.instanceMatrix.needsUpdate = true;
    secondaryRef.current.instanceMatrix.needsUpdate = true;
  }, [mountains]);

  return (
    <group>
      <instancedMesh
        args={[undefined, undefined, mountains.length]}
        ref={baseRef}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[23, 35, 24, 6]} />
        <meshStandardMaterial
          color="#8B7355" // Brown-gray mountain color
          roughness={0.8}
          metalness={0.1}
        />
      </instancedMesh>

      <instancedMesh
        args={[undefined, undefined, mountains.length]}
        ref={secondaryRef}
        castShadow
      >
        <coneGeometry args={[24, 28, 20, 5]} />
        <meshStandardMaterial
          color="#6B5B47" // Darker brown for background mountains
          roughness={0.9}
          metalness={0.05}
        />
      </instancedMesh>

      {/* Render individual peak meshes with varied geometries */}
      {mountains.map((mountain, index) => (
        <mesh
          key={`peak-${index}`}
          geometry={peakGeometries[index]}
          position={[
            mountain.position.x,
            mountain.position.y + (14 * mountain.scale),
            mountain.position.z
          ]}
          scale={[
            mountain.scale * 0.9,
            mountain.scale,
            mountain.scale * 0.9
          ]}
          castShadow
        >
          <meshStandardMaterial
            color="#f0f0f0" // Light gray-white for snow peaks
            roughness={0.3}
            metalness={0.0}
          />
        </mesh>
      ))}
    </group>
  );
};

export default InstancedMountains; 