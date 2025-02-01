import * as THREE from 'three';
//DISABLED FOR NOW - Planet

export class FrustumCuller {
  private frustum: THREE.Frustum;
  private matrix: THREE.Matrix4;

  constructor() {
    this.frustum = new THREE.Frustum();
    this.matrix = new THREE.Matrix4();
  }

  updateFrustum(camera: THREE.Camera) {
    this.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.matrix);
  }

  isInView(position: THREE.Vector3, radius: number = 5): boolean {
    return this.frustum.containsPoint(position) || 
           this.frustum.intersectsSphere(new THREE.Sphere(position, radius));
  }
} 