import { GroupProps } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { Group, Mesh, Color } from "three";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

interface DragonHornsProps extends GroupProps {
  scale?: number;
}

export function DragonHorns({ scale = 1, ...props }: DragonHornsProps) {
  const groupRef = useRef<Group>(null);
  const hornMeshes = useRef<Mesh[]>([]);

  // Merge geometries for better performance
  useEffect(() => {
    if (groupRef.current) {
      const geometries: THREE.BufferGeometry[] = [];
      hornMeshes.current.forEach((mesh) => {
        if (mesh.geometry) {
          geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));
        }
      });
      
      if (geometries.length > 0) {
        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
        // Apply merged geometry to first mesh and hide others
        if (hornMeshes.current[0] && mergedGeometry) {
          hornMeshes.current[0].geometry = mergedGeometry;
          hornMeshes.current.slice(1).forEach(mesh => mesh.visible = false);
        }
      }
    }
  }, []);

  const createHornSegment = (
    height: number,
    radiusTop: number,
    radiusBottom: number,
    position: [number, number, number],
    rotation: [number, number, number],
    gradientOffset: number = 0
  ) => {
    return (
      <mesh
        ref={(mesh) => {
          if (mesh) hornMeshes.current.push(mesh as Mesh);
        }}
        position={position}
        rotation={rotation}
      >
        <cylinderGeometry 
          args={[radiusTop, radiusBottom, height, 12, 4, false]} 
        />
        <meshStandardMaterial
          color={new Color('#ff3333').multiplyScalar(1 - gradientOffset * 0.5)}
          roughness={0.4 + gradientOffset * 0.3}
          metalness={0.6 - gradientOffset * 0.3}
          emissive={new Color('#330000')}
          emissiveIntensity={0.2 + gradientOffset * 0.3}
        />
      </mesh>
    );
  };

  return (
    <group ref={groupRef} scale={scale} {...props}>
      {/* Left Horn */}
      <group position={[-0.25, 0.5, 0]} rotation={[0.3, -0.2, 0]}>
        {createHornSegment(0.4, 0.06, 0.08, [0, 0.2, 0], [0.3, 0, 0], 0)}
        {createHornSegment(0.3, 0.05, 0.06, [0, 0.4, 0.1], [0.4, 0, 0], 0.3)}
        {createHornSegment(0.25, 0.04, 0.05, [0, 0.6, 0.2], [0.5, 0, 0], 0.6)}
        {createHornSegment(0.2, 0.03, 0.04, [0, 0.75, 0.3], [0.6, 0, 0], 0.9)}
      </group>

      {/* Right Horn */}
      <group position={[0.25, 0.5, 0]} rotation={[0.3, 0.2, 0]}>
        {createHornSegment(0.4, 0.06, 0.08, [0, 0.2, 0], [0.3, 0, 0], 0)}
        {createHornSegment(0.3, 0.05, 0.06, [0, 0.4, 0.1], [0.4, 0, 0], 0.3)}
        {createHornSegment(0.25, 0.04, 0.05, [0, 0.6, 0.2], [0.5, 0, 0], 0.6)}
        {createHornSegment(0.2, 0.03, 0.04, [0, 0.75, 0.3], [0.6, 0, 0], 0.9)}
      </group>
    </group>
  );
}
