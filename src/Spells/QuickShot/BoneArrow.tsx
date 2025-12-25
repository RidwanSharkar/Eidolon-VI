import { Vector3, MeshStandardMaterial, CylinderGeometry, SphereGeometry, ConeGeometry } from 'three';
import { useMemo, useEffect } from 'react';
import { WeaponSubclass } from '@/Weapons/weapons';

// Shared geometries - created once at module level for all instances
const BONE_ARROW_GEOMETRIES = {
  shaft: new CylinderGeometry(0.04, 0.06, 1.2, 6),
  joint: new SphereGeometry(0.08, 8, 8),
  arrowHead: new ConeGeometry(0.1, 0.3, 6),
  spike: new ConeGeometry(0.02, 0.1, 4),
};

interface BoneArrowProps {
  position: Vector3;
  direction: Vector3;
  opacity?: number;
  currentSubclass?: WeaponSubclass;
  level?: number;
}

export default function BoneArrow({ position, direction, opacity = 1, currentSubclass, level = 1 }: BoneArrowProps) {
  // Determine arrow color based on subclass and level
  const arrowColor = useMemo(() => {
    if (currentSubclass === WeaponSubclass.VENOM) return "#90ff90"; // Green for Venom
    if (currentSubclass === WeaponSubclass.ELEMENTAL && level >= 3) return "#80d9ff"; // Icy blue for Elemental level 3+
    return "#d6cfc7"; // Default bone color
  }, [currentSubclass, level]);
  
  // Shared materials with subclass-specific colors - properly memoized with cleanup
  const boneMaterial = useMemo(() => {
    return new MeshStandardMaterial({
      color: arrowColor,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: opacity
    });
  }, [arrowColor, opacity]);

  // Cleanup material on unmount
  useEffect(() => {
    return () => {
      boneMaterial.dispose();
    };
  }, [boneMaterial]);

  return (
    <group
      position={position.toArray()}
      rotation={[
        0,
        Math.atan2(direction.x, direction.z),
        0
      ]}
    >
      {/* Main bone shaft */}
      <mesh 
        rotation={[Math.PI/2, 0, 0]}
        geometry={BONE_ARROW_GEOMETRIES.shaft}
        material={boneMaterial}
      />

      {/* Bone joints/decorations */}
      {[-0.3, 0, 0.3].map((offset, i) => (
        <group key={i} position={[0, 0, offset]}>
          <mesh
            geometry={BONE_ARROW_GEOMETRIES.joint}
            material={boneMaterial}
          />
        </group>
      ))}

      {/* Arrow head (bone spike) */}
      <group position={[0, 0, -0.7]}>
        <mesh 
          rotation={[Math.PI/2, 0, 0]}
          geometry={BONE_ARROW_GEOMETRIES.arrowHead}
          material={boneMaterial}
        />
      </group>

      {/* Small decorative spikes */}
      {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => (
        <group 
          key={i} 
          position={[
            Math.sin(angle) * 0.08,
            Math.cos(angle) * 0.08,
            0
          ]}
          rotation={[0, 0, angle]}
        >
          <mesh 
            rotation={[Math.PI/2, 0, 0]}
            geometry={BONE_ARROW_GEOMETRIES.spike}
            material={boneMaterial}
          />
        </group>
      ))}

      {/* Subtle glow effect */}
      <pointLight 
        color={
          currentSubclass === WeaponSubclass.VENOM ? "#80ff80" : 
          currentSubclass === WeaponSubclass.ELEMENTAL && level >= 3 ? "#60c9ff" : 
          "#a8e6cf"
        }
        intensity={0.5 * opacity}
        distance={2}
        decay={2}
      />
    </group>
  );
} 