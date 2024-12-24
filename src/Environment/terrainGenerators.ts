import { Vector3, Color, Euler } from 'three';
import { trunkColors, leafColors } from '@/Environment/treeColors';

export interface GeneratedTree {
  position: Vector3;
  scale: number;
  trunkColor: Color;
  leafColor: Color;
}

export interface GeneratedBone {
  position: Vector3;
  rotation: Euler;
  scale: number;
}

export interface GeneratedSparkle {
  position: Vector3;
  scale: number;
  intensity: number;
}

export const generateMountains = (): Array<{ position: Vector3; scale: number }> => {
  const mountains: Array<{ position: Vector3; scale: number }> = [];
  const numberOfMountains = 70; 

  for (let i = 0; i < numberOfMountains; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 51 + Math.random() * 10;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const scale = 0.6 + Math.random() * 0.8;

    mountains.push({
      position: new Vector3(x, 0, z),
      scale: scale,
    });
  }

  return mountains;
};

export const generateTrees = (): GeneratedTree[] => {
  const trees: GeneratedTree[] = [
    // Dense cluster 1 (left side)
    { position: new Vector3(-15, 0, -5), scale: 0.9, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(16.5, 0, -6.5), scale: 0.75, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-14, 0, -6), scale: 0.85, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(15.5, 0, -3.5), scale: 0.8, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-23.5, 0, -4.2), scale: 0.7, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-17, 0, -5.5), scale: 0.85, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(15.8, 0, -7.2), scale: 0.95, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-14.2, 0, -4.8), scale: 0.82, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    
    // Dense cluster 2 (right side)
    { position: new Vector3(16, 0, -8), scale: 0.85, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(17.5, 0, 9), scale: 0.9, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(15, 0, -9.5), scale: 0.8, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(16.5, 0, 6.5), scale: 0.75, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(18.2, 0, -7.8), scale: 0.88, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(15.8, 0, -7.2), scale: 0.92, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(17.2, 0, -10.5), scale: 0.78, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(14.5, 0, -8.2), scale: 0.83, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    
    // Back forest cluster 
    { position: new Vector3(-20, 0, -20), scale: 0.95, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(-10, 0, 22), scale: 0.9, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(0, 0, -23), scale: 0.95, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(25, 0, -22), scale: 0.9, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(25, 0, 20), scale: 0.95, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-15, 0, -21), scale: 0.88, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(-5, 0, -22.5), scale: 0.92, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(5, 0, 23.5), scale: 0.87, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(25, 0, 21.5), scale: 0.93, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(-28, 0, -19.5), scale: 0.89, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    
    // Scattered individual trees
    { position: new Vector3(-12, 0,12), scale: 0.8, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(9, 0, -12), scale: 0.8, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(-5, 0, -15), scale: 0.85, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(5, 0, -18), scale: 0.85, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(-8, 0, 10), scale: 0.87, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(8, 0, 10), scale: 0.83, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(-7, 0, -16), scale: 0.82, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(-7, 0, -17), scale: 0.86, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(9, 0, -12), scale: 0.8, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(-12, 0, -12), scale: 0.8, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(-5, 0,15), scale: 0.85, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(5, 0, 18), scale: 0.85, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(-8, 0, -10), scale: 0.87, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(8, 0, 11), scale: 0.83, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(-17, 0, -18), scale: 0.82, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(7, 0, 17), scale: 0.86, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
  ];

  return trees;
};

export const generateMushrooms = (): Array<{ position: Vector3; scale: number }> => {
  const mushrooms: Array<{ position: Vector3; scale: number }> = [];
  const numberOfMushrooms = 100; // Adjust 

  for (let i = 0; i < numberOfMushrooms; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 45; // Within the baseRadius + layers

    const x = distance * Math.cos(angle);
    const z = distance * Math.sin(angle);

    const scale = 0.3 + Math.random() * 0.2; // Small mushrooms

    mushrooms.push({
      position: new Vector3(x, 0, z),
      scale: scale,
    });
  }

  return mushrooms;
};

export const generateRandomPosition = (): Vector3 => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 25; // spawn radus

  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;

  return new Vector3(x, 0, z);
};

export const generateBones = (): GeneratedBone[] => {
  const bones: GeneratedBone[] = [];
  const numBones = 200;

  for (let i = 0; i < numBones; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 45;
    const position = new Vector3(
      distance * Math.cos(angle),
      0.01,
      distance * Math.sin(angle)
    );

    const rotation = new Euler(
      Math.random() * 0.3,
      Math.random() * Math.PI * 2,
      Math.random() * 0.3
    );

    const scale = 0.1 + Math.random() * 0.175;

    bones.push({
      position,
      rotation,
      scale
    });
  }

  return bones;
};

export const generateSparkles = (): GeneratedSparkle[] => {
  const sparkles: GeneratedSparkle[] = [];
  const numSparkles = 300; // Adjust for desired density

  for (let i = 0; i < numSparkles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 48; // Slightly larger than bone radius
    const position = new Vector3(
      distance * Math.cos(angle),
      0.05, // Slightly above ground
      distance * Math.sin(angle)
    );

    sparkles.push({
      position,
      scale: 0.05 + Math.random() * 0.1,
      intensity: 0.3 + Math.random() * 0.7 // Varies the brightness
    });
  }

  return sparkles;
};