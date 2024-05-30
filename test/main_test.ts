import { assert } from "@std/assert";
import { grab } from "../src/main.ts";

const BASE_URL_HTTP = "http://httpbin.org";
const BASE_URL_HTTPS = "https://httpbin.org";
interface HttpBinResponse {
  args: Record<string, string>;
  headers: Record<string, string>;
  origin: string;
  url: string;
}

Deno.test("http GET request", async () => {
  const response = await grab(`${BASE_URL_HTTP}/get`);
  const json = await response.json();

  assert(response.ok);
  assert(json.url === `${BASE_URL_HTTP}/get`);
});

Deno.test("https GET request", async () => {
  const response = await grab(`${BASE_URL_HTTPS}/get`);
  const json = await response.json();

  assert(response.ok);
  assert(json.url === `${BASE_URL_HTTPS}/get`);
});

Deno.test("http POST request", async () => {
  const response = await grab(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: JSON.stringify({ test: "value" }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const json = await response.json();

  assert(response.ok);
  assert(json.json.test === "value");
});

Deno.test("http DELETE request", async () => {
  const response = await grab(`${BASE_URL_HTTP}/delete`, {
    method: "DELETE",
  });
  const json = await response.json();

  assert(response.ok);
  assert(json.url === `${BASE_URL_HTTP}/delete`);
});

Deno.test("http POST request on GET endpoint", async () => {
  const response = await grab(`${BASE_URL_HTTP}/get`, {
    method: "POST",
  });

  assert(!response.ok);
  assert(response.status === 405);
});

Deno.test("http GET request with query parameters", async () => {
  const response = await grab(`${BASE_URL_HTTP}/get?test=value`);
  const json = await response.json() as HttpBinResponse;

  assert(response.ok);
  assert(json.args.test === "value");
});

Deno.test("http GET request with headers", async () => {
  const response = await grab(`${BASE_URL_HTTP}/get`, {
    headers: {
      "X-Test-Header": "value",
    },
  });
  const json = await response.json() as HttpBinResponse;

  assert(response.ok);
  assert(json.headers["X-Test-Header"] === "value");
});

Deno.test("https GET request with query parameters and headers", async () => {
  const response = await grab(`${BASE_URL_HTTPS}/get?test=value`, {
    headers: {
      "X-Test-Header": "value",
    },
  });
  const json = await response.json() as HttpBinResponse;

  assert(response.ok);
  assert(json.args.test === "value");
  assert(json.headers["X-Test-Header"] === "value");
});

Deno.test("http GET request with fragment", async () => {
  const response = await grab(`${BASE_URL_HTTP}/get#test`);
  const json = await response.json() as HttpBinResponse;

  assert(response.ok);
  assert(json.url === `${BASE_URL_HTTP}/get`);
});
