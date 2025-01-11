import { Vector3, Color } from 'three';
import { trunkColors, leafColors } from '@/Environment/treeColors';

export interface GeneratedTree {
  position: Vector3;
  scale: number;
  trunkColor: Color;
  leafColor: Color;
}

export const generateMountains = (): Array<{ position: Vector3; scale: number }> => {
  const mountains: Array<{ position: Vector3; scale: number }> = [];
  const numberOfMountains = 50; 

  for (let i = 0; i < numberOfMountains; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 44;

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
    { position: new Vector3(-15, 0, -5), scale: 1.3, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-25, 0, -10.5), scale: 0.75, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-12, 0, -8), scale: 1.25, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-12, 0, -13.5), scale: 0.8, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    
    { position: new Vector3(30, 0, 5), scale: 1.3, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(16, 0, -10), scale: 0.75, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(12, 0, 8), scale: 1.25, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    
    { position: new Vector3(-11, 0, 5), scale: 1.3, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-12, 0, -28.5), scale: 0.75, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(12, 0, -8), scale: 1.25, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-12, 0, 23.5), scale: 0.8, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    

    // Dense cluster 2 (right side)
    { position: new Vector3(18, 0, -8), scale: 1.1, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(17.5, 0, -10), scale: 0.9, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(15, 0, -11.5), scale: 1.1, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(16.5, 0, -6.5), scale: 0.75, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    
    // Back forest cluster 
    { position: new Vector3(-20, 0, -20), scale: 1.2, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(-10, 0, -22), scale: 0.9, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(0, 0, -23), scale: 0.95, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(10, 0, -22), scale: 1.4, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(20, 0, -20), scale: 0.95, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    
    // Scattered individual trees
    { position: new Vector3(-12, 0, 12), scale: 0.8, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(12, 0, 12), scale: 0.8, trunkColor: new Color(trunkColors[0]), leafColor: new Color(leafColors[0]) },
    { position: new Vector3(-5, 0, -15), scale: 0.85, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(5, 0, -18), scale: 0.85, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
  ];

  return trees;
};

export const generateMushrooms = (): Array<{ position: Vector3; scale: number }> => {
  const mushrooms: Array<{ position: Vector3; scale: number }> = [];
  const numberOfMushrooms = 60; 


  for (let i = 0; i < numberOfMushrooms; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 48; // Within the baseRadius + layers

    const x = distance * Math.cos(angle);
    const z = distance * Math.sin(angle);

    const scale = 0.45 + Math.random() * 0.175; // Small mushrooms

    mushrooms.push({
      position: new Vector3(x, 0, z),
      scale: scale,
    });
  }

  return mushrooms;
};

export const generateRandomPosition = (): Vector3 => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 20; // REAL SPAWN RADIUS!?

  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;

  return new Vector3(x, 0, z);
};

export const generateFlowers = (): Array<{ position: Vector3; scale: number }> => {
  const flowers: Array<{ position: Vector3; scale: number }> = [];
  const numberOfFlowers = 35;

  for (let i = 0; i < numberOfFlowers; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 44;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const scale = 0.6 + Math.random() * 0.4;

    flowers.push({
      position: new Vector3(x, 0, z),
      scale: scale,
    });
  }

  return flowers;
};