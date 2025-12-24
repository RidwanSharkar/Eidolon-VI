import React, { useRef, useMemo, useEffect } from 'react';
import { Mesh, Vector3, Clock, Color, Group, Raycaster, SphereGeometry, MeshStandardMaterial } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import FireballTrail from '@/Spells/Fireball/FireballTrail';

interface FireballProps {
  position: Vector3;
  direction: Vector3;
  onImpact: () => void;
}

export default function Fireball({ position, direction, onImpact }: FireballProps) {
  const fireballRef = useRef<Mesh>(null);
  const disposedRef = useRef(false);
  const clock = useRef(new Clock());
  const speed = 0.275;
  const lifespan = 10;
  const currentPosition = useRef(position.clone());
  const { scene } = useThree();
  const size = 0.28;
  const color = useMemo(() => new Color('#00ff44'), []);
  const impactGroup = useRef<Group>(null);
  const explosionStartTime = useRef<number | null>(null);
  const collidableMeshesRef = useRef<Mesh[]>([]);
  const tempMovementRef = useRef(new Vector3());
  const rayDirectionRef = useRef(new Vector3());
  // Reusable raycaster and direction vector to avoid allocations every frame
  const raycasterRef = useRef(new Raycaster());

  const geometry = useMemo(() => new SphereGeometry(size, 32, 32), [size]);
  const material = useMemo(() => new MeshStandardMaterial({
    emissive: color,
    emissiveIntensity: 2,
    toneMapped: false
  }), [color]);

  useEffect(() => {
    const meshes: Mesh[] = [];
    scene.traverse((child) => {
      if (child instanceof Group && (child.name === 'mountain' || child.name === 'tree')) {
        child.traverse((nested) => {
          if (nested instanceof Mesh) {
            meshes.push(nested);
          }
        });
      }
    });
    collidableMeshesRef.current = meshes;
  }, [scene]);

  useEffect(() => () => {
    if (disposedRef.current) return;
    disposedRef.current = true;
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  const disposeFireball = () => {
    if (disposedRef.current) return;
    disposedRef.current = true;
    if (fireballRef.current) {
      fireballRef.current.removeFromParent();
    }
    geometry.dispose();
    material.dispose();
  };

  const checkCollision = (nextPosition: Vector3): boolean => {
    rayDirectionRef.current.subVectors(nextPosition, currentPosition.current).normalize();
    raycasterRef.current.set(currentPosition.current, rayDirectionRef.current);

    const intersects = raycasterRef.current.intersectObjects(collidableMeshesRef.current, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const movementDistance = currentPosition.current.distanceTo(nextPosition);
      if (hit.distance <= movementDistance) {
        return true;
      }
    }

    return false;
  };

  const createExplosionEffect = () => {
    // Explosion effect is handled by Unit.tsx handleFireballImpact
    explosionStartTime.current = clock.current.getElapsedTime();
  };

  useFrame((_, delta) => {
    if (!fireballRef.current) return;

    if (clock.current.getElapsedTime() > lifespan) {
      disposeFireball();
      return;
    }

    const movement = tempMovementRef.current.copy(direction).multiplyScalar(speed * delta * 60);
    const nextPosition = currentPosition.current.clone().add(movement);

    if (checkCollision(nextPosition)) {
      createExplosionEffect();
      disposeFireball();
      onImpact();
    } else {
      currentPosition.current.copy(nextPosition);
      fireballRef.current.position.copy(currentPosition.current);
    }


  });

  return (
    <group name="fireball-group">
      <mesh
        ref={fireballRef}
        position={currentPosition.current}
        geometry={geometry}
        material={material}
      >
        <pointLight color={color} intensity={5} distance={12} />
      </mesh>
      <group ref={impactGroup} visible={false}>

      </group>
      <FireballTrail
        color={color}
        size={size}
        meshRef={fireballRef}
        opacity={1}
      />
    </group>

  );
}