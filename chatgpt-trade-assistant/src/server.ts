import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import rateLimit from "express-rate-limit";

const PORT = Number(process.env.PORT || 3000);
const COMPANY = {
  name: "K.K International",
  website: "https://kkinternational.com.pk",
  contactEmail: "info@kkinternational.com.pk",
  businessSince: 2003,
  structure: "Sole proprietorship",
  malaysiaRelationship: "Malaysia-based corporate marketing partner; not a subsidiary",
  imports: ["Textile yarn", "Industrial machinery", "Agricultural products", "Pesticides and fungicides"],
  exports: ["Textile products", "Rice", "Fresh fruits", "Safety matches"],
  importOrigins: ["Malaysia", "China"],
  exportMarkets: ["Malaysia", "Turkey", "Turkmenistan", "Afghanistan", "Indonesia"]
};

function createServer() {
  const server = new McpServer(
    { name: "kk-international-trade-assistant", version: "0.1.0" },
    {
      instructions:
        "You are the K.K International Trade Assistant. Help users with international trade research, sourcing workflows, RFQ drafting, export/import documentation guidance, and transparent cost calculations. Distinguish sourced facts from estimates and assumptions. Never invent supplier identities, contact details, prices, certifications, shipping rates, legal requirements, or product availability. Use current authoritative sources for time-sensitive trade rules. The public app must never expose private K.K International Trade Desk records, staff data, customer data, or email inboxes. Do not submit or send an inquiry; prepare drafts only unless a future explicitly authorized submission tool is added."
    }
  );

  server.registerTool(
    "get_company_profile",
    {
      title: "K.K International company profile",
      description: "Use when a user asks about K.K International, its business areas, trading markets, or how to contact the company.",
      inputSchema: {},
      outputSchema: z.object({
        company: z.string(),
        website: z.string(),
        contactEmail: z.string(),
        businessSince: z.number(),
        structure: z.string(),
        malaysiaRelationship: z.string(),
        imports: z.array(z.string()),
        exports: z.array(z.string()),
        importOrigins: z.array(z.string()),
        exportMarkets: z.array(z.string())
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
    },
    async () => ({
      structuredContent: {
        company: COMPANY.name,
        website: COMPANY.website,
        contactEmail: COMPANY.contactEmail,
        businessSince: COMPANY.businessSince,
        structure: COMPANY.structure,
        malaysiaRelationship: COMPANY.malaysiaRelationship,
        imports: COMPANY.imports,
        exports: COMPANY.exports,
        importOrigins: COMPANY.importOrigins,
        exportMarkets: COMPANY.exportMarkets
      },
      content: [{ type: "text", text: "Official K.K International profile and contact details." }]
    })
  );

  server.registerTool(
    "list_trade_services",
    {
      title: "Trade services and product categories",
      description: "Use when users ask what trade services or product categories K.K International works with.",
      inputSchema: {},
      outputSchema: z.object({
        services: z.array(z.string()),
        importCategories: z.array(z.string()),
        exportCategories: z.array(z.string())
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
    },
    async () => {
      const services = [
        "International product sourcing support",
        "Supplier and market research",
        "Import and export inquiry preparation",
        "RFQ and quotation drafting",
        "Import cost and landed-cost calculations",
        "Trade documentation guidance"
      ];
      return {
        structuredContent: {
          services,
          importCategories: COMPANY.imports,
          exportCategories: COMPANY.exports
        },
        content: [{ type: "text", text: "K.K International trade service areas. Specific availability is subject to confirmation." }]
      };
    }
  );

  server.registerTool(
    "calculate_landed_cost",
    {
      title: "Calculate import landed cost",
      description: "Calculate an estimated landed cost from user-supplied values. The user must provide duty, tax, freight, insurance and other charges; do not guess official tax or duty rates.",
      inputSchema: {
        goodsValue: z.number().nonnegative().describe("Total customs or invoice value of the goods in the selected currency"),
        freight: z.number().nonnegative().default(0).describe("Freight cost in the same currency"),
        insurance: z.number().nonnegative().default(0).describe("Insurance cost in the same currency"),
        customsDuty: z.number().nonnegative().default(0).describe("Customs duty amount, not a percentage"),
        taxes: z.number().nonnegative().default(0).describe("Taxes supplied by the user, as an amount"),
        otherCharges: z.number().nonnegative().default(0).describe("Other clearance, port, handling or local charges in the same currency"),
        currency: z.string().min(3).max(8).default("USD")
      },
      outputSchema: z.object({
        currency: z.string(),
        goodsValue: z.number(),
        freight: z.number(),
        insurance: z.number(),
        customsDuty: z.number(),
        taxes: z.number(),
        otherCharges: z.number(),
        estimatedLandedCost: z.number(),
        note: z.string()
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
    },
    async (input) => {
      const total = input.goodsValue + input.freight + input.insurance + input.customsDuty + input.taxes + input.otherCharges;
      const result = {
        currency: input.currency.toUpperCase(),
        goodsValue: input.goodsValue,
        freight: input.freight,
        insurance: input.insurance,
        customsDuty: input.customsDuty,
        taxes: input.taxes,
        otherCharges: input.otherCharges,
        estimatedLandedCost: Number(total.toFixed(2)),
        note: "Estimate based only on values supplied by the user. It is not a customs assessment or official duty/tax calculation."
      };
      return {
        structuredContent: result,
        content: [{ type: "text", text: `Estimated landed cost: ${result.currency} ${result.estimatedLandedCost.toLocaleString("en-US", { maximumFractionDigits: 2 })}. Duty and tax values were supplied by the user.` }]
      };
    }
  );

  server.registerTool(
    "draft_supplier_rfq",
    {
      title: "Draft supplier RFQ",
      description: "Prepare a professional request for quotation to a potential supplier. This creates a draft only and does not send email or contact the supplier.",
      inputSchema: {
        product: z.string().min(2).max(200),
        specification: z.string().min(2).max(2000),
        quantity: z.string().min(1).max(100),
        destinationCountry: z.string().min(2).max(100),
        preferredIncoterm: z.string().max(30).optional(),
        targetDelivery: z.string().max(100).optional(),
        buyerCompany: z.string().max(150).optional(),
        additionalRequirements: z.string().max(1500).optional()
      },
      outputSchema: z.object({ subject: z.string(), draft: z.string(), sendingStatus: z.string() }),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
    },
    async (input) => {
      const subject = `Request for Quotation – ${input.product}`;
      const lines = [
        "Dear Sales Team,",
        "",
        "We are interested in purchasing the following product and kindly request your best quotation.",
        "",
        `Product: ${input.product}`,
        `Specification: ${input.specification}`,
        `Required quantity: ${input.quantity}`,
        `Destination: ${input.destinationCountry}`,
        input.preferredIncoterm ? `Preferred Incoterm: ${input.preferredIncoterm}` : "",
        input.targetDelivery ? `Target delivery: ${input.targetDelivery}` : "",
        input.buyerCompany ? `Company: ${input.buyerCompany}` : "",
        input.additionalRequirements ? `Additional requirements: ${input.additionalRequirements}` : "",
        "",
        "Please include your unit price, minimum order quantity, production lead time, payment terms, packing details, country of origin, available certificates (if applicable), and quotation validity.",
        "",
        "We look forward to your reply.",
        "",
        "Best regards,",
        input.buyerCompany || "[Buyer / Company Name]",
        "[Contact details]"
      ].filter(Boolean);
      return {
        structuredContent: { subject, draft: lines.join("\n"), sendingStatus: "Draft prepared only. Nothing has been sent." },
        content: [{ type: "text", text: "RFQ draft prepared. Review the details and send it yourself when ready." }]
      };
    }
  );

  server.registerTool(
    "prepare_business_inquiry",
    {
      title: "Prepare an inquiry for K.K International",
      description: "Prepare an inquiry draft addressed to K.K International. It does not send email or store personal information.",
      inputSchema: {
        name: z.string().min(2).max(120),
        company: z.string().max(150).optional(),
        email: z.string().email(),
        country: z.string().min(2).max(100),
        inquiryType: z.enum(["Import", "Export", "Supplier", "Buyer", "Other"]),
        product: z.string().min(2).max(200),
        quantity: z.string().max(100).optional(),
        message: z.string().min(10).max(2000)
      },
      outputSchema: z.object({ recipient: z.string(), subject: z.string(), draft: z.string(), privacyNote: z.string() }),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
    },
    async (input) => {
      const subject = `K.K International Inquiry – ${input.inquiryType}: ${input.product}`;
      const draft = [
        "Dear K.K International Team,",
        "",
        "I would like to submit the following business inquiry:",
        "",
        `Name: ${input.name}`,
        input.company ? `Company: ${input.company}` : "",
        `Email: ${input.email}`,
        `Country: ${input.country}`,
        `Inquiry type: ${input.inquiryType}`,
        `Product: ${input.product}`,
        input.quantity ? `Quantity: ${input.quantity}` : "",
        "",
        "Message:",
        input.message,
        "",
        "Regards,",
        input.name
      ].filter(Boolean).join("\n");
      return {
        structuredContent: {
          recipient: COMPANY.contactEmail,
          subject,
          draft,
          privacyNote: "This draft was generated for the user. It has not been transmitted or stored by K.K International."
        },
        content: [{ type: "text", text: `Inquiry draft prepared for ${COMPANY.contactEmail}. Nothing has been sent.` }]
      };
    }
  );

  return server;
}

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, Mcp-Protocol-Version");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use("/mcp", rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again shortly." }
}));

app.get("/", (_req, res) => {
  res.json({
    name: "K.K International Trade Assistant",
    status: "online",
    protocol: "MCP Streamable HTTP",
    endpoint: "/mcp",
    version: "0.1.0"
  });
});

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed", error);
    if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
  }
});

app.all("/mcp", (_req, res) => {
  res.setHeader("Allow", "POST");
  res.status(405).send("Use POST for MCP Streamable HTTP requests.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`K.K International Trade Assistant listening on port ${PORT}`);
});
