import { BufferGeometry, Material, MeshStandardMaterial } from 'three';
import { disposeEffectPools } from './EffectPools';

// Shared geometries across all scenes
export const sharedGeometries = {
  skeleton: null as BufferGeometry | null,
  mage: null as BufferGeometry | null,
  abomination: null as BufferGeometry | null,
  // Environment geometries
  tree: null as BufferGeometry | null,
  mountain: null as BufferGeometry | null,
  mushroom: null as BufferGeometry | null,
  // New
  boss: null as BufferGeometry | null,
  player: null as BufferGeometry | null,
  // Add any other shared geometries
};


// Shared materials across all scenes
export const sharedMaterials = {
  skeleton: null as Material | null,
  mage: null as Material | null,
  abomination: null as Material | null,
  // Environment materials
  tree: null as Material | null,
  mountain: null as Material | null,
  mushroom: null as Material | null,
  // New
  bossMaterial: null as Material | null,
  playerMaterial: null as Material | null,
  // Add any other shared materials
};

// Initialize shared resources
export function initializeSharedResources() {
  if (!sharedGeometries.skeleton) {
    // Initialize all geometries
    (Object.keys(sharedGeometries) as (keyof typeof sharedGeometries)[]).forEach(key => {
      sharedGeometries[key] = new BufferGeometry();
    });

    // Initialize all materials
    (Object.keys(sharedMaterials) as (keyof typeof sharedMaterials)[]).forEach(key => {
      sharedMaterials[key] = new MeshStandardMaterial();
    });
  }
}

// Cleanup shared resources
export function disposeSharedResources() {
  // Dispose effect pools first
  disposeEffectPools();

  Object.values(sharedGeometries).forEach(geo => geo?.dispose());
  Object.values(sharedMaterials).forEach(mat => mat?.dispose());
}