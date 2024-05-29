# grab - Deno fech using HTTP/1.1

Just a simple Deno HTTP fetcher using HTTP/1.1. It uses Deno's built-in TCP and TLS connection to fetch the data from the server.

## Features

It's the same as fetch... but with HTTP/1.1. Don't expect any fancy stuff here.

## Contributing

Feel free to open an issue or a pull request. Feel free to fork and modify the code. I'm open to suggestions and improvements.

## Usage

```ts
import { grab } from "https://deno.land/x/grab/mod.ts";

const response = await grab("https://example.com");
console.log(response);
```

## License

MIT
