import * as THREE from 'three';
import { disposeEffectPools } from './EffectPools';

// Shared geometries across all scenes
export const sharedGeometries = {
  skeleton: null as THREE.BufferGeometry | null,
  mage: null as THREE.BufferGeometry | null,
  abomination: null as THREE.BufferGeometry | null,
  // Environment geometries
  tree: null as THREE.BufferGeometry | null,
  mountain: null as THREE.BufferGeometry | null,
  mushroom: null as THREE.BufferGeometry | null,
  // New
  boss: null as THREE.BufferGeometry | null,
  player: null as THREE.BufferGeometry | null,
  // Add any other shared geometries
};

// Shared materials across all scenes
export const sharedMaterials = {
  skeleton: null as THREE.Material | null,
  mage: null as THREE.Material | null,
  abomination: null as THREE.Material | null,
  // Environment materials
  tree: null as THREE.Material | null,
  mountain: null as THREE.Material | null,
  mushroom: null as THREE.Material | null,
  // New
  bossMaterial: null as THREE.Material | null,
  playerMaterial: null as THREE.Material | null,
  // Add any other shared materials
};

// Initialize shared resources
export function initializeSharedResources() {
  if (!sharedGeometries.skeleton) {
    // Initialize all geometries
    (Object.keys(sharedGeometries) as (keyof typeof sharedGeometries)[]).forEach(key => {
      sharedGeometries[key] = new THREE.BufferGeometry();
    });

    // Initialize all materials
    (Object.keys(sharedMaterials) as (keyof typeof sharedMaterials)[]).forEach(key => {
      sharedMaterials[key] = new THREE.MeshStandardMaterial();
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