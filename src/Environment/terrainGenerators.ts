import { Vector3, Color } from 'three';
import { trunkColors } from '@/Environment/treeColors';

export interface GeneratedTree {
  position: Vector3;
  scale: number;
  trunkColor: Color;
  leafColor: Color;
}

export interface DetailedTree {
  position: Vector3;
  scale: number;
  trunkColor: Color;
  height: number;
  trunkRadius: number;
  rotationY?: number; // Fixed rotation to prevent spinning
  rotationX?: number;
  rotationZ?: number;
  seed?: number; // Seed for consistent tree generation
}

export const generateMountains = (): Array<{ position: Vector3; scale: number }> => {
  const mountains: Array<{ position: Vector3; scale: number }> = [];
  const numberOfMountains = 24;
  const radius = 51;
  
  // Create evenly spaced mountains around the perimeter
  for (let i = 0; i < numberOfMountains; i++) {
    const angle = (i / numberOfMountains) * Math. PI * 2;
    
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

// Seeded random for consistent tree generation across sessions
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}

/**
 * Generate 3-6 clustered trees with proper distribution
 * Trees spawn in clusters to create natural forest areas
 */
export const generateClusteredTrees = (): DetailedTree[] => {
  const rng = new SeededRandom(42); // Fixed seed for consistent generation
  const trees: DetailedTree[] = [];
  
  // Generate 2-3 clusters
  const numClusters = 1 + Math.floor(rng.random() * 3); // 2-3 clusters
  
  for (let i = 0; i < numClusters; i++) {
    // Random cluster center position (keep away from center spawn area)
    const clusterAngle = (i / numClusters) * Math.PI * 2 + (rng.random() - 0.5) * Math.PI;
    const clusterDistance = 20 + rng.random() * 15; // 20-35 units from center
    const clusterX = Math.cos(clusterAngle) * clusterDistance;
    const clusterZ = Math.sin(clusterAngle) * clusterDistance;
    
    // Generate 1-3 trees per cluster
    const treesInCluster = 1 + Math.floor(rng.random() * 3); // 1-3 trees
    
    for (let j = 0; j < treesInCluster; j++) {
      // Position trees within cluster (2-5 units from cluster center)
      const treeAngle = rng.random() * Math.PI * 2;
      const treeDistance = 2 + rng.random() * 3; // 2-5 units from cluster center
      const treeX = clusterX + Math.cos(treeAngle) * treeDistance;
      const treeZ = clusterZ + Math.sin(treeAngle) * treeDistance;
      
      // Vary tree properties for visual diversity
      const scale = 0.8 + rng.random() * 0.6; // 0.8-1.4 scale
      const height = 3.2 + rng.random() * 1.3; // 3.2-4.5 height
      const trunkRadius = 0.16 + rng.random() * 0.08; // 0.16-0.24 radius
      
      // Choose trunk color (80% chance for color 1, 20% for color 2)
      const colorIndex = rng.random() < 0.8 ? 1 : 2;
      
      trees.push({
        position: new Vector3(treeX, 0, treeZ),
        scale: scale,
        trunkColor: new Color(trunkColors[colorIndex]),
        height: height,
        trunkRadius: trunkRadius,
        rotationY: rng.random() * Math.PI * 2,
        rotationX: (rng.random() - 0.5) * 0.1,
        rotationZ: (rng.random() - 0.5) * 0.1,
        seed: i * 100 + j // Unique seed for each tree
      });
    }
  }
  
  // Ensure we have at least 3 trees and at most 6
  while (trees.length < 3) {
    // Add extra single trees if we have less than 3
    const angle = rng.random() * Math.PI * 2;
    const distance = 25 + rng.random() * 10;
    trees.push({
      position: new Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance),
      scale: 0.9 + rng.random() * 0.5,
      trunkColor: new Color(trunkColors[1]),
      height: 3.5 + rng.random() * 1.0,
      trunkRadius: 0.18 + rng.random() * 0.06,
      rotationY: rng.random() * Math.PI * 2,
      rotationX: (rng.random() - 0.5) * 0.1,
      rotationZ: (rng.random() - 0.5) * 0.1,
      seed: 999 + trees.length
    });
  }
  
  // Limit to 6 trees maximum
  return trees.slice(0, 6);
};

export const generateMushrooms = (): Array<{ position: Vector3; scale: number; variant: 'pink' | 'green' | 'blue' | 'orange' }> => {
  const mushrooms: Array<{ position: Vector3; scale: number; variant: 'pink' | 'green' | 'blue' | 'orange' }> = [];
  const numberOfMushrooms = 10;
  const trees = generateClusteredTrees(); // Get tree positions for reference

  for (let i = 0; i < numberOfMushrooms; i++) {
    let x: number, z: number;
    const scale = 0.375 + Math.random() * 0.375;

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

    // Even distribution of variants (25% each)
    let variant: 'pink' | 'green' | 'blue' | 'orange';
    const random = Math.random() * 100;
    if (random < 25) {
      variant = 'orange';
    } else if (random < 50) {
      variant = 'green';
    } else if (random < 75) {
      variant = 'blue';
    } else {
      variant = 'pink';
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
  const distance = Math.random() * 15.5; // REAL SPAWN RADIUS

  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;

  return new Vector3(x, 0, z);
};