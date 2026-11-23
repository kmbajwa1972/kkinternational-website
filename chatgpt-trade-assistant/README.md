# K.K International Trade Assistant

A platform-independent Model Context Protocol (MCP) service for international trade workflows, designed to connect to **ChatGPT and Claude** through their supported MCP integration paths.

## Platform compatibility

- **Shared MCP backend:** trade tools and business logic are exposed through the standard MCP protocol, rather than being implemented as ChatGPT-only features.
- **ChatGPT:** includes an MCP Apps interface resource for supported ChatGPT app experiences.
- **Claude:** can use the same MCP server and core tools through Claude's supported remote MCP connector/integration experience. The ChatGPT-specific embedded interface is optional; Claude can call the tools without it.
- **One service, one toolset:** both clients use the same server-side calculations, drafting and research-planning functions.
- **Client differences:** each platform controls its own connection setup, authentication flow, UI rendering and feature availability. We will test ChatGPT and Claude separately before public release.

## Current scope (MVP)

- K.K International company profile and trade categories
- MCP Apps interface resource for clients that support it
- Standalone interface preview at `web/trade-assistant.html`
- Import landed-cost calculator using user-supplied duty/tax values
- Supplier RFQ drafting (draft only; never sends email)
- K.K International inquiry drafting (draft only; no personal data is transmitted or stored)
- Supplier research planning with targeted queries and a verification checklist
- Supplier quotation comparison from user-provided offers
- Buyer and target-market research planning
- MCP Streamable HTTP endpoint at `/mcp`
- Shared client-neutral MCP server for ChatGPT and Claude
- Automated end-to-end MCP client tests for initialization, tool discovery, tool calls, and optional UI resource reads
- CORS preflight support and basic per-IP request rate limiting

## Product roadmap

**Stage 1 – Trade Assistant:** company profile, trade services, RFQ drafting, inquiry drafting, landed-cost estimates and documentation guidance.

**Stage 2 – Global Sourcing Assistant:** supplier research, buyer/market research, supplier evidence checklists and quotation comparison. Live supplier and buyer discovery must use permitted public sources or authorized APIs. The research tools in this MVP currently prepare searches and organize evidence; they do not claim to have searched or verified live listings.

**Out of scope:** a standalone B2B marketplace with public buyer/supplier accounts, a supplier bidding network, payments or order management.

## Architecture and privacy boundary

This public MCP service is separate from the private K.K International Trade Desk. It must not read private customer, supplier, staff, payment, shipment, Gmail, or inquiry records. No private Trade Desk API credentials belong in this project.

The core tool layer must remain client-neutral. Do not make core trade functionality depend on ChatGPT-specific UI metadata or rendering. MCP Apps UI is an optional presentation layer for compatible clients; clients without that UI capability must still be able to use the MCP tools.

The first release is deliberately read-only / draft-only. Stage 2 tools prepare research plans and compare user-supplied evidence; they do not scrape third-party platforms, access private supplier accounts, publish RFQs, or contact suppliers. Alibaba.com and Made-in-China.com were discussed only as examples of trade workflows; this project does not aim to copy either service or require integration with them. Any future inquiry submission or CRM write action must have explicit user consent, server-side validation, rate limiting, and a separate protected endpoint.

## Run locally

Requirements: Node.js 22.6+

```bash
npm install
npm run dev
```

The service entry point is `src/index.ts`; `src/server.ts` exports the Express app factory for automated compatibility tests.

- Health: http://localhost:3000/health
- MCP endpoint: http://localhost:3000/mcp

## Automated tests

The Node test runner checks landed-cost arithmetic, rounding, RFQ draft content and the research/quotation logic. GitHub Actions runs the type-check and test suite on changes to this branch.

## Build check

```bash
npm run build
npm test
```

## Deployment

Deploy this folder as the project root on a host that supports Node.js HTTP requests and MCP Streamable HTTP. Configure a stable HTTPS endpoint ending in `/mcp`. In production, set `ALLOWED_HOSTS` to the exact hostname(s) serving the MCP endpoint, `ALLOWED_ORIGINS` to the exact trusted browser origins (comma-separated, no wildcard), and `APP_DOMAIN` to the app UI origin when using the embedded interface. Production startup fails if either allowlist is missing. Requests without an `Origin` header remain available for server-to-server MCP clients; requests with an unlisted browser origin are rejected.

Before release, configure the trusted origins using the current platform requirements, validate the endpoint with the MCP Inspector and test it independently from ChatGPT and Claude. Verify tool discovery, input validation, structured outputs, error handling, and client connection instructions in each platform. Do not assume that an interface resource supported by one client will render in the other.

## Public listing preparation

Before public submission, provide:
- Verified publisher identity
- Public website, support, privacy policy, and terms URLs
- App logo and listing metadata where required
- Positive and negative test cases
- Stable production MCP endpoint
- Separate connection and compatibility tests for ChatGPT and Claude
- Security, privacy, rate-limit, and error-handling review

## Company profile facts

K.K International is a sole proprietorship. The Malaysia office is a corporate marketing partner, not a subsidiary. The company works in textile yarn, industrial machinery, agricultural products, pesticides and fungicides, textile products, rice, fresh fruits, and safety matches. Existing stated import origins are Malaysia and China; stated export markets include Malaysia, Turkey, Turkmenistan, Afghanistan, and Indonesia. Confirm current availability and commercial terms directly before relying on them.
