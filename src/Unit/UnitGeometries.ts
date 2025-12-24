import { ConeGeometry, CylinderGeometry, SphereGeometry, TorusGeometry } from 'three';

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
};

// Dispose all geometries on cleanup
export function disposeUnitGeometries() {
  Object.values(UNIT_GEOMETRIES).forEach(geo => geo.dispose());
}
