# K.K International Trade Assistant

Public ChatGPT app project for international trade workflows.

## Current scope (MVP)

- K.K International company profile and trade categories
- MCP Apps interface resource linked to all public tools
- Standalone interface preview at `web/trade-assistant.html`
- Import landed-cost calculator using user-supplied duty/tax values
- Supplier RFQ drafting (draft only; never sends email)
- K.K International inquiry drafting (draft only; no personal data is transmitted or stored)
- MCP Streamable HTTP endpoint at `/mcp`
- CORS preflight support for ChatGPT app connectivity
- Basic per-IP request rate limiting

## Architecture and privacy boundary

This public MCP service is separate from the private K.K International Trade Desk. It must not read private customer, supplier, staff, payment, shipment, Gmail, or inquiry records. No private Trade Desk API credentials belong in this project.

The first release is deliberately read-only / draft-only. Any future inquiry submission or CRM write action must have explicit user consent, server-side validation, rate limiting, and a separate protected endpoint.

## Run locally

Requirements: Node.js 22.6+

```bash
npm install
npm run dev
```

- Health: http://localhost:3000/health
- MCP endpoint: http://localhost:3000/mcp

## Automated tests

The Node test runner checks landed-cost arithmetic, rounding, and supplier RFQ draft content. GitHub Actions runs the type-check and test suite on changes to this branch.

## Build check

```bash
npm run build
npm test
```

## Deployment

Deploy this folder as the project root on a host that supports Node.js HTTP requests and MCP Streamable HTTP. Configure a stable HTTPS endpoint ending in `/mcp`. In production, set `ALLOWED_HOSTS` to the exact hostname(s) serving the MCP endpoint and `APP_DOMAIN` to the app UI origin (for example, `https://trade-assistant.example.com`). Production startup fails if the host allowlist is missing. Do not publish the endpoint until it has passed MCP Inspector and ChatGPT testing.

## Public listing preparation

Before public submission, provide:
- Verified publisher identity
- Public website, support, privacy policy, and terms URLs
- App logo and listing metadata
- Positive and negative test cases
- Stable production MCP endpoint
- Security, privacy, rate-limit, and error-handling review

## Company profile facts

K.K International is a sole proprietorship. The Malaysia office is a corporate marketing partner, not a subsidiary. The company works in textile yarn, industrial machinery, agricultural products, pesticides and fungicides, textile products, rice, fresh fruits, and safety matches. Existing stated import origins are Malaysia and China; stated export markets include Malaysia, Turkey, Turkmenistan, Afghanistan, and Indonesia. Confirm current availability and commercial terms directly before relying on them.
