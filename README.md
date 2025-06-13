# ✅ Verified Bot Commit

[![CI](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/ci.yml/badge.svg)](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/ci.yml)
[![Tests](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/test.yml/badge.svg)](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/test.yml)
[![Check dist/](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/check-dist.yml/badge.svg)](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/codeql.yml/badge.svg)](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/codeql.yml)  
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Verified%20Bot%20Commit-blue?style=flat&logo=github)](https://github.com/marketplace/actions/verified-bot-commit)
[![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/IAreKyleW00t/verified-bot-commit?style=flat&label=Latest%20Version&color=blue)](https://github.com/IAreKyleW00t/verified-bot-commit/tags)
[![License](https://img.shields.io/github/license/IAreKyleW00t/verified-bot-commit?label=License)](https://github.com/IAreKyleW00t/verified-bot-commit/blob/main/LICENSE)
[![Dependabot](https://img.shields.io/badge/Dependabot-0366d6?style=flat&logo=dependabot&logoColor=white)](.github/dependabot.yml)

A GitHub Action to create signed and verified commits as the
`github-actions[bot]` User with the standard `GITHUB_TOKEN`. This is
accomplished via the GitHub [REST API] by using the [Blob] and [Tree] endpoints
to build the commit and update the original Ref to point to it. [^1]

This Action will stage all changed files in your local branch and add those that
match your file patterns to the commit. Afterwards, your local branch will be
updated to point to the newly created commit, which will be signed and verified
using [GitHub's public PGP key](https://github.com/web-flow.gpg)! Files that
were not committed by the Action will be left staged.

> [!IMPORTANT]
>
> Using this Action with your own [Personal Access Token (PAT)] is **not**
> recommended.  
> See [limitations](#limitations) for more details.

> This action supports Linux, macOS and Windows runners (results may vary with
> self-hosted runners).

## Quick Start

```yaml
- name: Commit changes
  uses: iarekylew00t/verified-bot-commit@v1
  with:
    message: 'feat: Some changes'
    files: |
      README.md
      *.txt
      src/**/tests/*
      !test-data/dont-include-this
      test-data/**
```

## Usage

### Inputs

> `List` type is a newline-delimited string
>
> ```yaml
> files: |
>   *.md
>   example.txt
> ```

| Name              | Type    | Description                                          | Default                   |
| ----------------- | ------- | ---------------------------------------------------- | ------------------------- |
| `ref`             | String  | The ref to push the commit to                        | `${{ github.ref }}`       |
| `files`           | List    | Files/[Glob] patterns to include with the commit [1] | _required_                |
| `message`         | String  | Message for the commit [2]                           | _optional_                |
| `message-file`    | String  | File to use for the commit message [2]               | _optional_                |
| `auto-stage`      | Boolean | Stage all changed files for committing [3]           | `true`                    |
| `update-local`    | Boolean | Update local branch after committing [3]             | `true`                    |
| `force-push`      | Boolean | Force push the commit                                | `false`                   |
| `if-no-commit`    | String  | Set the behavior when no commit is made [4]          | `warning`                 |
| `no-throttle`     | Boolean | Disable the throttling mechanism during requests     | `false`                   |
| `no-retry`        | Boolean | Disable the retry mechanism during requests          | `false`                   |
| `max-retries`     | Number  | Number of retries to attempt if a request fails      | `1`                       |
| `follow-symlinks` | Boolean | Follow symbolic links when globbing files            | `true`                    |
| `workspace`       | String  | Directory containing checked out files               | `${{ github.workspace }}` |
| `token`           | String  | GitHub Token for REST API access [5]                 | `${{ github.token }}`     |

> 1. Files within your `.gitignore` will not be included. You can also negate
>    any files by prefixing it with `!`
> 2. You must include either `message` or `message-file` (which takes priority).
> 3. Only files that match a pattern you include will be in the final commit,
>    but you can optionally stage files yourself for more control.
> 4. Available options are `info`, `notice`, `warning` and `error`.
> 5. This Action is intended to work with the default `GITHUB_TOKEN`. See the
>    [notice](#verified-bot-commit-action) and [limitations](#limitations)

### Outputs

| Name     | Type   | Description                                       |
| -------- | ------ | ------------------------------------------------- |
| `blobs`  | JSON   | A JSON list of blob SHAs within the tree          |
| `tree`   | String | SHA of the underlying tree for the commit         |
| `commit` | String | SHA of the commit itself                          |
| `ref`    | String | SHA for the ref that was updated (same as commit) |

### Token Permissions

This Actions requires the following permissions granted to the `GITHUB_TOKEN`.

- `contents: write`

## Examples

### Commit all changes

```yaml
- name: Install regctl
  uses: iarekylew00t/verified-bot-commit@v1
  with:
    message: 'chore: Updates'
    files: |
      **
```

### Commit changes back to a Pull Request

```yaml
- name: Install regctl
  uses: iarekylew00t/verified-bot-commit@v1
  with:
    ref: ${{ github.event.pull_request.head.ref }}
    message: 'chore: Update README'
    files: |
      README.md
```

### Ignore warnings when no files changed

```yaml
- name: Install regctl
  uses: iarekylew00t/verified-bot-commit@v1
  with:
    if-no-commit: info
    message: 'feat: Some changes'
    files: |
      README.md
```

### Manually stage your own files

```yaml
- name: Stage files
  shell: bash
  run: |
    git add docs/
    git restore --staged docs/something/idont/want

- name: Install regctl
  uses: iarekylew00t/verified-bot-commit@v1
  with:
    auto-stage: false
    message: 'chore: Updating docs'
    files: |
      docs/**
```

### Use a repository in another directory

```yaml
- name: Checkout repo
  uses: actions/checkout@v4
  with:
    path: my-repo

- name: Update files
  shell: bash
  run: echo 'Hello World!' > my-repo/test.txt

- name: Install regctl
  uses: iarekylew00t/verified-bot-commit@v1
  with:
    workspace: my-repo
    message: 'chore: Updating tests'
    files: |
      test.txt
```

## Limitations

⚠️ As always, the `GITHUB_TOKEN` cannot push to protected Refs.

⚠️ The [Blob] API has a 40MiB limit, any files larger than this in your commit
will fail.

> [!TIP] You can create a commit with large files using regular git CLI and push
> it to a temporary branch. Then `git log --format=raw` will get you the tree
> hash, which you can use to
> [create a commit](https://docs.github.com/en/rest/git/commits?apiVersion=2022-11-28#create-a-commit)
> with Github API.
> [See example](https://github.com/orgs/community/discussions/50055#discussioncomment-13460641).

⚠️ Using your own [Personal Access Token (PAT)] will result in an unsigned and
unverified commit. You should _really_ look into [using your own keys] and
[signing commits] yourself with the help of Actions like
[webfactory/ssh-agent](https://github.com/webfactory/ssh-agent) and
[crazy-max/ghaction-import-gpg](https://github.com/crazy-max/ghaction-import-gpg).

## Common Errors

Below are some common errors that can occur depending on your use case. This are
issues that are considered outside the scope of this Action but are still
documented here to include common solutions/workarounds for others.

Feel free to create an
[Issue](https://github.com/IAreKyleW00t/verified-bot-commit/issues) or
[Pull Request](https://github.com/IAreKyleW00t/verified-bot-commit/pulls) if you
encounter other errors that should be documented here.

### Git Object Errors

If you see errors that contain
`insufficient permission for adding an object to repository database .git/objects`
then this probably means another Action in your Workflow performed a local Git
operations as a different user than what the Runner (usually `root`), which
results in `.git/` files being owned by that user.

You can fix this by updating the permissions of the `.git/` directory to the
back to current user/group.

```yaml
- name: Fix .git permissions
  run: sudo chown -R "$(id -u):$(id -g)" .git
```

## Development

> [!CAUTION]
>
> Since this is a TypeScript action you **must** transpile it into native
> JavaScript. This is done for you automatically as part of the `npm run all`
> command and will be validated via the
> [`check-dist.yml`](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/check-dist.yml)
> Workflow in any PR.

1. ⚙️ Install the version of [Node.js](https://nodejs.org/en) as defined in the
   [`.node-version`](.node-version).  
   You can use [asdf](https://github.com/asdf-vm/asdf) to help manage your
   project runtimes.

   ```sh
   asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
   asdf install
   ```

2. 🛠️ Install dependencies

   ```sh
   npm install
   ```

3. 🏗️ Format, lint, test, and package your code changes.

   ```sh
   npm run all
   ```

## Releases

For maintainers, the following release process should be used when cutting new
versions.

1. ⏬ Pull down the latest changes and ensure all
   [Workflows](https://github.com/IAreKyleW00t/verified-bot-commit/actions) are
   passing.

   ```sh
   git checkout main
   git pull
   ```

2. ✅ Bump the package version.

   ```sh
   npm version <major|minor|patch> -m "chore: Bumping version to vX.Y.Z"
   ```

3. 🔖 Create a new Tag, push it up, then create a
   [new Release](https://github.com/IAreKyleW00t/verified-bot-commit/releases/new)
   for the version.

   ```sh
   git tag vX.Y.Z
   git push -u origin vX.Y.Z
   ```

   Alternatively you can create the Tag on the GitHub Release page itself.

   When the tag is pushed it will kick off the
   [Shared Tags](https://github.com/IAreKyleW00t/verified-bot-commit/actions/workflows/shared-tags.yml)
   Workflows to update the `v$MAJOR` and `v$MAJOR.MINOR` tags.

## Contributing

Feel free to contribute and make things better by opening an
[Issue](https://github.com/IAreKyleW00t/verified-bot-commit/issues) or
[Pull Request](https://github.com/IAreKyleW00t/verified-bot-commit/pulls).  
Thank you for your contribution! ❤️

## License

See [LICENSE](LICENSE).

## Credits

Special thanks and credits to the following projects for their work and
inspiration:

- [swinton/commit](https://github.com/swinton/commit)
- [ChromeQ/commit](https://github.com/ChromeQ/commit)

<!-- Links -->

[^1]:
    [Git Internals - Git Objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)

[REST API]: https://docs.github.com/en/rest
[Personal Access Token (PAT)]:
  https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
[Blob]: https://docs.github.com/en/rest/git/blobs
[Tree]: https://docs.github.com/en/rest/git/trees
[Glob]: https://en.wikipedia.org/wiki/Glob_(programming)
[using your own keys]:
  https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key
[signing commits]:
  https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits
