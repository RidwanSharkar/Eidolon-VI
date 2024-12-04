import React from 'react';
import { Stars } from '@react-three/drei';

const BackgroundStars: React.FC = () => {
  return (
    <Stars
      radius={500}
      depth={200}
      count={5000}
      factor={3}
      saturation={0}
      fade={true}
      speed={0.2}
    />
  );
};

export default BackgroundStars; 