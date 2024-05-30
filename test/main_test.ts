import { assert, assertEquals, assertObjectMatch } from "@std/assert";
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

// Body parameters tests

// Multipart form data
Deno.test("http POST request with form data", async () => {
  const formData = new FormData();
  formData.append("test", "value");
  const fileContent = "file content";
  formData.append("file", new File([fileContent], "file.txt"));

  const response = await grab(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: formData,
  });
  const json = await response.json();

  const responseFetch = await fetch(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: formData,
  });
  const jsonFetch = await responseFetch.json();

  assert(response.ok);
  assert(json.form.test === "value");
  assert(json.files.file === fileContent);
  assertObjectMatch(json.form, jsonFetch.form);
});

// Normal form data
Deno.test("http POST request with normal form data", async () => {
  const response = await grab(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: new URLSearchParams("test=value"),
  });
  const json = await response.json();

  const responseFetch = await fetch(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: new URLSearchParams("test=value"),
  });
  const jsonFetch = await responseFetch.json();

  console.log(json.form, jsonFetch.form);

  assert(response.ok);
  assertObjectMatch(json.form, jsonFetch.form);
});

// JSON
Deno.test("http POST request with JSON", async () => {
  const response = await grab(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: JSON.stringify({ test: "value" }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const json = await response.json();

  const responseFetch = await fetch(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: JSON.stringify({ test: "value" }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const jsonFetch = await responseFetch.json();

  assert(response.ok);
  assertObjectMatch(json.json, jsonFetch.json);
});

// Binary
Deno.test("http POST request with binary", async () => {
  const response = await grab(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: new Uint8Array([1, 2, 3, 4]),
  });
  const json = await response.json();

  const responseFetch = await fetch(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: new Uint8Array([1, 2, 3, 4]),
  });
  const jsonFetch = await responseFetch.json();

  assert(response.ok);
  assertEquals(response.ok, responseFetch.ok);
  assertEquals(JSON.stringify(json.data), JSON.stringify(jsonFetch.data));
});

// Array buffer
Deno.test("http POST request with array buffer", async () => {
  const response = await grab(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: new ArrayBuffer(8),
  });
  const json = await response.json();

  const responseFetch = await fetch(`${BASE_URL_HTTP}/post`, {
    method: "POST",
    body: new ArrayBuffer(8),
  });
  const jsonFetch = await responseFetch.json();

  assert(response.ok);
  assertEquals(response.ok, responseFetch.ok);
  assertEquals(JSON.stringify(json.data), JSON.stringify(jsonFetch.data));
});

// Test rest of the methods
Deno.test("http PUT request", async () => {
  const response = await grab(`${BASE_URL_HTTP}/put`, {
    method: "PUT",
  });
  const json = await response.json();

  assert(response.ok);
  assert(json.url === `${BASE_URL_HTTP}/put`);
});

Deno.test("http PATCH request", async () => {
  const response = await grab(`${BASE_URL_HTTP}/patch`, {
    method: "PATCH",
  });
  const json = await response.json();

  assert(response.ok);
  assert(json.url === `${BASE_URL_HTTP}/patch`);
});

// delete
Deno.test("http DELETE request", async () => {
  const response = await grab(`${BASE_URL_HTTP}/delete`, {
    method: "DELETE",
  });
  const json = await response.json();

  assert(response.ok);
  assert(json.url === `${BASE_URL_HTTP}/delete`);
});

