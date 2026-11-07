# =============================================================================
# Stage 1: Build the Spring Boot application using Maven
# =============================================================================
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Cache dependency layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production artifact
COPY src ./src
RUN mvn clean package -DskipTests -B

# =============================================================================
# Stage 2: Hardened, Lightweight JRE 21 Runtime for Render / Cloud Containers
# =============================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install native dependencies required for image processing and health monitoring
RUN apk add --no-cache curl fontconfig freetype tzdata

# Create dedicated non-root application group and user
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

# Prepare application and storage directories with correct permissions
RUN mkdir -p /app/storage/media /app/tmp && \
    chown -R appuser:appgroup /app

# Copy executable jar from builder stage
COPY --from=builder --chown=appuser:appgroup /app/target/accessmap-backend-*.jar app.jar

# Switch to unprivileged user
USER appuser

# Expose container port (documentation only; Render routes dynamically via $PORT)
EXPOSE 8080

# Environment defaults
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# Native container healthcheck via Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT}/actuator/health || exit 1

# Execute Java with exec to ensure SIGTERM / SIGINT signals are forwarded for graceful shutdown
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT} -Dserver.address=0.0.0.0 -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar app.jar"]
