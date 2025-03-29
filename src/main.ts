import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import { minimatch } from 'minimatch'

import * as git from './git'
import { GitBlob } from './git'

export async function run(): Promise<void> {
  try {
    // Authenticate with GitHub
    const octokit = github.getOctokit(core.getInput('token'))

    // Get commit message
    const message = git.buildCommitMessage(
      core.getInput('message'),
      core.getInput('message-file')
    )

    // Lookup HEAD commit and tree
    const headRef = git.normalizeRef(core.getInput('ref'))
    const headCommit = await git.getRef(headRef, github.context, octokit)
    const headTree = await git.getTree(headCommit, github.context, octokit)

    // Get list of changed files
    let execOutput = ''
    core.startGroup('🪁 Getting changed files...')
    await exec.exec('git', ['add', '-A'])
    await exec.exec('git', ['diff', '--cached', '--name-only'], {
      listeners: {
        stdout: (data: Buffer) => {
          execOutput += data.toString()
        }
      }
    })
    core.endGroup()
    const changedFiles = execOutput.trim().split(/\r?\n/)

    // Create a blob object for each file
    const blobs: GitBlob[] = []
    const patterns = core.getInput('files').split(/\r?\n/)
    const workspace = core.getInput('workspace')
    const followSymbolicLinks = core.getBooleanInput('follow-symlinks')

    core.startGroup(`🗂️ Creating Git Blobs...`)
    for (const file of changedFiles) {
      // Only include files that match pattern
      for (const pattern of patterns) {
        if (minimatch(file, pattern)) {
          const blob = await git.createBlob(
            file,
            workspace,
            followSymbolicLinks,
            github.context,
            octokit
          )
          core.info(`${blob.sha}\t${blob.path}`)
          blobs.push(blob)
        }
      }
    }
    core.endGroup()
    core.setOutput(
      'blobs',
      blobs.map(b => b.sha)
    )

    // Confirm that blobs were made
    if (blobs.length === 0) {
      throw Error(`There were no blobs created as part of the commit`)
    }

    // Create tree with all blobs
    const tree = await git.createTree(blobs, headTree, github.context, octokit)
    core.info(`🌳 Created Git Tree @ ${tree}`)
    core.setOutput('tree', tree)

    // Create the signed commit
    const commit = await git.createCommit(
      tree,
      headCommit,
      message,
      github.context,
      octokit
    )
    core.info(`✅ Created Commit @ ${commit}`)
    core.setOutput('commit', commit)

    // Update the ref to point to the new commit
    const refSha = await git.updateRef(
      headRef,
      commit,
      core.getBooleanInput('force-push'),
      github.context,
      octokit
    )
    core.info(`⏩ Updated refs/${headRef} to point to ${refSha}`)
    core.setOutput('ref', refSha)

    core.startGroup('📍 Updating local branch...')
    await exec.exec('git', ['pull', 'origin', `refs/${headRef}`])
    core.endGroup()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed(error as string)
  }
}
