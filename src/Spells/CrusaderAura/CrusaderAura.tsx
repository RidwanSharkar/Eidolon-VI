import { useRef, useImperativeHandle, forwardRef, useMemo, useEffect } from 'react';
import { Group, Vector3, RingGeometry, CylinderGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useCrusaderAura } from '@/Spells/CrusaderAura/useCrusaderAura';
import CrusaderHealingEffect from '@/Spells/CrusaderAura/CrusaderHealingEffect';

// MEMORY FIX: Shared geometries created once at module level
const CRUSADER_AURA_GEOMETRIES = {
  innerRing: new RingGeometry(0.85, 1.0, 3),
  outerCylinder: new CylinderGeometry(0.925, 0.5, -0.175, 32)
};

interface CrusaderAuraProps {
  parentRef: React.RefObject<Group>;
  onHealthChange: (health: number) => void;
  currentHealth: number;
  maxHealth: number;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
}

const CrusaderAura = forwardRef<{ processHealingChance: () => void }, CrusaderAuraProps>(({ 
  parentRef,
  onHealthChange,
  setDamageNumbers,
  nextDamageNumberId,
  currentHealth,
  maxHealth
}, ref) => {
  const auraRef = useRef<Group>(null);
  const innerRotatingGroupRef = useRef<Group>(null);
  const rotationSpeed = 0.15;
  const rotationAngle = useRef(0); // MEMORY FIX: Store rotation in ref instead of using Date.now()

  const { processHealingChance, showHealingEffect, setShowHealingEffect } = useCrusaderAura({
    onHealthChange,
    parentRef,
    setDamageNumbers,
    nextDamageNumberId,
    currentHealth,
    maxHealth
  });

  // MEMORY FIX: Create materials once using useMemo
  const materials = useMemo(() => ({
    innerRing: new MeshStandardMaterial({
      color: "#ffaa00",
      emissive: "#ff8800",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    }),
    outerCylinder: new MeshStandardMaterial({
      color: "#ff8800",
      emissive: "#ff6600",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    })
  }), []);

  // MEMORY FIX: Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(m => m.dispose());
    };
  }, [materials]);

  // Expose processHealingChance through the forwarded ref
  useImperativeHandle(ref, () => ({
    processHealingChance
  }));

  useFrame((_, delta) => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.015, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.008;
    }

    // MEMORY FIX: Update rotation angle in ref instead of using Date.now()
    if (innerRotatingGroupRef.current) {
      rotationAngle.current += delta * 0.0008;
      innerRotatingGroupRef.current.rotation.z = rotationAngle.current;
    }
  });

  return (
    <>
      {showHealingEffect && parentRef.current && (
        <CrusaderHealingEffect
          position={parentRef.current.position}
          onComplete={() => setShowHealingEffect(false)}
        />
      )}
      <group ref={auraRef}>
        {/* MEMORY FIX: Rotating inner elements - use ref to update rotation instead of Date.now() */}
        <group ref={innerRotatingGroupRef} rotation={[0, 0, 0]} position={[0, 0.005, 0]}>
          {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rotation, i) => (
            <mesh 
              key={i} 
              rotation={[-Math.PI / 2, 0, rotation]}
              geometry={CRUSADER_AURA_GEOMETRIES.innerRing}
              material={materials.innerRing}
            />
          ))}
        </group>

        {/* MEMORY FIX: Circle - use shared geometry and material */}
        <mesh 
          position={[0, 0.1, 0]}
          geometry={CRUSADER_AURA_GEOMETRIES.outerCylinder}
          material={materials.outerCylinder}
        />
      </group>
    </>
  );
});

CrusaderAura.displayName = 'CrusaderAura';

export default CrusaderAura;