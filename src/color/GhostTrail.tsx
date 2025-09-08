import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Color } from 'three';
import * as THREE from 'three';
import { WeaponType, WeaponSubclass } from '../Weapons/weapons';

interface GhostTrailProps {
  parentRef: React.RefObject<THREE.Group>;
  weaponType: WeaponType;
  weaponSubclass?: WeaponSubclass;
  targetPosition?: Vector3; // Optional for multiplayer - if provided, use this instead of parentRef position
}

export default function GhostTrail({ parentRef, weaponType, weaponSubclass, targetPosition }: GhostTrailProps) {
  const trailsRef = useRef<Mesh[]>([]);
  const positions = useRef<Vector3[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const trailCount = 30;
  
  useEffect(() => {
    // Initialize with target position if provided, otherwise use parent's position
    let initialPos: Vector3;
    if (targetPosition) {
      initialPos = targetPosition.clone();
      positions.current = Array(trailCount).fill(0).map(() => initialPos.clone());
      setIsInitialized(true);
    } else if (parentRef.current) {
      initialPos = parentRef.current.position.clone();
      positions.current = Array(trailCount).fill(0).map(() => initialPos.clone());
      setIsInitialized(true);
    }
  }, [parentRef, targetPosition])

  const getTrailColor = () => {
    if (weaponSubclass) {
      switch (weaponSubclass) {
        // Scythe subclasses
        case WeaponSubclass.CHAOS:
          return '#00FF37'; // Keep original chaos color
        case WeaponSubclass.ABYSSAL:
          return '#17CE54'; // Purple for abyssal
        
        // Sword subclasses
        case WeaponSubclass.DIVINITY:
          return '#FF8C00'; // Keep original divinity color
        case WeaponSubclass.VENGEANCE:
          return '#FFB300'; // More orange for vengeance
        
        // Sabres subclasses
        case WeaponSubclass.FROST:
          return '#00BFFF'; // Keep original frost color
        case WeaponSubclass.ASSASSIN:
          return '#3A98F7'; // Dark purple for assassin
        
        // Spear subclasses
        case WeaponSubclass.PYRO:
          return '#FF544E'; // Keep original pyro color (changed from grey to match other files)
        case WeaponSubclass.STORM:
          return '#FF544E'; // Grey for storm
        
        // Bow subclasses
        case WeaponSubclass.ELEMENTAL:
          return '#3EB0FC'; // Keep original elemental color
        case WeaponSubclass.VENOM:
          return '#17CC93'; // Green/purple for venom
      }
    }
    
    // Fallback to weapon type colors
    switch (weaponType) {
      case WeaponType.SCYTHE:
        return '#17CE54'; // 39ff14
      case WeaponType.SWORD:
        return '#FFB300'; // <--FFB300   FFD500 GOLDER F9A602 YELLOWER <--- 8783D1 FF9441
      case WeaponType.SABRES:
        return '#00BFFF'; //78DFFF
      case WeaponType.SPEAR:
        return '#C6C6C6'; // FF544E
      case WeaponType.BOW:
        return '#3A905E'; //D09A1D try 
    }
  };
  useFrame(() => {
    if (!isInitialized) return;
    
    // Use targetPosition if provided (for multiplayer), otherwise use parentRef position
    let newPos: Vector3;
    if (targetPosition) {
      newPos = targetPosition.clone();
    } else if (parentRef.current) {
      newPos = parentRef.current.position.clone();
    } else {
      return;
    }

    // Update position history
    positions.current.unshift(newPos);
    positions.current = positions.current.slice(0, trailCount);

    // Update trail meshes
    trailsRef.current.forEach((trail, i) => {
      if (trail && positions.current[i]) {
        trail.position.copy(positions.current[i]);
        
        // Scale and opacity based on trail position
        const scale = 1 - (i / trailCount) * 0.6;
        trail.scale.setScalar(scale);
        
        if (trail.material && trail.material instanceof THREE.MeshBasicMaterial) {
          trail.material.opacity = (1 - i / trailCount) * 0.2;
        }
      }
    });
  });

  // Only render trails after initialization
  if (!isInitialized) return null;

  return (
    <>
      {Array.from({ length: trailCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) trailsRef.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.43, 8, 8]} />
          <meshBasicMaterial
            color={new Color(getTrailColor())}
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
} 