import { useRef, useImperativeHandle, forwardRef, useMemo, useEffect } from 'react';
import { CylinderGeometry, Group, RingGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useFrenzyAuraEmpoweredAttack } from './useFrenzyAuraEmpoweredAttack';

// MEMORY FIX: Static shared geometries - use scale instead of dynamic args
const FRENZY_GEOMETRIES = {
  outerRing: new RingGeometry(0.85, 1.0, 3),
  innerRing: new RingGeometry(0.5, 0.6, 6),
  glowCylinder: new CylinderGeometry(0.5, 0.8, 0.1, 32), // Base size, use scale for level
};

interface FrenzyAuraProps {
  parentRef: React.RefObject<Group>;
  skeletonCount: number;
  level?: number;
}

export interface FrenzyAuraRef {
  isEmpowered: boolean;
  consumeEmpoweredAttack: () => boolean;
  getEmpoweredDamage: (level: number) => number;
  cooldownRemaining: number;
  isOnCooldown: boolean;
}

const FrenzyAura = forwardRef<FrenzyAuraRef, FrenzyAuraProps>(({
  parentRef,
  skeletonCount,
  level = 1
}, ref) => {
  const auraRef = useRef<Group>(null);
  const outerRotatingGroupRef = useRef<Group>(null);
  const innerRotatingGroupRef = useRef<Group>(null);
  const rotationSpeed = 0.15;
  // MEMORY FIX: Store rotation in refs instead of using Date.now()
  const outerRotationAngle = useRef(0);
  const innerRotationAngle = useRef(0);

  // Use the empowered attack hook
  const {
    isEmpowered,
    cooldownRemaining,
    isOnCooldown,
    consumeEmpoweredAttack,
    getEmpoweredDamage
  } = useFrenzyAuraEmpoweredAttack();

  // Expose functions through the forwarded ref
  useImperativeHandle(ref, () => ({
    isEmpowered,
    consumeEmpoweredAttack,
    getEmpoweredDamage,
    cooldownRemaining,
    isOnCooldown
  }));

  // MEMORY FIX: Create materials once, update properties in useFrame
  const materials = useMemo(() => ({
    outerRing: new MeshStandardMaterial({
      color: "#0BDA51",
      emissive: "#0BDA51",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    }),
    innerRing: new MeshStandardMaterial({
      color: "#0BDA51",
      emissive: "#0BDA51",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    }),
    glowCylinder: new MeshStandardMaterial({
      color: "#0BDA51",
      emissive: "#0BDA51",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    })
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(m => m.dispose());
    };
  }, [materials]);

  // MEMORY FIX: Update material properties in useFrame instead of recreating materials
  useFrame((_, delta) => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.015, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.008;
    }

    // MEMORY FIX: Update rotation angles in refs instead of using Date.now()
    if (outerRotatingGroupRef.current) {
      outerRotationAngle.current += delta * 0.0008;
      outerRotatingGroupRef.current.rotation.z = outerRotationAngle.current;
    }

    if (innerRotatingGroupRef.current) {
      innerRotationAngle.current += delta * 0.001;
      innerRotatingGroupRef.current.rotation.z = innerRotationAngle.current;
    }

    // Calculate intensity based on empowered state and level
    const baseIntensity = 1.5;
    const levelBonus = (level - 1) * 0.2;
    const empoweredBonus = isEmpowered ? 1.0 : 0;
    const finalIntensity = baseIntensity + levelBonus + empoweredBonus;
    
    const baseOpacity = 0.6;
    const levelOpacityBonus = (level - 1) * 0.05;
    const normalOpacity = Math.min(0.9, baseOpacity + levelOpacityBonus);
    
    // MEMORY FIX: Pulsing effects - use accumulated time in refs instead of Date.now()
    const pulseIntensity = isEmpowered ? Math.sin(outerRotationAngle.current * 10) * 0.5 + 1 : 1;
    const pulseFade = isEmpowered ? Math.abs(Math.sin(outerRotationAngle.current * 5)) : 1;
    const finalOpacity = normalOpacity * pulseFade;

    // Update material properties directly
    materials.outerRing.emissiveIntensity = finalIntensity * pulseIntensity;
    materials.outerRing.opacity = finalOpacity;
    
    materials.innerRing.opacity = 0.2 * pulseFade;
    
    materials.glowCylinder.emissiveIntensity = 1.5 + (level * 0.1);
    materials.glowCylinder.opacity = (0.3 + (level * 0.02)) * pulseFade;
  });

  // MEMORY FIX: Calculate scale for level-based sizing
  const levelScale = 1 + (level - 1) * 0.1;

  return (
    <group ref={auraRef}>
      {/* MEMORY FIX: Rotating inner elements - use ref to update rotation instead of Date.now() */}
      <group ref={outerRotatingGroupRef} rotation={[0, 0, 0]} position={[0, 0.005, 0]}>
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, i) => (
          <mesh 
            key={i} 
            rotation={[-Math.PI / 2, 0, rotation]}
            geometry={FRENZY_GEOMETRIES.outerRing}
            material={materials.outerRing}
          />
        ))}
      </group>

      {/* MEMORY FIX: Additional inner ring - use ref to update rotation instead of Date.now() */}
      {skeletonCount > 0 && (
        <group ref={innerRotatingGroupRef} rotation={[0, 0, 0]} position={[0, 0.02, 0]}>
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]}
            geometry={FRENZY_GEOMETRIES.innerRing}
            material={materials.innerRing}
          />
        </group>
      )}

      {/* Pulsing outer glow - MEMORY FIX: Use shared material */}
      <mesh 
        position={[0, 0.05, 0]} 
        scale={[levelScale, 1, levelScale]}
        geometry={FRENZY_GEOMETRIES.glowCylinder}
        material={materials.glowCylinder}
      />
    </group>
  );
});

FrenzyAura.displayName = 'FrenzyAura';

export default FrenzyAura;
