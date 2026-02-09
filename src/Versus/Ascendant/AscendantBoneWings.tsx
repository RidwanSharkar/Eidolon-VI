import { useRef, useMemo, useEffect } from 'react';
import { Group, Vector3, Euler, Shape, ExtrudeGeometry, MeshStandardMaterial, DoubleSide } from 'three';

interface WingSegment {
  pos: Vector3;
  rot: Euler;
  scale: Vector3;
  featherLength: number;
  hasRedMarking: boolean;
}

interface BoneWingsProps {
  collectedBones: number;
  isLeftWing: boolean;
  parentRef: React.RefObject<Group>;
}

// Shared shapes and settings
const FEATHER_SHAPE = (() => {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.06, 0.8);
  shape.lineTo(0.03, 1.0);
  shape.lineTo(0, 0.95);
  shape.lineTo(-0.03, 1.0);
  shape.lineTo(-0.06, 0.8);
  shape.lineTo(0, 0);
  return shape;
})();

const RED_MARKING_SHAPE = (() => {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.05, 0.6);
  shape.lineTo(0.025, 0.8);
  shape.lineTo(0, 0.75);
  shape.lineTo(-0.025, 0.8);
  shape.lineTo(-0.05, 0.6);
  shape.lineTo(0, 0);
  return shape;
})();

const EXTRUDE_SETTINGS = {
  steps: 1,
  depth: 0.02,
  bevelEnabled: true,
  bevelThickness: 0.005,
  bevelSize: 0.008,
  bevelSegments: 2,
  curveSegments: 8
} as const;

// MEMORY FIX: Shared geometries and materials for all wing instances
const SHARED_GEOMETRIES = {
  feather: new ExtrudeGeometry(FEATHER_SHAPE, EXTRUDE_SETTINGS),
  redMarking: new ExtrudeGeometry(RED_MARKING_SHAPE, EXTRUDE_SETTINGS)
};

const SHARED_MATERIALS = {
  feather: new MeshStandardMaterial({
    color: "#F5F5DC",
    emissive: "#2A2A1A",
    emissiveIntensity: 0.3,
    metalness: 0.1,
    roughness: 0.6,
    side: DoubleSide
  }),
  redMarking: new MeshStandardMaterial({
    color: "#FF0000",
    emissive: "#FF0000",
    emissiveIntensity: 1.5,
    metalness: 0.7,
    roughness: 0.2,
    opacity: 0.9,
    transparent: true,
    side: DoubleSide
  }),
  wingBone: new MeshStandardMaterial({
    color: "#E8E8E8",
    emissive: "#404040",
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.4
  })
};

// Mark as shared to prevent disposal
Object.values(SHARED_GEOMETRIES).forEach(geo => {
  geo.userData = { shared: true };
});
Object.values(SHARED_MATERIALS).forEach(mat => {
  mat.userData = { shared: true };
});


// Static vectors and eulers to prevent recreation
const WING_POSITION = new Vector3(0, -0.2, 0);
const WING_ROTATION = new Euler(0, 0, 0);

export default function AscendantBoneWings({ collectedBones, isLeftWing }: BoneWingsProps) {
  const wingsRef = useRef<Group>(null);

  // Wing segment definitions - memoized to prevent recreation every frame
  const wingSegments = useMemo(() => [
    // Primary feathers (outermost, longest) - increased spacing
    { 
      pos: new Vector3(isLeftWing ? -1.0 : 1.0, 0.3, -0.15), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 4 : Math.PI / 4), 
      scale: new Vector3(-1.1, 1.4, -1), 
      featherLength: 1.6,
      hasRedMarking: true
    },

    { 
      pos: new Vector3(isLeftWing ? -1.4 : 1.4, 0.8, -0.05), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 3 : Math.PI / 3), 
      scale: new Vector3(-1.0, 1.3, -1), 
      featherLength: 1.5,
      hasRedMarking: true
    },
    { 
      pos: new Vector3(isLeftWing ? -1.5 : 1.5, 1.0, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 2.5 : Math.PI / 2.5), 
      scale: new Vector3(-0.9, 1.2, -1), 
      featherLength: 1.4,
      hasRedMarking: false
    },
    { 
      pos: new Vector3(isLeftWing ? -1.6 : 1.6, 1.5, 0.05), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 2 : Math.PI / 2), 
      scale: new Vector3(-0.8, 1.3, -1), 
      featherLength: 1.3,
      hasRedMarking: true
    },

    // Secondary feathers (middle layer) - better spacing
    { 
      pos: new Vector3(isLeftWing ? -0.7 : 0.7, 0.2, -0.1), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 8 : Math.PI / 8), 
      scale: new Vector3(-1.0, 1.4, -1), 
      featherLength: 1.0,
      hasRedMarking: false
    },
    { 
      pos: new Vector3(isLeftWing ? -0.9 : 0.9, 0.4, -0.05), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 5 : Math.PI / 5), 
      scale: new Vector3(-0.9, 1.2, -1), 
      featherLength: 1.1,
      hasRedMarking: true
    },
    { 
      pos: new Vector3(isLeftWing ? -1.1 : 1.1, 0.6, 0), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 3.5 : Math.PI / 3.5), 
      scale: new Vector3(-0.8, 1.1, -1), 
      featherLength: 1.1,
      hasRedMarking: false
    },


    // Lower wing feathers - increased spacing
    { 
      pos: new Vector3(isLeftWing ? -1.8 : 1.8, 1.1, -0.05), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 12 - Math.PI / 3 : Math.PI / 12 + Math.PI / 3),       scale: new Vector3(0.9, 1.2, 1), 
      featherLength: 1.8,
      hasRedMarking: true
    },
    { 
      pos: new Vector3(isLeftWing ? -1.6 : 1.6, 0.35, -0.05), 
      rot: new Euler(0, 0, isLeftWing ? -Math.PI / 12 - Math.PI / 5 : Math.PI / 12 + Math.PI / 5), 
      scale: new Vector3(0.8, 1.0, 1), 
      featherLength: 1.5,
      hasRedMarking: false
    },
    
  ], [isLeftWing]);

  // Create individual wing feather with optional red marking
  const createWingFeather = (segment: WingSegment, index: number) => (
    <group 
      key={`feather-${index}`}
      position={segment.pos}
      rotation={segment.rot}
      scale={segment.scale}
    >
      {/* Base feather */}
      <mesh geometry={SHARED_GEOMETRIES.feather} material={SHARED_MATERIALS.feather} />
      
      {/* Red marking overlay */}
      {segment.hasRedMarking && (
        <mesh
          geometry={SHARED_GEOMETRIES.redMarking}
          material={SHARED_MATERIALS.redMarking}
          position={[0, 0, 0.01]}
        />
      )}
    </group>
  );
  

  return (
    <group 
      ref={wingsRef}
      position={WING_POSITION}
      rotation={WING_ROTATION}
    >

      
      {/* Wing feathers - show progressively based on collected bones */}
      {wingSegments.slice(0, Math.min(wingSegments.length, Math.floor(collectedBones * 1.2))).map((segment, i) => 
        createWingFeather(segment, i)
      )}
      

    </group>
  );
}