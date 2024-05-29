import { assertEquals } from "jsr:@std/assert";
import { grab } from "./main.ts";

// TODO: Actually make some tests lol

const BASE_HTTPS_URL = "https://httpbin.org/get";
const NOT_FOUND_URL = "https://httpbin.org/status/404";
const SERVER_ERROR_URL = "https://httpbin.org/status/500";

Deno.test("Basic GET HTTPS Request", async () => {
  const response = await grab(BASE_HTTPS_URL);
  assertEquals(response.status, 200);
});

Deno.test("GET HTTPS Request with 404 status", async () => {
  const response = await grab(NOT_FOUND_URL);
  assertEquals(response.status, 404);
});

Deno.test("GET HTTPS Request with 500 status", async () => {
  const response = await grab(SERVER_ERROR_URL);
  assertEquals(response.status, 500);
});
