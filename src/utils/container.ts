import { HardwareDetector } from '../services/HardwareDetector.js';
import { MediaProbeService } from '../services/MediaProbeService.js';
import { StrategyRegistry } from '../strategies/StrategyRegistry.js';
import { VideoConverterService } from '../services/VideoConverterService.js';
import { fileCleanupManager } from '../services/FileCleanupManager.js';
import { logger } from './logger.js';

/**
 * Simple Dependency Injection Container
 * Manages singleton instances of services
 */
class DIContainer {
  private singletons: Map<string, any> = new Map();

  /**
   * Register a singleton service
   */
  register<T>(name: string, instance: T): void {
    this.singletons.set(name, instance);
    logger.debug(`[DI] Registered singleton: ${name}`);
  }

  /**
   * Retrieve a registered service
   */
  get<T>(name: string): T {
    const instance = this.singletons.get(name);
    if (!instance) {
      throw new Error(`Service not registered in container: ${name}`);
    }
    return instance;
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.singletons.has(name);
  }

  /**
   * Clear all registered services (for testing)
   */
  clear(): void {
    this.singletons.clear();
    logger.debug('[DI] Container cleared');
  }
}

// Global container instance
export const container = new DIContainer();

/**
 * Initialize all core services and register them in the container
 * Called once at application startup
 */
export async function initializeContainer(): Promise<void> {
  logger.info('Initializing dependency injection container...');

  // Create and register HardwareDetector
  const hardwareDetector = new HardwareDetector();
  container.register('hardwareDetector', hardwareDetector);

  // Create and register MediaProbeService
  const mediaProbeService = new MediaProbeService();
  container.register('mediaProbeService', mediaProbeService);

  // Create and register StrategyRegistry
  const strategyRegistry = new StrategyRegistry();
  container.register('strategyRegistry', strategyRegistry);

  // Create and register VideoConverterService
  const videoConverterService = new VideoConverterService(
    hardwareDetector,
    mediaProbeService,
    strategyRegistry
  );
  container.register('videoConverterService', videoConverterService);

  // Register FileCleanupManager and start it
  container.register('fileCleanupManager', fileCleanupManager);
  fileCleanupManager.start();

  logger.info('[DI] Container initialization complete');
}

/**
 * Get services from container (type-safe helpers)
 */
export function getHardwareDetector(): HardwareDetector {
  return container.get('hardwareDetector');
}

export function getMediaProbeService(): MediaProbeService {
  return container.get('mediaProbeService');
}

export function getStrategyRegistry(): StrategyRegistry {
  return container.get('strategyRegistry');
}

export function getVideoConverterService(): VideoConverterService {
  return container.get('videoConverterService');
}

export function getFileCleanupManager() {
  return container.get('fileCleanupManager');
}
