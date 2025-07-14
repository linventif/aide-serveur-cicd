# Discord Resource Auto-Updater

Automates posting updates to a resource on [aide-serveur.fr](https://aide-serveur.fr) with Puppeteer.

## Setup

1. **Clone repository**

    ```bash
    git clone https://github.com/linventif/aide-server-cicd.git
    cd aide-server-cicd
    ```

2. **Install dependencies**

    ```bash
    bun install
    ```

3. **Environment Variables**

    | Variable         | Description                                | Example                               |
    | ---------------- | ------------------------------------------ | ------------------------------------- |
    | `EMAIL`          | Connection email for aide-serveur.fr login | `user@example.com`                    |
    | `PASSWORD`       | Password for aide-serveur.fr login         | `supersecret123`                      |
    | `RESOURCE`       | Resource slug (e.g. `test.4571`)           | `test.4571`                           |
    | `TARGET_URL`     | Base URL for resources page                | `https://aide-serveur.fr/ressources/` |
    | `UPDATE_VERSION` | New version title for the update           | `v1.2.3`                              |
    | `UPDATE_MSG`     | Release notes or update message            | `Fixes typo and adds feature X.`      |

4. **Usage**

    - **Development** (live reload):

        ```bash
        bun run dev
        ```

    - **Build** production bundle:

        ```bash
        bun run build
        ```

    - **Run** after build:
        ```bash
        bun run start
        ```

## CI/CD Integration (GitHub Actions)

Create `.github/workflows/update.yml`:

```yaml
# .github/workflows/auto-update.yml
name: Auto Resource Update

on:
    push:
        branches:
            - main
        tags:
            - 'v*'

jobs:
    update:
        runs-on: ubuntu-latest

        steps:
            - name: Checkout repository
              uses: actions/checkout@v3

            - name: Clone aide-server-cicd CLI
              run: |
                  git clone https://github.com/linventif/aide-server-cicd.git cli

            - name: Setup Bun
              uses: oven-sh/setup-bun@v1

            - name: Install & build CLI
              working-directory: cli
              run: |
                  bun install
                  bun build src/index.ts --outdir=dist --target=node

            - name: Auto-update resource on aide-serveur
              working-directory: cli
              env:
                  EMAIL: ${{ secrets.AIDE_EMAIL }}
                  PASSWORD: ${{ secrets.AIDE_PASSWORD }}
                  RESOURCE: ${{ secrets.RESOURCE_ID }}
                  TARGET_URL: https://aide-serveur.fr/ressources/
                  UPDATE_VERSION: ${{ github.ref_name }}
                  UPDATE_MSG: 'Release ${{ github.ref_name }}'
              run: |
                  node dist/index.js
```

-   Store all sensitive values (`EMAIL`, `PASSWORD`, `RESOURCE`) in GitHub Secrets.
-   Adjust triggers as needed.

---

_Minimal README with environment table and CI/CD example._
