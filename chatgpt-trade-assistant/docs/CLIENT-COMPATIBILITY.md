# Client Compatibility and Release Test Plan

## Shared server contract

The single client-neutral endpoint is `https://<production-host>/mcp`.

- Transport: MCP Streamable HTTP.
- Tools: standard MCP tool definitions with JSON Schema input/output contracts.
- Optional UI: MCP Apps resource `ui://kk-international/trade-assistant-v1.html`.
- ChatGPT may render the optional MCP Apps interface.
- Claude's remote MCP connector currently uses the server's tools; the ChatGPT-specific interface is not required for Claude.
- No login is required for the current public, read-only/draft-only tool set. Do not add private Trade Desk access to this public server.

## ChatGPT connection test

1. Deploy the server to a stable public HTTPS host and confirm `/health` returns `{"ok":true}`.
2. In ChatGPT, open Plugins and choose **Add custom MCP server**.
3. Enter the server URL ending in `/mcp`, choose **No authentication** for this public MVP, review the risk notice, and create the plugin.
4. Confirm all eight tools are discovered.
5. Call `get_company_profile`, `calculate_landed_cost`, and `draft_supplier_rfq` with representative inputs.
6. Confirm the optional K.K International UI resource renders and the model-readable tool result remains available.
7. Test invalid input and a request that should not invoke any tool.

## Claude connection test

1. In Claude, open **Customize → Connectors → Add custom connector**.
2. Enter the same public HTTPS `/mcp` URL and choose **No sign in** for the public MVP.
3. Complete the connection and enable the connector in a new conversation.
4. Confirm all eight tools are discovered and callable.
5. Call `get_company_profile`, `calculate_landed_cost`, and `draft_supplier_rfq`.
6. Confirm that Claude can use the tools without depending on the ChatGPT Apps UI resource.
7. Test invalid input and a request that should not invoke any tool.

## Automated compatibility checks

The test suite uses the official MCP TypeScript client against the actual Express HTTP endpoint. It verifies:

- MCP initialization over Streamable HTTP
- Discovery of the complete tool set
- Tool invocation and structured results
- Access to the optional MCP Apps UI resource
- Browser CORS preflight behavior

Run from this directory:

```bash
npm install
npm run build
npm test
```

GitHub Actions runs the type-check and automated tests for branch updates.

## Production configuration

Set the following environment variables in the hosting provider:

- `NODE_ENV=production`
- `PORT` (provided by the host; default 3000)
- `ALLOWED_HOSTS`: exact public MCP hostname(s), comma-separated
- `ALLOWED_ORIGINS`: exact trusted browser origins, comma-separated; never use a wildcard in production
- `APP_DOMAIN`: only if required by the embedded ChatGPT UI host integration

The service rejects unlisted browser origins and rejects production startup when either allowlist is missing. Server-to-server MCP clients may connect without an Origin header. Keep the service on HTTPS port 443 for Claude remote connectors.

## Release gate

Do not call the integration complete until:

- GitHub Actions reports build and tests passing.
- MCP Inspector can initialize, list tools, call representative tools, and read the UI resource.
- ChatGPT connects and passes the manual tests above.
- Claude connects and passes the manual tests above.
- Production health and MCP endpoint checks pass after deployment.

A successful automated test is not a substitute for the actual ChatGPT and Claude account-level connection tests. Public directory publication and review are separate steps after technical compatibility is verified.
