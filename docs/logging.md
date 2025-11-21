# Logging Best Practices

## Overview

This document describes logging practices for the Terranote Telegram adapter.

## Current Implementation

The adapter uses [Pino](https://getpino.io/) for structured logging:

- **Development**: Logs to stdout with pretty formatting via `pino-pretty`
- **Production**: Logs to stdout/stderr in JSON format (captured by systemd/journald)

## Log Location

### Development
Logs are written to stdout/stderr. If you need to capture them:

```bash
npm start > ~/.local/share/terranote/logs/adapter.log 2>&1
```

### Production (Recommended)

#### Option 1: systemd/journald (Recommended)
When running as a systemd service, logs are automatically captured by journald:

```bash
# View logs
journalctl -u terranote-adapter-telegram -f

# View last 100 lines
journalctl -u terranote-adapter-telegram -n 100
```

#### Option 2: File-based logging
If you prefer file-based logs, configure systemd to redirect output:

```ini
[Service]
StandardOutput=append:/var/log/terranote/adapter.log
StandardError=append:/var/log/terranote/adapter-error.log
```

Then configure log rotation via `logrotate` (managed in `terranote-infra`).

## Directory Structure

### Recommended Production Structure

```
/var/log/terranote/
├── adapter-telegram.log
├── adapter-telegram-error.log
├── core.log
└── core-error.log
```

Or for user-based deployment:

```
~/.local/share/terranote/logs/
├── adapter-telegram.log
└── core.log
```

## Log Rotation

Log rotation should be configured in `terranote-infra` using `logrotate`:

```conf
/var/log/terranote/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 terranote terranote
    sharedscripts
    postrotate
        systemctl reload terranote-adapter-telegram > /dev/null 2>&1 || true
        systemctl reload terranote-core > /dev/null 2>&1 || true
    endscript
}
```

## Git Ignore

All log files are excluded from Git via `.gitignore`:

```
*.log
```

## Infrastructure Management

All logging infrastructure (systemd services, logrotate configs, directory creation) should be managed in the `terranote-infra` repository, not in individual service repositories.

## References

- [Pino Documentation](https://getpino.io/)
- [Pino Ecosystem (Log Rotation)](https://github.com/pinojs/pino/blob/master/docs/ecosystem.md#log-rotation)
- [systemd Journal](https://www.freedesktop.org/software/systemd/man/systemd-journald.service.html)

