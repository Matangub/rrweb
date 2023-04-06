import type { RRwebPlayerOptions } from 'rrweb-player';
declare type RRvideoConfig = {
    input: string;
    output?: string;
    headless?: boolean;
    fps?: number;
    cb?: (file: string, error: null | Error) => void;
    startDelayTime?: number;
    rrwebPlayer?: Omit<RRwebPlayerOptions['props'], 'events'>;
};
export declare class RRvideo {
    private browser;
    private page;
    private state;
    private config;
    constructor(config: RRvideoConfig);
    transform(): Promise<void>;
    updateConfig(config: RRvideoConfig): void;
    private startRecording;
    private finishRecording;
}
export declare function transformToVideo(config: RRvideoConfig): Promise<string>;
export {};
