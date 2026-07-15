import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { IntegrationsService } from "./integrations.service";
import { PrismaService } from "./prisma.service";

@Module({
  controllers: [AppController],
  providers: [PrismaService, IntegrationsService],
})
export class AppModule {}
