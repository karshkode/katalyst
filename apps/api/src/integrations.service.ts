import { Injectable } from "@nestjs/common";
import { loadEnv } from "@katalyst/config";
import { IntegrationBus } from "@katalyst/integrations";

@Injectable()
export class IntegrationsService {
  readonly env = loadEnv();
  readonly bus = new IntegrationBus(this.env.INTEGRATION_MODE);
}
