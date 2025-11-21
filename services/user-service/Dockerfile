# Stage 1: Build the application
FROM gradle:8.5-jdk17 AS build

# Set Gradle cache directory for faster builds
ARG GRADLE_USER_HOME=/gradle-cache
ENV GRADLE_USER_HOME=$GRADLE_USER_HOME
WORKDIR /app

# Copy Gradle files and pre-download dependencies
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle build -x test --no-daemon || true

# Copy source code and build the app
COPY src ./src
RUN gradle build -x test --no-daemon

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy the jar from the build stage
COPY --from=build /app/build/libs/*.jar ./app.jar

# Expose the application port
EXPOSE 8086

# Set entrypoint
ENTRYPOINT ["java", "-jar", "app.jar"]

# Healthcheck using wget
HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:8086/actuator/health || exit 1
