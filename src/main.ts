import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'

import { minimatch } from 'minimatch'
import { Octokit } from '@octokit/core'
import { throttling } from '@octokit/plugin-throttling'
import { retry } from '@octokit/plugin-retry'

import * as git from './git.js'
import { GitBlob } from './git.js'

export async function run(): Promise<void> {
  try {
    // Authenticate Octokit with plugins
    const SafeOctokit = Octokit.plugin(throttling, retry)
    const maxRetries = parseInt(core.getInput('max-retries'))
    const noRetry = core.getBooleanInput('no-retry')
    const noThrottle = core.getBooleanInput('no-throttle')
    const octokit = new SafeOctokit({
      auth: core.getInput('token'),
      request: { retries: maxRetries },
      retry: { enabled: !noRetry },
      throttle: {
        enabled: !noThrottle,
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          octokit.log.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`
          )

          if (!noRetry && retryCount < maxRetries) {
            octokit.log.info(`Retrying after ${retryAfter} seconds...`)
            return true
          }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
          octokit.log.warn(
            `SecondaryRateLimit detected for request ${options.method} ${options.url}`
          )

          if (!noRetry && retryCount < maxRetries) {
            octokit.log.info(`Retrying after ${retryAfter} seconds...`)
            return true
          }
        }
      }
    })

    // Get commit message
    const message = git.buildCommitMessage(
      core.getInput('message'),
      core.getInput('message-file')
    )

    // Lookup HEAD commit and tree
    const autoStage = core.getBooleanInput('auto-stage')
    const headRef = git.normalizeRef(core.getInput('ref'))
    const headCommit = await git.getRef(headRef, github.context, octokit)
    const headTree = await git.getTree(headCommit, github.context, octokit)

    // Get list of changed files
    const workspace = core.getInput('workspace')
    const execOpts = { cwd: workspace }
    let execOutput = ''

    core.startGroup('🪁 Getting changed files...')
    if (autoStage) await exec.exec('git', ['add', '-A'], execOpts)
    await exec.exec('git', ['diff', '--cached', '--name-only'], {
      ...execOpts,
      listeners: {
        stdout: (data: Buffer) => {
          execOutput += data.toString()
        }
      }
    })
    core.endGroup()
    const changedFiles = execOutput
      .trim()
      .split(/\r?\n/)
      .filter((f) => f)

    // If there are no changed files, exit early
    const noCommitAction = core.getInput('if-no-commit')
    if (changedFiles.length === 0) {
      if (noCommitAction === 'error') {
        throw new Error('No file changes found in local branch')
      } else if (noCommitAction === 'warning') {
        core.warning('No file changes found in local branch')
      } else if (noCommitAction === 'notice') {
        core.notice('No file changes found in local branch')
      } else {
        core.info('No file changes found in local branch')
      }
      return
    }

    // Create a blob object for each file
    const blobs: GitBlob[] = []
    const patterns = core.getMultilineInput('files')
    const followSymbolicLinks = core.getBooleanInput('follow-symlinks')

    core.startGroup(`🗂️ Creating Git Blobs...`)
    for (const file of changedFiles) {
      for (const pattern of patterns) {
        // Skip blank and comment patterns
        if (pattern.startsWith('#') || pattern.length === 0) {
          continue
        }

        // Skip the file entirely if a pattern specifically negates it
        if (pattern.startsWith('!')) {
          if (minimatch(file, pattern.substring(1))) break
          continue
        }

        // Only include files that match a pattern
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
          break
        }
      }
    }
    core.endGroup()
    core.setOutput(
      'blobs',
      blobs.map((b) => b.sha)
    )

    // Confirm that blobs were made
    if (blobs.length === 0) {
      if (noCommitAction === 'error') {
        throw new Error('No files added to commit')
      } else if (noCommitAction === 'warning') {
        core.warning('No files added to commit')
      } else if (noCommitAction === 'notice') {
        core.notice('No files added to commit')
      } else {
        core.info('No files added to commit')
      }
      return
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
    const forcePush = core.getBooleanInput('force-push')
    const refSha = await git.updateRef(
      headRef,
      commit,
      forcePush,
      github.context,
      octokit
    )
    core.info(`⏩ Updated refs/${headRef} to point to ${refSha}`)
    core.setOutput('ref', refSha)

    // Update local branch
    const updateLocal = core.getBooleanInput('update-local')
    if (updateLocal) {
      core.startGroup('📍 Updating local branch...')
      await exec.exec('git', ['pull', 'origin', `refs/${headRef}`], execOpts)
      core.endGroup()
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed(error as string)
  }
}
