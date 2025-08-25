import { Vector3 } from 'three';
import * as THREE from 'three';
import { WeaponSubclass } from '@/Weapons/weapons';

interface BoneArrowProps {
  position: Vector3;
  direction: Vector3;
  opacity?: number;
  currentSubclass?: WeaponSubclass;
  level?: number;
}

export default function BoneArrow({ position, direction, opacity = 1, currentSubclass, level = 1 }: BoneArrowProps) {
  // Determine arrow color based on subclass and level
  const getArrowColor = () => {
    if (currentSubclass === WeaponSubclass.VENOM) return "#90ff90"; // Green for Venom
    if (currentSubclass === WeaponSubclass.ELEMENTAL && level >= 3) return "#80d9ff"; // Icy blue for Elemental level 3+
    return "#d6cfc7"; // Default bone color
  };
  
  // Shared materials with subclass-specific colors
  const boneMaterial = new THREE.MeshStandardMaterial({
    color: getArrowColor(),
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: opacity
  });

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
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.2, 6]} />
        <meshStandardMaterial {...boneMaterial} />
      </mesh>

      {/* Bone joints/decorations */}
      {[-0.3, 0, 0.3].map((offset, i) => (
        <group key={i} position={[0, 0, offset]}>
          <mesh>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial {...boneMaterial} />
          </mesh>
        </group>
      ))}

      {/* Arrow head (bone spike) */}
      <group position={[0, 0, -0.7]}>
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <coneGeometry args={[0.1, 0.3, 6]} />
          <meshStandardMaterial {...boneMaterial} />
        </mesh>
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
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <coneGeometry args={[0.02, 0.1, 4]} />
            <meshStandardMaterial {...boneMaterial} />
          </mesh>
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