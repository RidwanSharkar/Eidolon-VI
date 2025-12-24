import { useRef, useMemo, useEffect } from 'react';
import { Vector3, Group, MeshBasicMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry
} from 'three';
import { registerGlobalSharedResource } from '../../Scene/EffectPools';

// Pre-allocated color for performance
const BONECLAW_COLOR = new Color('#39ff14');

// Module-level shared geometries (singleton pattern for maximum reuse)
const SHARED_GEOMETRIES = {
  beam: new CylinderGeometry(0.1, 0.1, 15, 16),
  innerBeam: new CylinderGeometry(0.175, 0.175, 15, 16),
  middleBeam: new CylinderGeometry(0.25, 0.25, 15, 16),
  outerBeam: new CylinderGeometry(0.375, 0.375, 15, 16),
  torus: new TorusGeometry(0.5, 0.08, 32, 32),
  particle: new SphereGeometry(0.04, 8, 8)
};

// Module-level shared materials for torusSpiral and particle meshes (avoids per-render allocations)
const SHARED_TORUS_MATERIAL = new MeshStandardMaterial({
  color: BONECLAW_COLOR,
  emissive: BONECLAW_COLOR,
  emissiveIntensity: 3,
  transparent: true,
  opacity: 0.4
});

const SHARED_PARTICLE_MATERIAL = new MeshStandardMaterial({
  color: BONECLAW_COLOR,
  emissive: BONECLAW_COLOR,
  emissiveIntensity: 12,
  transparent: true,
  opacity: 0.6
});

// Register global shared resources for disposal
// Lazy registration of global shared resources (client-side only)
let registeredBoneClawResources = false;
const registerBoneClawResources = () => {
  if (registeredBoneClawResources || typeof window === 'undefined') return;
  try {
    registerGlobalSharedResource(() => {
      Object.values(SHARED_GEOMETRIES).forEach(geo => geo.dispose());
      SHARED_TORUS_MATERIAL.dispose();
      SHARED_PARTICLE_MATERIAL.dispose();
    }, 'BoneClawScratch');
    registeredBoneClawResources = true;
  } catch (error) {
    console.warn('Failed to register BoneClaw resources:', error);
  }
};

// Helper to create shader material with specific opacity
const createShaderMaterial = (opacity: number, color: Color) => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float strength = 1.0 - length(vUv - vec2(0.5));
      vec3 glowColor = mix(uColor, vec3(1.0), 0.3);
      gl_FragColor = vec4(glowColor, strength * ${opacity.toFixed(2)});
    }
  `,
  uniforms: {
    uColor: { value: color }
  }
});

interface BoneclawScratchProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
}

export default function BoneClawScratch({ position, direction, onComplete }: BoneclawScratchProps) {
  // Register shared resources on first use
  useEffect(() => {
    registerBoneClawResources();
  }, []);

  const effectRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const animationDuration = 1.2;
  const delayTimer = useRef(0);
  const startDelay = 0.125;
  const scorchedDuration = 2.5;
  const scorchedRef = useRef<Group>(null);
  const scorchedProgressRef = useRef(0);

  // Memoize positions based on position and direction props
  const { centerPosition, leftPosition, rightPosition } = useMemo(() => {
    const center = new Vector3(
      position.x + direction.x * 5,
      0,
      position.z + direction.z * 5
    );
    const perpVector = new Vector3(-direction.z, 0, direction.x).normalize();
    const spacing = 1.35;
    return {
      centerPosition: center,
      leftPosition: center.clone().add(perpVector.clone().multiplyScalar(-spacing)),
      rightPosition: center.clone().add(perpVector.clone().multiplyScalar(spacing))
    };
  }, [position, direction]);

  // Memoize shader materials with proper disposal
  const sharedShaderMaterials = useMemo(() => ({
    core: createShaderMaterial(0.95, BONECLAW_COLOR),
    inner: createShaderMaterial(0.8, BONECLAW_COLOR),
    middle: createShaderMaterial(0.6, BONECLAW_COLOR),
    outer: createShaderMaterial(0.4, BONECLAW_COLOR)
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      sharedShaderMaterials.core.dispose();
      sharedShaderMaterials.inner.dispose();
      sharedShaderMaterials.middle.dispose();
      sharedShaderMaterials.outer.dispose();
    };
  }, [sharedShaderMaterials]);

  useFrame((_, delta) => {
    if (!effectRef.current) return;

    if (delayTimer.current < startDelay) {
      delayTimer.current += delta;
      return;
    }

    progressRef.current += delta;
    scorchedProgressRef.current += delta;
    const progress = Math.min(progressRef.current / animationDuration, 1);
    const scorchedProgress = Math.min(scorchedProgressRef.current / scorchedDuration, 1);

    if (progress < 1) {
      const startY = 3.5; //HEIGHT
      const currentY = startY * (1 - progress);
      effectRef.current.position.y = currentY;

      const scale = progress < 0.9 ? 1 : 1 - (progress - 0.9) / 0.2;
      effectRef.current.scale.set(scale, scale, scale);
    } else {
      onComplete();
    }

    if (scorchedRef.current) {
      const fadeOut = scorchedProgress > 0.7 
        ? 1 - ((scorchedProgress - 0.7) / 0.3)
        : 1;
      
      scorchedRef.current.scale.set(
        Math.min(scorchedProgress * 1.2, 1),
        1,
        Math.min(scorchedProgress * 1.2, 1)
      );
      
      const materials = (scorchedRef.current.children[0] as Mesh).material as MeshBasicMaterial;
      materials.opacity = fadeOut * 0.6;
    }
  });

  const createScratchEffect = (pos: Vector3, isCenter: boolean) => (
    <group
      position={[pos.x, 0, pos.z]}
      rotation={[
        isCenter ? Math.PI / 6 : Math.PI / 6,
        Math.atan2(direction.x, direction.z),
        0
      ]}
    >
      {/* Core beam */}
      <mesh geometry={SHARED_GEOMETRIES.beam} material={sharedShaderMaterials.core} />

      {/* inner core beam */}
      <mesh geometry={SHARED_GEOMETRIES.innerBeam} material={sharedShaderMaterials.inner} />

      {/* Inner glow */}
      <mesh geometry={SHARED_GEOMETRIES.middleBeam} material={sharedShaderMaterials.middle} />

      {/* Outer glow */}
      <mesh geometry={SHARED_GEOMETRIES.outerBeam} material={sharedShaderMaterials.outer} />

      {/*Spiral effectSky */}
      {[...Array(8)].map((_, i) => (
        <mesh 
          key={i} 
          rotation={[0, (i * Math.PI) / 1.5, 0]} 
          position={[0, +7.45, 0]} 
          geometry={SHARED_GEOMETRIES.torus}
          material={SHARED_TORUS_MATERIAL}
        />
      ))}


      {/* Floating particles from Smite base */}
      {[...Array(20)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI) / 4) * 0.5 ,
            (i - 4) * 0.5,
            Math.sin((i * Math.PI) / 4) * 0.5,
          ]}
          geometry={SHARED_GEOMETRIES.particle}
          material={SHARED_PARTICLE_MATERIAL}
        />
      ))}

      {/* Impact point glow */}
      <pointLight position={[0, 0, 0]} color={BONECLAW_COLOR} intensity={20} distance={6} />

      {/* Ambient glow */}
      <pointLight position={[0, 0, 0]} color={BONECLAW_COLOR} intensity={15} distance={3} />
    </group>
  );


  return (
    <group
      ref={effectRef}
      visible={delayTimer.current >= startDelay}
    >
      {createScratchEffect(leftPosition, false)}
      {createScratchEffect(centerPosition, true)}
      {createScratchEffect(rightPosition, false)}
    </group>
  );
}