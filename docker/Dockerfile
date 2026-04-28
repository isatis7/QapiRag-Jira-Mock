FROM wiremock/wiremock:3.3.1

# Copy mappings and fixtures into the image for an immutable production image
COPY mappings /home/wiremock/mappings
COPY __files /home/wiremock/__files

EXPOSE 8080

ENTRYPOINT ["java","-jar","/wiremock/wiremock-standalone.jar","--verbose"]

