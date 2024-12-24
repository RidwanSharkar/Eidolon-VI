import React from 'react';
import { useMemo } from 'react';
import { Vector3, Color, DoubleSide, Texture, CanvasTexture } from 'three';
import * as THREE from 'three';

// Helper function to create bark texture
const createBarkTexture = (): Texture => {
  const width = 256;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Create vertical striped pattern for bark
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Create noise pattern
      const noise = Math.random() * 0.2 + 0.8;
      // Add vertical stripes
      const stripe = Math.sin(x * 0.1) * Math.sin(y * 0.05) * 0.5 + 0.5;
      // Combine noise and stripes
      const value = (noise * stripe * 255) | 0;
      
      ctx.fillStyle = `rgb(${value},${value},${255})`; // Normal map blue channel is up
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
};

// Helper function to create leaf texture
const createLeafTexture = (): Texture => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Create a radial gradient for leaf veins
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2;
      const dy = y - size / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create vein pattern
      const angle = Math.atan2(dy, dx);
      const vein = Math.sin(angle * 8) * 0.5 + 0.5;
      const gradient = (1 - distance / (size / 2)) * 0.5;
      
      // Combine patterns
      const value = ((vein * gradient * 255) | 0);
      ctx.fillStyle = `rgb(${value},${value},${255})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

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
  trunkColor,
  leafColor,
}: TreeProps) => {
  // Create textures using useMemo
  const { barkTexture, leafTexture } = useMemo(() => ({
    barkTexture: createBarkTexture(),
    leafTexture: createLeafTexture()
  }), []);

  const variedTrunkColor = useMemo(() => varyColor(trunkColor), [trunkColor]);
  const variedLeafColor = useMemo(() => varyColor(leafColor), [leafColor]);
  
  const trunkRadius = 0.25 * scale;
  const trunkHeight = 4.2 * scale;
  const leafSize = 1.5 * scale;
  const leafHeight = 2 * scale;

  return (
    <group name="tree" position={position} scale={scale}>
      {/* Trunk with bark texture */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry 
          args={[
            trunkRadius, 
            trunkRadius * 1.2, 
            trunkHeight, 
            8,
            4,
            true
          ]} 
        />
        <meshStandardMaterial 
          color={variedTrunkColor}
          roughness={0.9}
          metalness={0.1}
          normalMap={barkTexture}
          normalScale={new THREE.Vector2(1.5, 1.5)}
          displacementScale={0.1}
        />
      </mesh>

      {/* Main foliage group */}
      <group position={[0, trunkHeight * 0.6, 0]} name="foliage">
        {/* Main foliage */}
        <mesh castShadow receiveShadow>
          <coneGeometry args={[leafSize, leafHeight, 8]} />
          <meshStandardMaterial 
            color={variedLeafColor}
            roughness={0.8}
            metalness={0.1}
            side={DoubleSide}
            transparent
            opacity={0.95}
            alphaTest={0.5}
            normalMap={leafTexture}
          />
        </mesh>

        {/* Secondary foliage layer */}
        <mesh 
          position={[0, leafHeight * 0.2, 0]} 
          castShadow 
          receiveShadow
        >
          <coneGeometry args={[leafSize * 0.7, leafHeight * 0.7, 8]} />
          <meshStandardMaterial 
            color={variedLeafColor.clone().offsetHSL(0, 0, -0.1)}
            roughness={0.8}
            metalness={0.1}
            side={DoubleSide}
            transparent
            opacity={0.95}
            alphaTest={0.5}
            normalMap={leafTexture}
          />
        </mesh>

        {/* Top foliage layer */}
        <mesh 
          position={[0, leafHeight * 0.4, 0]} 
          castShadow 
          receiveShadow
        >
          <coneGeometry args={[leafSize * 0.4, leafHeight * 0.4, 8]} />
          <meshStandardMaterial 
            color={variedLeafColor.clone().offsetHSL(0, 0, -0.15)}
            roughness={0.8}
            metalness={0.1}
            side={DoubleSide}
            transparent
            opacity={0.95}
            alphaTest={0.5}
            normalMap={leafTexture}
          />
        </mesh>


      </group>
    </group>
  );
};

export default React.memo(TreeComponent);