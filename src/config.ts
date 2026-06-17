export interface RunConfig {
  token: string
  apiUrl: string
  repository: string
  ref: string
  files: string[]
  message?: string
  messageFile?: string
  autoStage: boolean
  updateLocal: boolean
  forcePush: boolean
  ifNoCommit: string
  allowEmptyCommit: boolean
  noThrottle: boolean
  noRetry: boolean
  maxRetries: number
  followSymlinks: boolean
  workspace: string
}
