import * as fs from 'fs'
import * as path from 'path'

import { Context } from '@actions/github/lib/context.js'
import { Octokit } from '@octokit/core'

export type GitMode = '100644' | '100755' | '040000' | '160000' | '120000'
export interface GitBlob {
  path: string
  mode: GitMode
  type: 'blob' // Only supported type in our case
  sha: string
}

export function buildCommitMessage(message?: string, file?: string): string {
  // Allow message to be either static or from contents in a file
  const output = file ? fs.readFileSync(file, 'utf-8') : message

  // Raise error if output commit message is empty
  if (!output) throw Error('Commit message is empty')
  else return output
}

export function normalizeRef(ref: string): string {
  // Ensure ref matches format `heads/<ref>`
  if (ref.startsWith('heads/')) return ref
  else if (ref.startsWith('refs/')) return ref.replace('refs/', '')
  else return `heads/${ref}`
}

export async function getRef(
  ref: string,
  context: Context,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref
    })
  ).data.object.sha
}

export async function getTree(
  sha: string,
  context: Context,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request(
      'GET /repos/{owner}/{repo}/git/commits/{commit_sha}',
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        commit_sha: sha
      }
    )
  ).data.tree.sha
}

export function getFileMode(file: string, symlink: boolean): GitMode {
  const stat = symlink ? fs.lstatSync(file) : fs.statSync(file)
  if (stat.isFile()) {
    // Check if execute bit is set on file for current user
    if (stat.mode & fs.constants.S_IXUSR) {
      return '100755'
    } else {
      return '100644'
    }
  } else if (stat.isDirectory()) {
    // Technically don't need to worry about submodules because
    // they aren't applicable in our case.
    return '040000'
  } else if (stat.isSymbolicLink()) {
    return '120000'
  } else throw Error(`Unknown file mode for ${file}`)
}

export async function createBlob(
  file: string,
  workspace: string,
  symlink: boolean,
  context: Context,
  octokit: InstanceType<typeof Octokit>
): Promise<GitBlob> {
  // Get file data
  const location = path.join(workspace, file)
  const mode = getFileMode(location, symlink)
  const content = Buffer.from(fs.readFileSync(location)).toString('base64')

  // Send the blob to GitHub
  const sha = (
    await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      encoding: 'base64',
      content
    })
  ).data.sha

  // Format blob for later use in tree
  return {
    path: file,
    type: 'blob',
    mode,
    sha
  }
}

export async function createTree(
  blobs: GitBlob[],
  headTree: string,
  context: Context,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      base_tree: headTree,
      tree: blobs
    })
  ).data.sha
}

export async function createCommit(
  tree: string,
  headCommit: string,
  message: string,
  context: Context,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      parents: [headCommit],
      message,
      tree
    })
  ).data.sha
}

export async function updateRef(
  ref: string,
  sha: string,
  force: boolean,
  context: Context,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      sha,
      force,
      ref
    })
  ).data.object.sha
}
