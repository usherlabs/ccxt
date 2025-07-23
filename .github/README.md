# GitHub Actions

This directory contains GitHub Actions workflows for building and publishing the CCXT library.

## Workflows

### Build and Test (`build.yml`)
- Runs on pull requests and pushes to main/master branches
- Builds the project using TypeScript, Webpack, and Rollup
- Verifies that all build artifacts are created successfully
- Does not publish to NPM

### Build and Publish (`publish.yml`)
- Runs when a new version tag is pushed (e.g., `v0.0.4`)
- Verifies that the tag version matches the package.json version
- Builds the project and all bundles
- Publishes the package to NPM

## Setup

### NPM Token Setup

To enable automatic publishing to NPM, you need to set up an NPM authentication token:

1. **Create an NPM Access Token:**
   - Go to [npmjs.com](https://www.npmjs.com) and log in
   - Navigate to your profile settings
   - Go to "Access Tokens" section
   - Click "Generate New Token"
   - Select "Automation" token type
   - Copy the generated token

2. **Add the Token to GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM access token
   - Click "Add secret"

### Publishing Process

1. **Prepare for Release:**
   - Update the version in `package.json`
   - Commit your changes
   - Push to the repository

2. **Create and Push Version Tag:**
   ```bash
   git tag v0.0.4
   git push origin v0.0.4
   ```
   
   Or create the tag via GitHub:
   - Go to GitHub repository → Releases
   - Click "Create a new release"
   - Tag version (e.g., `v0.0.4`)
   - Write release notes
   - Click "Publish release"

3. **Automatic Publishing:**
   - The `publish.yml` workflow will automatically trigger when the tag is pushed
   - It will verify the version matches package.json
   - Build the project and publish to NPM
   - Check the Actions tab to monitor the process

## Build Process

The build process includes:

1. **TypeScript Compilation:** `npm run build`
2. **Browser Bundle:** Webpack creates `dist/ccxt.browser.js`
3. **CommonJS Bundle:** Rollup creates `dist/cjs/` directory
4. **Minified Bundle:** Production webpack build

## Troubleshooting

- **Build Failures:** Check the Actions tab for detailed error logs
- **NPM Publishing Issues:** Verify the NPM_TOKEN secret is correctly set
- **Version Conflicts:** The workflow will automatically fail if the tag version doesn't match package.json version
- **Tag Format:** Ensure tags follow the format `v*` (e.g., `v0.0.4`, `v1.2.3`) 