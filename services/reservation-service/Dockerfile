# Stage 1: Build
FROM gradle:8.5-jdk17 AS build

# Set Gradle cache directory
ARG GRADLE_USER_HOME=/gradle-cache
ENV GRADLE_USER_HOME=$GRADLE_USER_HOME
WORKDIR /app

# Copy Gradle files first for caching dependencies
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Pre-download dependencies (cache layer)
RUN gradle build -x test --no-daemon || true

# Copy application source code
COPY src ./src

# Build the app
RUN gradle build -x test --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/build/libs/*.jar ./app.jar

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
