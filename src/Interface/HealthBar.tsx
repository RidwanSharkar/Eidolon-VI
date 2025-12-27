import { PlaneGeometry, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';

// MEMORY FIX: Static shared geometries - use scale instead of dynamic args
const HEALTHBAR_GEOMETRIES = {
  background: new PlaneGeometry(2, 0.3),
  fill: new PlaneGeometry(1, 0.28), // Unit width, scale X by percentage
};

export interface HealthBarProps {
  current: number;
  max: number;
  position: Vector3 | [number, number, number];
}

export default function HealthBar({ current, max, position }: HealthBarProps) {
  const percentage = (current / max) * 100;
  // MEMORY FIX: Use scaleX instead of dynamic geometry args
  const fillScaleX = Math.max(0.01, (percentage / 100) * 2); // Minimum scale to avoid zero
  const fillPositionX = -1 + (percentage / 100);
  
  return (
    <Billboard position={position}>
      <mesh>
        <primitive object={HEALTHBAR_GEOMETRIES.background} />
        <meshBasicMaterial color="#333333" opacity={0.8} transparent />
      </mesh>
      <mesh position={[fillPositionX, 0, 0.001]} scale={[fillScaleX, 1, 1]}>
        <primitive object={HEALTHBAR_GEOMETRIES.fill} />
        <meshBasicMaterial color="#ff3333" opacity={0.9} transparent />
      </mesh>
      <Text
        position={[0, 0, 0.002]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {`${current}/${max}`}
      </Text>
    </Billboard>
  );
}