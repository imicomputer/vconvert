import { EncodingStrategy } from './EncodingStrategy.js';
/**
 * StrategyRegistry: Factory for encoding strategy selection
 * Implements Strategy Pattern for extensible format support
 * Validates Property 8: Strategy Pattern Extensibility
 */
export declare class StrategyRegistry {
    private strategies;
    constructor();
    /**
     * Register all built-in encoding strategies
     */
    private registerDefaultStrategies;
    /**
     * Register a custom encoding strategy (extensibility)
     */
    register(format: string, strategy: EncodingStrategy): void;
    /**
     * Get encoding strategy for a target format
     */
    getStrategy(targetFormat: string): EncodingStrategy;
    /**
     * Check if a format is supported
     */
    isFormatSupported(format: string): boolean;
    /**
     * Get list of all supported formats
     */
    getSupportedFormats(): string[];
    /**
     * Get all registered strategies (for inspection/testing)
     */
    getAllStrategies(): Map<string, EncodingStrategy>;
    /**
     * Validates Property 8: Strategy Pattern Extensibility
     * Confirms that new strategies can be added at runtime
     */
    validateExtensibility(): {
        extensible: boolean;
        registeredCount: number;
        canAddNew: boolean;
    };
}
export declare const strategyRegistry: StrategyRegistry;
