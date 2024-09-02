import * as core from '@actions/core'
import * as fs from 'fs'

import { Context } from '@actions/github/lib/context'
import { GitHub } from '@actions/github/lib/utils'

export type GitMode = '100644' | '100755' | '040000' | '160000' | '120000'
export interface GitBlob {
  path: string
  mode: GitMode
  type: 'blob' // Only supported type in our case
  sha: string
}

export function buildCommitMessage(message?: string, file?: string): string {
  core.debug(`git.buildCommitMessage(message: '${message}', file: '${file}')`)
  // Allow message to be either static or from contents in a file
  const output = file ? fs.readFileSync(file, 'utf-8') : message

  // Raise error if output commit message is empty
  if (!output) throw Error('Commit message is empty')
  else {
    core.debug(`\t=> ${output}`)
    return output
  }
}

export function normalizeRef(ref: string): string {
  core.debug(`git.normalizeRef(ref: '${ref}')`)
  const output = ref.startsWith('heads/') ? ref : `heads/${ref}`
  core.debug(`\t=> ${output}`)
  return output
}

export async function getRef(
  ref: string,
  context: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<string> {
  core.debug(`git.getRef('${ref}')`)
  const sha = (
    await octokit.rest.git.getRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref
    })
  ).data.object.sha
  core.debug(`\t=> ${sha}`)
  return sha
}

export async function getTree(
  sha: string,
  context: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<string> {
  core.debug(`git.getTree('${sha}')`)
  const treeSha = (
    await octokit.rest.git.getCommit({
      owner: context.repo.owner,
      repo: context.repo.repo,
      commit_sha: sha
    })
  ).data.tree.sha
  core.debug(`\t=> ${treeSha}`)
  return treeSha
}

export async function getFileMode(file: string): Promise<GitMode> {
  core.debug(`git.getFileMode(file: '${file}')`)
  const stat = fs.statSync(file)
  core.debug(`\tmode=${stat.mode}`)

  let mode: GitMode
  if (stat.isFile()) {
    // Check if execute bit is set on file for current user
    if (stat.mode & fs.constants.S_IXUSR) {
      mode = '100755'
    } else {
      mode = '100644'
    }
  } else if (stat.isDirectory()) {
    // TODO: Add logic to account for submodules
    mode = '040000'
  } else if (stat.isSymbolicLink()) {
    mode = '120000'
  } else throw Error(`Unknown file mode for ${file}`)
  core.debug(`\t=> ${mode}`)
  return mode
}

export async function createBlob(
  file: string,
  workspace: string,
  context: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<GitBlob> {
  core.debug(`git.createBlob(file: '${file}', workspace: '${workspace}')`)

  // Generate relative and absolute paths to file base on workspace
  const relPath = file.replace(`${workspace}/`, '')
  const absPath = file.startsWith(workspace) ? file : `${workspace}/${file}`
  core.debug(`\trelPath=${relPath}`)
  core.debug(`\tabsPath=${absPath}`)

  // Get file data
  const mode = await getFileMode(absPath)
  const content = Buffer.from(fs.readFileSync(absPath)).toString('base64')

  // Send the blob to GitHub
  const sha = (
    await octokit.rest.git.createBlob({
      owner: context.repo.owner,
      repo: context.repo.repo,
      encoding: 'base64',
      content
    })
  ).data.sha

  // Format blob for later use in tree
  const blob: GitBlob = {
    path: relPath,
    type: 'blob',
    mode,
    sha
  }

  core.debug(`\t=> ${JSON.stringify(blob)}`)
  return blob
}

export async function createTree(
  blobs: GitBlob[],
  headTree: string,
  context: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<string> {
  core.debug(
    `git.createTree(blobs: 'blobs[..${blobs.length}]',` +
      `headTree: '${headTree}')`
  )
  const sha = (
    await octokit.rest.git.createTree({
      owner: context.repo.owner,
      repo: context.repo.repo,
      base_tree: headTree,
      tree: blobs
    })
  ).data.sha
  core.debug(`\t=> ${sha}`)
  return sha
}

export async function createCommit(
  tree: string,
  headCommit: string,
  message: string,
  context: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<string> {
  core.debug(
    `git.createCommit(tree: '${tree}', ` +
      `headCommit: '${headCommit}', ` +
      `message: '${message}')`
  )
  const sha = (
    await octokit.rest.git.createCommit({
      owner: context.repo.owner,
      repo: context.repo.repo,
      parents: [headCommit],
      message,
      tree
    })
  ).data.sha
  core.debug(`\t=> ${sha}`)
  return sha
}

export async function updateRef(
  ref: string,
  sha: string,
  force: boolean,
  context: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<string> {
  core.debug(`git.updateRef(ref: '${ref}', sha: '${sha}', force: '${force}')`)
  const refSha = (
    await octokit.rest.git.updateRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      sha,
      force,
      ref
    })
  ).data.object.sha
  core.debug(`\t=> ${refSha}`)
  return refSha
}
