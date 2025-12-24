import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Vector3, CylinderGeometry, MeshStandardMaterial } from 'three';

interface BoneVortexProps {
  position: Vector3;
  onComplete?: () => void;
  isSpawning?: boolean;
  scale?: number;
}

// MEMORY FIX: Shared geometry and material - created once, reused by all instances
const SHARED_VORTEX_GEOMETRY = new CylinderGeometry(0.03, 0.025, 0.3, 6); // Reduced segments from 8 to 6
const SHARED_VORTEX_MATERIAL = new MeshStandardMaterial({
  color: "#F33FAE",
  transparent: true,
  opacity: 0.55,
  emissive: "#FF0000",
  emissiveIntensity: 0.75
});

// MEMORY FIX:
const LAYER_COUNT = 12; 
const SEGMENTS_PER_LAYER = 8; 
const TOTAL_SEGMENTS = LAYER_COUNT * SEGMENTS_PER_LAYER; 

export default function BoneVortex2({ position, onComplete, isSpawning = false, scale = 1 }: BoneVortexProps) {
    const segmentsRef = useRef<Mesh[]>([]);
    const layerCount = LAYER_COUNT;
    const segmentsPerLayer = SEGMENTS_PER_LAYER;
    const maxRadius = 1.15 * scale;
    const height = 2.75 * scale;
    const groupRef = useRef<Group>(null);
    const startTime = useRef(Date.now());
    const animationDuration = 1500;
    const hasCompletedRef = useRef(false);
    
    useFrame(() => {
      if (!groupRef.current || hasCompletedRef.current) return;
      
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      const effectiveProgress = isSpawning ? 1 - progress : progress;
      
      groupRef.current.position.copy(position);
      
      // MEMORY FIX: Only iterate over valid segments
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
        
        // MEMORY FIX: Use shared material opacity via mesh visibility instead of modifying material
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
  

  // MEMORY FIX: Cleanup on unmount - clear refs to allow GC
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
          key={i}
          ref={(el) => {
            if (el) segmentsRef.current[i] = el;
          }}
          geometry={SHARED_VORTEX_GEOMETRY}
          material={SHARED_VORTEX_MATERIAL}
        />
      ))}
    </group>
  );
} 