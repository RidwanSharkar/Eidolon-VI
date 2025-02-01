import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';

interface FirebeamAnimationProps {
  beamRef: React.RefObject<Group>;
  position: Vector3;
  direction: Vector3;
}

export const useFirebeamAnimation = ({
  beamRef,
}: FirebeamAnimationProps) => {
  const progressRef = useRef(0);
  const startupDuration = 0;
  const fadeOutDuration = 2500;
  const isActive = useRef(true);
  const isFadingOut = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const currentBeam = beamRef.current;
    
    return () => {
      isActive.current = false;
      if (currentBeam) {
        isFadingOut.current = true;
        timeoutRef.current = setTimeout(() => {
          if (currentBeam) {
            currentBeam.scale.z = 0;
          }
        }, fadeOutDuration);
      }
    };
  }, [beamRef]);

  useFrame((_, delta) => {
    if (!beamRef.current) return;

    if (isFadingOut.current) {
      if (Math.random() > 0.25) return;
      progressRef.current -= delta / fadeOutDuration;
      if (progressRef.current > 0) {
        beamRef.current.scale.z = progressRef.current;
      }
    } else if (progressRef.current < 1) {
      progressRef.current += delta / startupDuration;
      beamRef.current.scale.z = Math.min(progressRef.current, 1);
    }
  });

  return {
    reset: useCallback(() => {
      progressRef.current = 0;
      isActive.current = false;
      isFadingOut.current = true;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (beamRef.current) {
          beamRef.current.scale.z = 0;
        }
        isFadingOut.current = false;
      }, fadeOutDuration);
    }, [beamRef])
  };
}; 