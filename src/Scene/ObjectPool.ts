export class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  
  constructor(
    private factory: () => T,
    private initialSize: number,
    private expandSize: number,
    private maxSize: number
  ) {
    this.initialize();
  }

  private initialize() {
    for (let i = 0; i < this.initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  acquire(): T {
    if (this.available.length === 0 && this.size < this.maxSize) {
      this.expand();
    }
    
    const item = this.available.pop();
    if (!item) {
      throw new Error('Pool exhausted');
    }
    
    this.inUse.add(item);
    return item;
  }

  release(item: T) {
    if (this.inUse.has(item)) {
      this.inUse.delete(item);
      this.available.push(item);
    }
  }

  clear() {
    this.available = [];
    this.inUse.clear();
    this.initialize();
  }

  private expand() {
    const newSize = Math.min(this.size + this.expandSize, this.maxSize);
    const itemsToAdd = newSize - this.size;
    
    for (let i = 0; i < itemsToAdd; i++) {
      this.available.push(this.factory());
    }
  }

  get size() {
    return this.available.length + this.inUse.size;
  }
}
