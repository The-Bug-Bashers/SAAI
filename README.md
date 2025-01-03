# SAAI
Sani Alarm Alert Improvement is an improvement for the SaniAlarm app to allow for custom changes such as a monthly rota, displaying messages when no Paramedic is on Duty, or displaying which Paramedics are on duty in the School entrance.

For explanations on how the API requests work, have a look at the backend [README.md](/backend/README.md) file.

## Local Development

Start the MySQL DB in a docker container:

```bash
cd local
docker-compose up -d
```

Run the backend Spring Boot Application:

```
mvn spring-boot:run
```

Browse the API:

* [API Docs](http://localhost:9090/v3/api-docs)
* [Swagger OpenAPI definition](http://localhost:9090/swagger-ui/index.html)
