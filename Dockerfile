FROM maven:3-eclipse-temurin-25-noble AS build
WORKDIR /build
COPY pom.xml ./
COPY frontend ./frontend
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:25-jre-noble
WORKDIR /app
COPY --from=build /build/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar
USER 10001:10001
EXPOSE 10000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
