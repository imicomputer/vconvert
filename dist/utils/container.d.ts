import { HardwareDetector } from '../services/HardwareDetector.js';
import { MediaProbeService } from '../services/MediaProbeService.js';
import { StrategyRegistry } from '../strategies/StrategyRegistry.js';
/**
 * Simple Dependency Injection Container
 * Manages singleton instances of services
 */
declare class DIContainer {
    private singletons;
    /**
     * Register a singleton service
     */
    register<T>(name: string, instance: T): void;
    /**
     * Retrieve a registered service
     */
    get<T>(name: string): T;
    /**
     * Check if service is registered
     */
    has(name: string): boolean;
    /**
     * Clear all registered services (for testing)
     */
    clear(): void;
}
export declare const container: DIContainer;
/**
 * Initialize all core services and register them in the container
 * Called once at application startup
 */
export declare function initializeContainer(): Promise<void>;
/**
 * Get services from container (type-safe helpers)
 */
export declare function getHardwareDetector(): HardwareDetector;
export declare function getMediaProbeService(): MediaProbeService;
export declare function getStrategyRegistry(): StrategyRegistry;
export {};
