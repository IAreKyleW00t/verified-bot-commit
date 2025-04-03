import mock from 'mock-fs'
import * as git from '../src/git.js'

describe('git.ts', () => {
  // Reset mocked filesystem after each test
  afterEach(mock.restore)

  describe('buildCommitMessage', () => {
    test('accepts a message', () => {
      const message = 'Some message'
      const result = git.buildCommitMessage('Some message')
      expect(result).toEqual(message)
    })

    test('accepts a message from file', () => {
      mock({
        'message.txt': 'Some message'
      })

      const result = git.buildCommitMessage(undefined, 'message.txt')
      expect(result).toEqual('Some message')
    })

    test('rejects an empty message', () => {
      const result = () => git.buildCommitMessage('')
      expect(result).toThrow('Commit message is empty')
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
    ])('handles %s', (ref, expected) => {
      const result = git.normalizeRef(ref)
      expect(result).toEqual(expected)
    })
  })

  describe('getFileMode', () => {
    test('returns correct mode for regular file', () => {
      mock({
        'test.txt': mock.file({ mode: 0o644 })
      })

      const result = git.getFileMode('test.txt', true)
      expect(result).toEqual('100644')
    })

    test('returns correct mode for executable file', () => {
      mock({
        test: mock.file({ mode: 0o755 })
      })

      const result = git.getFileMode('test', true)
      expect(result).toEqual('100755')
    })

    test('returns correct mode for directory', () => {
      mock({
        'test-dir': {}
      })

      const result = git.getFileMode('test-dir', true)
      expect(result).toEqual('040000')
    })

    test('returns correct mode for symlinks', () => {
      mock({
        file: 'some file',
        link: mock.symlink({
          path: 'file'
        })
      })

      const result = git.getFileMode('link', true)
      expect(result).toEqual('120000')
    })

    test('returns correct mode for symlinks when not following', () => {
      mock({
        file: 'some file',
        link: mock.symlink({
          path: 'file'
        })
      })

      const result = git.getFileMode('link', false)
      expect(result).toEqual('100644')
    })
  })
})
