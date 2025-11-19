# GitHub Actions Workflows

Due to permissions restrictions, the following GitHub Actions workflow files could not be automatically committed to the repository. They are available in the `.github/workflows/` directory and should be added manually.

## Workflow Files

### 1. `.github/workflows/ci.yml` - Continuous Integration

**Purpose**: Runs automated tests and build verification on every push and pull request.

**Features**:
- Tests on Node.js versions 18, 20, and 22
- Verifies all build outputs (ESM, CJS, UMD, Browser)
- Runs test suite with coverage
- Tests both ESM and CommonJS imports
- Uploads coverage to Codecov (optional)

**Triggers**:
- Push to main/master branches
- Push to `claude/**` branches
- Pull requests to main/master

**Location**: `.github/workflows/ci.yml`

---

### 2. `.github/workflows/publish.yml` - NPM Publishing

**Purpose**: Automatically publishes the package to npm when a release is created.

**Features**:
- Automated npm publishing on release
- Support for pre-release tags (beta, alpha, next)
- Full test suite execution before publishing
- Bundle size verification
- Package content verification
- npm provenance attestation
- Manual workflow dispatch option

**Triggers**:
- Release published on GitHub
- Manual workflow dispatch

**Setup Required**:
1. Add `NPM_TOKEN` secret to your GitHub repository
2. Get your npm token from https://www.npmjs.com/settings/tokens
3. Add it to Settings > Secrets and variables > Actions > New repository secret

**Location**: `.github/workflows/publish.yml`

---

### 3. `.github/workflows/size.yml` - Bundle Size Monitoring

**Purpose**: Monitors and reports bundle sizes on pull requests.

**Features**:
- Compares bundle sizes with base branch
- Reports size changes in GitHub Actions summary
- Enforces bundle size limits
- Generates detailed size reports
- Runs on every pull request

**Triggers**:
- Pull requests to main/master
- Push to main/master

**Location**: `.github/workflows/size.yml`

---

## How to Add Workflows

These workflow files are already created in your local `.github/workflows/` directory. To add them to the repository:

### Option 1: Manual Commit (Recommended)

1. Ensure you have write access to workflow files in the repository settings
2. Add the workflow files:
   ```bash
   git add .github/workflows/
   git commit -m "Add GitHub Actions workflows for CI/CD"
   git push
   ```

### Option 2: Add via GitHub Web Interface

1. Go to your repository on GitHub
2. Navigate to `.github/workflows/`
3. Click "Add file" > "Create new file"
4. Name the file (e.g., `ci.yml`)
5. Copy the contents from your local file
6. Commit directly to main or create a pull request

### Option 3: Create Pull Request from Current Branch

If you have the workflow files in your local branch but can't push them:

1. Create the workflows in a separate commit
2. Push to a new branch
3. Create a pull request
4. Have someone with workflow permissions approve and merge

## Required Secrets

For the publishing workflow to work, you need to add the following secret:

- `NPM_TOKEN`: Your npm authentication token
  - Get it from: https://www.npmjs.com/settings/tokens
  - Required scopes: "Automation" or "Publish"
  - Add to: Repository Settings > Secrets and variables > Actions

## Optional Secrets

- `CODECOV_TOKEN`: For uploading test coverage to Codecov
  - Only needed if you want coverage reporting
  - Get it from: https://codecov.io/

## Testing Workflows

After adding the workflows:

1. **Test CI workflow**:
   - Push a commit to see if tests run
   - Create a pull request to verify all checks pass

2. **Test size workflow**:
   - Create a pull request to see bundle size reports
   - Check the Actions summary for size comparison

3. **Test publish workflow** (optional):
   - Create a test release (can be a pre-release)
   - Verify the publish job runs successfully
   - Check npm for the published package

## Workflow Permissions

These workflows require the following permissions:
- `contents: read` - Read repository contents
- `pull-requests: write` - Comment on PRs (size workflow)
- `issues: write` - Create issues (size workflow)
- `id-token: write` - npm provenance (publish workflow)

## Troubleshooting

### Workflow fails with "permission denied"

Ensure the repository has Actions enabled:
1. Go to Settings > Actions > General
2. Set "Actions permissions" to allow actions
3. Enable "Allow GitHub Actions to create and approve pull requests"

### Publishing fails with "401 Unauthorized"

1. Verify `NPM_TOKEN` secret is set correctly
2. Ensure the token has publish permissions
3. Check if 2FA is required for your npm account

### Bundle size check fails

1. Verify `size-limit` is in devDependencies
2. Check `.size-limit.json` configuration
3. Ensure builds are generated before size check

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [size-limit Documentation](https://github.com/ai/size-limit)
