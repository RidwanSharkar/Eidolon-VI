import React, { useRef } from 'react';
import { Mesh, Vector3, Clock, Color, Group } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import CrossentropyBoltTrail from './CrossentropyBoltTrail';
import * as THREE from 'three'

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
  const color = new Color('#00ff44');
  const impactGroup = useRef<Group>(null);
  const explosionStartTime = useRef<number | null>(null);
  const explosionRef = useRef<Group>(null);

  // Spiral parameters
  const spiralRadius = 0.35;
  const spiralSpeed = 5; // rotations per second
  const time = useRef(0);

  const checkCollision = (nextPosition: Vector3): boolean => {
    const raycaster = new THREE.Raycaster();
    const rayDirection = nextPosition.clone().sub(currentPosition.current).normalize();
    raycaster.set(currentPosition.current, rayDirection);

    const collidableObjects = scene.children.filter(child => 
      (child.name === 'mountain' && child instanceof THREE.Group) ||
      (child.name === 'tree' && child instanceof THREE.Group)
    );

    const allMeshes = collidableObjects.flatMap(group => {
      const meshes: THREE.Mesh[] = [];
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
      return meshes;
    });

    const intersects = raycaster.intersectObjects(allMeshes, true);

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
      
      // Calculate spiral positions for the two fireballs
      const spiralAngle = time.current * spiralSpeed * Math.PI * 2;
      const spiralOffset1 = new Vector3(
        Math.cos(spiralAngle) * spiralRadius,
        Math.sin(spiralAngle * 0.5) * spiralRadius * 0.3,
        0
      );
      const spiralOffset2 = new Vector3(
        Math.cos(spiralAngle + Math.PI) * spiralRadius,
        Math.sin((spiralAngle + Math.PI) * 0.5) * spiralRadius * 0.3,
        0
      );

      // Apply spiral offsets to the main direction
      const right = new Vector3();
      const up = new Vector3(0, 1, 0);
      right.crossVectors(direction, up).normalize();
      up.crossVectors(right, direction).normalize();

      const finalOffset1 = right.clone().multiplyScalar(spiralOffset1.x)
        .add(up.clone().multiplyScalar(spiralOffset1.y));
      const finalOffset2 = right.clone().multiplyScalar(spiralOffset2.x)
        .add(up.clone().multiplyScalar(spiralOffset2.y));

      fireball1Ref.current.position.copy(currentPosition.current.clone().add(finalOffset1));
      fireball2Ref.current.position.copy(currentPosition.current.clone().add(finalOffset2));
    }
  });

  return (
    <group name="crossentropy-bolt-group">
      <mesh ref={fireball1Ref} position={currentPosition.current}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
        <pointLight color={color} intensity={5} distance={12} />
      </mesh>
      <mesh ref={fireball2Ref} position={currentPosition.current}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
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