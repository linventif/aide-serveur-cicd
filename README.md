# aide-server-cicd

**CLI tool** to automatically post updates to your resource on [aide-serveur.fr](https://aide-serveur.fr).

## Features

-   Logs into the site with your email & password
-   Navigates to a given resource
-   Fills in update title & message
-   Optionally sets an **external download URL** or **uploads a local artifact**
-   Submits the update form

## Installation

```bash
npm install -g @linventif/aide-server-cicd
# or with Bun
bun add -g @linventif/aide-server-cicd
```

## Quickstart

Create a `.env` file in your project root:

```dotenv
# Required
EMAIL=you@example.com
PASSWORD=••••••••
RESOURCE=test.4571           # resource identifier on aide-serveur.fr
UPDATE_VERSION=1.2.3         # version string to post
UPDATE_MSG="Release 1.2.3"   # update message body

# Optional (pick one)
EXTERNAL_URL=https://example.com/download/1.2.3.zip
# ARTIFACT_PATH=./dist/app-1.2.3.zip

# Advanced
TARGET_URL=https://aide-serveur.fr/ressources/   # default target
DEV_MODE=false    # if true, opens browser in non-headless mode
```

### Available environment variables

| Name             | Required? | Description                                                                |
| ---------------- | --------- | -------------------------------------------------------------------------- |
| `EMAIL`          | yes       | Your login email                                                           |
| `PASSWORD`       | yes       | Your login password                                                        |
| `RESOURCE`       | yes       | Resource slug (e.g. `test.4571`)                                           |
| `UPDATE_VERSION` | yes       | Version string for this update                                             |
| `UPDATE_MSG`     | yes       | Markdown/plain text message for the update                                 |
| `EXTERNAL_URL`   | no        | If set, selects “external” download and fills this URL                     |
| `ARTIFACT_PATH`  | no        | If set (and no `EXTERNAL_URL`), selects “local” and uploads it             |
| `TARGET_URL`     | no        | Base URL for resources (defaults to `https://aide-serveur.fr/ressources/`) |
| `DEV_MODE`       | no        | `true` to run browser with UI & slower typing (default: `false`)           |

> **Note:** Only one of `EXTERNAL_URL` or `ARTIFACT_PATH` should be provided.

## Usage

Once installed, simply run:

```bash
aide-server-cicd
```

Or, if you prefer to call the built script directly:

```bash
node dist/index.js
```

## Example GitHub Actions Workflow

```yaml
# .github/workflows/auto-update.yml
name: Auto Resource Update

on:
    push:
        branches: [main]

jobs:
    update:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout code
              uses: actions/checkout@v3

            - name: Setup Bun (or Node)
              uses: oven-sh/setup-bun@v1
              # or: uses: actions/setup-node@v3 with node-version: '16'

            - name: Install dependencies
              run: bun install
              # or: npm install

            - name: Run resource updater
              env:
                  EMAIL: ${{ secrets.EMAIL }}
                  PASSWORD: ${{ secrets.PASSWORD }}
                  RESOURCE: ${{ secrets.RESOURCE }}
                  UPDATE_VERSION: ${{ github.ref_name }}
                  UPDATE_MSG: 'Release ${{ github.ref_name }}'
                  EXTERNAL_URL: ${{ secrets.EXTERNAL_URL }} # optional
                  # ARTIFACT_PATH:  ./build/app-${{ github.ref_name }}.zip
              run: bun src/index.ts
              # or: aide-server-cicd
```

This will automatically log in and post a new version each time you push to `main`.

---

## License

MIT © [linventif](https://github.com/linventif/aide-server-cicd)
