import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import * as git from '../src/git'

describe('git', () => {
  let tmpDir: string
  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verified-bot-commit_'))
  })
  afterAll(() => {
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('buildCommitMessage', () => {
    test('accepts a message', async () => {
      // Set message
      const message = 'Some message'

      // Check result
      const result = git.buildCommitMessage('Some message')
      expect(result).toEqual(message)
    })

    test('accepts a message from file', async () => {
      // Set message
      const message = 'Some message'

      // Write to file
      const file = path.join(tmpDir, 'test-message.txt')
      fs.writeFileSync(file, message)

      // Check result
      const result = git.buildCommitMessage(undefined, file)
      expect(result).toEqual(message)
    })
  })

  describe('normalizeRef', () => {
    test.each([
      ['test', 'heads/test'],
      ['heads/test', 'heads/test'],
      ['refs/heads/test', 'heads/test'],
      ['feat/test', 'heads/feat/test'],
      ['heads/feat/test', 'heads/feat/test'],
      ['refs/heads/refs', 'heads/refs']
    ])('handles %s', async (ref, expected) => {
      // Check each result
      const result = git.normalizeRef(ref)
      expect(result).toEqual(expected)
    })
  })

  describe('getFileMode', () => {
    test('returns correct mode for regular file', async () => {
      // Create file
      const file = path.join(tmpDir, 'test-regular-file.txt')
      fs.closeSync(fs.openSync(file, 'w'))

      // Check result
      const result = git.getFileMode(file, true)
      expect(result).toEqual('100644')
    })

    test('returns correct mode for executable file', async () => {
      // Create file and make it executable
      const file = path.join(tmpDir, 'test-exec')
      fs.closeSync(fs.openSync(file, 'w'))
      fs.chmodSync(file, fs.constants.S_IXUSR)

      // Check result
      const result = git.getFileMode(file, true)
      expect(result).toEqual('100755')
    })

    test('returns correct mode for directory', async () => {
      // Check result
      const result = git.getFileMode(tmpDir, true)
      expect(result).toEqual('040000')
    })

    test('returns correct mode for symlinks', async () => {
      // Create symlink
      const symlink = path.join(tmpDir, 'link')
      fs.symlinkSync(tmpDir, symlink)

      // Check result
      const result = git.getFileMode(symlink, true)
      expect(result).toEqual('120000')
    })

    test('returns correct mode for symlinks when not following', async () => {
      // Create file
      const file = path.join(tmpDir, 'test-file.txt')
      fs.closeSync(fs.openSync(file, 'w'))

      // Create symlink
      const symlink = path.join(tmpDir, 'test-link')
      fs.symlinkSync(tmpDir, symlink)

      // Check result
      const dirResult = git.getFileMode(symlink, false)
      const fileResult = git.getFileMode(file, false)
      expect(dirResult).toEqual('040000')
      expect(fileResult).toEqual('100644')
    })
  })
})
