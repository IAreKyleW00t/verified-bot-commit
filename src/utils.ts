import * as fs from 'fs'
import * as path from 'path'

export function fileExists(file: string): boolean {
  try {
    fs.accessSync(file)
    return true
  } catch (_) /* eslint-disable-line @typescript-eslint/no-unused-vars */ {
    return false
  }
}

export function isDirectory(file: string): boolean {
  return fs.statSync(file).isDirectory()
}

export function relativePath(file: string, workspace: string): string {
  if (file.startsWith(workspace)) {
    return file.replace(workspace, '').substring(1)
  }
  return file
}

export function absolutePath(file: string, workspace: string): string {
  return file.startsWith(workspace) ? file : path.join(workspace, file)
}

export function normalizePath(file: string): string {
  return file.replaceAll('\\', '/').replace(/(\/)\/+/g, '$1')
}
