// src/versus/Reaper/ReaperModel.tsx
import React, { useRef } from 'react';
import { Group } from 'three';
import BonePlate from '../../gear/BonePlate';  
import ReaperBoneWings from './ReaperBoneWings';  
import ReaperBoneVortex from './ReaperBoneVortex';  
import DragonSkull from '../../gear/DragonSkull';  
import ReaperTrailEffect from './ReaperTrailEffect';
import ReaperDexScythe from './ReaperDexScythe';
import ReaperLysScythe from './ReaperLysScythe';
import * as THREE from 'three';
import ReaperBoneAura from './ReaperBoneAura';

interface ReaperModelProps {
  isAttacking: boolean;
  onHit?: (damage: number) => void;
  playerPosition: THREE.Vector3;
  isWalking: boolean;
}


export default function ReaperModel({ isAttacking }: ReaperModelProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {/* Reaper Skull - smaller than boss */}
      <group scale={[0.45, 0.45, 0.45]} position={[0, 1.35, 0.25]} rotation={[0.5, 0, 0]}>
        <DragonSkull />
      </group>

      {/* Scaled Bone Plate - smaller */}
      <group scale={[1.0, 0.9, 0.8]} position={[0, 1.1, 0]} rotation={[0.3, 0, 0]}>
        <BonePlate />
      </group>



      {/* Scaled Wings SECOND PAIR - smaller */}
      <group scale={[1.15, 1.0, 1.0]} position={[0, 1.35, 0]}>
        {/* Left Wing */}
        <group rotation={[0, Math.PI / 5, 0]}>
          <ReaperBoneWings 
            collectedBones={12} 
            isLeftWing={true}
            parentRef={groupRef} 
          />
        </group>
        
        {/* Right Wing */}
        <group rotation={[0, -Math.PI / 5, 0]}>
          <ReaperBoneWings 
            collectedBones={12} 
            isLeftWing={false}
            parentRef={groupRef} 
          />
        </group>
      </group>





      {/* Add Glowing Core Effect - smaller */}
      <group position={[0, 1, 0]} scale={[0.65, 0.65, 0.65]}>
        <ReaperTrailEffect parentRef={groupRef} />
      </group>

      <group position={[0, 1.5, 0.25]} scale={[0.35, 0.35, 0.35]}>
        <ReaperTrailEffect parentRef={groupRef} />
      </group>

      {/* Bone Vortex Effects - smaller */}
      <group scale={[1.35, 1.8, 1.35]} position={[0, -0.25, 0]}>
        {/* Front and Back Vortexes only */}
        <group position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
          <ReaperBoneVortex parentRef={groupRef} />
        </group>
        <group position={[0, 0, -0.1]} rotation={[0, Math.PI, 0]}>
          <ReaperBoneVortex parentRef={groupRef} />
        </group>
      </group>

      {/* Left Scythe - smaller */}
      <group 
        position={[0.6, 1.45, +0.75]} 
        rotation={[Math.PI/3 + 0.2, 1 + Math.PI + 1.15, 1.45]} 
        scale={[0.85, 0.85, 0.85]}
      >
        <ReaperLysScythe 
          isSwinging={isAttacking} 
          onSwingComplete={() => {}} 
          parentRef={groupRef}
        />
      </group>

      {/* Right Scythe - smaller */}
      <group 
        position={[-0.6, 1.1, -0.75]} 
        rotation={[Math.PI/3 + 0.2, -(1 + Math.PI + 1.15), -1.45]} 
        scale={[0.85, 0.85, 0.85]}
      >
        <ReaperDexScythe 
          isSwinging={isAttacking} 
          onSwingComplete={() => {}} 
          parentRef={groupRef}
        />
      </group>

      {/* Bone Aura - smaller */}
      <group position={[0, 0.12, 0]} scale={[0.6, 0.6, 0.6]}>
        <ReaperBoneAura parentRef={groupRef} />
      </group>


      <group position={[0, 0, 0]}>
      </group>
    </group>
  );
}

