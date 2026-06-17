import { Command } from 'commander'
import { run } from './main.js'
import { RunConfig } from './config.js'

const program = new Command()

program
  .name('verified-bot-commit')
  .description('Create signed and verified bot commits via the GitHub REST API')
  .requiredOption(
    '--repository <owner/repo>',
    'Target repository in owner/repo format'
  )
  .requiredOption('--ref <ref>', 'Branch or tag to push the commit to')
  .requiredOption(
    '-f, --files <pattern...>',
    'Glob pattern(s) for files to include'
  )
  .option('-m, --message <text>', 'Commit message')
  .option('--message-file <path>', 'File containing the commit message')
  .option('--token <token>', 'GitHub token (defaults to GITHUB_TOKEN env var)')
  .option('--api-url <url>', 'GitHub API base URL', 'https://api.github.com')
  .option('--auto-stage', 'Stage all changed files before filtering', true)
  .option('--no-auto-stage', 'Do not auto-stage changed files')
  .option('--update-local', 'Update local branch after committing', true)
  .option('--no-update-local', 'Do not update local branch after committing')
  .option('--force-push', 'Force push the commit', false)
  .option(
    '--if-no-commit <action>',
    'Behaviour when no commit is made: info, notice, warning, error',
    'warning'
  )
  .option('--allow-empty-commit', 'Allow empty commits if no changes', false)
  .option('--no-throttle', 'Disable GitHub API rate limit throttling', false)
  .option('--no-retry', 'Disable retry mechanism for failed requests', false)
  .option('--max-retries <n>', 'Number of retries for failed requests', '1')
  .option('--follow-symlinks', 'Follow symbolic links when globbing', true)
  .option('--no-follow-symlinks', 'Do not follow symbolic links when globbing')
  .option(
    '--workspace <path>',
    'Directory containing checked out files',
    process.cwd()
  )

program.parse()

const opts = program.opts()

const token = opts.token || process.env.GITHUB_TOKEN
if (!token) {
  console.error(
    'Error: --token is required or GITHUB_TOKEN env var must be set'
  )
  process.exit(1)
}

if (!opts.message && !opts.messageFile) {
  console.error('Error: either --message or --message-file is required')
  process.exit(1)
}

const config: RunConfig = {
  token,
  apiUrl: opts.apiUrl,
  repository: opts.repository,
  ref: opts.ref,
  files: opts.files,
  message: opts.message,
  messageFile: opts.messageFile,
  autoStage: opts.autoStage,
  updateLocal: opts.updateLocal,
  forcePush: opts.forcePush,
  ifNoCommit: opts.ifNoCommit,
  allowEmptyCommit: opts.allowEmptyCommit,
  noThrottle: opts.noThrottle,
  noRetry: opts.noRetry,
  maxRetries: parseInt(opts.maxRetries, 10),
  followSymlinks: opts.followSymlinks,
  workspace: opts.workspace
}

run(config)
