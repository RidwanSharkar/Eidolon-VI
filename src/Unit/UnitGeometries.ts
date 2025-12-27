import { ConeGeometry, CylinderGeometry, PlaneGeometry, SphereGeometry, TorusGeometry } from 'three';

// Unit projectile geometries - shared to prevent memory leaks
// Created once and reused across all projectiles
export const UNIT_GEOMETRIES = {
  arrowCylinder: new CylinderGeometry(0.02, 0.075, 1.75, 6),
  arrowRing0: new TorusGeometry(0.125, 0.05, 6, 12),
  arrowRing1: new TorusGeometry(0.165, 0.05, 6, 12),
  arrowRing2: new TorusGeometry(0.205, 0.05, 6, 12),
  spearCylinder: new CylinderGeometry(0.08, 0.18, 1.5, 4),
  projectileSphere: new SphereGeometry(0.08, 3, 3),
  projectileParticle: new SphereGeometry(0.05, 3, 3),
  projectileTorus: new TorusGeometry(0.25, 0.06, 3, 6),
  projectileCone: new ConeGeometry(0.08, 0.4, 6),
  
  // MEMORY FIX: Explosion effect geometries - use scale instead of dynamic args
  explosionCore: new SphereGeometry(0.3, 32, 32),    // Scale dynamically with (1 + elapsed * 2)
  explosionInner: new SphereGeometry(0.2, 24, 24),   // Scale dynamically with (1 + elapsed * 3)
  explosionTorus0: new TorusGeometry(0.3, 0.05, 16, 32),  // Scale dynamically - thicker rings
  explosionTorus1: new TorusGeometry(0.5, 0.06, 16, 32),  // Scale dynamically - thicker rings
  explosionTorus2: new TorusGeometry(0.7, 0.07, 16, 32),  // Scale dynamically - thicker rings
  explosionTorusGround: new TorusGeometry(1.0, 0.08, 16, 32),  // Largest ring, perpendicular to ground - thicker
  
  // MEMORY FIX: Bow ground effect geometries - use scale instead of dynamic args
  bowPlaneMain: new PlaneGeometry(0.4, 1),           // Use scaleY for bowGroundEffectProgress
  bowPlaneSide: new PlaneGeometry(0.125, 1),         // Use scaleY for bowGroundEffectProgress
  
  // MEMORY FIX: Health bar geometry - base 1x0.08, use scaleX for health percentage
  healthBarFill: new PlaneGeometry(1, 0.08),
};

// Dispose all geometries on cleanup
export function disposeUnitGeometries() {
  Object.values(UNIT_GEOMETRIES).forEach(geo => geo.dispose());
}
