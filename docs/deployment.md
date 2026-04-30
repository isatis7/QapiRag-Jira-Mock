# Déploiement

Options de déploiement pour le mock WireMock.

1) Local / Développement
- Utiliser `docker compose up -d` depuis la racine du repo.
- Avantage : montages locaux (`mappings`, `__files`) permettent développement rapide.

2) Container standalone (image immuable)
- Construire une image qui contient les mappings et fixtures (recommandé en prod) :

```dockerfile
FROM wiremock/wiremock:3.3.1
COPY mappings /home/wiremock/mappings
COPY __files /home/wiremock/__files
EXPOSE 8080
ENTRYPOINT ["java","-jar","/wiremock/wiremock-standalone.jar","--verbose"]
```

Build & push :
```bash
docker build -f docker/Dockerfile -t ghcr.io/<owner>/qapirag-jira-mock:1.0.0 .
docker push ghcr.io/<owner>/qapirag-jira-mock:1.0.0
```

3) Déploiement sur VM (systemd)
- Démarrer `docker compose up -d` au boot via un service systemd ou script.

4) Kubernetes
- Déployer l'image immuable, exposer via Service/Ingress. Configurer readinessProbe → `/health`.

5) Points réseau importants
- Si MCP et mock sont dans le même `docker-compose`, MCP doit utiliser l'URL interne du service (ex: `http://qapirag-jira-mock:8080`).
- Si MCP dans un container indépendant et mock sur l'hôte, sur Docker Desktop utilisez `host.docker.internal:8092`. Sur Linux, ajoutez host via `--add-host` ou utilisez `--network host` si acceptable.
