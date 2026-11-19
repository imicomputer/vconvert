import { EventEmitter } from 'node:events';

export interface FakeChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  killed: boolean;
  kill(): boolean;
}

export function createFakeChildProcess(): FakeChildProcess {
  const process = new EventEmitter() as FakeChildProcess;
  process.stdout = new EventEmitter();
  process.stderr = new EventEmitter();
  process.killed = false;
  process.kill = () => {
    process.killed = true;
    return true;
  };
  return process;
}

export function asSpawnProcess(
  implementation: (...args: unknown[]) => FakeChildProcess
): typeof import('node:child_process').spawn {
  return implementation as unknown as typeof import('node:child_process').spawn;
}
