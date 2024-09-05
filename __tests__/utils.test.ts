import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import * as utils from '../src/utils'

describe('utils', () => {
  let tmpDir: string
  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verified-bot-commit_'))
  })
  afterAll(() => {
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('fileExists', () => {
    test('accepts existing file', async () => {
      // Check result
      const result = utils.fileExists(tmpDir)
      expect(result).toBeTruthy()
    })

    test('rejects file that does not exist', async () => {
      // Set filename
      const file =
        process.platform === 'win32'
          ? 'D:\\some\\invalid\\file'
          : '/some/invalid/file'

      // Check result
      const result = utils.fileExists(file)
      expect(result).toBeFalsy()
    })
  })

  describe('isDirectory', () => {
    test('accepts a directory', async () => {
      // Check result
      const result = utils.isDirectory(tmpDir)
      expect(result).toBeTruthy()
    })

    test('rejects a file', async () => {
      // Create file
      const file = path.join(tmpDir, 'testfile.txt')
      fs.writeFileSync(file, 'foobar')

      // Check result
      const result = utils.isDirectory(file)
      expect(result).toBeFalsy()
    })
  })

  describe('relativePath', () => {
    test('resolves a relative path', async () => {
      // Set path
      const file = path.resolve('just', 'some', 'path')

      // Check result
      const result = utils.relativePath(file, __dirname)
      expect(result).toEqual(file)
    })

    test('resolves an absolute path', async () => {
      // Set path
      const file = path.resolve(__dirname, 'just', 'some', 'path')

      // Check result
      const expected = 'just/some/path'
      const result = utils.relativePath(file, __dirname)
      expect(result).toEqual(expected)
    })
  })

  describe('absolutePath', () => {
    test('resolves a relative path', async () => {
      // Set path
      const file = path.resolve('just', 'some', 'path')

      // Check result
      const expected = path.join(__dirname, file)
      const result = utils.absolutePath(file, __dirname)
      expect(result).toEqual(expected)
    })

    test('resolves an absolute path', async () => {
      // Set path
      const file = path.resolve(__dirname, 'just', 'some', 'path')

      // Check result
      const result = utils.absolutePath(file, __dirname)
      expect(result).toEqual(file)
    })
  })

  describe('normalizePath', () => {
    test('normalizes a path', async () => {
      // Set path
      const file = 'just\\\\some/test//path\\here'

      // Check result
      const expected = 'just/some/test/path/here'
      const result = utils.normalizePath(file)
      expect(result).toEqual(expected)
    })
  })
})
