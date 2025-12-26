// MEMORY FIX: Shared cached geometries and materials for enemy health bars
// All enemy units should import from here to prevent geometry leaks

import { PlaneGeometry, MeshBasicMaterial } from 'three';
import { registerGlobalSharedResource } from '../Scene/EffectPools';

// Standard enemy health bar (skeleton, mage, reaper, abomination, death knight)
export const HEALTHBAR_GEOMETRIES = {
  background: new PlaneGeometry(2.0, 0.25),
  fill: new PlaneGeometry(1, 0.23)  // Unit size, will be scaled by health percentage
};

export const HEALTHBAR_MATERIALS = {
  background: new MeshBasicMaterial({ color: "#333333", opacity: 0.8, transparent: true }),
  fill: new MeshBasicMaterial({ color: "#ff3333", opacity: 0.9, transparent: true })
};

// Boss health bar (Ascendant - larger)
export const BOSS_HEALTHBAR_GEOMETRIES = {
  background: new PlaneGeometry(2.5, 0.3),
  fill: new PlaneGeometry(1, 0.28)  // Unit size, will be scaled
};

export const BOSS_HEALTHBAR_MATERIALS = {
  background: new MeshBasicMaterial({ color: "#333333", opacity: 0.8, transparent: true }),
  fill: new MeshBasicMaterial({ color: "#cc4444", opacity: 0.9, transparent: true })
};

// Fallen Titan health bar (extra large)
export const TITAN_HEALTHBAR_GEOMETRIES = {
  background: new PlaneGeometry(4.0, 0.4),
  fill: new PlaneGeometry(1, 0.36)  // Unit size, will be scaled
};

export const TITAN_HEALTHBAR_MATERIALS = {
  background: new MeshBasicMaterial({ color: "#333333", opacity: 0.8, transparent: true }),
  fill: new MeshBasicMaterial({ color: "#cc2222", opacity: 0.9, transparent: true })
};

// Register all health bar resources for global disposal
let registeredHealthBarResources = false;
export const registerHealthBarResources = () => {
  if (registeredHealthBarResources || typeof window === 'undefined') return;
  try {
    registerGlobalSharedResource(() => {
      Object.values(HEALTHBAR_GEOMETRIES).forEach(geo => geo.dispose());
      Object.values(HEALTHBAR_MATERIALS).forEach(mat => mat.dispose());
      Object.values(BOSS_HEALTHBAR_GEOMETRIES).forEach(geo => geo.dispose());
      Object.values(BOSS_HEALTHBAR_MATERIALS).forEach(mat => mat.dispose());
      Object.values(TITAN_HEALTHBAR_GEOMETRIES).forEach(geo => geo.dispose());
      Object.values(TITAN_HEALTHBAR_MATERIALS).forEach(mat => mat.dispose());
    }, 'HealthBarResources');
    registeredHealthBarResources = true;
  } catch (error) {
    console.warn('Failed to register HealthBar resources:', error);
  }
};

// Auto-register when module loads (client-side only)
if (typeof window !== 'undefined') {
  registerHealthBarResources();
}
