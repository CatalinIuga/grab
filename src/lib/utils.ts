function getUrl(input: string | Request | URL): URL {
  if (input instanceof URL) {
    return input;
  }

  if (typeof input === "string") {
    return new URL(input);
  }

  return new URL(input.url);
}

async function bodyToString(body: BodyInit): Promise<string> {
  // NOTE: This ones are not tested!!

  if (body instanceof Blob) {
    const arrayBuffer = await body.arrayBuffer();
    return new TextDecoder().decode(arrayBuffer);
  }

  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return new TextDecoder().decode(body);
  }

  // Damn... https://stackoverflow.com/questions/8659808/how-does-http-file-upload-work
  // TODO: uhhhh, maybe implement this later
  if (body instanceof FormData) {
    const entries = [...body.entries()];
    return entries
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    let result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      result += new TextDecoder().decode(value);
    }
    return result;
  }

  return body;
}

interface ParsedRequest {
  method: string;
  host: string;
  port: number;
  protocol: string;
  pathname: string;
  params: URLSearchParams;
  fragment: string;
  headers: Headers;
  body: BodyInit | null | undefined;
}

interface ParseRequestOptions {
  input: string | Request | URL;
  init?: RequestInit | undefined;
}

export function parseRequest(
  { input, init }: ParseRequestOptions,
): ParsedRequest {
  const url: URL = getUrl(input);

  const {
    hostname: host,
    protocol,
    pathname,
    searchParams: params,
    hash: fragment,
  } = url;

  const port = url.port === ""
    ? (protocol === "https:" ? 443 : 80)
    : parseInt(url.port);

  const method = init?.method || "GET";

  const headers: Headers = new Headers(init?.headers || {});

  const body = method !== "GET" ? init?.body : "";

  return {
    method,
    host,
    port,
    protocol,
    params,
    fragment,
    pathname,
    headers,
    body,
  };
}

export async function buildRequestString(
  {
    method,
    host,
    fragment,
    params,
    pathname,
    headers,
    body,
  }: ParsedRequest,
): Promise<string> {
  let bodyString = "";
  let headerString = "";

  if (body) {
    bodyString = await bodyToString(body);
    headers.append("Content-Length", bodyString.length.toString());
  }

  headerString = [...headers.entries()].map(([k, v]) => `${k}: ${v}`).join(
    "\r\n",
  );

  if (params.size > 0) {
    pathname += `?${params.toString()}`;
  }

  if (fragment) {
    pathname += `#${fragment}`;
  }

  return (
    `${method} ${pathname} HTTP/1.1\r\n` +
    `Host: ${host}\r\n` +
    `Connection: close\r\n` +
    `${headerString}\r\n\r\n` +
    `${bodyString}\r\n`
  );
}

export function parseRawResponse(rawResponse: string): Promise<Response> {
  return new Promise((resolve) => {
    const [statusLine, ...headersAndBody] = rawResponse.split("\r\n");
    const [_httpVersion, statusCode, statusText] = statusLine.split(" ");

    const headers = new Headers();
    let body = "";

    for (const header of headersAndBody) {
      if (header === "") {
        break;
      }

      const [key, value] = header.split(": ");
      headers.set(key, value);
    }

    body = headersAndBody.splice(headersAndBody.indexOf("") + 1).join("\r\n");

    resolve(
      new Response(body, {
        status: parseInt(statusCode),
        statusText,
        headers,
      }),
    );
  });
}
