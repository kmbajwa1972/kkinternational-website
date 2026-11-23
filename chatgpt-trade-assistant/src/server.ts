import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod/v4";
import rateLimit from "express-rate-limit";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { calculateLandedCost, buildSupplierRfq, buildSupplierResearchBrief, compareSupplierQuotes, buildBuyerMarketResearchBrief } from "./trade-logic.js";

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean);
const APP_DOMAIN = process.env.APP_DOMAIN;
const TRADE_ASSISTANT_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>K.K International Trade Assistant</title>\n<style>\n:root{color-scheme:light dark;--ink:var(--color-text-primary,#18222d);--muted:var(--color-text-secondary,#64748b);--line:var(--color-border,#dce2e8);--panel:var(--color-card,#fff);--accent:#1d5d54;--soft:#eaf3f0}\n*{box-sizing:border-box}body{margin:0;padding:22px;font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:transparent}\n.wrap{max-width:850px;margin:auto}.hero{padding:22px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(135deg,var(--soft),var(--panel))}\n.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--accent)}h1{font-size:clamp(24px,4vw,34px);line-height:1.15;margin:8px 0}p{margin:8px 0;color:var(--muted)}\n.meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.pill{border:1px solid var(--line);border-radius:999px;padding:5px 10px;font-size:12px;color:var(--muted);background:var(--panel)}\nh2{font-size:17px;margin:24px 0 10px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}\n.card{border:1px solid var(--line);border-radius:13px;padding:14px;background:var(--panel)}.card strong{display:block;margin-bottom:4px}.card p{font-size:13px;margin:0}\n.footer{border-top:1px solid var(--line);margin-top:20px;padding-top:14px;font-size:12px;color:var(--muted)}a{color:var(--accent)}\n</style>\n</head>\n<body><main class=\"wrap\">\n<section class=\"hero\">\n<div class=\"eyebrow\">International trade · Since 2003</div>\n<h1>K.K International Trade Assistant</h1>\n<p>Practical support for sourcing, import and export planning, RFQ preparation and trade-cost calculations.</p>\n<div class=\"meta\"><span class=\"pill\">Pakistan office</span><span class=\"pill\">Malaysia marketing partner</span><span class=\"pill\">Independent public assistant</span></div>\n</section>\n<h2>What you can do</h2>\n<section class=\"grid\">\n<div class=\"card\"><strong>Supplier RFQs</strong><p>Prepare a clear request for quotation with product specifications, quantity, destination and trade terms.</p></div>\n<div class=\"card\"><strong>Import cost estimates</strong><p>Calculate a landed-cost estimate from values and charges you provide. Official duties and taxes are never guessed.</p></div>\n<div class=\"card\"><strong>Trade planning</strong><p>Plan supplier searches, verify supplier evidence, compare quotations, research target buyer markets and prepare import/export documentation checklists.</p></div>\n<div class=\"card\"><strong>Company information</strong><p>Learn about K.K International’s stated business categories, markets and contact details.</p></div>\n</section>\n<h2>Global sourcing research</h2>\n<section class=\"grid\">\n<div class=\"card\"><strong>Supplier discovery planning</strong><p>Build targeted search queries and a checklist for checking manufacturers, trading companies, capacity and certificates.</p></div>\n<div class=\"card\"><strong>Quotation comparison</strong><p>Compare supplier offers using the details you provide, and identify missing prices, MOQ, Incoterms and evidence.</p></div>\n<div class=\"card\"><strong>Buyer and market research</strong><p>Plan research into importers, distributors, demand signals and market requirements in your target country.</p></div>\n</section>\n<h2>Business categories</h2>\n<section class=\"grid\">\n<div class=\"card\"><strong>Imports</strong><p>Textile yarn · Industrial machinery · Agricultural products · Pesticides and fungicides</p></div>\n<div class=\"card\"><strong>Exports</strong><p>Textile products · Rice · Fresh fruits · Safety matches</p></div>\n</section>\n<div class=\"footer\">K.K International is a sole proprietorship. The Malaysia office is a corporate marketing partner, not a subsidiary. This public assistant is separate from the company’s private Trade Desk. Drafts are not sent automatically. <a href=\"https://kkinternational.com.pk\" target=\"_blank\" rel=\"noopener noreferrer\">Visit the company website</a> · <a href=\"mailto:info@kkinternational.com.pk\">Contact</a></div>\n</main></body></html>";
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

  registerAppTool(server,
    "get_company_profile",
    {
      title: "K.K International company profile",
      _meta: { ui: { resourceUri: "ui://kk-international/trade-assistant-v1.html" } },
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

  registerAppTool(server,
    "list_trade_services",
    {
      title: "Trade services and product categories",
      _meta: { ui: { resourceUri: "ui://kk-international/trade-assistant-v1.html" } },
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

  registerAppTool(server,
    "calculate_landed_cost",
    {
      title: "Calculate import landed cost",
      _meta: { ui: { resourceUri: "ui://kk-international/trade-assistant-v1.html" } },
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
      const result = calculateLandedCost(input);
      return {
        structuredContent: result,
        content: [{ type: "text", text: `Estimated landed cost: ${result.currency} ${result.estimatedLandedCost.toLocaleString("en-US", { maximumFractionDigits: 2 })}. Duty and tax values were supplied by the user.` }]
      };
    }
  );

  registerAppTool(server,
    "draft_supplier_rfq",
    {
      title: "Draft supplier RFQ",
      _meta: { ui: { resourceUri: "ui://kk-international/trade-assistant-v1.html" } },
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
      const { subject, draft } = buildSupplierRfq(input);
      return {
        structuredContent: { subject, draft, sendingStatus: "Draft prepared only. Nothing has been sent." },
        content: [{ type: "text", text: "RFQ draft prepared. Review the details and send it yourself when ready." }]
      };
    }
  );

  registerAppTool(server,
    "prepare_business_inquiry",
    {
      title: "Prepare an inquiry for K.K International",
      _meta: { ui: { resourceUri: "ui://kk-international/trade-assistant-v1.html" } },
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


  registerAppTool(server,
    "build_supplier_research_brief",
    {
      title: "Plan a supplier search",
      _meta: { ui: { resourceUri: "ui://kk-international/trade-assistant-v1.html" } },
      description: "Create a targeted supplier-research plan and verification checklist. This tool does not itself search the live web or verify suppliers.",
      inputSchema: {
        product: z.string().min(2).max(200),
        specification: z.string().max(1000).optional(),
        targetCountry: z.string().max(100).optional(),
        quantity: z.string().max(100).optional(),
        supplierType: z.enum(["manufacturer", "trading_company", "either"]).default("either")
      },
      outputSchema: z.object({
        researchSubject: z.string(),
        suggestedSearchQuery: z.string(),
        filters: z.object({ targetCountry: z.string(), supplierType: z.string(), quantity: z.string() }),
        evidenceToCollect: z.array(z.string()),
        verificationWarnings: z.array(z.string()),
        note: z.string()
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
    },
    async (input) => {
      const result = buildSupplierResearchBrief(input);
      return {
        structuredContent: result,
        content: [{ type: "text", text: "Supplier research plan prepared. Use live web research to find candidates, then verify each supplier independently." }]
      };
    }
  );

  registerAppTool(server,
    "compare_supplier_quotes",
    {
      title: "Compare supplier quotations",
      _meta: { ui: { resourceUri: "ui://kk-international/trade-assistant-v1.html" } },
      description: "Organize and compare supplier quotations supplied by the user. It flags missing information and does not independently verify suppliers.",
      inputSchema: {
        quotes: z.array(z.object({
          supplierName: z.string().min(1).max(180),
          country: z.string().min(2).max(100),
          productSpecification: z.string().min(2).max(1000),
          unitPrice: z.number().nonnegative().optional(),
          currency: z.string().min(3).max(8).optional(),
          moq: z.string().max(100).optional(),
          incoterm: z.string().max(80).optional(),
          leadTime: z.string().max(100).optional(),
          certificates: z.array(z.string().max(150)).max(20).optional(),
          evidenceUrl: z.string().url().optional(),
          notes: z.string().max(1000).optional()
        })).min(1).max(20)
      },
      outputSchema: z.object({
        suppliers: z.array(z.object({
          supplierName: z.string(),
          country: z.string(),
          productSpecification: z.string(),
          unitPrice: z.number().optional(),
          currency: z.string().optional(),
          moq: z.string().optional(),
          incoterm: z.string().optional(),
          leadTime: z.string().optional(),
          certificates: z.array(z.string()).optional(),
          evidenceUrl: z.string().optional(),
          notes: z.string().optional(),
          missingInformation: z.array(z.string())
        })),
        comparisonNote: z.string()
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
    },
    async (input) => {
      const result = compareSupplierQuotes(input.quotes);
      return {
        structuredContent: result,
        content: [{ type: "text", text: "Supplier quotation comparison prepared from user-provided information. Supplier claims and documents still require independent verification." }]
      };
    }
  );

  registerAppTool(server,
    "build_buyer_market_research_brief",
    {
      title: "Plan buyer and market research",
      _meta: { ui: { resourceUri: "ui://kk-international/trade-assistant-v1.html" } },
      description: "Prepare search queries and an evidence checklist for researching buyers, importers and distributors in a target market. This tool does not itself search the live web.",
      inputSchema: {
        product: z.string().min(2).max(200),
        targetMarket: z.string().min(2).max(100),
        buyerType: z.string().max(150).optional()
      },
      outputSchema: z.object({
        researchSubject: z.string(),
        targetMarket: z.string(),
        buyerType: z.string(),
        suggestedSearchQueries: z.array(z.string()),
        evidenceToCollect: z.array(z.string()),
        note: z.string()
      }),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false }
    },
    async (input) => {
      const result = buildBuyerMarketResearchBrief(input);
      return {
        structuredContent: result,
        content: [{ type: "text", text: "Buyer and market research plan prepared. Verify every prospective buyer using current public sources." }]
      };
    }
  );

  const resourceUri = "ui://kk-international/trade-assistant-v1.html";
  registerAppResource(server, "K.K International Trade Assistant", resourceUri, {
    mimeType: RESOURCE_MIME_TYPE,
    _meta: { ui: { prefersBorder: true } }
  }, async () => ({
    contents: [{
      uri: resourceUri,
      mimeType: RESOURCE_MIME_TYPE,
      text: TRADE_ASSISTANT_HTML,
      _meta: { ui: { prefersBorder: true, ...(APP_DOMAIN ? { domain: APP_DOMAIN } : {}) } }
    }]
  }));

  return server;
}

export function createHttpApp() {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.NODE_ENV === "production" && ALLOWED_HOSTS.length === 0) {
    throw new Error("Set ALLOWED_HOSTS to the exact public hostname(s) before production deployment.");
  }
  if (process.env.NODE_ENV === "production" && ALLOWED_ORIGINS.length === 0) {
    throw new Error("Set ALLOWED_ORIGINS to the exact trusted browser origins before production deployment.");
  }

  app.use((req, res, next) => {
    if (ALLOWED_HOSTS.length === 0) return next();
    const requestHost = (req.headers.host || "").toLowerCase().split(":")[0];
    if (!ALLOWED_HOSTS.includes(requestHost)) return res.status(421).send("Host not allowed.");
    next();
  });

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader("Vary", "Origin");
    if (origin) {
      const originAllowed = ALLOWED_ORIGINS.length === 0
        ? process.env.NODE_ENV !== "production"
        : ALLOWED_ORIGINS.includes(origin);
      if (!originAllowed) return res.status(403).send("Origin not allowed.");
      res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.length === 0 ? "*" : origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
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
      version: "0.1.0",
      clients: ["ChatGPT", "Claude"]
    });
  });

  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

  const handleMcpRequest = async (req: Request, res: Response) => {
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
      await transport.handleRequest(req, res, req.method === "POST" ? req.body : undefined);
    } catch (error) {
      console.error("MCP request failed", error);
      if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
    }
  };

  app.post("/mcp", handleMcpRequest);
  app.get("/mcp", handleMcpRequest);
  app.all("/mcp", (_req, res) => {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.status(405).send("MCP Streamable HTTP supports GET and POST requests.");
  });

  return app;
}
