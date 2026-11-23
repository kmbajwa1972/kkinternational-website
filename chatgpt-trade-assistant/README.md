# K.K International Trade Assistant

Public ChatGPT app project for international trade workflows.

## Current scope (MVP)

- K.K International company profile and trade categories
- MCP Apps interface resource linked to all public tools
- Standalone interface preview at `web/trade-assistant.html`
- Import landed-cost calculator using user-supplied duty/tax values
- Supplier RFQ drafting (draft only; never sends email)
- K.K International inquiry drafting (draft only; no personal data is transmitted or stored)
- Supplier research planning with targeted queries and a verification checklist
- Supplier quotation comparison from user-provided offers
- Buyer and target-market research planning
- MCP Streamable HTTP endpoint at `/mcp`
- CORS preflight support for ChatGPT app connectivity
- Basic per-IP request rate limiting

## Product roadmap\n\n**Stage 1 – Trade Assistant:** company profile, trade services, RFQ drafting, inquiry drafting, landed-cost estimates and documentation guidance.\n\n**Stage 2 – Global Sourcing Assistant:** supplier research planning, buyer/market research planning, supplier evidence checklists and quotation comparison. Live supplier and buyer discovery must use permitted public sources or authorized platform APIs; the research tools in this MVP prepare searches and organize evidence but do not claim to have searched or verified live listings.\n\n**Out of scope:** a standalone B2B marketplace with public buyer/supplier accounts, a supplier bidding network, payments or order management.\n\n## Architecture and privacy boundary

This public MCP service is separate from the private K.K International Trade Desk. It must not read private customer, supplier, staff, payment, shipment, Gmail, or inquiry records. No private Trade Desk API credentials belong in this project.

The first release is deliberately read-only / draft-only. Stage 2 tools prepare research plans and compare user-supplied evidence; they do not scrape marketplaces, access private supplier accounts, publish RFQs on third-party platforms, or contact suppliers. Any future inquiry submission or CRM write action must have explicit user consent, server-side validation, rate limiting, and a separate protected endpoint.

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

## Marketplace integration research

- **Alibaba.com:** Its Open Platform requires developer registration, application review/approval, App Key and App Secret, API permission requests, and seller authorization for seller business data. We will only use endpoints and accounts for which K.K International receives authorization. See the [official Open Platform guide](https://openapi.alibaba.com/doc/doc.htm).
- **Made-in-China.com:** Its official buyer-facing Easy Sourcing workflow accepts sourcing requests, matches suppliers, and returns quotations through its own portal. We have not identified a public official API for external supplier-search/RFQ submission in the reviewed official documentation. We will use the official portal and permitted public information unless Made-in-China grants an integration route. See [Easy Sourcing for buyers](https://sourcing.made-in-china.com/tailored-sourcing-service/for-buyers.html) and [official help](https://m.made-in-china.com/html/forApp/helpcenter/en.html).
- No third-party marketplace scraping, account automation, RFQ posting, or supplier messaging is enabled in this MVP.

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
