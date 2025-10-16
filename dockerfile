# Fase de construcción
FROM maven:3.8.4-openjdk-11 AS builder
WORKDIR /app
COPY pom.xml .
# Copia el código fuente
COPY src ./src
RUN mvn clean package -DskipTests

# Fase de ejecución
FROM openjdk:11-jre-slim
WORKDIR /app

# Copiar el JAR desde la fase de construcción
COPY --from=builder /app/target/card-payment-sample-java-1.0.0.jar app.jar

# Variables de entorno
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV SPRING_PROFILES_ACTIVE="default"

# Puerto que usa Spring Boot por defecto
EXPOSE 8080

# Health check para Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Usuario no root para seguridad
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Comando de ejecución
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
