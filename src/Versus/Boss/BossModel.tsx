// src/versus/Boss/BossModel.tsx
import React, { useRef } from 'react';
import { Group } from 'three';
import BoneTail from '../../gear/BoneTail';
import BonePlate from '../../gear/BonePlate';  
import BoneWings from '../../gear/BoneWings';  
import BossBoneVortex from './BossBoneVortex';  
import DragonSkull from '../../gear/DragonSkull';  
import BossTrailEffect from './BossTrailEffect';
import DexScythe from './DexScythe';
import LysScythe from './LysScythe';
import * as THREE from 'three';
import BossBoneAura from './BossBoneAura';

interface BossModelProps {
  isAttacking: boolean;
  onHit?: (damage: number) => void;
  playerPosition: THREE.Vector3;
  isWalking: boolean;
}

// Add reusable materials at the top
const standardBoneMaterial = new THREE.MeshStandardMaterial({
  color: "#e8e8e8",
  roughness: 0.4,
  metalness: 0.3
});

const darkBoneMaterial = new THREE.MeshStandardMaterial({
  color: "#d4d4d4",
  roughness: 0.3,
  metalness: 0.4
});

// Cache geometries that are reused frequently
const jointGeometry = new THREE.SphereGeometry(0.06, 6, 6);
const boneGeometry = new THREE.CylinderGeometry(0.06, 0.048, 1, 4);

export default function BossModel({ isAttacking }: BossModelProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {/* Boss Skull - positioned above the body */}
      <group scale={[0.7, 0.65, 0.7]} position={[0, 2.05, 0.35]} rotation={[0.5, 0, 0]}>
        <DragonSkull />
      </group>

      {/* Scaled Bone Plate */}
      <group scale={[1.3 , 1.1, 1.3]} position={[0, 1.5, 0]} rotation={[0.3, 0, 0]}>
        <BonePlate />
      </group>

      {/* Scaled Wings */}
      <group scale={[1.85, 1.55, 1.625]} position={[0, 1.85, 0]}>
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

            {/* Scaled Wings SECOND PAIR */}
            <group scale={[1.7, 1.525, 1.525]} position={[0, 1.95, 0]}>
        {/* Left Wing */}
        <group rotation={[0, Math.PI / 4, 0]}>
          <BoneWings 
            collectedBones={15} 
            isLeftWing={true}
            parentRef={groupRef} 
          />
        </group>
        
        {/* Right Wing */}
        <group rotation={[0, -Math.PI / 4, 0]}>
          <BoneWings 
            collectedBones={15} 
            isLeftWing={false}
            parentRef={groupRef} 
          />
        </group>
      </group>

      {/* Add Decorative Boneclaws */}
      <group scale={[0.625, 0.625, 0.625]} position={[0, 1.6, 0]}>
        {/* Left Claw */}
        <group position={[-0.775, 0.15, 0.1]} rotation={[0, Math.PI /-2, 0]}>
          <BossClawModel />
        </group>
        {/* Right Claw */}
        <group position={[0.775, 0.15, 0.1]} rotation={[0, -Math.PI / 6, 0]}>
          <BossClawModel />
        </group>
      </group>

      {/* Scaled Tail */}
      <group scale={[1.5, 1.5, 1.5]} position={[0, 1.7, 0.16]}>
        <BoneTail />
      </group>

      {/* Add Glowing Core Effect */}
      <group position={[0,1.4, 0]} scale={[1.25, 1.25, 1.25]}>
      <BossTrailEffect parentRef={groupRef} />
      </group>

      <group position={[0, 2.15, 0.275]} scale={[0.525, 0.525, 0.525]}>
      <BossTrailEffect parentRef={groupRef} />
      </group>

      {/* 
      <group position={[0,0.15, 0]} scale={[9.25, 50.25, 9.25]}>
        <BossTrailEffect parentRef={groupRef} />
      </group>
     */}

      {/* Add Bone Vortex Effects */}
      <group scale={[2.1, 2.25, 2.1]} position={[0, -0.325, 0]}>
        {/* Front and Back Vortexes only */}
        <group position={[0, 0, 0.11]} rotation={[0, 0, 0]}>
          <BossBoneVortex parentRef={groupRef} />
        </group>
        <group position={[0, 0, -0.11]} rotation={[0, Math.PI, 0]}>
          <BossBoneVortex parentRef={groupRef} />
        </group>
      </group>


      {/* Left Scythe-------------------------------- */}
      <group 
        position={[0.5, 2.6, +0.2]} 
        rotation={[Math.PI/3 + 0.2, 1 + Math.PI + 1.15, 1.45]} 
        scale={[0.6, 0.6, 0.6]}
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
        scale={[0.6, 0.6, 0.6]}
      >
        <DexScythe 
          isSwinging={isAttacking} 
          onSwingComplete={() => {}} 
          parentRef={groupRef}
        />
      </group>

      {/* Add the bone aura at the bottom of the boss */}
      <group position={[0, 0.15, 0]} scale={[0.9, 0.9, 0.9]}>
        <BossBoneAura parentRef={groupRef} />
      </group>

      {/* Add red ground light effect */}
      <pointLight
        position={[0, 0.1, 0]}
        color="#ff0000"
        intensity={4.5}
        distance={12}
        decay={2}
      />

      <group position={[0, 0, 0]}>
      </group>
    </group>
  );
}

function BossClawModel() {
  const createBoneSegment = (length: number, width: number) => (
    <mesh geometry={boneGeometry} scale={[width/0.06, length, width/0.06]}>
      <meshStandardMaterial {...standardBoneMaterial} />
    </mesh>
  );

  const createJoint = (size: number) => (
    <mesh geometry={jointGeometry} scale={[size/0.06, size/0.06, size/0.06]}>
      <meshStandardMaterial {...standardBoneMaterial} />
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
        {createJoint(0.17)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.075)}
      </group>
    </group>
  );

  const createSpike = (scale = 1) => (
    <group scale={[scale, scale, scale]}>
      {/* Base segment - reduced segments */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.02, 0.12, 4]} /> {/* Reduced from 6 */}
        <meshStandardMaterial {...standardBoneMaterial} />
      </mesh>

      {/* Middle segment - reduced segments */}
      <mesh position={[0, 0.1, 0.02]} rotation={[0.05, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 4]} /> {/* Reduced from 6 */}
        <meshStandardMaterial {...standardBoneMaterial} />
      </mesh>

      {/* Sharp tip - reduced segments */}
      <mesh position={[0, 0.2, 0.04]} rotation={[0.1, 0, 0]}>
        <coneGeometry args={[0.03, 0.15, 4]} /> {/* Reduced from 6 */}
        <meshStandardMaterial {...darkBoneMaterial} />
      </mesh>

      {/* Reduced number of decorative ridges */}
      {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => ( // Reduced from 6 to 4
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[0.04, 0.05, 0]}>
            <boxGeometry args={[0.01, 0.12, 0.02]} />
            <meshStandardMaterial {...darkBoneMaterial} />
          </mesh>
        </group>
      ))}
    </group>
  );

  return (
    <group>
      <group>
        {createParallelBones(1.0, 0.15)}
        
        {/* Reduced number of shoulder spikes */}
        <group position={[0, 0.7, 0]} rotation={[-1, 1, 1]} scale={0.5}>
          {[-0.03, 0, 0.03].map((offset, i) => ( // Reduced from 5 to 3
            <group 
              key={i} 
              position={[offset, -0.275, -0.15]}
              rotation={[0.4, 0, (i - 1) * Math.PI / 4]}
            >
              <group position={[0, 0.4, 0]} scale={[1.35, 1.35, 1.35]}>
                {/* Main shoulder plate - reduced segments */}
                <mesh>
                  <cylinderGeometry args={[0.075, 0.5, 0.20, 4, 1]} /> {/* Reduced segments */}
                  <meshStandardMaterial {...standardBoneMaterial} />
                </mesh>
                
                {/* Reduced number of spikes */}
                <group position={[0, 0.25, 0]}>
                  {/* Center spike */}
                  <group position={[0, 0, 0]}>
                    {createSpike(2)}
                  </group>
                  
                  {/* Reduced side spikes */}
                  <group position={[0, -0.05, 0.15]} rotation={[-0.1, 0, 0]}>
                    {createSpike(0.9)}
                  </group>
                  <group position={[0, -0.05, -0.15]} rotation={[0.1, 0, 0]}>
                    {createSpike(0.9)}
                  </group>
                </group>
              </group>
            </group>
          ))}
        </group>

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