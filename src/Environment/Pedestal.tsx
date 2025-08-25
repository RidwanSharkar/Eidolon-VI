import React, { useMemo } from 'react';
import * as THREE from 'three';

interface PedestalProps {
  position?: [number, number, number];
  scale?: number;
  level?: number;
}

const Pedestal: React.FC<PedestalProps> = ({ 
  position = [0, 0, 0], 
  scale = 1,
  level = 1
}) => {
  // Get level-based colors
  const getLevelColors = (level: number) => {
    switch (level) {
      case 1: return { color: '#00ff00', emissive: '#006600' }; // Green
      case 2: return { color: '#ffa500', emissive: '#cc8400' }; // Orange
      case 3: return { color: '#87ceeb', emissive: '#4682b4' }; // Light Blue
      case 4: return { color: '#dda0dd', emissive: '#9370db' }; // Light Purple
      case 5: return { color: '#ff0000', emissive: '#600000' }; // Red
      default: return { color: '#00ff00', emissive: '#006600' }; // Default to green
    }
  };
  // Create geometries and materials only once using useMemo
  const { pedestalGeometry, material } = useMemo(() => {
    // Create a larger base geometry similar to the pillar base but bigger
    // Using a slightly tapered cylinder for a more imposing look
    const baseGeometry = new THREE.CylinderGeometry(4, 4.5, 2.5, 12);
    
    // Add some detail with a smaller top ring
    const topRingGeometry = new THREE.CylinderGeometry(4.2, 4.2, 0.3, 12);
    
    // Stone material similar to pillar
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: '#e8e8e8',
      roughness: 0.8,
      metalness: 0.1,
    });

    return {
      pedestalGeometry: {
        base: baseGeometry,
        topRing: topRingGeometry,
      },
      material: stoneMaterial,
    };
  }, []);

  // Cleanup geometries and materials on unmount
  React.useEffect(() => {
    return () => {
      Object.values(pedestalGeometry).forEach(geometry => geometry.dispose());
      material.dispose();
    };
  }, [pedestalGeometry, material]);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Main base */}
      <mesh
        geometry={pedestalGeometry.base}
        material={material}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      />
      
      {/* Top decorative ring */}
      <mesh
        geometry={pedestalGeometry.topRing}
        material={material}
        position={[0, 0.6, 0]}
        castShadow
        receiveShadow
      />
      
      {/* Central point light */}
      <pointLight
        position={[0, 2.5, 0]}
        color={getLevelColors(level).color}
        intensity={0.8}
        distance={8}
        decay={2}
      />
    </group>
  );
};

export default React.memo(Pedestal);
