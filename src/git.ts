import * as fs from 'fs'
import * as path from 'path'

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
  // Ensure ref matches format `heads/<ref>` or `tags/<ref>`
  if (ref.startsWith('heads/') || ref.startsWith('tags/')) return ref
  else if (ref.startsWith('refs/')) return ref.replace('refs/', '')
  else return `heads/${ref}`
}

export async function getRef(
  ref: string,
  owner: string,
  repo: string,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  const data = (
    await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
      owner,
      repo,
      ref
    })
  ).data

  // If the ref is a tag, we need to get the commit SHA from the tag object
  if (data.object.type == 'tag') {
    return (
      await octokit.request('GET /repos/{owner}/{repo}/git/tags/{tag_sha}', {
        owner,
        repo,
        tag_sha: data.object.sha
      })
    ).data.object.sha
  } else if (data.object.type == 'commit') {
    return data.object.sha
  } else throw Error(`Unsupported ref type: ${data.object.type}`)
}

export async function getTree(
  sha: string,
  owner: string,
  repo: string,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request(
      'GET /repos/{owner}/{repo}/git/commits/{commit_sha}',
      {
        owner,
        repo,
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
  owner: string,
  repo: string,
  octokit: InstanceType<typeof Octokit>
): Promise<GitBlob> {
  // Get file data
  const location = path.join(workspace, file)
  const mode = getFileMode(location, symlink)
  const content = Buffer.from(fs.readFileSync(location)).toString('base64')

  // Send the blob to GitHub
  const sha = (
    await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
      owner,
      repo,
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
  owner: string,
  repo: string,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
      owner,
      repo,
      base_tree: headTree,
      tree: blobs
    })
  ).data.sha
}

export async function createCommit(
  tree: string,
  headCommit: string,
  message: string,
  owner: string,
  repo: string,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
      owner,
      repo,
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
  owner: string,
  repo: string,
  octokit: InstanceType<typeof Octokit>
): Promise<string> {
  return (
    await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
      owner,
      repo,
      sha,
      force,
      ref
    })
  ).data.object.sha
}
