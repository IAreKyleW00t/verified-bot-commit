import MockFs from 'mock-fs'
import * as git from '../src/git.js'

describe('git.ts', () => {
  afterEach(() => {
    // Reset mocked filesystem after each test
    MockFs.restore()
  })

  describe('buildCommitMessage', () => {
    test('accepts a message', () => {
      const message = 'Some message'
      const result = git.buildCommitMessage('Some message')
      expect(result).toEqual(message)
    })

    test('accepts a message from file', () => {
      MockFs({
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
      ['refs/heads/refs', 'heads/refs'],
      ['refs/tags/test-tag', 'tags/test-tag']
    ])('handles %s', (ref, expected) => {
      const result = git.normalizeRef(ref)
      expect(result).toEqual(expected)
    })
  })

  describe('getFileMode', () => {
    test('returns correct mode for regular file', () => {
      MockFs({
        'test.txt': MockFs.file({ mode: 0o644 })
      })

      const result = git.getFileMode('test.txt', true)
      expect(result).toEqual('100644')
    })

    test('returns correct mode for executable file', () => {
      MockFs({
        test: MockFs.file({ mode: 0o755 })
      })

      const result = git.getFileMode('test', true)
      expect(result).toEqual('100755')
    })

    test('returns correct mode for directory', () => {
      MockFs({
        'test-dir': {}
      })

      const result = git.getFileMode('test-dir', true)
      expect(result).toEqual('040000')
    })

    test('returns correct mode for symlinks', () => {
      MockFs({
        file: 'some file',
        link: MockFs.symlink({
          path: 'file'
        })
      })

      const result = git.getFileMode('link', true)
      expect(result).toEqual('120000')
    })

    test('returns correct mode for symlinks when not following', () => {
      MockFs({
        file: 'some file',
        link: MockFs.symlink({
          path: 'file'
        })
      })

      const result = git.getFileMode('link', false)
      expect(result).toEqual('100644')
    })
  })
})
