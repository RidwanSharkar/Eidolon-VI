import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { DetailedTree } from './terrainGenerators';

interface TreeBranch {
  start: Vector3;
  end: Vector3;
  radius: number;
  children: TreeBranch[];
  rotation: Vector3;
}

interface DetailedTreesProps {
  trees: DetailedTree[];
}

// Seeded random number generator for consistent tree generation
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

// Function to generate a natural tree structure with a seed for consistency
const generateTreeStructure = (seed: number): TreeBranch[] => {
  const rng = new SeededRandom(seed);
  
  const trunkHeight = 3 + rng.random() * 2; // 3-5 units tall
  const trunkRadius = 0.15 + rng.random() * 0.1; // 0.15-0.25 radius
  
  // Determine tree type for variety
  const treeType = rng.random();
  let isSparse = false;
  let isDense = false;
  
  if (treeType < 0.3) {
    isSparse = true; // 30% chance for sparse trees
  } else if (treeType > 0.7) {
    isDense = true; // 30% chance for dense trees
  }
  // 40% chance for normal trees
  
  // Create main trunk with slight natural curve
  const trunkCurve = (rng.random() - 0.5) * 0.3; // Slight trunk curve
  const trunk: TreeBranch = {
    start: new Vector3(0, 0, 0),
    end: new Vector3(trunkCurve, trunkHeight, 0),
    radius: trunkRadius,
    children: [],
    rotation: new Vector3(0, 0, 0)
  };
  
  // Generate main branches from trunk
  let mainBranchCount = 4 + Math.floor(rng.random() * 4); // 4-7 main branches (increased)
  if (isSparse) mainBranchCount = Math.max(3, mainBranchCount - 2); // Fewer branches for sparse trees
  if (isDense) mainBranchCount = mainBranchCount + 3; // More branches for dense trees
  
  const branchStartHeight = trunkHeight * (0.5 + rng.random() * 0.2); // Start branching at 50-70% of trunk height
  
  for (let i = 0; i < mainBranchCount; i++) {
    const angle = (i / mainBranchCount) * Math.PI * 2 + (rng.random() - 0.5) * 0.8;
    const height = branchStartHeight + (rng.random() - 0.5) * trunkHeight * 0.4;
    const length = 1.2 + rng.random() * 1.8; // 1.2-3 units long
    const radius = trunkRadius * (0.5 + rng.random() * 0.5); // 50-100% of trunk radius
    
    // Natural upward-growing branches
    const upwardAngle = Math.PI * 0.15 + rng.random() * Math.PI * 0.25; // 15-40 degrees upward
    const horizontalSpread = 0.4 + rng.random() * 0.3; // Reduced horizontal spread (0.4-0.7)
    const verticalGrowth = Math.cos(upwardAngle) * length; // Strong vertical component
    const horizontalGrowth = Math.sin(upwardAngle) * length * horizontalSpread;
    
    const branch: TreeBranch = {
      start: new Vector3(0, height, 0),
      end: new Vector3(
        Math.cos(angle) * horizontalGrowth,
        height + verticalGrowth, // Strong upward growth
        Math.sin(angle) * horizontalGrowth
      ),
      radius: radius,
      children: [],
      rotation: new Vector3(
        (rng.random() - 0.5) * 0.3, // Less rotation variation
        angle + (rng.random() - 0.5) * 0.2,
        (rng.random() - 0.5) * 0.3
      )
    };
    
    // Generate secondary branches
    const secondaryCount = 3 + Math.floor(rng.random() * 4); // 3-6 secondary branches (increased)
    for (let j = 0; j < secondaryCount; j++) {
      const secAngle = angle + (rng.random() - 0.5) * 2.0;
      const secLength = length * (0.3 + rng.random() * 0.5); // 30-80% of main branch
      const secRadius = radius * (0.4 + rng.random() * 0.4); // 40-80% of main branch radius
      
      // Secondary branches also grow upward but at steeper angles
      const secUpwardAngle = Math.PI * 0.2 + rng.random() * Math.PI * 0.3; // 20-50 degrees upward
      const secHorizontalSpread = 0.3 + rng.random() * 0.4; // Even less horizontal spread
      const secVerticalGrowth = Math.cos(secUpwardAngle) * secLength;
      const secHorizontalGrowth = Math.sin(secUpwardAngle) * secLength * secHorizontalSpread;
      
      const secondaryBranch: TreeBranch = {
        start: branch.end.clone(),
        end: new Vector3(
          branch.end.x + Math.cos(secAngle) * secHorizontalGrowth,
          branch.end.y + secVerticalGrowth, // Strong upward growth
          branch.end.z + Math.sin(secAngle) * secHorizontalGrowth
        ),
        radius: secRadius,
        children: [],
        rotation: new Vector3(
          (rng.random() - 0.5) * 0.4,
          secAngle + (rng.random() - 0.5) * 0.3,
          (rng.random() - 0.5) * 0.4
        )
      };
      
      // Removed tertiary branches to prevent cactus-like appearance
      
      branch.children.push(secondaryBranch);
    }
    
    trunk.children.push(branch);
  }
  
  return [trunk];
};

// Function to create branch geometry
const createBranchGeometry = (branch: TreeBranch): THREE.BufferGeometry => {
  const direction = branch.end.clone().sub(branch.start);
  const length = direction.length();
  
  // Create a cylinder for the branch
  const geometry = new THREE.CylinderGeometry(
    branch.radius * 0.8, // Top radius (slightly smaller)
    branch.radius,        // Bottom radius
    length,
    6                     // 6 segments for natural look
  );
  
  // Position cylinder so it starts at origin and extends along Y-axis
  geometry.translate(0, length / 2, 0);
  
  return geometry;
};

// Function to create foliage cone geometry - reduced segments for better performance
const createFoliageCone = (rng: SeededRandom, scale: number = 1): THREE.ConeGeometry => {
  const coneRadius = 0.3 + rng.random() * 0.4; // 0.3-0.7 radius
  const coneHeight = 0.3 + rng.random() * 0.5; // 0.6-1.4 height
  
  return new THREE.ConeGeometry(
    coneRadius * scale,
    coneHeight * scale,
    6, // 6 segments for better performance (was 8)
    1  // 1 height segment
  );
};

const DetailedTrees: React.FC<DetailedTreesProps> = ({ trees }) => {
  const treeGroupsRef = useRef<THREE.Group[]>([]);

  // Generate tree structures using seeds for consistency
  const treeStructures = useMemo(() => {
    return trees.map(tree => ({
      ...tree,
      branches: generateTreeStructure(tree.seed || 1)
    }));
  }, [trees]);

  // Shared materials for better performance - created once and reused
  const sharedMaterials = useMemo(() => {
    const foliageColors = [
      new THREE.Color(0x228B22), // Forest green
      new THREE.Color(0x32CD32), // Lime green
      new THREE.Color(0x90EE90), // Light green
      new THREE.Color(0x00FF7F), // Spring green
      new THREE.Color(0x3CB371), // Medium sea green
      new THREE.Color(0x2E8B57), // Sea green
      new THREE.Color(0x98FB98), // Pale green
      new THREE.Color(0x00FA9A)  // Medium spring green
    ];
    
    return {
      foliageMaterials: foliageColors.map(color => 
        new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.85,
          metalness: 0.0,
          emissive: color.clone().multiplyScalar(0.1),
          emissiveIntensity: 0.25
        })
      )
    };
  }, []);

  useEffect(() => {
    // Clear previous trees
    treeGroupsRef.current.forEach(group => {
      if (group.parent) {
        group.parent.remove(group);
      }
    });
    treeGroupsRef.current = [];

    // Create new trees
    treeStructures.forEach((tree) => {
      const treeGroup = new THREE.Group();
      const rng = new SeededRandom(tree.seed || 1);
      
      // Create trunk with reduced segments for better performance
      const trunkGeometry = new THREE.CylinderGeometry(
        tree.trunkRadius * 0.8,
        tree.trunkRadius,
        tree.height,
        6 // Reduced from 8 to 6 segments
      );
      
      // Create more realistic bark material with color variation
      const barkColorVariation = 0.2; // 20% color variation
      const trunkColorWithVariation = tree.trunkColor.clone().multiplyScalar(
        1.0 + rng.random() * barkColorVariation
      );
      
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: trunkColorWithVariation,
        roughness: 0.85 + rng.random() * 0.1, // 0.85-0.95 for bark texture
        metalness: 0.05 + rng.random() * 0.05, // 0.05-0.1 for subtle variation
        emissive: trunkColorWithVariation.clone().multiplyScalar(0.05),
        emissiveIntensity: 0.15 + rng.random() * 0.1
      });
      
      const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunkMesh.position.y = tree.height / 2;
      treeGroup.add(trunkMesh);

      // Create branches recursively - using shared materials for better performance
      const createBranches = (branches: TreeBranch[], parentGroup: THREE.Group) => {
        branches.forEach(branch => {
          const branchGeometry = createBranchGeometry(branch);
          
          // Create branch material with color variation based on branch size
          const branchColorVariation = 0.2; // 20% color variation for branches
          const branchColor = tree.trunkColor.clone().multiplyScalar(
            0.85 + rng.random() * branchColorVariation
          );
          
          const branchMaterial = new THREE.MeshStandardMaterial({
            color: branchColor,
            roughness: 0.9 + rng.random() * 0.08,
            metalness: 0.02 + rng.random() * 0.03,
            emissive: branchColor.clone().multiplyScalar(0.03),
            emissiveIntensity: 0.08 + rng.random() * 0.07
          });
          
          const branchMesh = new THREE.Mesh(branchGeometry, branchMaterial);
          
          // Position branch at start point
          branchMesh.position.copy(branch.start);
          
          // Calculate direction and rotation to align branch properly
          const direction = branch.end.clone().sub(branch.start).normalize();
          const up = new Vector3(0, 1, 0);
          
          // Create quaternion to rotate from up vector to branch direction
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(up, direction);
          branchMesh.setRotationFromQuaternion(quaternion);
          
          parentGroup.add(branchMesh);
          
          // Add foliage cones at terminal branches (branches with no children)
          if (branch.children.length === 0) {
            const coneGeometry = createFoliageCone(rng, tree.scale);
            
            // Use shared foliage material for better performance
            const foliageMaterial = sharedMaterials.foliageMaterials[
              Math.floor(rng.random() * sharedMaterials.foliageMaterials.length)
            ];
            
            const coneMesh = new THREE.Mesh(coneGeometry, foliageMaterial);
            
            // Position cone at the end of the branch
            coneMesh.position.copy(branch.end);
            
            // Add slight random rotation for natural variation
            coneMesh.rotation.x = (rng.random() - 0.5) * 0.3;
            coneMesh.rotation.z = (rng.random() - 0.5) * 0.3;
            coneMesh.rotation.y = rng.random() * Math.PI * 2;
            
            // Slightly offset the cone upward so it sits naturally on the branch
            coneMesh.position.y += 0.1;
            
            parentGroup.add(coneMesh);
          }
          
          // Recursively add child branches
          if (branch.children.length > 0) {
            createBranches(branch.children, parentGroup);
          }
        });
      };

      createBranches(tree.branches, treeGroup);
      
      // Position the entire tree
      treeGroup.position.copy(tree.position);
      treeGroup.scale.setScalar(tree.scale);
      
      // Use FIXED rotations instead of random ones to prevent spinning
      treeGroup.rotation.y = tree.rotationY ?? rng.random() * Math.PI * 2;
      treeGroup.rotation.x = tree.rotationX ?? (rng.random() - 0.5) * 0.1;
      treeGroup.rotation.z = tree.rotationZ ?? (rng.random() - 0.5) * 0.1;
      
      // Add some position variation using seeded random for consistency
      const positionVariation = 0.5;
      treeGroup.position.x += (rng.random() - 0.5) * positionVariation;
      treeGroup.position.z += (rng.random() - 0.5) * positionVariation;
      
      treeGroupsRef.current.push(treeGroup);
    });
  }, [treeStructures, sharedMaterials]);

  return (
    <group>
      {treeGroupsRef.current.map((treeGroup, index) => (
        <primitive key={index} object={treeGroup} />
      ))}
    </group>
  );
};

export default DetailedTrees;
