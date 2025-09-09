import cors from "@fastify/cors";
import Fastify, { FastifyInstance } from "fastify";
import "reflect-metadata";

import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { TokenBucketRoutes } from "./src/TokenBucketRoutes.route";

import {
  collectDefaultMetrics,
  Counter,
  Registry as PromRegistry,
} from "prom-client";

class App {
  public server: FastifyInstance;
  private promRegistry: PromRegistry;
  private requestCounter: Counter<string>;

  constructor() {
    this.promRegistry = new PromRegistry();
    this.collectMetrics();

    this.server = Fastify({ logger: false });
    this.middleware();
    this.setSwagger();
    this.routes();
    this.prometheusRoute();
  }

  setSwagger() {
    this.server.register(swagger, {
      openapi: {
        info: {
          title: "Documentação Token Bucket",
          description: "Documentação da API para Token Bucket",
          version: "1.0.0",
        },
      },
    });
    this.server.register(swaggerUi, {
      routePrefix: "/documentation",
      uiConfig: {
        docExpansion: "full",
        deepLinking: false,
      },
      staticCSP: true,
    });
  }

  routes() {
    this.server.register(TokenBucketRoutes, {
      prefix: "/examples",
    });
  }

  middleware() {
    this.server.register(cors);

    this.server.addHook("onResponse", (request, reply, done) => {
      this.requestCounter.inc({
        method: request.method,
        route: request.url,
        status_code: reply.statusCode,
      });
      done();
    });

    this.server.addHook("onRequest", async (request) => {
      if (["POST"].includes(request.method)) {
        request.headers["content-type"] = "application/json";
      }
    });
  }

  collectMetrics() {
    collectDefaultMetrics({ register: this.promRegistry });

    this.requestCounter = new Counter({
      name: "http_requests_total",
      help: "Total de requisições HTTP",
      labelNames: ["method", "route", "status_code"],
      registers: [this.promRegistry],
    });
  }

  prometheusRoute() {
    this.server.get("/metrics", async (request, reply) => {
      reply
        .header("Content-Type", this.promRegistry.contentType)
        .send(await this.promRegistry.metrics());
    });
  }
}

export default new App();
