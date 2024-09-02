import * as core from '@actions/core'
import * as fs from 'fs'

export function fileExists(file: string): boolean {
  core.debug(`utils.fileExists(file: '${file}')`)

  try {
    fs.accessSync(file)
    core.debug('\t=> true')
    return true
  } catch (_) /* eslint-disable-line @typescript-eslint/no-unused-vars */ {
    core.debug('\t=>false')
    return false
  }
}

export function isDirectory(file: string): boolean {
  core.debug(`utils.isDirectory(file: '${file}')`)
  const isDir = fs.statSync(file).isDirectory()
  core.debug(`\t=>${isDir}`)
  return isDir
}
