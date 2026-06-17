import * as core from '@actions/core'
import { run } from './main.js'
import { RunConfig } from './config.js'

/* istanbul ignore next */
const config: RunConfig = {
  token: core.getInput('token'),
  apiUrl: core.getInput('api-url'),
  repository: core.getInput('repository'),
  ref: core.getInput('ref'),
  files: core.getMultilineInput('files'),
  message: core.getInput('message') || undefined,
  messageFile: core.getInput('message-file') || undefined,
  autoStage: core.getBooleanInput('auto-stage'),
  updateLocal: core.getBooleanInput('update-local'),
  forcePush: core.getBooleanInput('force-push'),
  ifNoCommit: core.getInput('if-no-commit'),
  allowEmptyCommit: core.getBooleanInput('allow-empty-commit'),
  noThrottle: core.getBooleanInput('no-throttle'),
  noRetry: core.getBooleanInput('no-retry'),
  maxRetries: parseInt(core.getInput('max-retries')),
  followSymlinks: core.getBooleanInput('follow-symlinks'),
  workspace: core.getInput('workspace')
}

/* istanbul ignore next */
run(config)
