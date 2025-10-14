# GitHub Actions CI/CD

## Workflows

### CI (`ci.yml`)
Runs on every push/PR:
- Build application
- Run unit tests  
- Code quality checks

### E2E Tests (`e2e-tests.yml`)
Runs nightly at 2 AM UTC + manual trigger:
- Full E2E test suite with Fledge container
- Uses private registry: `54.204.128.201:5000`

### PR Commands (`pr-commands.yml`)
Trigger tests via PR comments:
```
/run-e2e
```
Runs build + E2E tests on your PR branch.

## Configuration

**Private Registry**: `54.204.128.201:5000/fledge:nightly-ubuntu2004`  
**OS**: Ubuntu 20.04  
**Node**: 16.x  
**Artifacts**: 3-5 days retention

## Insecure Registry Setup

Docker is configured to allow the insecure registry. If the registry is unavailable, workflows will fail (no fallback to Docker Hub).

**Alternative**: Use self-hosted runners with network access to the registry.

## Usage

**Automatic**: Push to main/develop triggers CI. Nightly E2E runs at 2 AM UTC.

**Manual**: Comment `/run-e2e` on any PR to trigger build + E2E tests.

## Status Badges

```markdown
![CI](https://github.com/fledge-iot/fledge-gui/workflows/CI/badge.svg)
![E2E](https://github.com/fledge-iot/fledge-gui/workflows/E2E%20Tests/badge.svg)
```

## Optional: Notifications

To add Slack/email notifications:

1. Add secrets: `SLACK_WEBHOOK_URL` or `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_TO`
2. Add notification job to workflow (see [GitHub Actions docs](https://github.com/marketplace/actions/slack-send))

## Documentation

- [PR Commands](PR_COMMANDS.md) - PR comment trigger details
- [Insecure Registry](INSECURE_REGISTRY_SETUP.md) - Registry configuration
