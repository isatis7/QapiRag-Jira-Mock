FROM wiremock/wiremock:3.3.1

# Copy mappings and fixtures
COPY mappings /home/wiremock/mappings
COPY __files /home/wiremock/__files

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/__admin/mappings || exit 1

# Start WireMock with verbose logging
ENTRYPOINT ["java","-jar","/wiremock/wiremock-standalone.jar","--verbose"]