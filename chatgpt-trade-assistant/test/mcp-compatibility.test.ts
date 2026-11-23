import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHttpApp } from "../src/server.js";

test("standard MCP clients can initialize, list tools, call a tool, and read the optional app resource", async (t) => {
  const httpServer = createHttpApp().listen(0, "127.0.0.1");
  await once(httpServer, "listening");
  const address = httpServer.address();
  assert.ok(address && typeof address !== "string");
  const endpoint = new URL(`http://127.0.0.1:${address.port}/mcp`);

  const client = new Client({ name: "kk-trade-assistant-compatibility-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(endpoint);

  t.after(async () => {
    await client.close().catch(() => undefined);
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => error ? reject(error) : resolve());
    });
  });

  await client.connect(transport);

  const listed = await client.listTools();
  const toolNames = listed.tools.map((tool) => tool.name).sort();
  assert.deepEqual(toolNames, [
    "build_buyer_market_research_brief",
    "build_supplier_research_brief",
    "calculate_landed_cost",
    "compare_supplier_quotes",
    "draft_supplier_rfq",
    "get_company_profile",
    "list_trade_services",
    "prepare_business_inquiry"
  ]);

  const calculation = await client.callTool({
    name: "calculate_landed_cost",
    arguments: {
      goodsValue: 1000,
      freight: 100,
      insurance: 10,
      customsDuty: 50,
      taxes: 25,
      otherCharges: 15,
      currency: "USD"
    }
  });
  assert.equal(calculation.isError, false);
  assert.equal((calculation.structuredContent as { estimatedLandedCost: number }).estimatedLandedCost, 1200);

  const profile = await client.callTool({ name: "get_company_profile", arguments: {} });
  assert.equal(profile.isError, false);
  assert.equal((profile.structuredContent as { company: string }).company, "K.K International");

  const resource = await client.readResource({ uri: "ui://kk-international/trade-assistant-v1.html" });
  assert.ok(resource.contents.some((item) =>
    ("text" in item && item.text.includes("K.K International Trade Assistant"))
  ));
});

test("MCP endpoint advertises browser preflight support without requiring browser credentials", async (t) => {
  const httpServer = createHttpApp().listen(0, "127.0.0.1");
  await once(httpServer, "listening");
  const address = httpServer.address();
  assert.ok(address && typeof address !== "string");

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => error ? reject(error) : resolve());
    });
  });

  const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://chatgpt.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,mcp-protocol-version"
    }
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("access-control-allow-methods") || "", /POST/);
});
