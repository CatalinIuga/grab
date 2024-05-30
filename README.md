# grab - Deno fetch using HTTP/1.1

Fetch using HTTP/1.1 in Deno. Because Deno's fetch uses HTTP/2 and some servers don't support it. Same API and types as the normal implementation (no Deno Client support yet).

## Features

It's the same as fetch... but with HTTP/1.1. Don't expect any fancy stuff here. Heads's up, I've been too lazy to implement proper form data support.

## Contributing

Feel free to open an issue or a pull request. Feel free to fork and modify the code.

## Usage

```ts
import { grab } from "https://deno.land/x/grab/mod.ts";

const response = await grab("https://example.com");
console.log(response);
```
