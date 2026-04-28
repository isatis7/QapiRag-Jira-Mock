# Troubleshooting

Problèmes courants et commandes pour diagnostiquer.

1) Mapping non chargé / 404 inattendu

- Vérifier présence du fichier sur l'hôte :
  ```bash
  ls -la mappings
  cat mappings/your-mapping.json
  ```
- Vérifier le montage dans le container :
  ```bash
  CONTAINER=$(docker ps --filter "name=qapirag-jira-mock" -q)
  docker exec $CONTAINER ls -la /home/wiremock/mappings
  docker exec $CONTAINER cat /home/wiremock/mappings/your-mapping.json
  ```
- Redémarrer WireMock si nécessaire :
  ```bash
  docker compose restart wiremock
  ```

2) 401 inattendu

- Assurez-vous que le MCP envoie l'en-tête `Authorization: Bearer <token>` si le mapping l'exige.

3) Vérifier mappings chargés (admin API)

```bash
curl -sS http://127.0.0.1:8092/__admin/mappings | jq '.mappings | length'
curl -sS http://127.0.0.1:8092/__admin/mappings | jq '.mappings[] | {request: .request, response: .response}'
```

4) Consulter les logs

```bash
docker compose logs -f wiremock --tail 200
# ou
docker logs -f qapirag-jira-mock
```

5) Problèmes réseau (conteneurs)

- Si MCP et WireMock dans le même compose : utilisez `http://<service-name>:8080`.
- Si mock sur l'hôte et MCP dans conteneur : utilisez `host.docker.internal:8092` (Windows/Mac) ou `--add-host` sur Linux.

