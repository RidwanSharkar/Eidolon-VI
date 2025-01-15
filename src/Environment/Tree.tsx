import {  useMemo } from 'react';
import {  Vector3, Color } from 'three';
import * as THREE from 'three';
import React from 'react';

interface TreeProps {
  position: Vector3;
  scale: number;
  trunkColor: Color;
  leafColor: Color;
}

const varyColor = (baseColor: Color, range: number = 0.1) => {
  const color = new THREE.Color(baseColor);
  color.r = THREE.MathUtils.clamp(color.r + (Math.random() - 0.5) * range, 0, 1);
  color.g = THREE.MathUtils.clamp(color.g + (Math.random() - 0.5) * range, 0, 1);
  color.b = THREE.MathUtils.clamp(color.b + (Math.random() - 0.5) * range, 0, 1);
  return color;
};

const TreeComponent: React.FC<TreeProps> = ({ 
  position = new Vector3(0, 2, -5),
  scale = 0.8,
  leafColor,
}: TreeProps) => {
  const variedLeafColor = useMemo(() => varyColor(leafColor), [leafColor]);

  const trunkRadius = 0.25 * scale;
  const trunkHeight = 4 * scale;
  const leafSize = 1.35 * scale;
  const leafHeight = 1.7 * scale;

  return (
    <group name="tree" position={position} scale={scale*0.9}>
      <mesh>
        {/* Trunk */}
        <cylinderGeometry args={[trunkRadius, trunkRadius * 1.225, trunkHeight, 8]} />
        <meshStandardMaterial 
          color={'#FFBD83'}
          roughness={0.8}
          metalness={0.1}
        />

                                {/* Main foliage */}
                                <mesh position={[0, trunkHeight * 0.56, 0]} name="tree-top">
          <coneGeometry args={[leafSize, leafHeight, 8]} />
          <meshStandardMaterial 
            color={variedLeafColor}
            roughness={0.4}
            metalness={0.1}
            emissive={variedLeafColor}
            emissiveIntensity={0.475}
          />
        </mesh>
        


        <mesh position={[0, trunkHeight * 0.69, 0]} name="tree-top">
          <coneGeometry args={[leafSize* 0.8, leafHeight* 0.8, 8]} />
          <meshStandardMaterial 
            color={variedLeafColor}
            roughness={0.4}
            metalness={0.1}
            emissive={variedLeafColor}
            emissiveIntensity={0.45}
          />
        </mesh>


        {/* Secondary foliage layer */}
        <mesh position={[0, trunkHeight * 0.85, 0]} name="tree-top-2">
          <coneGeometry args={[leafSize * 0.56, leafHeight * 0.8, 8]} />
          <meshStandardMaterial 
            color={variedLeafColor.clone().multiplyScalar(1.1)}
            roughness={0.4}
            metalness={0.1}
            emissive={variedLeafColor}
            emissiveIntensity={0.49}
          />
        </mesh>




        {/* Top foliage layer */}
        <mesh position={[0, trunkHeight*0.905, 0]} name="tree-top-3">
          <coneGeometry args={[leafSize * 0.525, leafHeight * 0.45, 8]} />
          <meshStandardMaterial 
            color={variedLeafColor.clone().multiplyScalar(1.15)}
            roughness={0.4}
            metalness={0.1}
            emissive={variedLeafColor}
            emissiveIntensity={0.485}
          />
        </mesh>
      </mesh>
    </group>
  );
};

export default React.memo(TreeComponent);