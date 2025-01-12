import { useRef } from 'react';
import { Group, Vector3, Shape, DoubleSide } from 'three';
import { useFrame } from '@react-three/fiber';
import { calculateBoneclawHits } from '@/Spells/Boneclaw/BoneclawDamage';
import BoneclawScratch from '@/Spells/Boneclaw/BoneClawScratch';

interface BoneclawProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  parentRef: React.RefObject<Group>;
  onHitTarget?: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isBoneclaw?: boolean) => void;
  enemyData: Array<{ id: string; position: Vector3; health: number }>;
  onSwingComplete?: (position: Vector3, direction: Vector3) => void;
}

export default function Boneclaw({ position, direction, onComplete, parentRef, onHitTarget, enemyData, onSwingComplete }: BoneclawProps) {
  const clawRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const hasDealtDamage = useRef(false);
  const showScratch = useRef(false);

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

  const createSpectralClawShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    // Create thinner, longer claw shape
    shape.lineTo(0.2, -0.065);
    shape.bezierCurveTo(
      0.4, 0.11,    // control point 1
      0.665, 0.25,  // control point 2
      0.8, 0.26     // end point (tip)
    );
    
    // Create sharp edge
    shape.lineTo(0.56, 0.375);
    shape.bezierCurveTo(
      0.25, 0.1,
      0.11, 0.0,
      0.05, 0.35
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
      rotation={[0, 0, Math.PI + Math.PI / 16 + (index - 2) * Math.PI / 24]}
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

  useFrame((_, delta) => {
    if (!clawRef.current || !parentRef?.current) return;

    progressRef.current += delta * 2.5;
    const swingPhase = Math.min(progressRef.current / Math.PI, 1);

    if (swingPhase >= 1) {
      progressRef.current = 0;
      onSwingComplete?.(clawRef.current.position.clone(), direction);
      onComplete();
      return;
    }

    const parentPosition = parentRef.current.position.clone();
    const parentRotation = parentRef.current.rotation.y;

    const pivotX = -Math.sin(swingPhase * Math.PI) * 1.375 + 2;
    const pivotY = Math.cos(swingPhase * Math.PI)  + 1.9;
    const pivotZ = Math.sin(swingPhase * Math.PI) * 2 + 0.5;

    const rotatedOffsetX = (pivotX * Math.cos(parentRotation) + pivotZ * Math.sin(parentRotation));
    const rotatedOffsetZ = (-pivotX * Math.sin(parentRotation) + pivotZ * Math.cos(parentRotation));

    clawRef.current.position.set(
      parentPosition.x + rotatedOffsetX,
      parentPosition.y + pivotY,
      parentPosition.z + rotatedOffsetZ
    );

    const rotationX = Math.cos(swingPhase * Math.PI) / (Math.PI / -1.5);
    const rotationY = parentRotation + Math.PI / 2 - swingPhase * Math.PI;
    const rotationZ = -Math.sin(swingPhase * Math.PI) * (Math.PI /2);

    clawRef.current.rotation.set(
      rotationX,
      rotationY,
      rotationZ
    );

    if (Math.abs(swingPhase - 0.1) < 0.1 && !hasDealtDamage.current) {
      hasDealtDamage.current = true;
      showScratch.current = true;
      
      const hits = calculateBoneclawHits(
        clawRef.current.position,
        direction,
        enemyData
      );

      hits.forEach(hit => {
        onHitTarget?.(
          hit.targetId, 
          hit.damage, 
          hit.isCritical, 
          hit.position,
          true
        );
      });
    }
  });

  return (
    <>
      {showScratch.current && (
        <BoneclawScratch
          position={position}
          direction={direction}
          onComplete={() => {
            showScratch.current = false;
          }}
        />
      )}
      <group 
        ref={clawRef} 
        position={position}
        rotation={[0, Math.atan2(direction.x, direction.z), Math.PI /3]}
        scale={1.35}
      >
        <group>
          {createParallelBones(1.15, 0.15)}
          
          <group position={[-0.22, -.85, 0.21]}>   { /* ELBOW */}
            <mesh>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshStandardMaterial 
                color="#e8e8e8"
                roughness={0.4}
                metalness={0.3}
              />
            </mesh>
            
            <group rotation={[-0.7, -0, -Math.PI / 5]}>
              {createParallelBones(0.8, 0.12)}
              
              <group position={[0, -0.5, 0]} rotation={[0, 0, 1 - Math.PI / 4]}>
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
                        {createSpectralClaw(i)}
                      </group>
                    </group>
                  ))}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}