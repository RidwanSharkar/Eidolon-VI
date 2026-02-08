import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  BufferAttribute
} from 'three';
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

// Function to create branch geometry with natural imperfections
const createBranchGeometry = (branch: TreeBranch, rng: SeededRandom): BufferGeometry => {
  const direction = branch.end.clone().sub(branch.start);
  const length = direction.length();
  
  // Create a cylinder for the branch
  const geometry = new CylinderGeometry(
    branch.radius * 0.8, // Top radius (slightly smaller)
    branch.radius,        // Bottom radius
    length,
    6,                    // 6 radial segments
    2                     // 2 height segments for bend
  );
  
  // Add natural imperfections by displacing vertices slightly
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // Add small random displacement for organic feel (0-3% variation)
    const displacement = 0.03;
    positions.setX(i, x * (1 + (rng.random() - 0.5) * displacement));
    positions.setZ(i, z * (1 + (rng.random() - 0.5) * displacement));
    
    // Add slight bend in the middle of branches
    const heightFactor = (y + length / 2) / length; // 0 to 1
    const bendAmount = Math.sin(heightFactor * Math.PI) * 0.05; // Subtle arc
    positions.setX(i, x + bendAmount * (rng.random() - 0.5));
  }
  
  positions.needsUpdate = true;
  geometry.computeVertexNormals(); // Recompute normals after vertex manipulation
  
  // Position cylinder so it starts at origin and extends along Y-axis
  geometry.translate(0, length / 2, 0);
  
  return geometry;
};

// Function to create foliage cone geometry with organic shape
const createFoliageCone = (rng: SeededRandom, scale: number = 1): ConeGeometry => {
  const coneRadius = 0.3 + rng.random() * 0.4; // 0.3-0.7 radius
  const coneHeight = 0.3 + rng.random() * 0.5; // 0.3-0.8 height
  
  const geometry = new ConeGeometry(
    coneRadius * scale,
    coneHeight * scale,
    6, // 6 segments for better performance
    1  // 1 height segment
  );
  
  // Add organic irregularity to foliage
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // Only displace the sides (not tip or base) for natural leaf clumping
    if (y !== coneHeight * scale / 2 && y !== -coneHeight * scale / 2) {
      const displacement = 0.15; // 15% variation for leafy appearance
      positions.setX(i, x * (1 + (rng.random() - 0.5) * displacement));
      positions.setZ(i, z * (1 + (rng.random() - 0.5) * displacement));
    }
  }
  
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  
  return geometry;
};

const DetailedTrees: React.FC<DetailedTreesProps> = ({ trees }) => {
  const windTimeRef = useRef(0);

  // Shared materials for better performance - created once and reused
  const sharedMaterials = useMemo(() => {
    const foliageColors = [
      new Color(0x1a6b1a), // Deep forest green
      new Color(0x228B22), // Forest green
      new Color(0x2d8b2d), // Medium forest green
      new Color(0x3a9b3a), // Brighter green
      new Color(0x2E8B57), // Sea green
      new Color(0x3CB371), // Medium sea green
      new Color(0x1f7a1f), // Dark green
      new Color(0x266b26)  // Pine green
    ];
    
    return {
      foliageMaterials: foliageColors.map((color, index) => 
        new MeshStandardMaterial({
          color: color,
          roughness: 0.9 + Math.random() * 0.08, // 0.9-0.98 for leafy texture
          metalness: 0.0,
          emissive: color.clone().multiplyScalar(0.08),
          emissiveIntensity: 0.15 + index * 0.02, // Slight variation 0.15-0.29
          flatShading: true // Adds geometric faceted look for stylized leaves
        })
      )
    };
  }, []);

  // Generate tree groups directly in useMemo for immediate rendering
  const generatedTrees = useMemo(() => {
    const treeGroups: Group[] = [];
    
    // Generate tree structures using seeds for consistency
    const treeStructures = trees.map(tree => ({
      ...tree,
      branches: generateTreeStructure(tree.seed || 1),
      windSpeed: 0.5 + Math.random() * 0.5,
      windPhase: Math.random() * Math.PI * 2,
      windStrength: 0.015 + Math.random() * 0.01
    }));

    treeStructures.forEach((tree) => {
      const treeGroup = new Group();
      const rng = new SeededRandom(tree.seed || 1);
      
      // Create trunk
      const trunkGeometry = new CylinderGeometry(
        tree.trunkRadius * 0.85,
        tree.trunkRadius * 1.05,
        tree.height,
        6,
        3
      );
      
      const trunkPositions = trunkGeometry.attributes.position;
      for (let i = 0; i < trunkPositions.count; i++) {
        const x = trunkPositions.getX(i);
        const y = trunkPositions.getY(i);
        const z = trunkPositions.getZ(i);
        const bumpAmount = 0.05;
        const heightFactor = (y + tree.height / 2) / tree.height;
        trunkPositions.setX(i, x * (1 + (rng.random() - 0.5) * bumpAmount * (1 - heightFactor * 0.5)));
        trunkPositions.setZ(i, z * (1 + (rng.random() - 0.5) * bumpAmount * (1 - heightFactor * 0.5)));
      }
      trunkPositions.needsUpdate = true;
      trunkGeometry.computeVertexNormals();
      
      const darkenFactor = 0.85 + rng.random() * 0.2;
      const trunkColorWithVariation = tree.trunkColor.clone().multiplyScalar(darkenFactor);
      
      const trunkMaterial = new MeshStandardMaterial({
        color: trunkColorWithVariation,
        roughness: 0.92 + rng.random() * 0.06,
        metalness: 0.02 + rng.random() * 0.03,
        emissive: trunkColorWithVariation.clone().multiplyScalar(0.03),
        emissiveIntensity: 0.1 + rng.random() * 0.08,
        flatShading: false
      });
      
      const trunkMesh = new Mesh(trunkGeometry, trunkMaterial);
      trunkMesh.position.y = tree.height / 2;
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      treeGroup.add(trunkMesh);

      const createBranches = (branches: TreeBranch[], parentGroup: Group) => {
        branches.forEach(branch => {
          const branchGeometry = createBranchGeometry(branch, rng);
          const darkenFactor = 0.8 + rng.random() * 0.25;
          const branchColor = tree.trunkColor.clone().multiplyScalar(darkenFactor);
          
          const branchMaterial = new MeshStandardMaterial({
            color: branchColor,
            roughness: 0.91 + rng.random() * 0.07,
            metalness: 0.015 + rng.random() * 0.025,
            emissive: branchColor.clone().multiplyScalar(0.025),
            emissiveIntensity: 0.07 + rng.random() * 0.06,
            flatShading: false
          });
          
          const branchMesh = new Mesh(branchGeometry, branchMaterial);
          branchMesh.castShadow = true;
          branchMesh.receiveShadow = true;
          branchMesh.position.copy(branch.start);
          
          const direction = branch.end.clone().sub(branch.start).normalize();
          const up = new Vector3(0, 1, 0);
          const quaternion = new Quaternion();
          quaternion.setFromUnitVectors(up, direction);
          branchMesh.setRotationFromQuaternion(quaternion);
          
          parentGroup.add(branchMesh);
          
          if (branch.children.length === 0) {
            const foliageCount = 1 + (rng.random() > 0.6 ? 1 : 0);
            for (let f = 0; f < foliageCount; f++) {
              const coneGeometry = createFoliageCone(rng, tree.scale);
              const materialIndex = Math.floor(rng.random() * sharedMaterials.foliageMaterials.length);
              const foliageMaterial = sharedMaterials.foliageMaterials[materialIndex];
              
              const coneMesh = new Mesh(coneGeometry, foliageMaterial);
              coneMesh.castShadow = true;
              coneMesh.receiveShadow = true;
              
              const clusterOffset = new Vector3(
                (rng.random() - 0.5) * 0.15,
                (rng.random() - 0.5) * 0.1,
                (rng.random() - 0.5) * 0.15
              );
              coneMesh.position.copy(branch.end).add(clusterOffset);
              coneMesh.rotation.x = (rng.random() - 0.5) * 0.5;
              coneMesh.rotation.z = (rng.random() - 0.5) * 0.5;
              coneMesh.rotation.y = rng.random() * Math.PI * 2;
              coneMesh.position.y += 0.08 + rng.random() * 0.05;
              const scaleVar = 0.85 + rng.random() * 0.3;
              coneMesh.scale.setScalar(scaleVar);
              parentGroup.add(coneMesh);
            }
          }
          
          if (branch.children.length > 0) {
            createBranches(branch.children, parentGroup);
          }
        });
      };

      createBranches(tree.branches, treeGroup);
      treeGroup.position.copy(tree.position);
      treeGroup.scale.setScalar(tree.scale);
      treeGroup.rotation.y = tree.rotationY ?? rng.random() * Math.PI * 2;
      treeGroup.rotation.x = tree.rotationX ?? (rng.random() - 0.5) * 0.1;
      treeGroup.rotation.z = tree.rotationZ ?? (rng.random() - 0.5) * 0.1;
      
      const positionVariation = 0.5;
      treeGroup.position.x += (rng.random() - 0.5) * positionVariation;
      treeGroup.position.z += (rng.random() - 0.5) * positionVariation;
      
      // Store custom data for wind animation
      (treeGroup as any).userData = {
        windSpeed: tree.windSpeed,
        windPhase: tree.windPhase,
        windStrength: tree.windStrength,
        baseRotationX: tree.rotationX || 0,
        baseRotationZ: tree.rotationZ || 0
      };

      treeGroups.push(treeGroup);
    });

    return treeGroups;
  }, [trees, sharedMaterials]);

  // Cleanup on unmount or when trees change
  useEffect(() => {
    return () => {
      generatedTrees.forEach(group => {
        group.traverse((child) => {
          if (child instanceof Mesh) {
            if (child.geometry) child.geometry.dispose();
            // Materials are either shared or created per mesh. 
            // In this version, we're creating materials per mesh for trunk/branches.
            // Shared foliage materials are handled separately.
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else if (!sharedMaterials.foliageMaterials.includes(child.material as MeshStandardMaterial)) {
                child.material.dispose();
              }
            }
          }
        });
      });
    };
  }, [generatedTrees, sharedMaterials]);

  // Cleanup shared materials on unmount
  useEffect(() => {
    return () => {
      sharedMaterials.foliageMaterials.forEach(m => m.dispose());
    };
  }, [sharedMaterials]);

  // Animate trees with gentle wind effect
  useFrame((state, delta) => {
    windTimeRef.current += delta;
    
    generatedTrees.forEach((treeGroup) => {
      const userData = (treeGroup as any).userData;
      if (treeGroup && userData) {
        const time = windTimeRef.current * userData.windSpeed + userData.windPhase;
        
        const swayX = Math.sin(time * 0.8) * userData.windStrength;
        const swayZ = Math.cos(time * 0.6) * userData.windStrength * 0.7;
        
        const microSwayX = Math.sin(time * 2.3) * userData.windStrength * 0.3;
        const microSwayZ = Math.cos(time * 1.9) * userData.windStrength * 0.3;
        
        treeGroup.rotation.x = userData.baseRotationX + swayX + microSwayX;
        treeGroup.rotation.z = userData.baseRotationZ + swayZ + microSwayZ;
        
        const heightBob = Math.sin(time * 1.2) * 0.02;
        treeGroup.position.y = heightBob;
      }
    });
  });

  return (
    <group>
      {generatedTrees.map((treeGroup, index) => (
        <primitive key={index} object={treeGroup} />
      ))}
    </group>
  );
};

export default DetailedTrees;
