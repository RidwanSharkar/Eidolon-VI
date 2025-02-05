interface StealthState {
  isStealthed: boolean;
  hasShadowStrikeBuff: boolean;
  lastStealthStartTime: number | null;
  duration: number;
}

class StealthManager {
  private static instance: StealthManager;
  private state: StealthState = {
    isStealthed: false,
    hasShadowStrikeBuff: false,
    lastStealthStartTime: null,
    duration: 3500 // 4 seconds
  };

  private constructor() {}

  static getInstance(): StealthManager {
    if (!StealthManager.instance) {
      StealthManager.instance = new StealthManager();
    }
    return StealthManager.instance;
  }

  public activateStealth(): void {
    this.state.isStealthed = true;
    this.state.hasShadowStrikeBuff = true;
    this.state.lastStealthStartTime = Date.now();
  }

  public breakStealth(): void {
    this.state.isStealthed = false;
    this.state.hasShadowStrikeBuff = false;
    this.state.lastStealthStartTime = null;
    
    // Dispatch an event to notify all systems that stealth has broken
    window.dispatchEvent(new CustomEvent('stealthBreak'));
  }

  public isUnitStealthed(): boolean {
    if (!this.state.isStealthed || !this.state.lastStealthStartTime) {
      return false;
    }

    const elapsed = Date.now() - this.state.lastStealthStartTime;
    if (elapsed >= this.state.duration) {
      this.breakStealth();
      return false;
    }

    return true;
  }

  public hasShadowStrikeBuff(): boolean {
    // Ensure buff is only available if still stealthed
    if (!this.state.lastStealthStartTime) {
      return false;
    }

    const elapsed = Date.now() - this.state.lastStealthStartTime;
    if (elapsed >= this.state.duration) {
      this.breakStealth();
      return false;
    }

    return this.state.hasShadowStrikeBuff;
  }

  public consumeShadowStrikeBuff(): void {
    this.state.hasShadowStrikeBuff = false;
  }

  public getRemainingDuration(): number {
    if (!this.state.lastStealthStartTime) {
      return 0;
    }
    const elapsed = Date.now() - this.state.lastStealthStartTime;
    return Math.max(0, this.state.duration - elapsed);
  }
}

export const stealthManager = StealthManager.getInstance();