import { spawn } from 'child_process';
export interface MediaMetadata {
    duration: number;
    width: number;
    height: number;
    videoCodec: string;
    audioCodec: string | null;
    bitrate: number;
    frameRate: number;
    totalFrames: number;
}
export declare class MediaProbeService {
    private readonly spawnProcess;
    constructor(spawnProcess?: typeof spawn);
    probeFile(filePath: string): Promise<MediaMetadata>;
    private parseProbeOutput;
}
export declare const mediaProbeService: MediaProbeService;
