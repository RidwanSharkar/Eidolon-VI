import { Vector3 } from 'three';
import * as THREE from 'three';

interface BoneArrowProps {
  position: Vector3;
  direction: Vector3;
}

export default function BoneArrow({ position, direction }: BoneArrowProps) {
  // Shared materials
  const boneMaterial = new THREE.MeshStandardMaterial({
    color: "#d6cfc7",
    roughness: 0.9,
    metalness: 0.1
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
        color="#a8e6cf"
        intensity={0.5}
        distance={2}
        decay={2}
      />
    </group>
  );
} 