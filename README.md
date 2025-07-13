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
name: Auto Update Resource
on:
    push:
        branches: [main]
jobs:
    update:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - name: Setup Bun
              uses: oven-sh/bun@v4
            - name: Install dependencies
              run: bun install
            - name: Run updater
              env:
                  EMAIL: ${{ secrets.EMAIL }}
                  PASSWORD: ${{ secrets.PASSWORD }}
                  RESOURCE: ${{ secrets.RESOURCE }}
                  TARGET_URL: 'https://aide-serveur.fr/ressources/'
                  UPDATE_VERSION: '${{ github.ref_name }}'
                  UPDATE_MSG: 'Release ${{ github.ref_name }}'
              run: aide-server-cicd
```

-   Store all sensitive values (`EMAIL`, `PASSWORD`, `RESOURCE`) in GitHub Secrets.
-   Adjust triggers as needed.

---

_Minimal README with environment table and CI/CD example._
