import * as core from '@actions/core'
import * as github from '@actions/github'
import * as glob from '@actions/glob'

import * as utils from './utils'
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

    // Create a blob object for each file
    const seen: Set<string> = new Set<string>()
    const blobs: GitBlob[] = []
    const files = core.getInput('files')
    const workspace = core.getInput('workspace')
    const globOptions = {
      followSymbolicLinks: core.getBooleanInput('follow-symlinks')
    }
    core.startGroup(`🗂️ Creating Git Blobs...`)
    for (const pattern of files.split('\n')) {
      // Skip patterns we've already seen
      if (seen.has(pattern)) continue
      seen.add(pattern)

      // Check if pattern exactly matches an existing file
      if (utils.fileExists(pattern)) {
        if (utils.isDirectory(pattern)) continue // Skip directories

        // Ensure globbing patterns don't include static files
        seen.add(`${workspace}/${pattern}`)

        const blob = await git.createBlob(
          pattern,
          workspace,
          github.context,
          octokit
        )
        core.info(`${blob.sha}\t${blob.path}`)
        blobs.push(blob)
      } else {
        // Treat the pattern as a glob and attempt to locate files
        const globber = await glob.create(pattern, globOptions)
        for await (const file of globber.globGenerator()) {
          if (utils.isDirectory(file)) continue // Skip directories

          // Skip files we've already seen
          if (seen.has(file)) continue
          seen.add(file)

          const blob = await git.createBlob(
            file,
            workspace,
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
    core.debug(`main.blobs.length => ${blobs.length}`)
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
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed(error as string)
  }
}
