import { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { Camera } from 'three';
import { OrbitControls } from 'three-stdlib';

interface UseUnitControlsProps {
  groupRef: React.RefObject<Group>;
  controlsRef: React.RefObject<OrbitControls>;
  camera: Camera;
  speed?: number;
  onPositionUpdate: (position: Vector3) => void;
}

export function useUnitControls({
  groupRef,
  controlsRef,
  camera,
  speed = 0.075, 
  onPositionUpdate,
}: UseUnitControlsProps) {
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false
  });

  // Handle movement in useFrame
  useFrame(() => {
    if (!groupRef.current) return;

    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const cameraRight = new Vector3(
      -cameraDirection.z,
      0,
      cameraDirection.x
    );

    const moveDirection = new Vector3(0, 0, 0);

    if (keys.current.w) moveDirection.add(cameraDirection);
    if (keys.current.s) moveDirection.sub(cameraDirection);
    if (keys.current.a) moveDirection.sub(cameraRight);
    if (keys.current.d) moveDirection.add(cameraRight);

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      groupRef.current.position.add(moveDirection.multiplyScalar(speed));

      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
      groupRef.current.rotation.y = targetRotation;
    }

    if (controlsRef.current) {
      const unitPosition = groupRef.current.position;
      controlsRef.current.target.set(unitPosition.x, unitPosition.y, unitPosition.z);
    }

    onPositionUpdate(groupRef.current.position.clone());
  });

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return {
    keys // Expose keys ref in case it's needed externally
  };
} 