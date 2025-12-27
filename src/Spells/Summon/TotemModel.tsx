import React, { useRef, useEffect } from 'react';
import { Group, MeshStandardMaterial, CylinderGeometry, ConeGeometry, PlaneGeometry, SphereGeometry, DoubleSide, TorusGeometry } from 'three';
import BoneAuraTotem from './BoneAuraTotem';
import UnholyAura from './UnholyAura';
import { registerGlobalSharedResource } from '../../Scene/EffectPools';

const SHARED_MATERIALS = {
  bone: new MeshStandardMaterial({
    color: "#D2B48C",
    roughness: 1,
    metalness: 0
  }),
  spikes: new MeshStandardMaterial({
    color: "#BC8F8F", 
    roughness: 1,
    metalness: 0
  }),
  runes: new MeshStandardMaterial({
    color: "#00ff88",
    emissive: "#00ff88",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.9
  }),
  runesAttacking: new MeshStandardMaterial({
    color: "#00ff88",
    emissive: "#00ff88",
    emissiveIntensity: 4,
    transparent: true,
    opacity: 0.9
  }),
  crown: new MeshStandardMaterial({
    color: "#DEB887",
    roughness: 1,
    metalness: 0
  }),
  runePlane: new MeshStandardMaterial({
    color: "#00ff88",
    emissive: "#00ff88",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8,
    side: DoubleSide
  })
};

const SHARED_GEOMETRIES = {
  tower: new CylinderGeometry(0.6, 0.8, 4, 8),
  spike: new ConeGeometry(0.2, 0.8, 4),
  rune: new PlaneGeometry(0.2, 0.2),
  crown: new ConeGeometry(0.15, 1.2, 4),
  eye: new SphereGeometry(0.3, 32, 32),
  base: new CylinderGeometry(1, 1.2, 0.6, 8),
  lightning: new SphereGeometry(0.1, 16, 16),
  // MEMORY FIX: Add missing torus geometry for rune circles
  runeTorus: new TorusGeometry(0.7, 0.05, 16, 32)
};

// Lazy registration of global shared resources (client-side only)
let registeredTotemResources = false;
const registerTotemResources = () => {
  if (registeredTotemResources || typeof window === 'undefined') return;
  try {
    registerGlobalSharedResource(() => {
      Object.values(SHARED_GEOMETRIES).forEach(geo => geo.dispose());
      Object.values(SHARED_MATERIALS).forEach(mat => mat.dispose());
    }, 'TotemModel');
    registeredTotemResources = true;
  } catch (error) {
    console.warn('Failed to register Totem resources:', error);
  }
};

// ===========================================

interface TotemModelProps {
  isAttacking: boolean;
}

export default function TotemModel({ isAttacking }: TotemModelProps) {
  // Register shared resources on first use
  useEffect(() => {
    registerTotemResources();
  }, []);

  const totemRef = useRef<Group>(null);

  return (
    <group ref={totemRef} scale={0.40} position={[0, -0.80, 0]}>
      {/* Main tower structure */}
      <mesh 
        position={[0, 2, 0]} 
        geometry={SHARED_GEOMETRIES.tower} 
        material={SHARED_MATERIALS.bone} 
      />

      {/* Jagged spikes around the structure */}
      {[...Array(12)].map((_, i) => (
        <group key={i} rotation={[0, (-Math.PI * i) / 12, Math.PI * 0.25]} position={[0, 2.5, 0]}>
          <mesh 
            position={[0.7, Math.sin(i * 3) * 0.5, 0]} 
            rotation={[Math.PI/3, 0, -Math.PI * 0.25]}
            geometry={SHARED_GEOMETRIES.spike}
            material={SHARED_MATERIALS.spikes}
          />
        </group>
      ))}

      {/* Glowing rune circles - MEMORY FIX: Use shared geometry */}
      {[0.5, 1.5, 2.5, 3.5].map((height, i) => (
        <group key={i} position={[0, height, 0]}>
          <mesh 
            geometry={SHARED_GEOMETRIES.runeTorus}
            material={isAttacking ? SHARED_MATERIALS.runesAttacking : SHARED_MATERIALS.runes}
          />
          {/* Floating rune symbols */}
          {[...Array(4)].map((_, j) => (
            <mesh 
              key={j} 
              position={[
                Math.cos((Math.PI * 2 * j) / 4) * 0.7,
                0,
                Math.sin((Math.PI * 2 * j) / 4) * 0.7
              ]}
              geometry={SHARED_GEOMETRIES.rune}
              material={SHARED_MATERIALS.runePlane}
            />
          ))}
        </group>
      ))}

      {/* Top crown structure */}
      <group position={[0, 4, 0]}>
        {[...Array(8)].map((_, i) => (
          <mesh 
            key={i} 
            position={[
              Math.cos((Math.PI * 2 * i) / 8) * 0.5,
              0.3,
              Math.sin((Math.PI * 2 * i) / 8) * 0.5
            ]}
            rotation={[
              0.1,
              (Math.PI * 2 * i) / 8,
              Math.PI * 0.15
            ]}
            geometry={SHARED_GEOMETRIES.crown}
            material={SHARED_MATERIALS.crown}
          />
        ))}
        
        {/* Central eye */}
        <mesh 
          position={[0, 0.5, 0]}
          geometry={SHARED_GEOMETRIES.eye}
          material={isAttacking ? SHARED_MATERIALS.runesAttacking : SHARED_MATERIALS.runes}
        />
      </group>

      {/* Base structure */}
      <mesh 
        position={[0, 0.3, 0]}
        geometry={SHARED_GEOMETRIES.base}
        material={SHARED_MATERIALS.bone}
      />

      {/* Lightning effects when attacking */}
      {isAttacking && [...Array(4)].map((_, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos((Math.PI * 2 * i) / 4) * 1,
            2,
            Math.sin((Math.PI * 2 * i) / 4) * 1
          ]}
          geometry={SHARED_GEOMETRIES.lightning}
          material={SHARED_MATERIALS.runesAttacking}
        />
      ))}

      <BoneAuraTotem parentRef={totemRef} />
      <UnholyAura parentRef={totemRef} />

    </group>
  );
}
