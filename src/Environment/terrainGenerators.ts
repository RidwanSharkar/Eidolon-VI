import { Vector3, Color, Euler } from 'three';
import { trunkColors, leafColors } from '@/Environment/treeColors';

export interface GeneratedTree {
  position: Vector3;
  scale: number;
  trunkColor: Color;
  leafColor: Color;
}

export const generateMountains = (): Array<{ position: Vector3; scale: number }> => {
  const mountains: Array<{ position: Vector3; scale: number }> = [];
  const numberOfMountains = 32;
  const radius = 54;
  
  // Create evenly spaced mountains around the perimeter
  for (let i = 0; i < numberOfMountains; i++) {
    const angle = (i / numberOfMountains) * Math.PI * 2;
    
    // controlled randomness
    const randomRadius = radius + (Math.random() * 4 - 2); // Varies radius by ±2 units
    const x = Math.cos(angle) * randomRadius;
    const z = Math.sin(angle) * randomRadius;
    const scale = 0.75 + Math.random() * 0.4; // More consistent scaling

    // Overlapping mountains
    mountains.push({
      position: new Vector3(x, 0, z),
      scale: scale,
    });

    // Second row of mountains slightly offset
    const innerRadius = radius - 12;
    const offsetAngle = angle + (Math.PI / numberOfMountains);
    const innerX = Math.cos(offsetAngle) * innerRadius;
    const innerZ = Math.sin(offsetAngle) * innerRadius;

    mountains.push({
      position: new Vector3(innerX, 0, innerZ),
      scale: scale * 0.9,
    });
  }

  return mountains;
};

export const generateTrees = (): GeneratedTree[] => {
  const trees: GeneratedTree[] = [
    // Dense cluster 1 (left side)
    { position: new Vector3(-15, 0, -5), scale: 1.3, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-25, 0, -10.5), scale: 1, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-12, 0, -8), scale: 1.25, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-12, 0, -13.5), scale: 0.8, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    
    { position: new Vector3(30, 0, 5), scale: 1.3, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(16, 0, -10), scale: 1, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(12, 0, 8), scale: 1.25, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    
    { position: new Vector3(-11, 0, 5), scale: 1.3, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-12, 0, -28.5), scale: 1, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(12, 0, -8), scale: 1.25, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    { position: new Vector3(-12, 0, 23.5), scale: 0.8, trunkColor: new Color(trunkColors[1]), leafColor: new Color(leafColors[1]) },
    

    // Dense cluster 2 (right side)
    { position: new Vector3(18, 0, -8), scale: 1.1, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(17.5, 0, -10), scale: 0.9, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(15, 0, -11.5), scale: 1.1, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    { position: new Vector3(16.5, 0, -6.5), scale: 1, trunkColor: new Color(trunkColors[2]), leafColor: new Color(leafColors[2]) },
    
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

export const generateMushrooms = (): Array<{ position: Vector3; scale: number; variant: 'pink' | 'green' | 'blue' }> => {
  const mushrooms: Array<{ position: Vector3; scale: number; variant: 'pink' | 'green' | 'blue' }> = [];
  const numberOfMushrooms = 80;
  const trees = generateTrees(); // Get tree positions for reference

  for (let i = 0; i < numberOfMushrooms; i++) {
    let x: number, z: number;
    const scale = 0.45 + Math.random() * 0.175;

    // 70% chance to spawn near trees, 30% chance for random placement
    if (Math.random() < 0.7 && trees.length > 0) {
      // Pick a random tree
      const randomTree = trees[Math.floor(Math.random() * trees.length)];
      
      // Generate position near the tree
      const angleFromTree = Math.random() * Math.PI * 2;
      const distanceFromTree = Math.random() * 4; // 0-4 units from tree
      x = randomTree.position.x + Math.cos(angleFromTree) * distanceFromTree;
      z = randomTree.position.z + Math.sin(angleFromTree) * distanceFromTree;
    } else {
      // Random placement anywhere
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 48;
      x = distance * Math.cos(angle);
      z = distance * Math.sin(angle);
    }

    // Even distribution of variants (33:33:33)
    let variant: 'pink' | 'green' | 'blue';
    const random = Math.random() * 100;
    if (random < 33.33) {
      variant = 'pink';
    } else if (random < 66.66) {
      variant = 'green';
    } else {
      variant = 'blue';
    }

    mushrooms.push({
      position: new Vector3(x, 0, z),
      scale,
      variant,
    });
  }

  return mushrooms;
};

export const generateRandomPosition = (): Vector3 => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 22.5; // REAL SPAWN RADIUS!?

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

export const generateBoneDoodads = () => {
  const doodads: Array<{
    position: Vector3;
    rotation: Euler;
    type: string;
    scale?: number;
  }> = [];

  // Add the fixed submerged bone plate
  doodads.push({
    position: new Vector3(15, -0.2, 10),
    rotation: new Euler(-Math.PI * 0.05, Math.PI * 1.2, 0),
    type: 'submerged'
  });

  // Add random bone plates (1-2)
  for (let i = 0; i < 1 + Math.floor(Math.random()); i++) {
    doodads.push({
      position: new Vector3((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100),
      rotation: new Euler(0, Math.random() * Math.PI * 2, 0),
      type: 'plate',
      scale: 0.8 + Math.random() * 0.4
    });
  }

  // Add scattered bones (20-40)
  const boneCount = 20 + Math.floor(Math.random() * 20);
  for (let i = 0; i < boneCount; i++) {
    doodads.push({
      position: new Vector3((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100),
      rotation: new Euler(
        0,
        Math.random() * Math.PI * 2,
        0
      ),
      type: 'bones'
    });
  }

  // Add shoulder plates (10-20)
  const shoulderCount = 10 + Math.floor(Math.random() * 10);
  for (let i = 0; i < shoulderCount; i++) {
    doodads.push({
      position: new Vector3((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100),
      rotation: new Euler(
        Math.random() * 0.3,
        Math.random() * Math.PI * 2,
        Math.random() * 0.3
      ),
      type: 'shoulder'
    });
  }

  return doodads;
};