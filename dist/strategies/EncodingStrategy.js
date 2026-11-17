/**
 * Abstract base class with shared padding logic
 */
export class BaseEncodingStrategy {
    constructor() {
        this.paddingFilter = 'pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p';
    }
    /**
     * Helper to build common FFmpeg command prefix
     */
    buildBaseCommand(inputPath, outputPath) {
        return ['-i', inputPath, '-y'];
    }
    /**
     * Helper to add video filter with padding
     */
    getVideoFilterWithPadding() {
        return this.paddingFilter;
    }
}
//# sourceMappingURL=EncodingStrategy.js.map