import { useRef } from 'react';
import { Group, Vector3, Shape, DoubleSide } from 'three';
import { useFrame } from '@react-three/fiber';
import { calculateBoneclawHits } from '@/Spells/Boneclaw/BoneclawDamage';
import BoneclawScratch from '@/Spells/Boneclaw/BoneClawScratch';
import * as THREE from 'three';

interface BoneclawProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  parentRef: React.RefObject<Group>;
  onHitTarget?: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isBoneclaw?: boolean) => void;
  enemyData: Array<{ id: string; position: Vector3; health: number }>;
  onSwingComplete?: (position: Vector3, direction: Vector3) => void;
}

const sharedGeometries = {
  cylinder: new THREE.CylinderGeometry(0.06, 0.02, 0.12, 6),
  sphere: new THREE.SphereGeometry(0.12, 12, 12),
  box: new THREE.BoxGeometry(0.2, 0.15, 0.08),
  cone: new THREE.ConeGeometry(0.03, 0.3, 6)
};

const sharedMaterials = {
  bone: new THREE.MeshStandardMaterial({
    color: "#d6cfc7",
    roughness: 0.9,
    metalness: 0.1
  }),
  spectral: new THREE.MeshStandardMaterial({
    color: "#39ff14",
    emissive: "#39ff14",
    emissiveIntensity: 1.3,
    metalness: 0.8,
    roughness: 0.1,
    opacity: 0.85,
    transparent: true,
    side: DoubleSide
  })
};

export default function Boneclaw({ position, direction, onComplete, parentRef, onHitTarget, enemyData, onSwingComplete }: BoneclawProps) {
  const clawRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const hasDealtDamage = useRef(false);
  const showScratchRef = useRef(false);
  const hitEnemiesRef = useRef(new Set<string>());

  const rotationMatrixRef = useRef(new THREE.Matrix4());
  const tempVector = useRef(new THREE.Vector3());
  const tempPosition = useRef(new THREE.Vector3());

  const createBoneSegment = (length: number, width: number) => (
    <mesh
      scale={[width/0.06, length/0.12, width/0.06]}
      geometry={sharedGeometries.cylinder}
      material={sharedMaterials.bone}
    />
  );

  const createJoint = (size: number) => (
    <mesh>
      <sphereGeometry args={[size*1.1, 8, 8]} />
      <meshStandardMaterial 
        color="#d6cfc7"
        roughness={0.9}
        metalness={0.1}
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
        {createJoint(0.135)}
      </group>
      <group position={[0, -length/2, 0]}>
        {createJoint(0.155)}
      </group>
    </group>
  );

  const createSpectralClawShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    // Create longer, thinner claw shape
    shape.lineTo(0.25, -0.08);    // Adjusted for longer base
    shape.bezierCurveTo(
      0.4, 0.3,     // control point 1 - extended
      1.05, 0.32,    // control point 2 - extended
      1.1, 0.23      // end point (tip) - made significantly longer
    );
    
    // Create sharp edge with extended curve
    shape.lineTo(0.84, 0.47);     // Adjusted proportionally
    shape.bezierCurveTo(
      0.35, 0.13,    // Adjusted control points for smoother curve
      0.15, 0.0,
      0.07, 0.44     // Slightly adjusted for better shape
    );
    shape.lineTo(0, 0);
    return shape;
  };

  const spectralClawSettings = {
    steps: 1,
    depth: 0.00010,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.0175,
    bevelSegments: 1,
    curveSegments: 16
  };

  const createSpectralClaw = (index: number) => (
    <group 
      position={[0.025 * (index - 2), -0.3, 0]} 
      rotation={[-Math.PI , Math.PI / 2, Math.PI - Math.PI / 4 + (index ) * Math.PI / 10]}
      scale={[0.7, 0.7, 0.7]}
    >
      <mesh>
        <extrudeGeometry args={[createSpectralClawShape(), spectralClawSettings]} />
        <meshStandardMaterial 
          color="#39ff14"
          emissive="#39ff14"
          emissiveIntensity={1.3}
          metalness={0.8}
          roughness={0.1}
          opacity={0.85}
          transparent
          side={DoubleSide}
        />
      </mesh>
    </group>
  );

  const createSpike = (scale = 1) => (
    <group scale={[scale, scale, scale]}>
      {/* Base segment */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.02, 0.12, 6]} />
        <meshStandardMaterial 
          color="#e8e8e8"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Middle segment with slight curve */}
      <mesh position={[0, 0.1, 0.02]} rotation={[0.05, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 6]} />
        <meshStandardMaterial 
          color="#e8e8e8"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Sharp tip */}
      <mesh position={[0, 0.2, 0.04]} rotation={[0.1, 0, 0]}>
        <coneGeometry args={[0.03, 0.15, 6]} />
        <meshStandardMaterial 
          color="#d4d4d4"
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Decorative ridges */}
      {[0, Math.PI/4, Math.PI*1/2, Math.PI, Math.PI*3/2, Math.PI*5/4].map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[0.04, 0.05, 0]}>
            <boxGeometry args={[0.01, 0.12, 0.02]} />
            <meshStandardMaterial 
              color="#d4d4d4"
              roughness={0.5}
              metalness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );

  useFrame((_, delta) => {
    if (!clawRef.current || !parentRef?.current) return;

    progressRef.current += delta * 5;
    const swingPhase = Math.min(progressRef.current / Math.PI, 1);

    if (swingPhase >= 1) {
      progressRef.current = 0;
      hitEnemiesRef.current.clear();
      onSwingComplete?.(clawRef.current.position.clone(), direction);
      onComplete();
      return;
    }

    const parentPosition = parentRef.current.position;
    const parentRotation = parentRef.current.rotation.y;

    const pivotX = -Math.sin(swingPhase * Math.PI) * 2.5 + 3;
    const pivotY = Math.cos(swingPhase * Math.PI) + 3.75;
    const pivotZ = Math.sin(swingPhase * Math.PI) * 2 + 0.75;

    rotationMatrixRef.current.makeRotationY(parentRotation);
    tempVector.current.set(pivotX, 0, pivotZ);
    tempVector.current.applyMatrix4(rotationMatrixRef.current);

    tempPosition.current.set(
      parentPosition.x + tempVector.current.x,
      parentPosition.y + pivotY,
      parentPosition.z + tempVector.current.z
    );
    clawRef.current.position.copy(tempPosition.current);

    clawRef.current.rotation.set(
      Math.cos(swingPhase * Math.PI) / (Math.PI * 1.5),
      parentRotation + Math.PI / 2 - swingPhase * Math.PI/2,
      -Math.sin(swingPhase * Math.PI) * (Math.PI /3.5)
    );

    if (Math.abs(swingPhase - 0.1) < 0.1 && !hasDealtDamage.current) {
      hasDealtDamage.current = true;
      showScratchRef.current = true;
      
      const hits = calculateBoneclawHits(
        clawRef.current.position,
        direction,
        enemyData,
        hitEnemiesRef.current
      );

      if (hits.length > 0) {
        requestAnimationFrame(() => {
          hits.forEach(hit => {
            if (!hitEnemiesRef.current.has(hit.targetId)) {
              hitEnemiesRef.current.add(hit.targetId);
              onHitTarget?.(
                hit.targetId, 
                hit.damage, 
                hit.isCritical, 
                hit.position,
                true
              );
            }
          });
        });
      }
    }
  });

  return (
    <>
      {showScratchRef.current && (
        <BoneclawScratch
          position={position}
          direction={direction}
          onComplete={() => {
            showScratchRef.current = false;
          }}
        />
      )}
      

      <group 
        ref={clawRef} 
        position={position}
        rotation={[0, Math.atan2(direction.x, direction.z), Math.PI /3]}
        scale={1.25}
      >
        <group>
          {createParallelBones(1.15, 0.15)}
          
          <group position={[-0.22, -.85, 0.21]}>   { /* ELBOW */}
            <mesh>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshStandardMaterial 
                color="#d6cfc7"
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>
            
            <group rotation={[-0.7, -0, -Math.PI / 5]}>
              {createParallelBones(0.8, 0.12)}
              
              <group position={[0, -0.5, 0]} rotation={[0, 0, 1 - Math.PI / 4]}>
                {createJoint(0.125)}
                
                <group position={[0, -0.1, 0]}>
                  <mesh>
                    <boxGeometry args={[0.2, 0.15, 0.08]} />
                    <meshStandardMaterial 
                      color="#d6cfc7"
                      roughness={0.9}
                      metalness={0.1}
                    />
                  </mesh>

                  {createBoneSegment(0.5, 0.02)}
                  <group position={[0.025, -0.3, 0]} rotation={[0, 0, Math.PI + Math.PI / 16]}>
                    <mesh>
                      <coneGeometry args={[0.03, 0.3, 6]} />
                      <meshStandardMaterial 
                        color="#c4bdb6"
                        roughness={0.9}
                        metalness={0.1}
                      />
                    </mesh>
                    {[0, 1, 2, 3, 4].map(i => createSpectralClaw(i))}
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* New group for shoulder spikes */}
          <group position={[0, 0.7, 0]} rotation={[-1, 1, 1]} scale={0.5}>
            {[-0.03, -0.01, 0, 0.01, 0.03].map((offset, i) => (
              <group 
                key={i} 
                position={[offset, 0.1, 0]}
                rotation={[0, 0, (i - 2) * Math.PI / 5]}
              >
                <group position={[0, 0.3, 0]}>
                  {/* Main shoulder plate */}
                  <mesh>
                    <cylinderGeometry args={[0.075, 0.5, 0.20, 4, 1, false, 0, Math.PI*2]} />
                    <meshStandardMaterial 
                      color="#d6cfc7"
                      roughness={0.9}
                      metalness={0.1}
                    />
                  </mesh>
                  
                  {/* Enhanced spikes with different sizes and angles */}
                  <group position={[0, 0.25, 0]}>
                    {/* Center spike */}
                    <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
                      {createSpike(2)}
                    </group>
                    
                    {/* Side spikes */}
                    <group position={[0, -0.05, 0.15]} rotation={[-0.1, 0, 0]}>
                      {createSpike(0.9)}
                    </group>
                    <group position={[0, -0.05, -0.15]} rotation={[0.1, 0, 0]}>
                      {createSpike(0.9)}
                    </group>
                    
                    {/* Smaller corner spikes */}
                    <group position={[0, -0.1, 0.25]} rotation={[-0.2, 0, 0]}>
                      {createSpike(0.7)}
                    </group>
                    <group position={[0, -0.1, -0.25]} rotation={[0.2, 0, 0]}>
                      {createSpike(0.7)}
                    </group>
                  </group>
                </group>
              </group>
            ))}
          </group>
        </group>
      </group>
    </>
  );
}