# PR Comment Commands

## Usage

Comment on any PR with these commands (case-insensitive):

```
/run-e2e
/test-e2e
run e2e tests
```

## What Happens

1. Bot reacts with 🚀
2. Workflow runs:
   - Builds application
   - Starts Fledge container
   - Runs E2E tests
3. Bot comments with results

## Example

**You comment:**
```
/run-e2e
```

**Bot responds:**
```
✅ Build & E2E Tests PASSED

Triggered by: @username
Branch: feature/branch
Commit: abc1234

Checks:
✅ Build successful
✅ E2E tests passed

🎉 All checks passed!
```

## Requirements

- Works on PRs from same repository
- Requires write access to trigger
- Registry `54.204.128.201:5000` must be accessible

## Artifacts

Test results available for 3 days:
- XML/HTML reports
- Screenshots (on failure)
- Docker logs

## Troubleshooting

**No reaction?**
- Ensure it's a PR (not an issue)
- Check command spelling

**Tests fail?**
- View workflow run logs
- Download artifacts for details
- Check registry accessibility

---

For more details, see [main README](README.md).
