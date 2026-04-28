# Health check et automation

Fichiers : `scripts/health-check.sh` (déjà présent) — vérifie `__admin/mappings`, `/health` et un stub métier.

Usage local :

```bash
chmod +x scripts/health-check.sh
bash scripts/health-check.sh
```

Systemd (optionnel) :

Créer `/etc/systemd/system/qapirag-jira-mock-health.service` :

```
[Unit]
Description=QapiRag WireMock health check
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/QapiRag-Jira-Mock/scripts/health-check.sh
```

Créer `/etc/systemd/system/qapirag-jira-mock-health.timer` :

```
[Unit]
Description=Run Health Check every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Unit=qapirag-jira-mock-health.service

[Install]
WantedBy=timers.target
```

Activer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now qapirag-jira-mock-health.timer
```

