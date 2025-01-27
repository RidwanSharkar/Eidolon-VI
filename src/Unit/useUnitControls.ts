// src/unit/useUnitControls.ts
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
  isCharging?: boolean;
  onMovementUpdate?: (direction: Vector3) => void;
}

const PLAY_AREA_RADIUS = 27.25 // MAP BOUNDARY

export function useUnitControls({
  groupRef,
  controlsRef,
  camera,
  speed = 0.05,
  onPositionUpdate,
  health,
  isCharging = false,
  onMovementUpdate
}: UseUnitControlsProps) {
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
  });

  const isGameOver = useRef(false);

  // Add velocity state with useRef for smooth acceleration/deceleration
  const velocity = useRef(new Vector3());
  const ACCELERATION = 8.0;  // How quickly to reach max speed
  const DECELERATION = 12.0; // How quickly to stop

  useEffect(() => {
    if (health <= 0) {
      isGameOver.current = true;
      keys.current = {
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false
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
        d: false,
        shift: false
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

  useFrame((_, delta) => {
    if (!groupRef.current || isGameOver.current) return;

    // Convert speed from per-frame to per-second
    const normalizedSpeed = speed * 60; // Base speed per second
    const currentFrameSpeed = normalizedSpeed * delta; // Actual speed this frame
    
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    if (controlsRef.current && !keys.current.shift) {
      const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
      groupRef.current.rotation.y = targetRotation;
    }

    const currentRotation = groupRef.current.rotation.y;
    const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
    const rotationSpeed = 0.1; // 0.1 defaulted 
    
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
      
      if (onMovementUpdate) {
        onMovementUpdate(moveDirection);
      }

      const dotProduct = moveDirection.dot(cameraDirection);
      const baseSpeed = isCharging ? 0.005 * 60 * delta : currentFrameSpeed;
      const backwardsSpeed = baseSpeed * 0.6;
      const targetSpeed = dotProduct < 0 ? backwardsSpeed : baseSpeed;
      
      // Calculate target velocity
      const targetVelocity = moveDirection.clone().multiplyScalar(targetSpeed);
      
      // Smoothly interpolate current velocity towards target
      velocity.current.lerp(targetVelocity, ACCELERATION * delta);
      
      // Calculate new position using smoothed velocity
      const newPosition = groupRef.current.position.clone().add(velocity.current);

      // Check if new position is within bounds
      const distanceFromCenter = Math.sqrt(
        newPosition.x * newPosition.x + 
        newPosition.z * newPosition.z
      );

      if (distanceFromCenter < PLAY_AREA_RADIUS) {
        groupRef.current.position.copy(newPosition);
      } else {
        // Slide along the boundary
        const angle = Math.atan2(newPosition.z, newPosition.x);
        groupRef.current.position.x = PLAY_AREA_RADIUS * Math.cos(angle);
        groupRef.current.position.z = PLAY_AREA_RADIUS * Math.sin(angle);
        // Reset velocity when hitting boundary
        velocity.current.multiplyScalar(0.5);
      }
    } else {
      // Decelerate smoothly when no input
      velocity.current.multiplyScalar(1 - DECELERATION * delta);
      
      // Apply remaining velocity
      if (velocity.current.length() > 0.001) {
        const newPosition = groupRef.current.position.clone().add(velocity.current);
        groupRef.current.position.copy(newPosition);
      }

      if (onMovementUpdate) {
        onMovementUpdate(new Vector3());
      }
    }

    // Smooth rotation interpolation
    if (controlsRef.current && !keys.current.shift) {
      const targetRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
      const currentRotation = groupRef.current.rotation.y;
      
      // Normalize angle difference
      let rotationDiff = targetRotation - currentRotation;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      // Smooth rotation with increased interpolation
      groupRef.current.rotation.y += rotationDiff * Math.min(1, 15 * delta);
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
      if (key === 'shift') {
        keys.current.shift = true;
      } else if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'shift') {
        keys.current.shift = false;
      } else if (key in keys.current) {
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