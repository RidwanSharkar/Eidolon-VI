import { Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';

export interface HealthBarProps {
  current: number;
  max: number;
  position: Vector3 | [number, number, number];
}

export default function HealthBar({ current, max, position }: HealthBarProps) {
  const percentage = (current / max) * 100;
  
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[2, 0.3]} />
        <meshBasicMaterial color="#333333" opacity={0.8} transparent />
      </mesh>
      <mesh position={[-1 + (percentage / 100), 0, 0.001]}>
        <planeGeometry args={[(percentage / 100) * 2, 0.28]} />
        <meshBasicMaterial color="#ff3333" opacity={0.9} transparent />
      </mesh>
      <Text
        position={[0, 0, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {`${current}/${max}`}
      </Text>
    </Billboard>
  );
}