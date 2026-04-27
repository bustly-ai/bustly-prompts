# bustly-prompts

Remote-managed prompt documents for Bustly bootstrap and agent initialization.

## Upload to OSS

Upload `openclaw-prompts/` to OSS path `bustly-prompts/`:

```bash
# from repository root
pnpm bustly-prompts:upload:test
```

Direct script usage:

```bash
node bustly-prompts/scripts/upload-dist.mjs --env test
node bustly-prompts/scripts/upload-dist.mjs --env prod
```

Optional flags:

```bash
node bustly-prompts/scripts/upload-dist.mjs --env test --prefix bustly-prompts --dry-run
```
