import { FastifyInstance } from "fastify";
import { ExampleController } from "./core/controller/ExampleController";
import { rateLimiter } from "./infra/middleware/TokenBucket";

const exampleController = new ExampleController();

export type PageParams = {
  page: string | number;
  size: string | number;
  sort: "id" | "name" | "description";
  direction: "asc" | "desc" | "ASC" | "DESC";
};

export async function TokenBucketRoutes(fastify: FastifyInstance) {
  fastify.get("", {
    preHandler: rateLimiter,
    schema: {
      response: {
        200: { type: "string" },
      },
    },
    handler: async () => {
      return exampleController.testMethod();
    },
  });
}
