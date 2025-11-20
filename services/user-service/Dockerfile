# Stage 1: Build
FROM gradle:8.5-jdk17 AS build

# Set Gradle cache directory
ARG GRADLE_USER_HOME=/gradle-cache
ENV GRADLE_USER_HOME=$GRADLE_USER_HOME
WORKDIR /app

COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle build -x test --no-daemon || true

COPY src ./src
RUN gradle build -x test --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar ./app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
