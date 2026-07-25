import { readdirSync, type Dirent } from "node:fs";

// Directory listing that skips unreadable directories instead of aborting.
// Whole-repository walks routinely meet permission-denied and dangling-symlink
// entries; one of them must not end the run.
export function readDirSafe(directory: string): Dirent[] {
  try {
    return readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}
