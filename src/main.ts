import { Buffer } from "jsr:@std/io/buffer";
import { iterateReader } from "jsr:@std/io/iterate-reader";

/**
 * Grabs a resource from the network. It uses a TCP connection to make HTTP/1.1 requests to the server.
 * It returns a Promise that resolves to the Response to that Request, whether it is successful or not.
 * @param input RequestInfo | URL
 * @param init
 */
export async function grab(
  input: string | Request | URL,
  init?: RequestInit
): Promise<Response> {
  let url: URL;

  if (input instanceof URL) {
    url = input;
  } else if (typeof input === "string") {
    url = new URL(input);
  } else {
    url = new URL(input.url);
  }

  const host = url.hostname;

  const protocol = url.protocol;

  const port =
    url.port === "" ? (protocol === "https:" ? 443 : 80) : parseInt(url.port);

  const method = init?.method || "GET";

  const headers: Headers = new Headers(init?.headers || {});

  const body = method !== "GET" ? init?.body : "";

  // note: God willing, this will be replaced with a proper implementation
  const contentLength = body
    ? body instanceof Blob || body instanceof URLSearchParams
      ? body.size
      : body instanceof ArrayBuffer || ArrayBuffer.isView(body)
      ? body.byteLength
      : body instanceof FormData || body instanceof ReadableStream
      ? body.values.length
      : body.length
    : 0;

  const request =
    `${method} ${url.pathname} HTTP/1.1\r\n` +
    `Host: ${host}\r\n` +
    `Connection: close\r\n` +
    `${
      headers.values.length
        ? [...headers.entries()].map(([k, v]) => `${k}: ${v}`).join("\r\n")
        : ""
    }\r\n` +
    `${body ? `Content-Length: ${contentLength}` : ""}\r\n` +
    `${body}\r\n`;

  let connection: Deno.Conn<Deno.Addr>;

  try {
    connection =
      protocol === "https:"
        ? await Deno.connectTls({ hostname: host, port })
        : await Deno.connect({ hostname: host, port });

    await connection.write(new TextEncoder().encode(request));
  } catch (error) {
    console.error("Error while connecting to the server:", error);
    Deno.exit(1);
  }

  let response = "";

  const buffer = new Buffer();

  try {
    for await (const chunk of iterateReader(connection)) {
      await buffer.write(chunk);
      console.log("Chunk:", new TextDecoder().decode(chunk));
    }
  } catch (error) {
    // This can be a false positive, as it's a know issue for HTTPS: https://github.com/denoland/deno/issues/13058
    // If the response content lenght matches the actual content length, then it's a false positive
    const aux = new TextDecoder().decode(buffer.bytes());
    const contentLengthMatch = aux.match(/Content-Length: (\d+)/);
    const contentLength = contentLengthMatch
      ? parseInt(contentLengthMatch[1])
      : 0;
    const body = aux.split("\r\n\r\n")[1];

    if (contentLength !== body.length) {
      console.error("Error while reading the response:", error);
      Deno.exit(1);
    }
  }

  response = new TextDecoder().decode(buffer.bytes());

  connection.close();

  return new Response(response);
}
