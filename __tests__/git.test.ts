import { Octokit } from '@octokit/core'
import { setupServer, SetupServerApi } from 'msw/node'
import MockFs from 'mock-fs'

import { handlers } from '../__fixtures__/handlers.js'
import { github } from '../__fixtures__/github.js'

import * as git from '../src/git.js'
import { GitBlob } from '../src/git.js'

let server: SetupServerApi
let octokit: Octokit

describe('git.ts', () => {
  beforeAll(() => {
    // Setup Octokit and mock HTTP responses (async)
    octokit = new Octokit()
    server = setupServer(...handlers)
    server.listen()
  })

  afterAll(() => {
    server.close()
  })

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

  describe('getRef', () => {
    test.each(['heads/featureA', 'tags/v1.2.3'])(
      'returns a Ref via REST API (ref: %s)',
      async (ref) => {
        const result = await git.getRef(ref, github.context, octokit)
        expect(result).toBe('aa218f56b14c9653891f9e74264a383fa43fefbd')
      }
    )
  })

  describe('createBlob', () => {
    test('creates a Blob via REST API', async () => {
      MockFs({
        '/workspace/some/file': 'some contents'
      })

      const result = await git.createBlob(
        'some/file',
        '/workspace',
        true,
        github.context,
        octokit
      )

      expect(result.mode).toBe('100644')
      expect(result.path).toBe('some/file')
      expect(result.sha).toBe('3a0f86fb8db8eea7ccbb9a95f325ddbedfb25e15')
      expect(result.type).toBe('blob')
    })
  })

  describe('createTree', () => {
    test('creates a Tree via REST API', async () => {
      const blobs: GitBlob[] = [
        {
          mode: '100644',
          path: 'some/file',
          sha: '3a0f86fb8db8eea7ccbb9a95f325ddbedfb25e15',
          type: 'blob'
        }
      ]

      const result = await git.createTree(
        blobs,
        '9fb037999f264ba9a7fc6274d15fa3ae2ab98312',
        github.context,
        octokit
      )

      expect(result).toBe('cd8274d15fa3ae2ab983129fb037999f264ba9a7')
    })
  })

  describe('createCommit', () => {
    test('creates a Commit via REST API', async () => {
      const result = await git.createCommit(
        'cd8274d15fa3ae2ab983129fb037999f264ba9a7',
        '9fb037999f264ba9a7fc6274d15fa3ae2ab98312',
        'my commit message',
        github.context,
        octokit
      )

      expect(result).toBe('7638417db6d59f3c431d3e1f261cc637155684cd')
    })
  })

  describe('updateRef', () => {
    test.each([
      ['heads/featureA', true],
      ['heads/featureA', false],
      ['tags/v1.2.3', true],
      ['tags/v1.2.3', false]
    ])('updates a Ref via REST API (ref: %s force: %s)', async (ref, force) => {
      const result = await git.updateRef(
        ref,
        '7638417db6d59f3c431d3e1f261cc637155684cd',
        force,
        github.context,
        octokit
      )

      expect(result).toBe('aa218f56b14c9653891f9e74264a383fa43fefbd')
    })
  })
})
