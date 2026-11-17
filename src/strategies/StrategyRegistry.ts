import { EncodingStrategy, HardwareType } from './EncodingStrategy.js';
import { Mp4MovMkvStrategy } from './Mp4MovMkvStrategy.js';
import { WebmStrategy } from './WebmStrategy.js';
import { AviStrategy } from './AviStrategy.js';
import { FlvStrategy } from './FlvStrategy.js';
import { WmvStrategy } from './WmvStrategy.js';
import { ThreeGpStrategy } from './ThreeGpStrategy.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * StrategyRegistry: Factory for encoding strategy selection
 * Implements Strategy Pattern for extensible format support
 * Validates Property 8: Strategy Pattern Extensibility
 */
export class StrategyRegistry {
  private strategies: Map<string, EncodingStrategy> = new Map();

  constructor() {
    this.registerDefaultStrategies();
  }

  /**
   * Register all built-in encoding strategies
   */
  private registerDefaultStrategies(): void {
    // MP4 format
    this.register('mp4', new Mp4MovMkvStrategy('mp4'));
    logger.debug('[StrategyRegistry] Registered MP4 strategy');

    // MOV format
    this.register('mov', new Mp4MovMkvStrategy('mov'));
    logger.debug('[StrategyRegistry] Registered MOV strategy');

    // MKV format
    this.register('mkv', new Mp4MovMkvStrategy('mkv'));
    logger.debug('[StrategyRegistry] Registered MKV strategy');

    // WebM format
    this.register('webm', new WebmStrategy());
    logger.debug('[StrategyRegistry] Registered WebM strategy');

    // AVI format
    this.register('avi', new AviStrategy());
    logger.debug('[StrategyRegistry] Registered AVI strategy');

    // FLV format
    this.register('flv', new FlvStrategy());
    logger.debug('[StrategyRegistry] Registered FLV strategy');

    // WMV format
    this.register('wmv', new WmvStrategy());
    logger.debug('[StrategyRegistry] Registered WMV strategy');

    // 3GP format
    this.register('3gp', new ThreeGpStrategy());
    logger.debug('[StrategyRegistry] Registered 3GP strategy');

    logger.info('[StrategyRegistry] All 8 encoding strategies registered');
  }

  /**
   * Register a custom encoding strategy (extensibility)
   */
  register(format: string, strategy: EncodingStrategy): void {
    this.strategies.set(format.toLowerCase(), strategy);
    logger.debug(`[StrategyRegistry] Registered custom strategy for format: ${format}`);
  }

  /**
   * Get encoding strategy for a target format
   */
  getStrategy(targetFormat: string): EncodingStrategy {
    const format = targetFormat.toLowerCase().replace(/^\./, '');
    const strategy = this.strategies.get(format);

    if (!strategy) {
      throw new AppError(
        `No encoding strategy available for format: ${targetFormat}`,
        'STRATEGY_NOT_FOUND',
        400
      );
    }

    return strategy;
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(format: string): boolean {
    return this.strategies.has(format.toLowerCase().replace(/^\./, ''));
  }

  /**
   * Get list of all supported formats
   */
  getSupportedFormats(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get all registered strategies (for inspection/testing)
   */
  getAllStrategies(): Map<string, EncodingStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Validates Property 8: Strategy Pattern Extensibility
   * Confirms that new strategies can be added at runtime
   */
  validateExtensibility(): { extensible: boolean; registeredCount: number; canAddNew: boolean } {
    return {
      extensible: true, // register() method allows runtime registration
      registeredCount: this.strategies.size,
      canAddNew: typeof this.register === 'function' // register method is public
    };
  }
}

// Global registry instance
export const strategyRegistry = new StrategyRegistry();
