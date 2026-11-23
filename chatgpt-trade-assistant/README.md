# K.K International Trade Assistant

Public ChatGPT app project for international trade workflows.

## Current scope (MVP)

- K.K International company profile and trade categories
- Import landed-cost calculator using user-supplied duty/tax values
- Supplier RFQ drafting (draft only; never sends email)
- K.K International inquiry drafting (draft only; no personal data is transmitted or stored)
- MCP Streamable HTTP endpoint at `/mcp`

## Architecture and privacy boundary

This public MCP service is separate from the private K.K International Trade Desk. It must not read private customer, supplier, staff, payment, shipment, Gmail, or inquiry records. No private Trade Desk API credentials belong in this project.

The first release is deliberately read-only / draft-only. Any future inquiry submission or CRM write action must have explicit user consent, server-side validation, rate limiting, and a separate protected endpoint.

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

- Health: http://localhost:3000/health
- MCP endpoint: http://localhost:3000/mcp

## Build check

```bash
npm run build
```

## Deployment

Deploy this folder as the project root on a host that supports persistent or serverless Node.js HTTP requests and MCP Streamable HTTP. Configure a stable HTTPS endpoint ending in `/mcp`. Do not publish the endpoint until it has passed MCP Inspector and ChatGPT testing.

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
