import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function getAudioDuration(filePath: string): Promise<number> {
  const { stdout } = await execPromise(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
  );
  return parseFloat(stdout.trim());
}
