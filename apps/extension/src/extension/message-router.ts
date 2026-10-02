import { isRecord } from "@gistwarden/domain";
import {
  onExtensionMessage,
  type RouteContract,
} from "@gistwarden/orchestrator";
import type { z } from "zod";
import { getAssetUrl } from "@/core/runtime.ts";
import type {
  MessageCommand,
  MessageContext,
} from "@/extension/message-command.ts";
import { createCommand } from "@/extension/message-command.ts";

export type {
  MessageCommand,
  MessageContext,
} from "@/extension/message-command.ts";
export { createCommand } from "@/extension/message-command.ts";

export class MessageRouter {
  private commands = new Map<string, MessageCommand<unknown, unknown>>();

  registerCommand<TPayload, TResponse>(
    command: MessageCommand<TPayload, TResponse>,
  ): this {
    this.commands.set(command.type, command);
    return this;
  }

  registerCommands(commands: MessageCommand[]): this {
    for (const cmd of commands) {
      this.registerCommand(cmd);
    }
    return this;
  }

  register<
    TType extends string,
    TPayloadSchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny,
  >(
    route: RouteContract<TType, TPayloadSchema, TResponseSchema>,
    handler: (
      payload: z.infer<TPayloadSchema>,
      context: MessageContext,
    ) => Promise<z.infer<TResponseSchema>> | z.infer<TResponseSchema>,
  ): this {
    return this.registerCommand(createCommand(route, handler));
  }

  use(pluginFn: (router: MessageRouter) => void): this {
    pluginFn(this);
    return this;
  }

  hasRoute(type: string): boolean {
    return this.commands.has(type);
  }

  listen(): void {
    onExtensionMessage(
      (
        rawMessage: unknown,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void,
      ) => {
        if (
          isRecord(rawMessage) &&
          typeof rawMessage.type === "string" &&
          this.hasRoute(rawMessage.type)
        ) {
          void this.handleMessage(rawMessage, sender).then((res) => {
            if (res.handled) {
              sendResponse(res.response);
            }
          });
          return true;
        }
        return false;
      },
    );
  }

  async handleMessage(
    rawMessage: unknown,
    sender: chrome.runtime.MessageSender,
  ): Promise<{ handled: boolean; response?: unknown }> {
    if (!isRecord(rawMessage) || typeof rawMessage.type !== "string") {
      return { handled: false };
    }

    const command = this.commands.get(rawMessage.type);
    if (!command) {
      return { handled: false };
    }

    const extensionPageOrigin = getAssetUrl("");
    const isExtensionUrl = Boolean(
      extensionPageOrigin.length > 0 &&
        sender.url &&
        sender.url.startsWith(extensionPageOrigin),
    );
    const isExtensionRuntime = Boolean(
      typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.id &&
        sender.id === chrome.runtime.id &&
        !sender.tab,
    );
    const isExtensionSender = isExtensionUrl || isExtensionRuntime;

    // 1. Authorization check
    if (command.internalOnly && !isExtensionSender) {
      console.warn(
        `[MessageRouter] Unauthorized message from sender:`,
        sender.url || sender.id,
      );
      return {
        handled: true,
        response: { success: false, error: "Unauthorized sender context" },
      };
    }

    // 2. Payload Validation check
    let validatedPayload: unknown = rawMessage;
    if (command.payloadSchema) {
      const parseRes = command.payloadSchema.safeParse(rawMessage);
      if (!parseRes.success) {
        console.warn(
          `[MessageRouter] Schema validation failed:`,
          parseRes.error,
        );
        return {
          handled: true,
          response: { success: false, error: "Invalid message payload" },
        };
      }
      validatedPayload = parseRes.data;
    }

    const response = await command.execute(validatedPayload, {
      sender,
      isExtensionSender,
    });
    return { handled: true, response };
  }
}
