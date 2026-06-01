# ЭТАП 1: Сборка проекта
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Копируем файлы сборщика
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY gradle.properties .

# Даем права и скачиваем зависимости
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon

# Копируем исходный код и собираем .jar
COPY src src
RUN ./gradlew build -x test --no-daemon

# ЭТАП 2: Запуск готового приложения
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Копируем собранный jar-файл из предыдущего этапа (исключая *-plain.jar)
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar

# Открываем порт 8080 (или тот, что в вашем application.yml)
EXPOSE 8080

# Команда для запуска
ENTRYPOINT ["java", "-jar", "app.jar"]