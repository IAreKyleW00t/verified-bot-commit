import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get(
    'https://api.github.com/repos/octocat/Hello-World/git/ref/heads%2FfeatureA',
    () => {
      return HttpResponse.json({
        ref: 'refs/heads/featureA',
        node_id: 'MDM6UmVmcmVmcy9oZWFkcy9mZWF0dXJlQQ==',
        url: 'https://api.github.com/repos/octocat/Hello-World/git/refs/heads/featureA',
        object: {
          type: 'commit',
          sha: 'aa218f56b14c9653891f9e74264a383fa43fefbd',
          url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd'
        }
      })
    }
  ),
  http.get(
    'https://api.github.com/repos/octocat/Hello-World/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd',
    () => {
      return HttpResponse.json({
        sha: '7638417db6d59f3c431d3e1f261cc637155684cd',
        node_id:
          'MDY6Q29tbWl0NmRjYjA5YjViNTc4NzVmMzM0ZjYxYWViZWQ2OTVlMmU0MTkzZGI1ZQ==',
        url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd',
        html_url:
          'https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd',
        author: {
          date: '2014-11-07T22:01:45Z',
          name: 'Monalisa Octocat',
          email: 'octocat@github.com'
        },
        committer: {
          date: '2014-11-07T22:01:45Z',
          name: 'Monalisa Octocat',
          email: 'octocat@github.com'
        },
        message: 'added readme, because im a good github citizen',
        tree: {
          url: 'https://api.github.com/repos/octocat/Hello-World/git/trees/691272480426f78a0138979dd3ce63b77f706feb',
          sha: '691272480426f78a0138979dd3ce63b77f706feb'
        },
        parents: [
          {
            url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/1acc419d4d6a9ce985db7be48c6349a0475975b5',
            sha: '1acc419d4d6a9ce985db7be48c6349a0475975b5',
            html_url:
              'https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd'
          }
        ],
        verification: {
          verified: false,
          reason: 'unsigned',
          signature: null,
          payload: null,
          verified_at: null
        }
      })
    }
  ),
  http.post(
    'https://api.github.com/repos/octocat/Hello-World/git/blobs',
    () => {
      return HttpResponse.json({
        url: 'https://api.github.com/repos/octocat/Hello-World/git/blobs/3a0f86fb8db8eea7ccbb9a95f325ddbedfb25e15',
        sha: '3a0f86fb8db8eea7ccbb9a95f325ddbedfb25e15'
      })
    }
  ),
  http.post(
    'https://api.github.com/repos/octocat/Hello-World/git/trees',
    () => {
      return HttpResponse.json({
        sha: 'cd8274d15fa3ae2ab983129fb037999f264ba9a7',
        url: 'https://api.github.com/repos/octocat/Hello-World/trees/cd8274d15fa3ae2ab983129fb037999f264ba9a7',
        tree: [
          {
            path: 'file.rb',
            mode: '100644',
            type: 'blob',
            size: 132,
            sha: '7c258a9869f33c1e1e1f74fbb32f07c86cb5a75b',
            url: 'https://api.github.com/repos/octocat/Hello-World/git/blobs/7c258a9869f33c1e1e1f74fbb32f07c86cb5a75b'
          }
        ],
        truncated: true
      })
    }
  ),
  http.post(
    'https://api.github.com/repos/octocat/Hello-World/git/commits',
    () => {
      return HttpResponse.json({
        sha: '7638417db6d59f3c431d3e1f261cc637155684cd',
        node_id:
          'MDY6Q29tbWl0NzYzODQxN2RiNmQ1OWYzYzQzMWQzZTFmMjYxY2M2MzcxNTU2ODRjZA==',
        url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd',
        author: {
          date: '2014-11-07T22:01:45Z',
          name: 'Monalisa Octocat',
          email: 'octocat@github.com'
        },
        committer: {
          date: '2014-11-07T22:01:45Z',
          name: 'Monalisa Octocat',
          email: 'octocat@github.com'
        },
        message: 'my commit message',
        tree: {
          url: 'https://api.github.com/repos/octocat/Hello-World/git/trees/827efc6d56897b048c772eb4087f854f46256132',
          sha: '827efc6d56897b048c772eb4087f854f46256132'
        },
        parents: [
          {
            url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/7d1b31e74ee336d15cbd21741bc88a537ed063a0',
            sha: '7d1b31e74ee336d15cbd21741bc88a537ed063a0',
            html_url:
              'https://github.com/octocat/Hello-World/commit/7d1b31e74ee336d15cbd21741bc88a537ed063a0'
          }
        ],
        verification: {
          verified: false,
          reason: 'unsigned',
          signature: null,
          payload: null,
          verified_at: null
        },
        html_url:
          'https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd'
      })
    }
  ),
  http.patch(
    'https://api.github.com/repos/octocat/Hello-World/git/refs/heads%2FfeatureA',
    () => {
      return HttpResponse.json({
        ref: 'refs/heads/featureA',
        node_id: 'MDM6UmVmcmVmcy9oZWFkcy9mZWF0dXJlQQ==',
        url: 'https://api.github.com/repos/octocat/Hello-World/git/refs/heads/featureA',
        object: {
          type: 'commit',
          sha: 'aa218f56b14c9653891f9e74264a383fa43fefbd',
          url: 'https://api.github.com/repos/octocat/Hello-World/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd'
        }
      })
    }
  )
]
