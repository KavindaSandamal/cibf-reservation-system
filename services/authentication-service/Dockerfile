# Multi-stage build for smaller image
FROM gradle:8.5-jdk17 AS build
WORKDIR /app

# Copy Gradle files
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Copy source code
COPY src ./src

# Build application (skip tests for faster build)
RUN gradle build -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy built JAR
COPY --from=build /app/build/libs/*.jar app.jar

# Optimize JVM for container (t2.micro has 1GB RAM)
ENV JAVA_OPTS="-Xmx256m -Xms128m"

EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]