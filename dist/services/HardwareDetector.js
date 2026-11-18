import { spawn } from 'child_process';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
export class HardwareDetector {
    constructor() {
        this.status = null;
    }
    async detectAvailableAccelerators() {
        logger.info('Starting hardware acceleration detection...');
        const nvidiaAvailable = await this.testNvidiaNVENC();
        const amdAvailable = nvidiaAvailable ? false : await this.testAmdVAAMF();
        let activeAccelerator = 'cpu';
        if (nvidiaAvailable) {
            activeAccelerator = 'nvidia';
            logger.info('✅ NVIDIA NVENC detected as primary accelerator');
        }
        else if (amdAvailable) {
            activeAccelerator = 'amd';
            logger.info('✅ AMD VAAPI/AMF detected as primary accelerator');
        }
        else {
            logger.info('⚠️  No GPU accelerators detected, using CPU encoding');
        }
        this.status = {
            nvidia: nvidiaAvailable,
            amd: amdAvailable,
            activeAccelerator,
            detectionTime: new Date()
        };
        return this.status;
    }
    getStatus() {
        if (!this.status) {
            throw new Error('Hardware detection not yet performed');
        }
        return this.status;
    }
    testNvidiaNVENC() {
        return new Promise((resolve) => {
            logger.debug('Testing NVIDIA NVENC availability...');
            const timeout = setTimeout(() => {
                logger.debug('NVIDIA NVENC test timeout');
                resolve(false);
            }, config.hardwareDetectionTimeout);
            try {
                const proc = spawn('ffmpeg', [
                    '-f', 'lavfi',
                    '-i', 'color=c=black:s=1280x720:d=0.1',
                    '-c:v', 'h264_nvenc',
                    '-t', '0.1',
                    '-f', 'null',
                    '-'
                ]);
                let hasError = false;
                proc.stderr.on('data', (data) => {
                    const message = data.toString();
                    if (message.includes('Unknown encoder') || message.includes('not found')) {
                        hasError = true;
                    }
                });
                proc.on('exit', (code) => {
                    clearTimeout(timeout);
                    resolve(!hasError && code === 0);
                });
                proc.on('error', () => {
                    clearTimeout(timeout);
                    resolve(false);
                });
            }
            catch (error) {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }
    testAmdVAAMF() {
        return new Promise((resolve) => {
            logger.debug('Testing AMD VAAPI/AMF availability...');
            const timeout = setTimeout(() => {
                logger.debug('AMD VAAPI test timeout');
                resolve(false);
            }, config.hardwareDetectionTimeout);
            try {
                const proc = spawn('ffmpeg', [
                    '-vaapi_device', config.vaapiDevice,
                    '-f', 'lavfi',
                    '-i', 'color=c=black:s=1280x720:d=0.1',
                    '-vf', 'format=nv12,hwupload',
                    '-c:v', 'h264_vaapi',
                    '-t', '0.1',
                    '-f', 'null',
                    '-'
                ]);
                let hasError = false;
                proc.stderr.on('data', (data) => {
                    const message = data.toString();
                    if (message.includes('Unknown encoder') || message.includes('not found')) {
                        hasError = true;
                    }
                });
                proc.on('exit', (code) => {
                    clearTimeout(timeout);
                    resolve(!hasError && code === 0);
                });
                proc.on('error', () => {
                    clearTimeout(timeout);
                    resolve(false);
                });
            }
            catch (error) {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }
}
export const hardwareDetector = new HardwareDetector();
//# sourceMappingURL=HardwareDetector.js.map