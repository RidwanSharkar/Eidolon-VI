import * as THREE from 'three';

// Generic object pool class
class ObjectPool<T> {
  private pool: T[] = [];
  private create: () => T;
  private reset?: (item: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, initialSize: number, maxSize: number, resetFn?: (item: T) => void) {
    this.create = createFn;
    this.reset = resetFn;
    this.maxSize = maxSize;
    
    // Initialize pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.create());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.create();
  }

  release(object: T) {
    if (this.pool.length >= this.maxSize) {
      return;
    }
    if (this.reset) {
      this.reset(object);
    }
    this.pool.push(object);
  }

  clear() {
    this.pool = [];
  }

  dispose() {
    this.pool.forEach(item => {
      if (item && typeof (item as unknown as { dispose?: () => void }).dispose === 'function') {
        ((item as unknown) as { dispose: () => void }).dispose();
      }
    });
    this.clear();
  }
}

// Shared geometry pools
class GeometryPools {
  private static instance: GeometryPools;
  
  // Skeleton slash effect geometries
  public slashMainTorus: ObjectPool<THREE.TorusGeometry>;
  public slashInnerGlow: ObjectPool<THREE.TorusGeometry>;
  public slashOuterGlow: ObjectPool<THREE.TorusGeometry>;
  public slashParticle: ObjectPool<THREE.SphereGeometry>;
  public slashTrailSegment: ObjectPool<THREE.CylinderGeometry>;
  
  // Skeleton charging indicator geometries
  public chargingAttackArea: ObjectPool<THREE.BufferGeometry>;
  public chargingRing: ObjectPool<THREE.RingGeometry>;
  public chargingOrb: ObjectPool<THREE.SphereGeometry>;
  public chargingLine: ObjectPool<THREE.CylinderGeometry>;
  
  // Mage effect geometries
  public mageFireballSphere: ObjectPool<THREE.SphereGeometry>;
  public mageTrailSegment: ObjectPool<THREE.SphereGeometry>;
  public mageLightningCylinder: ObjectPool<THREE.CylinderGeometry>;
  public mageLightningRing: ObjectPool<THREE.RingGeometry>;

  // Reaper effect geometries
  public reaperMistParticle: ObjectPool<THREE.SphereGeometry>;

  // DeathKnight effect geometries (reuse skeleton patterns)
  public deathKnightSlashTorus: ObjectPool<THREE.TorusGeometry>;
  public deathKnightSlashParticle: ObjectPool<THREE.SphereGeometry>;
  public deathKnightChargingArea: ObjectPool<THREE.BufferGeometry>;
  public deathKnightChargingRing: ObjectPool<THREE.RingGeometry>;
  public deathKnightChargingOrb: ObjectPool<THREE.SphereGeometry>;
  public deathGraspTentacle: ObjectPool<THREE.CylinderGeometry>;
  public frostStrikeShard: ObjectPool<THREE.ConeGeometry>;
  public frostStrikeRing: ObjectPool<THREE.RingGeometry>;

  // Ascendant effect geometries
  public ascendantLightningBolt: ObjectPool<THREE.CylinderGeometry>;
  public ascendantLightningRing: ObjectPool<THREE.RingGeometry>;
  public ascendantChargingArea: ObjectPool<THREE.BufferGeometry>;
  public ascendantChargingOrb: ObjectPool<THREE.SphereGeometry>;
  public ascendantForcePulse: ObjectPool<THREE.SphereGeometry>;

  private constructor() {
    // Skeleton slash effect pools
    this.slashMainTorus = new ObjectPool(
      () => new THREE.TorusGeometry(1.2, 0.15, 8, 32, Math.PI * 0.8),
      5, 10
    );
    
    this.slashInnerGlow = new ObjectPool(
      () => new THREE.TorusGeometry(1.2, 0.08, 16, 32, Math.PI * 0.8),
      5, 10
    );
    
    this.slashOuterGlow = new ObjectPool(
      () => new THREE.TorusGeometry(1.4, 0.2, 16, 32, Math.PI * 0.8),
      5, 10
    );
    
    this.slashParticle = new ObjectPool(
      () => new THREE.SphereGeometry(0.06, 6, 6),
      20, 40
    );
    
    this.slashTrailSegment = new ObjectPool(
      () => new THREE.CylinderGeometry(0.08, 0.02, 0.4, 8),
      15, 30
    );

    // Skeleton charging indicator pools
    this.chargingAttackArea = new ObjectPool(
      () => this.createAttackAreaGeometry(),
      5, 10
    );
    
    this.chargingRing = new ObjectPool(
      () => new THREE.RingGeometry(0.6, 0.68, 16),
      10, 20
    );
    
    this.chargingOrb = new ObjectPool(
      () => new THREE.SphereGeometry(0.08, 8, 8),
      10, 20
    );
    
    this.chargingLine = new ObjectPool(
      () => new THREE.CylinderGeometry(0.015, 0.015, 1, 6),
      20, 40
    );

    // Mage effect pools
    this.mageFireballSphere = new ObjectPool(
      () => new THREE.SphereGeometry(0.3, 8, 8),
      10, 20
    );
    
    this.mageTrailSegment = new ObjectPool(
      () => new THREE.SphereGeometry(0.15, 6, 6),
      30, 60
    );
    
    this.mageLightningCylinder = new ObjectPool(
      () => new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
      15, 30
    );
    
    this.mageLightningRing = new ObjectPool(
      () => new THREE.RingGeometry(0.5, 0.7, 16),
      10, 20
    );

    // Reaper effect pools
    this.reaperMistParticle = new ObjectPool(
      () => new THREE.SphereGeometry(0.25, 8, 8),
      60, 120 // High count since mist creates many particles and is used twice per use
    );

    // DeathKnight effect pools (similar to skeleton but with different styling)
    this.deathKnightSlashTorus = new ObjectPool(
      () => new THREE.TorusGeometry(1.4, 0.18, 8, 32, Math.PI * 0.9),
      5, 10
    );

    this.deathKnightSlashParticle = new ObjectPool(
      () => new THREE.SphereGeometry(0.08, 6, 6),
      20, 40
    );

    this.deathKnightChargingArea = new ObjectPool(
      () => this.createAttackAreaGeometry(),
      5, 10
    );

    this.deathKnightChargingRing = new ObjectPool(
      () => new THREE.RingGeometry(0.7, 0.78, 16),
      10, 20
    );

    this.deathKnightChargingOrb = new ObjectPool(
      () => new THREE.SphereGeometry(0.1, 8, 8),
      10, 20
    );

    this.deathGraspTentacle = new ObjectPool(
      () => new THREE.CylinderGeometry(0.12, 0.08, 2, 8),
      15, 30
    );

    this.frostStrikeShard = new ObjectPool(
      () => new THREE.ConeGeometry(0.15, 0.8, 6),
      20, 40
    );

    this.frostStrikeRing = new ObjectPool(
      () => new THREE.RingGeometry(1.0, 1.3, 16),
      10, 20
    );

    // Ascendant effect pools
    this.ascendantLightningBolt = new ObjectPool(
      () => new THREE.CylinderGeometry(0.08, 0.08, 1, 6),
      25, 50 // High count for frequent lightning effects
    );

    this.ascendantLightningRing = new ObjectPool(
      () => new THREE.RingGeometry(0.8, 1.0, 16),
      15, 30
    );

    this.ascendantChargingArea = new ObjectPool(
      () => this.createAttackAreaGeometry(),
      5, 10
    );

    this.ascendantChargingOrb = new ObjectPool(
      () => new THREE.SphereGeometry(0.12, 10, 10),
      10, 20
    );

    this.ascendantForcePulse = new ObjectPool(
      () => new THREE.SphereGeometry(1.0, 16, 16),
      8, 16
    );
  }

  private createAttackAreaGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const segments = 8;
    const attackRange = 2.65; // Default attack range
    
    // Center point
    vertices.push(0, 0.01, 0);
    
    // Create arc vertices
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments - 0.5) * Math.PI * 0.6; // 60 degree arc
      const x = Math.sin(angle) * attackRange;
      const z = Math.cos(angle) * attackRange;
      vertices.push(x, 0.01, z);
    }
    
    // Create triangles for the fan
    for (let i = 0; i < segments; i++) {
      indices.push(0, i + 1, i + 2);
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  public static getInstance(): GeometryPools {
    if (!GeometryPools.instance) {
      GeometryPools.instance = new GeometryPools();
    }
    return GeometryPools.instance;
  }

  public dispose() {
    this.slashMainTorus.dispose();
    this.slashInnerGlow.dispose();
    this.slashOuterGlow.dispose();
    this.slashParticle.dispose();
    this.slashTrailSegment.dispose();
    this.chargingAttackArea.dispose();
    this.chargingRing.dispose();
    this.chargingOrb.dispose();
    this.chargingLine.dispose();
    this.mageFireballSphere.dispose();
    this.mageTrailSegment.dispose();
    this.mageLightningCylinder.dispose();
    this.mageLightningRing.dispose();
    this.reaperMistParticle.dispose();
    this.deathKnightSlashTorus.dispose();
    this.deathKnightSlashParticle.dispose();
    this.deathKnightChargingArea.dispose();
    this.deathKnightChargingRing.dispose();
    this.deathKnightChargingOrb.dispose();
    this.deathGraspTentacle.dispose();
    this.frostStrikeShard.dispose();
    this.frostStrikeRing.dispose();
    this.ascendantLightningBolt.dispose();
    this.ascendantLightningRing.dispose();
    this.ascendantChargingArea.dispose();
    this.ascendantChargingOrb.dispose();
    this.ascendantForcePulse.dispose();
  }
}

// Shared material pools
class MaterialPools {
  private static instance: MaterialPools;
  
  // Skeleton slash materials
  public slashMain: ObjectPool<THREE.MeshStandardMaterial>;
  public slashInnerGlow: ObjectPool<THREE.MeshStandardMaterial>;
  public slashOuterGlow: ObjectPool<THREE.MeshStandardMaterial>;
  public slashParticle: ObjectPool<THREE.MeshStandardMaterial>;
  public slashTrail: ObjectPool<THREE.MeshStandardMaterial>;
  
  // Skeleton charging materials
  public chargingArea: ObjectPool<THREE.MeshBasicMaterial>;
  public chargingBorder: ObjectPool<THREE.MeshBasicMaterial>;
  public chargingRing: ObjectPool<THREE.MeshBasicMaterial>;
  public chargingOrb: ObjectPool<THREE.MeshStandardMaterial>;
  public chargingLine: ObjectPool<THREE.MeshStandardMaterial>;
  
  // Mage materials
  public mageFireball: ObjectPool<THREE.MeshStandardMaterial>;
  public mageTrail: ObjectPool<THREE.MeshStandardMaterial>;
  public mageLightning: ObjectPool<THREE.MeshStandardMaterial>;
  public mageLightningRing: ObjectPool<THREE.MeshBasicMaterial>;

  // Reaper materials
  public reaperMist: ObjectPool<THREE.MeshStandardMaterial>;

  // DeathKnight materials
  public deathKnightSlash: ObjectPool<THREE.MeshStandardMaterial>;
  public deathKnightSlashParticle: ObjectPool<THREE.MeshStandardMaterial>;
  public deathKnightChargingArea: ObjectPool<THREE.MeshBasicMaterial>;
  public deathKnightChargingRing: ObjectPool<THREE.MeshBasicMaterial>;
  public deathKnightChargingOrb: ObjectPool<THREE.MeshStandardMaterial>;
  public deathGrasp: ObjectPool<THREE.MeshStandardMaterial>;
  public frostStrike: ObjectPool<THREE.MeshStandardMaterial>;
  public frostStrikeRing: ObjectPool<THREE.MeshBasicMaterial>;

  // Ascendant materials
  public ascendantLightning: ObjectPool<THREE.MeshStandardMaterial>;
  public ascendantLightningRing: ObjectPool<THREE.MeshBasicMaterial>;
  public ascendantChargingArea: ObjectPool<THREE.MeshBasicMaterial>;
  public ascendantChargingOrb: ObjectPool<THREE.MeshStandardMaterial>;
  public ascendantForcePulse: ObjectPool<THREE.MeshStandardMaterial>;

  private constructor() {
    // Skeleton slash material pools
    this.slashMain = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#8B0000",
        emissive: "#8B0000",
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      5, 10,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 1.5;
      }
    );
    
    this.slashInnerGlow = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#A00000",
        emissive: "#A00000",
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      5, 10,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 1.0;
      }
    );
    
    this.slashOuterGlow = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#6B0000",
        emissive: "#6B0000",
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      5, 10,
      (material) => {
        material.opacity = 0.6;
        material.emissiveIntensity = 0.8;
      }
    );
    
    this.slashParticle = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#B00000",
        emissive: "#B00000",
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      20, 40,
      (material) => {
        material.opacity = 0.7;
        material.emissiveIntensity = 1.2;
      }
    );
    
    this.slashTrail = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#C00000",
        emissive: "#C00000",
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      15, 30,
      (material) => {
        material.opacity = 0.6;
        material.emissiveIntensity = 1.0;
      }
    );

    // Skeleton charging material pools
    this.chargingArea = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#FF4444",
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      }),
      5, 10,
      (material) => {
        material.opacity = 0.4;
      }
    );
    
    this.chargingBorder = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#FF0000",
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        wireframe: true
      }),
      5, 10,
      (material) => {
        material.opacity = 0.7;
      }
    );
    
    this.chargingRing = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#FF4444",
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      }),
      10, 20,
      (material) => {
        material.opacity = 0.5;
      }
    );
    
    this.chargingOrb = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#FF3333",
        emissive: "#FF0000",
        emissiveIntensity: 15,
        transparent: true,
        opacity: 0.9
      }),
      10, 20,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 15;
      }
    );
    
    this.chargingLine = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#FF3333",
        emissive: "#FF0000",
        emissiveIntensity: 8,
        transparent: true,
        opacity: 0.8
      }),
      20, 40,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 8;
      }
    );

    // Mage material pools
    this.mageFireball = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#FF4500",
        emissive: "#FF4500",
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.9
      }),
      10, 20,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 2.0;
      }
    );
    
    this.mageTrail = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#FF6600",
        emissive: "#FF4500",
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      }),
      30, 60,
      (material) => {
        material.opacity = 0.7;
        material.emissiveIntensity = 1.5;
      }
    );
    
    this.mageLightning = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#4444FF",
        emissive: "#4444FF",
        emissiveIntensity: 3.0,
        transparent: true,
        opacity: 0.8
      }),
      15, 30,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 3.0;
      }
    );
    
    this.mageLightningRing = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#6666FF",
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      }),
      10, 20,
      (material) => {
        material.opacity = 0.6;
      }
    );

    // Reaper material pools
    this.reaperMist = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#a8e6cf",
        emissive: "#a8e6cf",
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
      60, 120,
      (material) => {
        material.opacity = 0.6;
        material.emissiveIntensity = 0.5;
      }
    );

    // DeathKnight material pools
    this.deathKnightSlash = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#4A90E2", // Frost blue
        emissive: "#4A90E2",
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      5, 10,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 2.0;
      }
    );

    this.deathKnightSlashParticle = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#87CEEB", // Sky blue
        emissive: "#87CEEB",
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      20, 40,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 1.5;
      }
    );

    this.deathKnightChargingArea = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#4A90E2",
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      }),
      5, 10,
      (material) => {
        material.opacity = 0.4;
      }
    );

    this.deathKnightChargingRing = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#87CEEB",
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      }),
      10, 20,
      (material) => {
        material.opacity = 0.6;
      }
    );

    this.deathKnightChargingOrb = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#4A90E2",
        emissive: "#4A90E2",
        emissiveIntensity: 12,
        transparent: true,
        opacity: 0.9
      }),
      10, 20,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 12;
      }
    );

    this.deathGrasp = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#2E4057", // Dark blue-gray
        emissive: "#2E4057",
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.8
      }),
      15, 30,
      (material) => {
        material.opacity = 0.8;
        material.emissiveIntensity = 1.0;
      }
    );

    this.frostStrike = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#B0E0E6", // Powder blue
        emissive: "#B0E0E6",
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 0.9
      }),
      20, 40,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 2.5;
      }
    );

    this.frostStrikeRing = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#87CEEB",
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      }),
      10, 20,
      (material) => {
        material.opacity = 0.7;
      }
    );

    // Ascendant material pools
    this.ascendantLightning = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#FFD700", // Gold
        emissive: "#FFD700",
        emissiveIntensity: 3.5,
        transparent: true,
        opacity: 0.9
      }),
      25, 50,
      (material) => {
        material.opacity = 0.9;
        material.emissiveIntensity = 3.5;
      }
    );

    this.ascendantLightningRing = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#FFA500", // Orange
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      }),
      15, 30,
      (material) => {
        material.opacity = 0.8;
      }
    );

    this.ascendantChargingArea = new ObjectPool(
      () => new THREE.MeshBasicMaterial({
        color: "#FFD700",
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      }),
      5, 10,
      (material) => {
        material.opacity = 0.5;
      }
    );

    this.ascendantChargingOrb = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#FFD700",
        emissive: "#FFD700",
        emissiveIntensity: 18,
        transparent: true,
        opacity: 0.95
      }),
      10, 20,
      (material) => {
        material.opacity = 0.95;
        material.emissiveIntensity = 18;
      }
    );

    this.ascendantForcePulse = new ObjectPool(
      () => new THREE.MeshStandardMaterial({
        color: "#FFA500",
        emissive: "#FFA500",
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      }),
      8, 16,
      (material) => {
        material.opacity = 0.6;
        material.emissiveIntensity = 2.0;
      }
    );
  }

  public static getInstance(): MaterialPools {
    if (!MaterialPools.instance) {
      MaterialPools.instance = new MaterialPools();
    }
    return MaterialPools.instance;
  }

  public dispose() {
    this.slashMain.dispose();
    this.slashInnerGlow.dispose();
    this.slashOuterGlow.dispose();
    this.slashParticle.dispose();
    this.slashTrail.dispose();
    this.chargingArea.dispose();
    this.chargingBorder.dispose();
    this.chargingRing.dispose();
    this.chargingOrb.dispose();
    this.chargingLine.dispose();
    this.mageFireball.dispose();
    this.mageTrail.dispose();
    this.mageLightning.dispose();
    this.mageLightningRing.dispose();
    this.reaperMist.dispose();
    this.deathKnightSlash.dispose();
    this.deathKnightSlashParticle.dispose();
    this.deathKnightChargingArea.dispose();
    this.deathKnightChargingRing.dispose();
    this.deathKnightChargingOrb.dispose();
    this.deathGrasp.dispose();
    this.frostStrike.dispose();
    this.frostStrikeRing.dispose();
    this.ascendantLightning.dispose();
    this.ascendantLightningRing.dispose();
    this.ascendantChargingArea.dispose();
    this.ascendantChargingOrb.dispose();
    this.ascendantForcePulse.dispose();
  }
}

// Export singleton instances
export const geometryPools = GeometryPools.getInstance();
export const materialPools = MaterialPools.getInstance();

// Cleanup function for when the game shuts down
export const disposeEffectPools = () => {
  geometryPools.dispose();
  materialPools.dispose();
};
