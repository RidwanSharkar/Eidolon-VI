import { useRef } from 'react';
import { Group, Vector3, Euler } from 'three';

interface BonePosition {
  pos: Vector3;
  rot: Euler;
  scale: number;
}

interface BoneWingsProps {
  collectedBones: number;
  isLeftWing: boolean;
  parentRef: React.RefObject<Group>;
}

export default function BoneWings({ collectedBones, isLeftWing }: BoneWingsProps) {
  const wingsRef = useRef<Group>(null);
    const wingBonePositions: BonePosition[] = [
    // Main central arm bone
    { 
      pos: new Vector3(isLeftWing ? -0.3 : 0.3, 0.3, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 6 : Math.PI / 6), 
      scale: 1.3 
    },
    { 
      pos: new Vector3(isLeftWing ? -0.5 : 0.5, 0.45, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 3.5 : Math.PI / 3.5), 
      scale: 1.4 
    },
    
    // Upper wing section
    { 
      pos: new Vector3(isLeftWing ? -0.65 : 0.65, 0.6, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 2.5 : Math.PI / 2.5), 
      scale: 1.0 
    },
    { 
      pos: new Vector3(isLeftWing ? -0.85 : 0.85, 0.72, 0.1), 
      rot: new Euler(0.1, 0, isLeftWing ? -Math.PI / 2.2 : Math.PI / 2.2), 
      scale: 1.0 
    },
    { 
      pos: new Vector3(isLeftWing ? -1.05 : 1.05, 0.8, 0.2), 
      rot: new Euler(0.2, 0, isLeftWing ? -Math.PI / 2 : Math.PI / 2), 
      scale: 0.9 
    },
    { 
      pos: new Vector3(isLeftWing ? -1.2 : 1.2, 0.9, 0.2), 
      rot: new Euler(0.2, 0, isLeftWing ? -Math.PI / 1.8 : Math.PI / 1.8), 
      scale: 0.8 
    },
    { 
      pos: new Vector3(isLeftWing ? -1.3 : 1.3, 0.75, 0.2), 
      rot: new Euler(0.05, 0, isLeftWing ? -Math.PI / -0.475 : Math.PI / -0.475), 
      scale: 1.0 
    },

    // Lower wing section
    { 
      pos: new Vector3(isLeftWing ? -1.15 : 1.15, 0.475, 0.2), 
      rot: new Euler(0.2, 0, isLeftWing ? -Math.PI / -0.45 : Math.PI / -0.45), 
      scale: 0.8 
    },
    
  ];

  const createBonePiece = () => (
    <group>
      {/* Main bone shaft */}
      <mesh>
        <cylinderGeometry args={[0.023, 0.0175, 0.32, 3]} />
        <meshStandardMaterial 
          color="#e8e8e8"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      
      {/* Upper joint */}
      <mesh position={new Vector3(0, 0.2, 0)}>
        <sphereGeometry args={[0.035, 4, 4]} />
        <meshStandardMaterial 
          color="#d8d8d8"
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Side bone piece -
      <mesh 
        position={new Vector3(isLeftWing ? -0.13 : 0.13, -0.1285, 0)} 
        rotation={new Euler(0, 0, isLeftWing ? Math.PI / 2.5 : -Math.PI / 2.5)}
      >
        <cylinderGeometry args={[0.023, 0.0175, 0.25, 4]} />
        <meshStandardMaterial 
          color="#d8d8d8"
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

       angled outward */}


    </group>
  );
  

  return (
    <group 
      ref={wingsRef}
      rotation={new Euler(0, Math.PI, 0)}
      position={new Vector3(0, -0.3, 0)}
    >
      {wingBonePositions.slice(0, Math.min(15, collectedBones)).map((bone, i) => (
        <group
          key={`bone-${i}`}
          position={bone.pos}
          rotation={bone.rot}
          scale={bone.scale}
        >
          {createBonePiece()}
        </group>
      ))}
    </group>
  );
} 