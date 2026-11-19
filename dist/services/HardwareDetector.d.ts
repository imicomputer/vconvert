import { spawn } from 'child_process';
export interface HardwareStatus {
    nvidia: boolean;
    amd: boolean;
    activeAccelerator: 'nvidia' | 'amd' | 'cpu';
    detectionTime: Date;
}
export declare class HardwareDetector {
    private readonly spawnProcess;
    private status;
    constructor(spawnProcess?: typeof spawn);
    detectAvailableAccelerators(): Promise<HardwareStatus>;
    getStatus(): HardwareStatus;
    private testNvidiaNVENC;
    private testAmdVAAMF;
}
export declare const hardwareDetector: HardwareDetector;
