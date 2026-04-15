# Step 1: Build the application
FROM eclipse-temurin:17-jdk-jammy AS build
COPY . .
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Step 2: Run the application
FROM eclipse-temurin:17-jre-jammy
COPY --from=build /target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]