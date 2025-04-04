import { Context } from '@actions/github/lib/context.js'

// Mocked @actions/github context
export const github = {
  context: {
    payload: {},
    eventName: 'workflow_dispatch',
    sha: 'aa218f56b14c9653891f9e74264a383fa43fefbd',
    ref: 'refs/heads/test',
    workflow: 'Test Workflow',
    action: '__run',
    actor: 'octocat',
    job: 'test-job',
    runNumber: 1,
    runId: 14234464167,
    apiUrl: 'https://api.github.com',
    serverUrl: 'https://github.com',
    graphqlUrl: 'https://api.github.com/graphql',
    issue: {
      owner: 'octocat',
      repo: 'Hello-World',
      number: 123
    },
    repo: {
      owner: 'octocat',
      repo: 'Hello-World'
    }
  } as Context
}
