import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Vector3, CylinderGeometry, MeshStandardMaterial } from 'three';
import { WeaponType, WeaponSubclass } from '../Weapons/weapons';

interface BoneVortexProps {
  position: Vector3;
  onComplete?: () => void;
  isSpawning?: boolean;
  weaponType: WeaponType;
  weaponSubclass?: WeaponSubclass;
  scale?: number;
}

// MEMORY FIX: Shared geometry - created once, reused by all instances
const SHARED_DEATH_GEOMETRY = new CylinderGeometry(0.03, 0.025, 0.3, 6); // Reduced segments

// MEMORY FIX: Pre-created material cache by color to avoid creating new materials
const MATERIAL_CACHE = new Map<string, MeshStandardMaterial>();

const getOrCreateMaterial = (color: string): MeshStandardMaterial => {
  if (!MATERIAL_CACHE.has(color)) {
    const material = new MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 0.525,
      emissive: color,
      emissiveIntensity: 0.75
    });
    MATERIAL_CACHE.set(color, material);
  }
  return MATERIAL_CACHE.get(color)!;
};

const getVortexColor = (weaponType: WeaponType, weaponSubclass?: WeaponSubclass) => {
  if (weaponSubclass) {
    switch (weaponSubclass) {
      case WeaponSubclass.CHAOS: return '#00FF4D';
      case WeaponSubclass.ABYSSAL: return '#8B00FF';
      case WeaponSubclass.DIVINITY: return '#FFD700';
      case WeaponSubclass.VENGEANCE: return '#FF8C00';
      case WeaponSubclass.FROST: return '#00BBFF';
      case WeaponSubclass.ASSASSIN: return '#4A00AA';
      case WeaponSubclass.PYRO: return '#F33FAE';
      case WeaponSubclass.STORM: return '#808080';
      case WeaponSubclass.ELEMENTAL: return '#3A905E';
      case WeaponSubclass.VENOM: return '#17CC93';
    }
  }
  
  switch (weaponType) {
    case WeaponType.SCYTHE: return '#00FF4D';
    case WeaponType.SWORD: return '#FFD700';
    case WeaponType.SABRES: return '#00BBFF';
    case WeaponType.SPEAR: return '#F33FAE';
    default: return '#00ff44';
  }
};

// MEMORY FIX: Reduced segment count
const LAYER_COUNT = 8; // Reduced from 12
const SEGMENTS_PER_LAYER = 6; // Reduced from 10
const TOTAL_SEGMENTS = LAYER_COUNT * SEGMENTS_PER_LAYER; // 48 instead of 120

export default function BoneVortex({ position, onComplete, isSpawning = false, weaponType, weaponSubclass }: BoneVortexProps) {
  const segmentsRef = useRef<Mesh[]>([]);
  const layerCount = LAYER_COUNT;
  const segmentsPerLayer = SEGMENTS_PER_LAYER;
  const maxRadius = 1.15;
  const height = 2.75;
  const groupRef = useRef<Group>(null);
  const startTime = useRef(Date.now());
  const animationDuration = 1500;
  const hasCompletedRef = useRef(false);
  
  // MEMORY FIX: Get cached material based on weapon
  const material = useMemo(() => {
    const color = getVortexColor(weaponType, weaponSubclass);
    return getOrCreateMaterial(color);
  }, [weaponType, weaponSubclass]);
  
  useFrame(() => {
    if (!groupRef.current || hasCompletedRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    const effectiveProgress = isSpawning ? 1 - progress : progress;
    
    groupRef.current.position.set(position.x, 0, position.z);
    
    // MEMORY FIX: Use for loop instead of forEach, check array bounds
    const segmentCount = Math.min(segmentsRef.current.length, TOTAL_SEGMENTS);
    for (let i = 0; i < segmentCount; i++) {
      const segment = segmentsRef.current[i];
      if (!segment) continue;
      
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
      
      // MEMORY FIX: Use visibility instead of modifying shared material opacity
      const opacity = Math.max(0, 0.7 - layerProgress * 0.4 - (effectiveProgress > 0.7 ? (effectiveProgress - 0.7) * 3 : 0));
      segment.visible = opacity > 0.05;
      
      const scaleVal = 1 + Math.sin(elapsed * 0.003 + i * 0.5) * 0.2;
      segment.scale.set(scaleVal, scaleVal, scaleVal);
    }

    if (progress === 1 && onComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete();
    }
  });

  // MEMORY FIX: Cleanup on unmount
  useEffect(() => {
    return () => {
      segmentsRef.current = [];
      hasCompletedRef.current = true;
    };
  }, []);

  return (
    <group ref={groupRef}>
      {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
        <mesh
          key={`death-${i}`}
          ref={(el) => {
            if (el) segmentsRef.current[i] = el;
          }}
          geometry={SHARED_DEATH_GEOMETRY}
          material={material}
        />
      ))}
    </group>
  );
} 