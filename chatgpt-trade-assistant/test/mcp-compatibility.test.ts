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

  const services = await client.callTool({ name: "list_trade_services", arguments: {} });
  assert.equal(services.isError, false);

  const rfq = await client.callTool({
    name: "draft_supplier_rfq",
    arguments: {
      product: "Cotton yarn",
      specification: "30/1 combed cotton",
      quantity: "10 MT",
      destinationCountry: "Pakistan"
    }
  });
  assert.equal(rfq.isError, false);
  assert.match((rfq.structuredContent as { draft: string }).draft, /10 MT/);

  const inquiry = await client.callTool({
    name: "prepare_business_inquiry",
    arguments: {
      name: "Compatibility Test",
      email: "compatibility@example.com",
      country: "Pakistan",
      inquiryType: "Buyer",
      product: "Rice",
      message: "Please share the export specifications and indicative terms."
    }
  });
  assert.equal(inquiry.isError, false);
  assert.equal((inquiry.structuredContent as { recipient: string }).recipient, "info@kkinternational.com.pk");

  const supplierResearch = await client.callTool({
    name: "build_supplier_research_brief",
    arguments: { product: "Cotton yarn", targetCountry: "China" }
  });
  assert.equal(supplierResearch.isError, false);

  const quoteComparison = await client.callTool({
    name: "compare_supplier_quotes",
    arguments: {
      quotes: [{
        supplierName: "Example Supplier",
        country: "China",
        productSpecification: "Cotton yarn 30/1"
      }]
    }
  });
  assert.equal(quoteComparison.isError, false);

  const buyerResearch = await client.callTool({
    name: "build_buyer_market_research_brief",
    arguments: { product: "Basmati rice", targetMarket: "Malaysia" }
  });
  assert.equal(buyerResearch.isError, false);

  const invalidCalculation = await client.callTool({
    name: "calculate_landed_cost",
    arguments: {
      goodsValue: -1,
      freight: 0,
      insurance: 0,
      customsDuty: 0,
      taxes: 0,
      otherCharges: 0,
      currency: "USD"
    }
  });
  assert.equal(invalidCalculation.isError, true);

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
