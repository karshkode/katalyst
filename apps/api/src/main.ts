import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@katalyst/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [env.WEB_ORIGIN, "http://localhost:3000"],
    credentials: true,
  });
  await app.listen(env.PORT);
  console.log(`Katalyst API listening on ${env.PORT} (mode=${env.INTEGRATION_MODE})`);
}

bootstrap();
