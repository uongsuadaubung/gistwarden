import type { MessageRouter } from "@/extension/message-router.ts";
import {
  checkDataBreachRoute,
  checkEmailBreachUseCase,
  checkHIBPRoute,
  checkPasswordHIBPUseCase,
} from "@gistwarden/orchestrator";

export function registerReportRoutes(router: MessageRouter): void {
  router
    .register(checkHIBPRoute, async (payload) => {
      const res = await checkPasswordHIBPUseCase(payload.password);
      return {
        success: !res.errorKey,
        count: res.count,
        errorKey: res.errorKey,
      };
    })
    .register(checkDataBreachRoute, async (payload) => {
      return await checkEmailBreachUseCase(payload.email);
    });
}
