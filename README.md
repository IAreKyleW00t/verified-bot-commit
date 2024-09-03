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
accomplished via the GitHub [REST API] by using the [Blob] and [Tree] endpoints to
build the commit and update the original Ref to point to it. [^1]

The resulting commit will be signed and verified using
[GitHub's public PGP key](https://github.com/web-flow.gpg)!

> [!IMPORTANT]
>
> Using this Action with your own [Personal Access Token (PAT)] is **not** recommended.  
> See [limitations](#limitations) for more details.

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

| Name              | Type   | Description                                      | Default                   |
| ----------------- | ------ | ------------------------------------------------ | ------------------------- |
| `ref`             | String | The ref to push the commit to                    | `${{ github.ref }}`       |
| `files`           | List   | Files/[Glob] patterns to include with the commit | _required_                |
| `message`         | String | Message for the commit [1]                       | _optional_                |
| `message-file`    | String | File to use for the commit message [1]           | _optional_                |
| `force-push`      | String | Force push the commit                            | `false`                   |
| `follow-symlinks` | String | Follow symbolic links when globbing files        | `true`                    |
| `workspace`       | String | Directory containing checked out files           | `${{ github.workspace }}` |
| `token`           | String | GitHub Token for REST API access [2]             | `${{ github.token }}`     |

> 1. You must include either `message` or `message-file` (which takes priority).
> 2. This Action is intended to work with the default `GITHUB_TOKEN`. See the
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

## Limitations

⚠️ As always, the `GITHUB_TOKEN` cannot push to protected Refs.

⚠️ The [Blob] API has a 40MiB limit, any files larger than this in your commit
will fail.

⚠️ Using your own [Personal Access Token (PAT)] will result in an unsigned and unverified
commit. You should _really_ look into [using your own keys] and [signing
commits] yourself with the help of Actions like [webfactory/ssh-agent](https://github.com/webfactory/ssh-agent)
and [crazy-max/ghaction-import-gpg](https://github.com/crazy-max/ghaction-import-gpg).

## Development

> [!CAUTION]
>
> Since this is a TypeScript action you **must** transpile it into native
> JavaScript. This is done for you automatically as part of the `npm run all`
> command and will be validated via the
> [`check-dist.yml`](.github/workflows/check-dist.yml) Workflow in any PR.

1. ⚙️ Install the version of [Node.js](https://nodejs.org/en) as defined in the
   [`.node-version`](.node-version).  
   You can use [asdf](https://github.com/asdf-vm/asdf) to help manage your
   project runtimes.

   ```sh
   asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
   asdf install
   ```

1. 🛠️ Install dependencies

   ```sh
   npm install
   ```

1. 🏗️ Format, lint, and package your code changes.

   ```sh
   npm run all
   ```

## Releases

For maintainers, the following release process should be used when cutting new
versions.

1. ⏬ Ensure all changes are in the `main` branch and all necessary
   [Workflows](https://github.com/IAreKyleW00t/verified-bot-commit/actions) are
   passing.

   ```sh
   git checkout main
   git pull
   ```

2. ✅ Ensure the [`package.json`](package.json#L4) and
   [`package-lock.json`](package-lock.json#L3) files are updated to with the new
   version being cut.

   ```sh
   npm update
   ```

3. 🔖 Create a new Tag, push it up, then create a
   [new Release](https://github.com/IAreKyleW00t/verified-bot-commit/releases/new)
   for the version.

   ```sh
   git tag v1.2.3
   git push -u origin v1.2.3
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
