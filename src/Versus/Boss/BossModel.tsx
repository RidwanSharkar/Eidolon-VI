import React, { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import BoneTail from '../../Unit/Gear/BoneTail';
import BonePlate from '../../Unit/Gear/BonePlate';  
import BoneWings from '../../Unit/Gear/BoneWings';  
import BossBoneVortex from './BossBoneVortex';  
import DragonSkull from './BossSkull';  
import BossTrailEffect from './BossTrailEffect';
import DexScythe from '@/Versus/Boss/DexScythe';
import LysScythe from '@/Versus/Boss/LysScythe';
import * as THREE from 'three';

interface BossModelProps {
  isAttacking: boolean;
  isWalking: boolean;
  onHit?: (damage: number) => void;
  playerPosition: THREE.Vector3;
}

export default function BossModel({ isAttacking, isWalking, onHit, playerPosition }: BossModelProps) {
  const groupRef = useRef<Group>(null);

  // Add click handler for testing/debugging hits
  const handleHit = (damage: number) => {
    if (onHit) {
      onHit(damage);
    }
  };

  useFrame(() => {
    if (!groupRef.current) return;

    if (isWalking) {
      // Keep floating animation
      groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }

    // Calculate direction to player while keeping boss upright
    const directionToPlayer = new THREE.Vector3()
      .subVectors(playerPosition, groupRef.current.position)
      .setY(0)  // Ignore Y difference to prevent tilting
      .normalize();

    // Create rotation matrix for smooth facing
    const lookMatrix = new THREE.Matrix4();
    lookMatrix.lookAt(
      new THREE.Vector3(0, 0, 0),
      directionToPlayer,
      new THREE.Vector3(0, 1, 0)
    );
    
    // Extract rotation while keeping Y-axis locked
    const targetRotation = new THREE.Euler(0, 0, 0);
    targetRotation.setFromRotationMatrix(lookMatrix);
    
    // Apply only Y rotation to face player
    groupRef.current.rotation.y = targetRotation.y;
  });

  return (
    <group 
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        handleHit(10); // remove this
      }}
    >
      {/* Boss Skull - positioned above the body */}
      <group scale={[0.6, 0.6, 0.6]} position={[0, 2.2, 0.25]} rotation={[0.5, 0, 0]}>
        <DragonSkull />
      </group>

      {/* Scaled Bone Plate */}
      <group scale={[1.8 , 1.35, 1.6]} position={[0, 1.7, 0]}>
        <BonePlate />
      </group>

      {/* Scaled Wings */}
      <group scale={[1.9, 1.6, 1.4]} position={[0, 2, 0]}>
        {/* Left Wing */}
        <group rotation={[0, Math.PI / 7, 0]}>
          <BoneWings 
            collectedBones={15} 
            isLeftWing={true}
            parentRef={groupRef} 
          />
        </group>
        
        {/* Right Wing */}
        <group rotation={[0, -Math.PI / 7, 0]}>
          <BoneWings 
            collectedBones={15} 
            isLeftWing={false}
            parentRef={groupRef} 
          />
        </group>
      </group>

      {/* Add Decorative Boneclaws */}
      <group scale={[0.7, 0.7, 0.7]} position={[0, 1.9, 0]}>
        {/* Left Claw */}
        <group position={[-0.85, 0.25, 0.1]} rotation={[0, Math.PI /-2, 0]}>
          <BossClawModel />
        </group>
        {/* Right Claw */}
        <group position={[0.85, 0.25, 0.1]} rotation={[0, -Math.PI / 6, 0]}>
          <BossClawModel />
        </group>
      </group>

      {/* Scaled Tail */}
      <group scale={[2, 2, 2]} position={[0, 1.75, -0.15]}>
        <BoneTail />
      </group>

      {/* Add Glowing Core Effect */}
      <group position={[0, 2.2, 0]}>
        <BossTrailEffect parentRef={groupRef} />
      </group>

      {/* Add Bone Vortex Effects */}
      <group scale={[2.1, 2.25, 2.1]}>
        {/* Front Vortex */}
        <group position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
          <BossBoneVortex parentRef={groupRef} />
        </group>
        
        {/* Back Vortex */}
        <group position={[0, 0, -0.1]} rotation={[0, Math.PI, 0]}>
          <BossBoneVortex parentRef={groupRef} />
        </group>
        
        {/* Left Vortex */}
        <group position={[0.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <BossBoneVortex parentRef={groupRef} />
        </group>
        
        {/* Right Vortex */}
        <group position={[-0.1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <BossBoneVortex parentRef={groupRef} />
        </group>
      </group>


      {/* Left Scythe-------------------------------- */}
      <group 
        position={[0.5, 2.6, +0.2]} 
        rotation={[Math.PI/3 + 0.2, 1 + Math.PI + 1.15, 1.45]} 
        scale={[0.60, 0.60, 0.60]}
      >
        <LysScythe 
          isSwinging={isAttacking} 
          onSwingComplete={() => {}} 
          parentRef={groupRef}
        />
      </group>

      {/* Right Scythe-------------------------------- */}
      <group 
        position={[-0.5, 2.31, -1]} 
        rotation={[Math.PI/3 + 0.2, -(1 + Math.PI + 1.15), -1.45]} 
        scale={[0.60, 0.60, 0.60]}
      >
        <DexScythe 
          isSwinging={isAttacking} 
          onSwingComplete={() => {}} 
          parentRef={groupRef}
        />
      </group>
    </group>
  );
}

function BossClawModel() {
  const createBoneSegment = (length: number, width: number) => (
    <mesh>
      <cylinderGeometry args={[width, width * 0.8, length, 8]} />
      <meshStandardMaterial 
        color="#e8e8e8"
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );

  const createJoint = (size: number) => (
    <mesh>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial 
        color="#e8e8e8" 
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );

  const createParallelBones = (length: number, spacing: number) => (
    <group>
      <group position={[spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.06)}
      </group>
      <group position={[-spacing/2, 0, 0]}>
        {createBoneSegment(length, 0.06)}
      </group>
      <group position={[0, length/2, 0]}>
        {createJoint(0.08)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.08)}
      </group>
    </group>
  );

  return (
    <group>
      <group>
        {createParallelBones(1.0, 0.15)}
        
        <group position={[0.25, -0.85, 0.21]}> 
          <mesh>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial 
              color="#e8e8e8"
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
          
          <group rotation={[-0.7, -0, Math.PI / 5]}>
            {createParallelBones(0.8, 0.12)}
            
            <group position={[0, -0.5, 0]} rotation={[0, 0, Math.PI / 5.5]}>
              {createJoint(0.09)}
              
              <group position={[0, -0.1, 0]}>
                <mesh>
                  <boxGeometry args={[0.2, 0.15, 0.08]} />
                  <meshStandardMaterial color="#e8e8e8" roughness={0.4} />
                </mesh>
                {[-0.08, -0.04, 0, 0.04, 0.08].map((offset, i) => (
                  <group 
                    key={i} 
                    position={[offset, -0.1, 0]}
                    rotation={[0, 0, (i - 2) * Math.PI / 10]}
                  >
                    {createBoneSegment(0.5, 0.02)}
                    <group position={[0.025, -0.3, 0]} rotation={[0, 0, Math.PI + Math.PI / 16]}>
                      <mesh>
                        <coneGeometry args={[0.03, 0.3, 6]} />
                        <meshStandardMaterial 
                          color="#d4d4d4"
                          roughness={0.3}
                          metalness={0.4}
                        />
                      </mesh>
                    </group>
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
} 