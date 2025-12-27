import React, { useRef, useMemo, useEffect } from 'react';
import { Mesh, Vector3, Clock, Color, Group, Raycaster, SphereGeometry, MeshStandardMaterial } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import CrossentropyBoltTrail from './CrossentropyBoltTrail';

// MEMORY FIX: Static shared geometry - created once, reused for all bolts
const BOLT_GEOMETRY = new SphereGeometry(0.28, 32, 32);

interface CrossentropyBoltProps {
  position: Vector3;
  direction: Vector3;
  onImpact: () => void;
}

export default function CrossentropyBolt({ position, direction, onImpact }: CrossentropyBoltProps) {
  const fireball1Ref = useRef<Mesh>(null);
  const fireball2Ref = useRef<Mesh>(null);
  const clock = useRef(new Clock());
  const speed = 0.3;
  const lifespan = 10;
  const currentPosition = useRef(position.clone());
  const { scene } = useThree();
  const size = 0.28;
  const color = useMemo(() => new Color('#00ff44'), []);
  
  // MEMORY FIX: Create material once per component instance
  const material = useMemo(() => new MeshStandardMaterial({
    emissive: new Color('#00ff44'),
    emissiveIntensity: 2,
    toneMapped: false,
  }), []);
  
  // Cleanup material on unmount
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);
  const impactGroup = useRef<Group>(null);
  const explosionStartTime = useRef<number | null>(null);
  const explosionRef = useRef<Group>(null);

  // Spiral parameters
  const spiralRadius = 0.35;
  const spiralSpeed = 5; // rotations per second
  const time = useRef(0);
  
  // Reusable raycaster and vectors to avoid allocations every frame
  const raycasterRef = useRef(new Raycaster());
  const rayDirectionRef = useRef(new Vector3());
  const spiralOffset1Ref = useRef(new Vector3());
  const spiralOffset2Ref = useRef(new Vector3());
  const rightRef = useRef(new Vector3());
  const upRef = useRef(new Vector3(0, 1, 0));

  const checkCollision = (nextPosition: Vector3): boolean => {
    rayDirectionRef.current.subVectors(nextPosition, currentPosition.current).normalize();
    raycasterRef.current.set(currentPosition.current, rayDirectionRef.current);

    const collidableObjects = scene.children.filter(child => 
      (child.name === 'mountain' && child instanceof Group) ||
      (child.name === 'tree' && child instanceof Group)
    );

    const allMeshes = collidableObjects.flatMap(group => {
      const meshes: Mesh[] = [];
      group.traverse((child) => {
        if (child instanceof Mesh) {
          meshes.push(child);
        }
      });
      return meshes;
    });

    const intersects = raycasterRef.current.intersectObjects(allMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const movementDistance = currentPosition.current.distanceTo(nextPosition);
      if (hit.distance <= movementDistance) {
        return true;
      }
    }

    return false;
  };

  const createExplosionEffect = (position: Vector3) => {
    if (!explosionRef.current) return;
    
    explosionRef.current.position.copy(position);
    explosionRef.current.visible = true;
    explosionStartTime.current = clock.current.getElapsedTime();
  };

  useFrame((_, delta) => {
    if (!fireball1Ref.current || !fireball2Ref.current) return;

    if (clock.current.getElapsedTime() > lifespan) {
      fireball1Ref.current.removeFromParent();
      fireball2Ref.current.removeFromParent();
      return;
    }

    time.current += delta;

    const movement = direction.clone().multiplyScalar(speed * delta * 60);
    const nextPosition = currentPosition.current.clone().add(movement);

    if (checkCollision(nextPosition)) {
      if (fireball1Ref.current && fireball2Ref.current) {
        createExplosionEffect(currentPosition.current);
        fireball1Ref.current.removeFromParent();
        fireball2Ref.current.removeFromParent();
      }
      onImpact();
    } else {
      currentPosition.current.copy(nextPosition);
      
      // Calculate spiral positions for the two fireballs - reusing refs
      const spiralAngle = time.current * spiralSpeed * Math.PI * 2;
      spiralOffset1Ref.current.set(
        Math.cos(spiralAngle) * spiralRadius,
        Math.sin(spiralAngle * 0.5) * spiralRadius * 0.3,
        0
      );
      spiralOffset2Ref.current.set(
        Math.cos(spiralAngle + Math.PI) * spiralRadius,
        Math.sin((spiralAngle + Math.PI) * 0.5) * spiralRadius * 0.3,
        0
      );

      // Apply spiral offsets to the main direction - reusing refs
      upRef.current.set(0, 1, 0);
      rightRef.current.crossVectors(direction, upRef.current).normalize();
      upRef.current.crossVectors(rightRef.current, direction).normalize();

      // Calculate final positions without allocating new vectors
      fireball1Ref.current.position.copy(currentPosition.current);
      fireball1Ref.current.position.x += rightRef.current.x * spiralOffset1Ref.current.x + upRef.current.x * spiralOffset1Ref.current.y;
      fireball1Ref.current.position.y += rightRef.current.y * spiralOffset1Ref.current.x + upRef.current.y * spiralOffset1Ref.current.y;
      fireball1Ref.current.position.z += rightRef.current.z * spiralOffset1Ref.current.x + upRef.current.z * spiralOffset1Ref.current.y;

      fireball2Ref.current.position.copy(currentPosition.current);
      fireball2Ref.current.position.x += rightRef.current.x * spiralOffset2Ref.current.x + upRef.current.x * spiralOffset2Ref.current.y;
      fireball2Ref.current.position.y += rightRef.current.y * spiralOffset2Ref.current.x + upRef.current.y * spiralOffset2Ref.current.y;
      fireball2Ref.current.position.z += rightRef.current.z * spiralOffset2Ref.current.x + upRef.current.z * spiralOffset2Ref.current.y;
    }
  });

  return (
    <group name="crossentropy-bolt-group">
      {/* MEMORY FIX: Use shared geometry and material */}
      <mesh 
        ref={fireball1Ref} 
        position={currentPosition.current}
        geometry={BOLT_GEOMETRY}
        material={material}
      >
        <pointLight color={color} intensity={5} distance={12} />
      </mesh>
      <mesh 
        ref={fireball2Ref} 
        position={currentPosition.current}
        geometry={BOLT_GEOMETRY}
        material={material}
      >
        <pointLight color={color} intensity={5} distance={12} />
      </mesh>
      <group ref={impactGroup} visible={false}>
      </group>
      <CrossentropyBoltTrail
        color={color}
        size={size}
        mesh1Ref={fireball1Ref}
        mesh2Ref={fireball2Ref}
        opacity={1}
      />
      <pointLight color={color} intensity={8} distance={4} decay={2} />
    </group>
  );
} 