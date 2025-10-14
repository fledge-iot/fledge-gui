# Insecure Docker Registry

## Configuration

**Registry**: `54.204.128.201:5000` (HTTP only)  
**Image**: `fledge:nightly-ubuntu2404`  
**Full Path**: `54.204.128.201:5000/fledge:nightly-ubuntu2404`

## How It Works

Workflows configure Docker to allow insecure (HTTP) registry:

```json
{
  "insecure-registries": ["54.204.128.201:5000"]
}
```

Then restart Docker and pull the image. **No fallback** - workflow fails if registry unavailable.

## Network Requirements

⚠️ **GitHub Actions runners need public internet access** to `54.204.128.201:5000`

If registry is **not accessible**:

**Option 1**: Self-hosted runners
```yaml
runs-on: self-hosted
```

**Option 2**: GitHub Container Registry
```bash
docker tag 54.204.128.201:5000/fledge:nightly-ubuntu2404 ghcr.io/fledge-iot/fledge:nightly
docker push ghcr.io/fledge-iot/fledge:nightly
```
Update workflow:
```yaml
env:
  FLEDGE_IMAGE: ghcr.io/fledge-iot/fledge:nightly
```
Remove insecure registry config step.

**Option 3**: Docker Hub
```yaml
env:
  FLEDGE_IMAGE: fledge-iot/fledge:nightly
```
Remove insecure registry config step.

## Troubleshooting

**Error: "http: server gave HTTP response to HTTPS client"**
- Docker config not applied. Check daemon.json.

**Error: "connection refused"**
- Registry not accessible. Use self-hosted runners or alternative registry.

**Error: "manifest unknown"**
- Image doesn't exist. Verify image name/tag.

## Security Note

HTTP registries are suitable for internal/development only. For production, use HTTPS registries with TLS certificates.