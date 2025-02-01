import React, { useMemo } from 'react';
import * as THREE from 'three';

const Pillar: React.FC = () => {
  // Create geometries and materials only once using useMemo
  const { pillarGeometries, materials } = useMemo(() => {
    // Base geometry
    const baseGeometry = new THREE.CylinderGeometry(2, 2.2, 1, 8);
    
    // Main column geometry
    const columnGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
    
    // Top geometry (decorative cap)
    const topGeometry = new THREE.CylinderGeometry(2.2, 2, 1, 8);

    // Shared material for all parts
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.7,
      metalness: 0.2,
    });

    // Add sphere geometry for the orb
    const orbGeometry = new THREE.SphereGeometry(1, 32, 32);

    // Add glowing material for the orb
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: '#ff0000',
      emissive: '#600000',
      metalness: 1,
      roughness: 0.2,
    });

    return {
      pillarGeometries: {
        base: baseGeometry,
        column: columnGeometry,
        top: topGeometry,
        orb: orbGeometry,
      },
      materials: {
        stone: stoneMaterial,
        orb: orbMaterial,
      }
    };
  }, []);

  // rotation animation for the orb
  const [rotation, setRotation] = React.useState(0);
  
  React.useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      setRotation(prev => (prev + 0.02) % (Math.PI * 2));
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  //  cleanup 
  React.useEffect(() => {
    return () => {
      Object.values(pillarGeometries).forEach(geometry => geometry.dispose());
      Object.values(materials).forEach(material => material.dispose());
    };
  }, [pillarGeometries, materials]);

  return (
    <group position={[0, 0, 0]} scale={[0.35, 0.35, 0.35]}>
      {/* Base */}
      <mesh
        geometry={pillarGeometries.base}
        material={materials.stone}
        position={[0, 0, 0]}
      />
      
      {/* Main column */}
      <mesh
        geometry={pillarGeometries.column}
        material={materials.stone}
        position={[0, 0.25, 0]}
      />
      
      {/* Top */}
      <mesh
        geometry={pillarGeometries.top}
        material={materials.stone}
        position={[0, 3, 0]}
      />
      
      {/* Floating orb */}
      <mesh
        geometry={pillarGeometries.orb}
        material={materials.orb}
        position={[0, 5, 0]}
        rotation={[rotation, rotation, 0]}
      >
        <pointLight color="#ff0000" intensity={0.5} distance={5} />
      </mesh>
    </group>
  );
};

export default React.memo(Pillar); 