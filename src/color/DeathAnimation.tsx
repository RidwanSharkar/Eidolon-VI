import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Vector3 } from 'three';
import * as THREE from 'three';
import { WeaponType, WeaponSubclass } from '../Weapons/weapons';

interface BoneVortexProps {
  position: Vector3;
  onComplete?: () => void;
  isSpawning?: boolean;
  weaponType: WeaponType;
  weaponSubclass?: WeaponSubclass;
  scale?: number;
}

const getVortexColor = (weaponType: WeaponType, weaponSubclass?: WeaponSubclass) => {
  if (weaponSubclass) {
    switch (weaponSubclass) {
      // Scythe subclasses
      case WeaponSubclass.CHAOS:
        return '#00FF4D'; // Keep original chaos color
      case WeaponSubclass.ABYSSAL:
        return '#8B00FF'; // Purple for abyssal
      
      // Sword subclasses
      case WeaponSubclass.DIVINITY:
        return '#FFD700'; // Keep original divinity color
      case WeaponSubclass.VENGEANCE:
        return '#FF8C00'; // More orange for vengeance
      
      // Sabres subclasses
      case WeaponSubclass.FROST:
        return '#00BBFF'; // Keep original frost color
      case WeaponSubclass.ASSASSIN:
        return '#4A00AA'; // Dark purple for assassin
      
      // Spear subclasses
      case WeaponSubclass.PYRO:
        return '#F33FAE'; // Keep original pyro color
      case WeaponSubclass.STORM:
        return '#808080'; // Grey for storm
      
      // Bow subclasses
      case WeaponSubclass.ELEMENTAL:
        return '#3A905E'; // Keep original elemental color
      case WeaponSubclass.VENOM:
        return '#17CC93'; // Green/purple for venom
    }
  }
  
  // Fallback to weapon type colors
  switch (weaponType) {
    case WeaponType.SCYTHE:
      return '#00FF4D'; //  00FF88 FF6B6B FF6AAA
    case WeaponType.SWORD:
      return '#FFD700'; // FF9843  FF8C2D
    case WeaponType.SABRES:
      return '#00BBFF'; //ice blue 98F5FC 
    case WeaponType.SPEAR:
      return '#F33FAE'; //RED
    default:
      return '#00ff44'; // 00FF37
  }
};

const createVortexSegment = (weaponType: WeaponType, weaponSubclass?: WeaponSubclass) => {
  const color = getVortexColor(weaponType, weaponSubclass);
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.03, 0.025, 0.3, 8]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={0.525}
          emissive={color}
          emissiveIntensity={0.75}
        />
      </mesh>
    </group>
  );
};

export default function BoneVortex({ position, onComplete, isSpawning = false, weaponType, weaponSubclass }: BoneVortexProps) {
  const segmentsRef = useRef<Mesh[]>([]);
  const layerCount = 12;
  const segmentsPerLayer = 10;
  const maxRadius = 1.15;
  const height = 2.75;
  const groupRef = useRef<Group>(null);
  const startTime = useRef(Date.now());
  const animationDuration = 1500;
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    const effectiveProgress = isSpawning ? 1 - progress : progress;
    
    groupRef.current.position.set(position.x, 0, position.z);
    
    segmentsRef.current.forEach((segment, i) => {
      const layer = Math.floor(i / segmentsPerLayer);
      const layerProgress = layer / (layerCount - 1);
      
      const radiusMultiplier = effectiveProgress < 0.5 
        ? effectiveProgress * 2 
        : 2 - (effectiveProgress * 2);
      const radius = maxRadius * layerProgress * radiusMultiplier;
      
      const rotationSpeed = 0.006 * (1 + layerProgress * 3);
      const baseAngle = (i % segmentsPerLayer) / segmentsPerLayer * Math.PI * 2;
      const angle = baseAngle + elapsed * rotationSpeed;
      
      const spiralTightness = 2;
      const x = Math.cos(angle + layerProgress * spiralTightness) * radius;
      const z = Math.sin(angle + layerProgress * spiralTightness) * radius;
      const y = (1 - layerProgress) * height * (1 + Math.sin(elapsed * 0.002) * 0.1);
      
      segment.position.set(x, y, z);
      
      segment.rotation.y = angle + Math.PI / 2;
      segment.rotation.z = Math.PI / 2 + layerProgress * 0.8;
      segment.rotation.x = Math.sin(elapsed * 0.004 + i) * 0.2;
      
      const material = segment.material as THREE.MeshStandardMaterial;
      material.opacity = Math.max(0, 0.7 - layerProgress * 0.4 - (effectiveProgress > 0.7 ? (effectiveProgress - 0.7) * 3 : 0));
      material.emissiveIntensity = 0.5 + Math.sin(elapsed * 0.004 + i) * 0.3;
      
      const scale = 1 + Math.sin(elapsed * 0.003 + i * 0.5) * 0.2;
      segment.scale.set(scale, scale, scale);
    });

    if (progress === 1 && onComplete) {
      onComplete();
    }
  });

  return (
    <group ref={groupRef} >
      {Array.from({ length: layerCount * segmentsPerLayer }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) segmentsRef.current[i] = el;
          }}
        >
          {createVortexSegment(weaponType, weaponSubclass)}
        </mesh>
      ))}
    </group>
  );
} 