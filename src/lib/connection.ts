import { Buffer, iterateReader } from "@std/io";

/**
 * Create a TCP connection to the server. Or a TLS connection if the protocol is HTTPS.
 * It returns a Promise that resolves the connection.
 * @example
 * ```ts
 * const connection = await createTCPConnection("httpbin.org", 80, "http:");
 * ```
 */
export async function createTCPConnection(
  host: string,
  port: number,
  protocol: string,
): Promise<Deno.Conn> {
  try {
    return protocol === "https:"
      ? await Deno.connectTls({ hostname: host, port })
      : await Deno.connect({ hostname: host, port });
  } catch (error) {
    console.error("Error while connecting to the server:", error);
    throw error;
  }
}

/**
 * Send a raw request to the server. It returns a Promise that resolves when the request is sent.
 * @example
 * ```ts
 * const connection = await createTCPConnection("httpbin.org", 80, "http:");
 * await sendRawRequest(connection, "GET /get HTTP/1.1\r\nHost: httpbin.org\r\n\r\n");
 * ```
 */
export async function sendRawRequest(
  connection: Deno.Conn,
  requestString: string,
): Promise<void> {
  try {
    await connection.write(new TextEncoder().encode(requestString));
  } catch (error) {
    console.error("Error while sending the request:", error);
    throw error;
  }
}

/**
 * Get the raw response from the server. It returns a Promise that resolves to the raw response.
 * @example
 * ```ts
 * const connection = await createTCPConnection("httpbin.org", 80, "http:");
 * await sendRawRequest(connection, "GET /get HTTP/1.1\r\nHost: httpbin.org\r\n\r\n");
 * const rawReponse = await getRawReponse(connection);
 * connection.close();
 * ```
 */
export async function getRawReponse(
  connection: Deno.Conn,
): Promise<string> {
  const buffer = new Buffer();

  // Just so I don't have catch-block duplication for the response
  let caughtError: Error | undefined;

  try {
    for await (
      const chunk of iterateReader(connection)
    ) {
      await buffer.write(chunk);
    }
  } catch (error) {
    /**
     * This error can be false positive, as it's a known issue for HTTPS
     * requests in some dependency library that Deno uses internally.
     * To fix this for now, if the response content length matches the
     * expected content length, then it's a valid response.
     * @see  https://github.com/denoland/deno/issues/13058
     */
    caughtError = error;
  }

  const response = new TextDecoder().decode(buffer.bytes());

  if (caughtError) {
    const contentLengthMatch = response.match(/Content-Length: (\d+)/);
    const contentLength = contentLengthMatch
      ? parseInt(contentLengthMatch[1])
      : 0;
    const body = response.split("\r\n\r\n")[1];

    if (contentLength !== body.length) {
      console.error("Error while reading the response:", caughtError);
      connection.close();
      throw caughtError;
    }
  }
  connection.close();
  return response;
}
