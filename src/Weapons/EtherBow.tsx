// src/weapons/EtherBow.tsx

import { useRef, useMemo, useEffect } from 'react';
import { Group, Vector3, CatmullRomCurve3, CubicBezierCurve3, TubeGeometry, BoxGeometry, CylinderGeometry, ConeGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { WeaponSubclass } from '@/Weapons/weapons';

// Shared bow curve - created once at module level (never changes)
const BOW_CURVE = new CatmullRomCurve3([
  new Vector3(-0.875, 0, 0),
  new Vector3(-0.85, 0.2, 0),
  new Vector3(-0.25, 0.5, 0),
  new Vector3(-0.4, 0.35, 0),
  new Vector3(0.4, 0.35, 0),
  new Vector3(0.25, 0.5, 0),
  new Vector3(0.85, 0.2, 0),
  new Vector3(0.875, 0, 0)
]);

// Shared bow body geometry - created once at module level
const BOW_BODY_GEOMETRY = new TubeGeometry(BOW_CURVE, 64, 0.035, 8, false);

// Shared static geometries
const ETHER_BOW_GEOMETRIES = {
  wing: new BoxGeometry(0.6, 0.02, 0.05),
  arrowShaft: new CylinderGeometry(0.015, 0.02, 0.9, 8),
  arrowHead: new ConeGeometry(0.03, 0.175, 8),
};

interface EtherealBowProps {
  position: Vector3;
  direction: Vector3;
  chargeProgress: number;
  isCharging: boolean;
  onRelease: (finalProgress: number) => void;
  currentSubclass?: WeaponSubclass;
  hasInstantPowershot?: boolean;
  isAbilityBowAnimation?: boolean;
}

export default function EtherealBow({ chargeProgress, isCharging, onRelease, currentSubclass, hasInstantPowershot = false, isAbilityBowAnimation = false }: EtherealBowProps) {
  const bowRef = useRef<Group>(null);
  const maxDrawDistance = 1.35;
  const prevIsCharging = useRef(isCharging);
  const chargeStartTime = useRef<number | null>(null);
  const basePosition = [-0.9, 0, 0.75] as const;
  const prevStringGeometryRef = useRef<TubeGeometry | null>(null);
  
  // Memoize string geometry - recreated only when chargeProgress changes significantly
  // We quantize chargeProgress to reduce geometry recreations
  const quantizedProgress = Math.round(chargeProgress * 20) / 20; // 20 steps
  
  const stringGeometry = useMemo(() => {
    const pullback = quantizedProgress * maxDrawDistance;
    const curve = new CubicBezierCurve3(
      new Vector3(-0.8, 0, 0),
      new Vector3(0, 0, -pullback),
      new Vector3(0, 0, -pullback),
      new Vector3(0.8, 0, 0)
    );
    return new TubeGeometry(curve, 16, 0.02, 8, false);
  }, [quantizedProgress, maxDrawDistance]);
  
  // Dispose previous string geometry when it changes
  useEffect(() => {
    if (prevStringGeometryRef.current && prevStringGeometryRef.current !== stringGeometry) {
      prevStringGeometryRef.current.dispose();
    }
    prevStringGeometryRef.current = stringGeometry;
    
    return () => {
      if (stringGeometry) {
        stringGeometry.dispose();
      }
    };
  }, [stringGeometry]);
  
  // Memoize materials based on visual state
  const isVenomPowershot = currentSubclass === WeaponSubclass.VENOM && hasInstantPowershot;
  const isElementalCharging = currentSubclass === WeaponSubclass.ELEMENTAL && isCharging;
  
  const materials = useMemo(() => {
    const bowColor = isVenomPowershot ? "#00ff40" :
      isElementalCharging ? `rgb(${Math.floor(193 + chargeProgress * 62)}, ${Math.floor(140 - chargeProgress * 140)}, ${Math.floor(75 - chargeProgress * 75)})` :
      "#C18C4B";
    const bowEmissive = isVenomPowershot ? "#00aa20" :
      isElementalCharging ? `rgb(${Math.floor(193 + chargeProgress * 62)}, ${Math.floor(140 - chargeProgress * 140)}, ${Math.floor(75 - chargeProgress * 75)})` :
      "#C18C4B";
    const emissiveIntensity = isVenomPowershot ? 2.5 :
      isElementalCharging ? 1.5 + chargeProgress * 1.5 : 1.5;
      
    return {
      bow: new MeshStandardMaterial({
        color: bowColor,
        emissive: bowEmissive,
        emissiveIntensity: emissiveIntensity,
        transparent: true,
        opacity: 0.8,
      }),
      string: new MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#ffffff",
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.6,
      }),
      arrow: new MeshStandardMaterial({
        color: "#00ffff",
        emissive: "#00ffff",
        emissiveIntensity: 3,
        transparent: true,
        opacity: 0.9,
      }),
    };
  }, [isVenomPowershot, isElementalCharging, chargeProgress]);
  
  // Cleanup materials on unmount or when they change
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);
  
  // Charge Release Logic - only trigger for actual bow charging, not ability animations
  useFrame(() => {
    // Only track charging state for actual bow charging, not ability animations
    const actualIsCharging = isCharging && !isAbilityBowAnimation;
    
    if (!prevIsCharging.current && actualIsCharging) {
      chargeStartTime.current = Date.now();
    }
    
    // Only trigger onRelease for actual bow charging, not ability animations
    if (prevIsCharging.current && !actualIsCharging) {
      const chargeTime = chargeStartTime.current ? (Date.now() - chargeStartTime.current) / 1000 : 0;
      const finalChargeProgress = Math.min(chargeTime / 2, 1);
      onRelease(finalChargeProgress);
      chargeStartTime.current = null;
    }
    
    prevIsCharging.current = actualIsCharging;
  });

  return (
    <group 
      position={[0.6, 0.6, 0.6]}
      rotation={[-Math.PI/2, -Math.PI/2,  -Math.PI/2]}
      scale={[0.875, 0.8, 0.8]}
    >
      <group 
        ref={bowRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[Math.PI, Math.PI/2, 0]}
      >
        {/* Bow body with dynamic color for instant powershot and charging */}
        <mesh 
          rotation={[Math.PI/2, 0, 0]}
          geometry={BOW_BODY_GEOMETRY}
          material={materials.bow}
        />

        {/* Bow string */}
        <mesh
          geometry={stringGeometry}
          material={materials.string}
        />

        {/* Decorative wing elements */}
        <group>
          {/* Left wing */}
          <mesh 
            position={[-0.4, 0, 0.475]} 
            rotation={[Math.PI/2, 0, Math.PI/6]}
            geometry={ETHER_BOW_GEOMETRIES.wing}
            material={materials.bow}
          />

          {/* Right wing */}
          <mesh 
            position={[0.4, 0, 0.475]} 
            rotation={[Math.PI/2, 0, -Math.PI/6]}
            geometry={ETHER_BOW_GEOMETRIES.wing}
            material={materials.bow}
          />
        </group>

        {/* Arrow */}
        {isCharging && (
          <group 
            position={[0, 0, 0.8 - chargeProgress * maxDrawDistance]}
            rotation={[Math.PI/2, 0, 0]}
          >
            {/* Arrow shaft */}
            <mesh
              geometry={ETHER_BOW_GEOMETRIES.arrowShaft}
              material={materials.arrow}
            />
            {/* Arrow head */}
            <mesh 
              position={[0, 0.35, 0]}
              geometry={ETHER_BOW_GEOMETRIES.arrowHead}
              material={materials.arrow}
            />
          </group>
        )}

      </group>
    </group>
  );
} 