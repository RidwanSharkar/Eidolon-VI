import {
  SphereGeometry,
  PlaneGeometry,
  CylinderGeometry,
  TorusGeometry,
  ConeGeometry,
  BoxGeometry,
  RingGeometry,
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

// Spell effect sphere geometries
export const SHARED_SPHERE_GEOMETRY_SPELL_SMALL = new SphereGeometry(0.05, 6, 6);
export const SHARED_SPHERE_GEOMETRY_SPELL_MEDIUM = new SphereGeometry(0.25, 16, 16);
export const SHARED_SPHERE_GEOMETRY_SPELL_LARGE = new SphereGeometry(0.5, 32, 32);
export const SHARED_SPHERE_GEOMETRY_SPELL_XL = new SphereGeometry(1.0, 32, 32);
export const SHARED_SPHERE_GEOMETRY_SPELL_XXL = new SphereGeometry(2.0, 16, 16);
export const SHARED_SPHERE_GEOMETRY_SPELL_PARTICLE = new SphereGeometry(0.01, 6, 6);

// Plane geometries
export const SHARED_PLANE_GEOMETRY_1x01 = new PlaneGeometry(1, 0.1);
export const SHARED_PLANE_GEOMETRY_0125x15 = new PlaneGeometry(0.125, 15);
export const SHARED_PLANE_GEOMETRY_TRAIL = new PlaneGeometry(5.1, 0.25);

// Cylinder geometries
export const SHARED_CYLINDER_GEOMETRY_ARROW = new CylinderGeometry(0.025, 0.1, 1.8, 6);
export const SHARED_CYLINDER_GEOMETRY_SPEAR = new CylinderGeometry(0.08, 0.18, 1.5, 4);
export const SHARED_CYLINDER_GEOMETRY_SPELL = new CylinderGeometry(0.3, 0.4, 2, 6);

// Torus geometries - rings
export const SHARED_TORUS_GEOMETRY_RING_01 = new TorusGeometry(0.1, 0.04, 6, 10);
export const SHARED_TORUS_GEOMETRY_RING_013 = new TorusGeometry(0.13, 0.04, 6, 10);
export const SHARED_TORUS_GEOMETRY_RING_016 = new TorusGeometry(0.16, 0.04, 6, 10);
export const SHARED_TORUS_GEOMETRY_RING_02 = new TorusGeometry(0.2, 0.035, 3, 5);
export const SHARED_TORUS_GEOMETRY_RING_016_002 = new TorusGeometry(0.16, 0.02, 4, 5);

// Spell effect torus geometries
export const SHARED_TORUS_GEOMETRY_SPELL_SMALL = new TorusGeometry(0.4, 0.05, 8, 16);
export const SHARED_TORUS_GEOMETRY_SPELL_MEDIUM = new TorusGeometry(0.8, 0.075, 8, 32);
export const SHARED_TORUS_GEOMETRY_SPELL_LARGE = new TorusGeometry(1.5, 0.1, 8, 24);
export const SHARED_TORUS_GEOMETRY_SPELL_WIND_0 = new TorusGeometry(0.5 * 1.75, 0.1, 16, 32);
export const SHARED_TORUS_GEOMETRY_SPELL_WIND_1 = new TorusGeometry(1.0 * 1.75, 0.1, 16, 32);
export const SHARED_TORUS_GEOMETRY_SPELL_WIND_2 = new TorusGeometry(1.5 * 1.75, 0.1, 16, 32);

// Cone geometries
export const SHARED_CONE_GEOMETRY_SMALL = new ConeGeometry(0.08, 0.4, 6);
export const SHARED_CONE_GEOMETRY_SPELL = new ConeGeometry(0.25, 1.0, 8);

// Box geometries
export const SHARED_BOX_GEOMETRY_012x019x002 = new BoxGeometry(0.12, 0.19, 0.02);
export const SHARED_BOX_GEOMETRY_035x024x0015 = new BoxGeometry(0.035, 0.24, 0.015);

// Ring geometries (for spell effects)
export const SHARED_RING_GEOMETRY_WARNING = new RingGeometry(0, 1, 32); // Will be scaled dynamically

// Enemy model geometries - shared across all enemy instances
export const SHARED_ENEMY_SPHERE_SMALL = new SphereGeometry(0.02, 8, 8);
export const SHARED_ENEMY_SPHERE_MEDIUM = new SphereGeometry(0.06, 6, 6);
export const SHARED_ENEMY_SPHERE_LARGE = new SphereGeometry(0.22, 8, 8);
export const SHARED_ENEMY_SPHERE_XL = new SphereGeometry(0.26, 8, 8);

export const SHARED_ENEMY_CYLINDER_BONE = new CylinderGeometry(0.04, 0.032, 1, 4);
export const SHARED_ENEMY_CYLINDER_MEDIUM = new CylinderGeometry(0.03, 0.04, 2.8, 8);
export const SHARED_ENEMY_CYLINDER_LARGE = new CylinderGeometry(0.044, 0.035, 1.1, 6);
export const SHARED_ENEMY_CYLINDER_XL = new CylinderGeometry(0.066, 0.066, 0.165, 6);

export const SHARED_ENEMY_CONE_TOOTH = new ConeGeometry(0.03, 0.075, 3);
export const SHARED_ENEMY_CONE_LOWER_TOOTH = new ConeGeometry(0.01, 0.08, 3);
export const SHARED_ENEMY_CONE_CLAW = new ConeGeometry(0.022, 0.165, 6);

export const SHARED_ENEMY_BOX_SMALL = new BoxGeometry(0.12, 0.15, 0.08);
export const SHARED_ENEMY_BOX_MEDIUM = new BoxGeometry(0.28, 0.28, 0.1);
export const SHARED_ENEMY_BOX_LARGE = new BoxGeometry(0.34, 0.34, 0.12);

export const SHARED_ENEMY_TORUS_RIM = new TorusGeometry(0.2, 0.035, 3, 5);
export const SHARED_ENEMY_TORUS_BELT = new TorusGeometry(0.075, 0.03, 3, 16);

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
