# Stage 1: Build
FROM gradle:8.5-jdk17 AS build

# Set Gradle cache directory
ARG GRADLE_USER_HOME=/gradle-cache
ENV GRADLE_USER_HOME=$GRADLE_USER_HOME
WORKDIR /app

# Copy Gradle files first for caching
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Pre-download dependencies
RUN gradle build -x test --no-daemon || true

# Copy source code
COPY src ./src

# Build the app
RUN gradle build -x test --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar ./app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
