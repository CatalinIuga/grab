import {
  createTCPConnection,
  getRawReponse,
  sendRawRequest,
} from "./lib/connection.ts";
import {
  buildRequestString,
  parseRawResponse,
  parseRequest,
} from "./lib/utils.ts";

/**
 * Grabs a resource from the network. It returns a Promise that resolves
 * to the Response to that Request, whether it is successful or not.
 * @example
 * ```ts
 * const response = await grab("https://httpbin.org/get");
 * if (response.ok) {
 *  const json = await response.json();
 *  console.log(json);
 * }
 * ```
 */
export async function grab(
  input: string | Request | URL,
  init?: RequestInit | undefined,
): Promise<Response> {
  const parsedRequest = parseRequest({ input, init });

  const requestString = await buildRequestString(parsedRequest);

  const connection = await createTCPConnection(
    parsedRequest.host,
    parsedRequest.port,
    parsedRequest.protocol,
  );

  await sendRawRequest(connection, requestString);

  const rawReponse = await getRawReponse(connection);

  return await parseRawResponse(rawReponse);
}
