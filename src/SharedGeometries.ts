import {
  SphereGeometry,
  PlaneGeometry,
  CylinderGeometry,
  TorusGeometry,
  ConeGeometry,
  BoxGeometry,
  Color,
  MeshBasicMaterial,
  BufferGeometry,
  Material
} from 'three';

// ============================================================================
// SHARED GEOMETRIES - Created once, reused everywhere to prevent memory leaks
// ============================================================================

// Basic shapes
export const SHARED_SPHERE_GEOMETRY_LOW = new SphereGeometry(0.08, 3, 3);
export const SHARED_SPHERE_GEOMETRY_MEDIUM = new SphereGeometry(0.3, 16, 16);
export const SHARED_SPHERE_GEOMETRY_HIGH = new SphereGeometry(0.42, 32, 32);
export const SHARED_SPHERE_GEOMETRY_GLOW = new SphereGeometry(0.415, 8, 8);

// Weapon-specific sphere geometries
export const SHARED_SPHERE_GEOMETRY_WEAPON_SMALL = new SphereGeometry(0.16, 16, 16);
export const SHARED_SPHERE_GEOMETRY_WEAPON_MEDIUM = new SphereGeometry(0.232, 16, 16);
export const SHARED_SPHERE_GEOMETRY_WEAPON_LARGE = new SphereGeometry(0.248, 16, 16);
export const SHARED_SPHERE_GEOMETRY_WEAPON_XL = new SphereGeometry(0.28, 16, 16);
export const SHARED_SPHERE_GEOMETRY_WEAPON_EFFECT = new SphereGeometry(1.2, 12, 12);

// Plane geometries
export const SHARED_PLANE_GEOMETRY_1x01 = new PlaneGeometry(1, 0.1);
export const SHARED_PLANE_GEOMETRY_0125x15 = new PlaneGeometry(0.125, 15);

// Cylinder geometries
export const SHARED_CYLINDER_GEOMETRY_ARROW = new CylinderGeometry(0.025, 0.1, 1.8, 6);
export const SHARED_CYLINDER_GEOMETRY_SPEAR = new CylinderGeometry(0.08, 0.18, 1.5, 4);

// Torus geometries
export const SHARED_TORUS_GEOMETRY_RING_01 = new TorusGeometry(0.1, 0.04, 6, 10);
export const SHARED_TORUS_GEOMETRY_RING_013 = new TorusGeometry(0.13, 0.04, 6, 10);
export const SHARED_TORUS_GEOMETRY_RING_016 = new TorusGeometry(0.16, 0.04, 6, 10);
export const SHARED_TORUS_GEOMETRY_RING_02 = new TorusGeometry(0.2, 0.035, 3, 5);
export const SHARED_TORUS_GEOMETRY_RING_016_002 = new TorusGeometry(0.16, 0.02, 4, 5);

// Cone geometries
export const SHARED_CONE_GEOMETRY_SMALL = new ConeGeometry(0.08, 0.4, 6);

// Box geometries
export const SHARED_BOX_GEOMETRY_012x019x002 = new BoxGeometry(0.12, 0.19, 0.02);
export const SHARED_BOX_GEOMETRY_035x024x0015 = new BoxGeometry(0.035, 0.24, 0.015);

// Extrude geometries (shapes defined per component as they vary)

// ============================================================================
// SHARED COLORS - Created once, reused everywhere to prevent memory leaks
// ============================================================================

export const SHARED_COLOR_METEOR_RED = new Color("#ff4400");
export const SHARED_COLOR_METEOR_ORANGE = new Color("#ff8800");
export const SHARED_COLOR_BLACK = new Color("#000000");
export const SHARED_COLOR_WHITE = new Color("#ffffff");
export const SHARED_COLOR_RED = new Color("#ff0000");
export const SHARED_COLOR_GREEN = new Color("#00ff00");
export const SHARED_COLOR_BLUE = new Color("#0000ff");

// ============================================================================
// SHARED MATERIALS - Created once, reused everywhere to prevent memory leaks
// ============================================================================

// Basic materials
export const SHARED_MESH_BASIC_MATERIAL_BLACK = new MeshBasicMaterial({ color: SHARED_COLOR_BLACK });
export const SHARED_MESH_BASIC_MATERIAL_WHITE = new MeshBasicMaterial({ color: SHARED_COLOR_WHITE });
export const SHARED_MESH_BASIC_MATERIAL_RED = new MeshBasicMaterial({ color: SHARED_COLOR_RED });
export const SHARED_MESH_BASIC_MATERIAL_GREEN = new MeshBasicMaterial({ color: SHARED_COLOR_GREEN });
export const SHARED_MESH_BASIC_MATERIAL_BLUE = new MeshBasicMaterial({ color: SHARED_COLOR_BLUE });

// Specific effect materials
export const SHARED_MESH_BASIC_MATERIAL_HEALTH_BAR_BG = new MeshBasicMaterial({ color: "#333333" });

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Clone geometries when you need unique instances (rarely needed)
export const cloneGeometry = (geometry: BufferGeometry): BufferGeometry => {
  return geometry.clone();
};

// Clone materials when you need unique instances (for per-instance properties)
export const cloneMaterial = (material: Material): Material => {
  return material.clone();
};
