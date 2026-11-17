import { HardwareDetector } from '../services/HardwareDetector.js';
import { MediaProbeService } from '../services/MediaProbeService.js';
import { StrategyRegistry } from '../strategies/StrategyRegistry.js';
import { logger } from './logger.js';
/**
 * Simple Dependency Injection Container
 * Manages singleton instances of services
 */
class DIContainer {
    constructor() {
        this.singletons = new Map();
    }
    /**
     * Register a singleton service
     */
    register(name, instance) {
        this.singletons.set(name, instance);
        logger.debug(`[DI] Registered singleton: ${name}`);
    }
    /**
     * Retrieve a registered service
     */
    get(name) {
        const instance = this.singletons.get(name);
        if (!instance) {
            throw new Error(`Service not registered in container: ${name}`);
        }
        return instance;
    }
    /**
     * Check if service is registered
     */
    has(name) {
        return this.singletons.has(name);
    }
    /**
     * Clear all registered services (for testing)
     */
    clear() {
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
export async function initializeContainer() {
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
    logger.info('[DI] Container initialization complete');
}
/**
 * Get services from container (type-safe helpers)
 */
export function getHardwareDetector() {
    return container.get('hardwareDetector');
}
export function getMediaProbeService() {
    return container.get('mediaProbeService');
}
export function getStrategyRegistry() {
    return container.get('strategyRegistry');
}
//# sourceMappingURL=container.js.map