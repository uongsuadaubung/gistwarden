import { z } from "zod";
import { getAssetUrl } from "@/core/runtime.ts";
import { isRecord } from "@/core/storage.ts";
import { onExtensionMessage, type RouteContract } from "@/core/messaging.ts";

export interface MessageContext {
  sender: chrome.runtime.MessageSender;
  isExtensionSender: boolean;
}

export type HandlerFunction<TSchema extends z.ZodTypeAny, TResponse> = (
  payload: z.infer<TSchema>,
  context: MessageContext,
) => Promise<TResponse> | TResponse;

export interface RegisteredRouteDefinition<
  TSchema extends z.ZodTypeAny,
  TResponse,
> {
  schema: TSchema;
  internalOnly?: boolean;
  handler: HandlerFunction<TSchema, TResponse>;
}

interface StoredRoute {
  schema: z.ZodTypeAny;
  internalOnly?: boolean;
  handler: (
    payload: unknown,
    context: MessageContext,
  ) => Promise<unknown> | unknown;
}

function isRegisteredRoute(
  val: unknown,
): val is RegisteredRouteDefinition<z.ZodTypeAny, unknown> {
  return (
    isRecord(val) &&
    "schema" in val &&
    isRecord(val.schema) &&
    "safeParse" in val.schema &&
    typeof val.schema.safeParse === "function" &&
    "handler" in val &&
    typeof val.handler === "function"
  );
}

function isZodSchema(val: unknown): val is z.ZodTypeAny {
  return (
    isRecord(val) &&
    "safeParse" in val &&
    typeof val.safeParse === "function"
  );
}

function isRouteContract(
  val: unknown,
): val is RouteContract<string, z.ZodTypeAny, z.ZodTypeAny> {
  return (
    isRecord(val) &&
    "type" in val &&
    typeof val.type === "string" &&
    "payloadSchema" in val &&
    "responseSchema" in val
  );
}

function isHandlerFn(
  val: unknown,
): val is (payload: unknown, context: MessageContext) => unknown {
  return typeof val === "function";
}

export class MessageRouter {
  private routes = new Map<string, StoredRoute>();

  register<
    TType extends string,
    TPayloadSchema extends z.ZodTypeAny,
    TResponseSchema extends z.ZodTypeAny,
  >(
    route: RouteContract<TType, TPayloadSchema, TResponseSchema>,
    handler: HandlerFunction<TPayloadSchema, z.infer<TResponseSchema>>,
  ): this;
  register<TSchema extends z.ZodTypeAny, TResponse>(
    type: string,
    schema: TSchema,
    handler: HandlerFunction<TSchema, TResponse>,
    internalOnly?: boolean,
  ): this;
  register<TSchema extends z.ZodTypeAny, TResponse>(
    type: string,
    route: RegisteredRouteDefinition<TSchema, TResponse>,
  ): this;
  register(
    typeOrRoute: unknown,
    schemaOrRouteOrHandler?: unknown,
    handlerOrInternalOnly?: unknown,
    internalOnlyParam = false,
  ): this {
    if (isRouteContract(typeOrRoute)) {
      if (!isHandlerFn(schemaOrRouteOrHandler)) return this;
      const routeContract = typeOrRoute;
      const targetHandler = schemaOrRouteOrHandler;
      this.routes.set(routeContract.type, {
        schema: routeContract.payloadSchema,
        internalOnly: routeContract.internalOnly,
        handler: (rawPayload: unknown, context: MessageContext) => {
          const parseRes = routeContract.payloadSchema.safeParse(rawPayload);
          if (!parseRes.success) {
            console.warn(
              `[MessageRouter] Schema validation failed for type ${routeContract.type}:`,
              parseRes.error,
            );
            return { success: false, error: "Invalid message payload" };
          }
          return targetHandler(parseRes.data, context);
        },
      });
      return this;
    }

    if (typeof typeOrRoute === "string") {
      const type = typeOrRoute;
      let schema: z.ZodTypeAny | null = null;
      let fn: ((payload: unknown, context: MessageContext) => unknown) | null =
        null;
      let isInternalOnly = internalOnlyParam;

      if (isRegisteredRoute(schemaOrRouteOrHandler)) {
        schema = schemaOrRouteOrHandler.schema;
        fn = schemaOrRouteOrHandler.handler;
        if (schemaOrRouteOrHandler.internalOnly !== undefined) {
          isInternalOnly = schemaOrRouteOrHandler.internalOnly;
        }
      } else if (
        isZodSchema(schemaOrRouteOrHandler) &&
        isHandlerFn(handlerOrInternalOnly)
      ) {
        schema = schemaOrRouteOrHandler;
        fn = handlerOrInternalOnly;
        if (typeof internalOnlyParam === "boolean") {
          isInternalOnly = internalOnlyParam;
        }
      }

      if (!schema || !fn) {
        console.error(
          `[MessageRouter] Invalid route definition for message type: ${type}`,
        );
        return this;
      }

      const validSchema = schema;
      const validFn = fn;
      this.routes.set(type, {
        schema: validSchema,
        internalOnly: isInternalOnly,
        handler: (rawPayload: unknown, context: MessageContext) => {
          const parseRes = validSchema.safeParse(rawPayload);
          if (!parseRes.success) {
            console.warn(
              `[MessageRouter] Schema validation failed for type ${type}:`,
              parseRes.error,
            );
            return { success: false, error: "Invalid message payload" };
          }
          return validFn(parseRes.data, context);
        },
      });
      return this;
    }

    return this;
  }

  use(pluginFn: (router: MessageRouter) => void): this {
    pluginFn(this);
    return this;
  }

  registerGroup<
    T extends {
      [K in keyof T]: T[K] extends RegisteredRouteDefinition<infer S, infer R>
        ? RegisteredRouteDefinition<S, R>
        : never;
    },
  >(routes: T): this {
    for (const [type, route] of Object.entries(routes)) {
      if (isRegisteredRoute(route)) {
        this.register(type, route);
      }
    }
    return this;
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
          this.handleMessage(rawMessage, sender)
            .then((res) => {
              if (res.handled) {
                sendResponse(res.response);
              }
            })
            .catch((err) => {
              console.error("[MessageRouter] Unhandled listener error:", err);
              sendResponse({ success: false, error: "Internal server error" });
            });
          return true;
        }
        return false;
      },
    );
  }

  hasRoute(type: string): boolean {
    return this.routes.has(type);
  }

  async handleMessage(
    rawMessage: unknown,
    sender: chrome.runtime.MessageSender,
  ): Promise<{ handled: boolean; response?: unknown }> {
    if (!isRecord(rawMessage) || typeof rawMessage.type !== "string") {
      return { handled: false };
    }

    const route = this.routes.get(rawMessage.type);
    if (!route) {
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

    if (route.internalOnly && !isExtensionSender) {
      console.warn(
        `[MessageRouter] Unauthorized message type: ${rawMessage.type} from sender:`,
        sender.url || sender.id,
      );
      return {
        handled: true,
        response: { success: false, error: "Unauthorized sender context" },
      };
    }

    try {
      const response = await route.handler(rawMessage, {
        sender,
        isExtensionSender,
      });
      return { handled: true, response };
    } catch (err) {
      console.error(
        `[MessageRouter] Error executing handler for ${rawMessage.type}:`,
        err,
      );
      return {
        handled: true,
        response: { success: false, error: "Handler execution failed" },
      };
    }
  }
}
