import request from "supertest";
import { test, expect } from "vitest";
import app from "../src/server.js";

test("GET /health works", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});
