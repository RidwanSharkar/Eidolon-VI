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
  health: number;
}

export function useUnitControls({
  groupRef,
  controlsRef,
  camera,
  speed = 0.075,
  onPositionUpdate,
  health
}: UseUnitControlsProps) {
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false
  });

  const isGameOver = useRef(false);

  useEffect(() => {
    if (health <= 0) {
      isGameOver.current = true;
      keys.current = {
        w: false,
        a: false,
        s: false,
        d: false
      };
    } else {
      isGameOver.current = false;
    }
  }, [health]);

  useEffect(() => {
    const handleGameOver = () => {
      isGameOver.current = true;
      keys.current = {
        w: false,
        a: false,
        s: false,
        d: false
      };
    };

    const handleGameReset = () => {
      isGameOver.current = false;
    };

    window.addEventListener('gameOver', handleGameOver);
    window.addEventListener('gameReset', handleGameReset);

    return () => {
      window.removeEventListener('gameOver', handleGameOver);
      window.removeEventListener('gameReset', handleGameReset);
    };
  }, []);

  useFrame(() => {
    if (!groupRef.current || isGameOver.current) return;

    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const currentRotation = groupRef.current.rotation.y;
    const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
    const rotationSpeed = 0.05; // 0.1 defaulted 
    
    groupRef.current.rotation.y = currentRotation + (targetRotation - currentRotation) * rotationSpeed;

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

    if (controlsRef.current) {
      const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
      groupRef.current.rotation.y = targetRotation;
    }

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      
      // Calculate dot product between movement and facing direction
      const dotProduct = moveDirection.dot(cameraDirection);
      
      // Adjust speed based on movement direction
      const backwardsSpeed = speed * 0.45; // 45% of normal speed when moving backwards
      const currentSpeed = dotProduct < 0 ? backwardsSpeed : speed;
      
      groupRef.current.position.add(moveDirection.multiplyScalar(currentSpeed));
    }

    if (controlsRef.current) {
      const unitPosition = groupRef.current.position;
      controlsRef.current.target.set(unitPosition.x, unitPosition.y, unitPosition.z);
    }

    onPositionUpdate(groupRef.current.position.clone());
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver.current) return;
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
    keys
  };
} 