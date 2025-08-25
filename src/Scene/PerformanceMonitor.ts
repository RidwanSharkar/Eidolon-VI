/**
 * Performance Monitor for Towers Game
 * Tracks memory usage, object counts, and performance metrics
 */

// Type definitions for browser memory API
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

// Type definition for game metrics stored on window
interface GameMetrics {
  damageNumbers?: number;
  activeEffects?: number;
  enemies?: number;
  projectiles?: number;
  statusEffects?: number;
}

declare global {
  interface Window {
    __gameMetrics?: GameMetrics;
  }
}

interface PerformanceMetrics {
  memoryUsage: number;
  objectCounts: {
    damageNumbers: number;
    activeEffects: number;
    enemies: number;
    projectiles: number;
    statusEffects: number;
  };
  frameRate: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 100;
  private lastFrameTime = 0;
  private frameCount = 0;
  private frameRate = 0;

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startMonitoring() {
    // Only start monitoring on the client side
    if (typeof window === 'undefined') {
      return;
    }

    // Monitor frame rate
    const updateFrameRate = () => {
      const now = performance.now();
      this.frameCount++;
      
      if (now - this.lastFrameTime >= 1000) {
        this.frameRate = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      requestAnimationFrame(updateFrameRate);
    };
    updateFrameRate();

    // Collect metrics every 5 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 5000);
  }

  private collectMetrics() {
    // Only collect metrics on the client side
    if (typeof window === 'undefined') {
      return;
    }

    const memoryUsage = this.getMemoryUsage();
    const objectCounts = this.getObjectCounts();

    const metric: PerformanceMetrics = {
      memoryUsage,
      objectCounts,
      frameRate: this.frameRate,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Log performance warnings
    this.checkPerformanceWarnings(metric);
  }

  private getMemoryUsage(): number {
    const perf = performance as PerformanceWithMemory;
    if (perf.memory) {
      return perf.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private getObjectCounts() {
    // Only get object counts on the client side
    if (typeof window === 'undefined') {
      return {
        damageNumbers: 0,
        activeEffects: 0,
        enemies: 0,
        projectiles: 0,
        statusEffects: 0,
      };
    }

    // These will be updated by the game components
    const metrics = window.__gameMetrics;
    return {
      damageNumbers: metrics?.damageNumbers || 0,
      activeEffects: metrics?.activeEffects || 0,
      enemies: metrics?.enemies || 0,
      projectiles: metrics?.projectiles || 0,
      statusEffects: metrics?.statusEffects || 0,
    };
  }

  private checkPerformanceWarnings(metric: PerformanceMetrics) {
    const warnings: string[] = [];

    // Memory usage warning
    if (metric.memoryUsage > 200) {
      warnings.push(`🚨 High memory usage: ${metric.memoryUsage.toFixed(1)}MB`);
    }

    // Frame rate warning
    if (metric.frameRate < 30) {
      warnings.push(`🚨 Low frame rate: ${metric.frameRate}fps`);
    }

    // Object count warnings
    if (metric.objectCounts.damageNumbers > 50) {
      warnings.push(`🚨 Too many damage numbers: ${metric.objectCounts.damageNumbers}`);
    }

    if (metric.objectCounts.activeEffects > 100) {
      warnings.push(`🚨 Too many active effects: ${metric.objectCounts.activeEffects}`);
    }

    if (metric.objectCounts.projectiles > 30) {
      warnings.push(`🚨 Too many projectiles: ${metric.objectCounts.projectiles}`);
    }

    if (warnings.length > 0) {
      console.warn('⚠️ PERFORMANCE WARNINGS:', warnings.join(', '));
    }
  }

  public updateObjectCount(type: keyof PerformanceMetrics['objectCounts'], count: number) {
    // Only update object counts on the client side
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.__gameMetrics) {
      window.__gameMetrics = {};
    }
    window.__gameMetrics[type] = count;
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  public getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public logPerformanceSummary() {
    const latest = this.getLatestMetrics();
    if (!latest) return;

    console.log('📊 PERFORMANCE SUMMARY:');
    console.log(`Memory: ${latest.memoryUsage.toFixed(1)}MB`);
    console.log(`Frame Rate: ${latest.frameRate}fps`);
    console.log('Object Counts:', latest.objectCounts);
  }

  public reset() {
    this.metrics = [];
    if (typeof window !== 'undefined' && window.__gameMetrics) {
      window.__gameMetrics = {};
    }
    console.log('🔄 Performance monitor reset');
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-reset on game reset
if (typeof window !== 'undefined') {
  window.addEventListener('gameReset', () => {
    performanceMonitor.reset();
  });
}
