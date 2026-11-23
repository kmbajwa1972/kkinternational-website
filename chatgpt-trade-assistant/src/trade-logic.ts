export type LandedCostInput = {
  goodsValue: number;
  freight: number;
  insurance: number;
  customsDuty: number;
  taxes: number;
  otherCharges: number;
  currency: string;
};

export function calculateLandedCost(input: LandedCostInput) {
  const total = input.goodsValue + input.freight + input.insurance + input.customsDuty + input.taxes + input.otherCharges;
  return {
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
}

export type SupplierRfqInput = {
  product: string;
  specification: string;
  quantity: string;
  destinationCountry: string;
  preferredIncoterm?: string;
  targetDelivery?: string;
  buyerCompany?: string;
  additionalRequirements?: string;
};

export function buildSupplierRfq(input: SupplierRfqInput) {
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
  return { subject, draft: lines.join("\n") };
}


export type SupplierResearchInput = {
  product: string;
  specification?: string;
  targetCountry?: string;
  quantity?: string;
  supplierType?: "manufacturer" | "trading_company" | "either";
};

export function buildSupplierResearchBrief(input: SupplierResearchInput) {
  const queryParts = [
    input.product,
    input.specification,
    input.supplierType === "manufacturer" ? "manufacturer factory" : input.supplierType === "trading_company" ? "trading company supplier" : "manufacturer supplier",
    input.targetCountry ? `in ${input.targetCountry}` : ""
  ].filter(Boolean);
  return {
    researchSubject: input.product,
    suggestedSearchQuery: queryParts.join(" "),
    filters: {
      targetCountry: input.targetCountry || "Not specified",
      supplierType: input.supplierType || "either",
      quantity: input.quantity || "Not specified"
    },
    evidenceToCollect: [
      "Official company website and legal business name",
      "Factory or trading-company status and verifiable business address",
      "Product specifications matching the requested grade or model",
      "MOQ, capacity, production lead time and quotation validity",
      "Export markets and relevant trade references",
      "Certificates with issuer, scope, validity and verification method",
      "Payment terms, Incoterm, port and shipping assumptions"
    ],
    verificationWarnings: [
      "A marketplace badge or website statement is not independent proof of a supplier's identity or certifications.",
      "Contact the supplier using details independently confirmed from its official website.",
      "Request current documents and verify them with the issuing body before payment."
    ],
    note: "This is a research plan, not a live supplier search or a verified supplier list."
  };
}

export type SupplierQuote = {
  supplierName: string;
  country: string;
  productSpecification: string;
  unitPrice?: number;
  currency?: string;
  moq?: string;
  incoterm?: string;
  leadTime?: string;
  certificates?: string[];
  evidenceUrl?: string;
  notes?: string;
};

export function compareSupplierQuotes(quotes: SupplierQuote[]) {
  return {
    suppliers: quotes.map((quote) => ({
      ...quote,
      missingInformation: [
        !quote.unitPrice || !quote.currency ? "Comparable unit price and currency" : "",
        !quote.moq ? "Minimum order quantity" : "",
        !quote.incoterm ? "Incoterm and named place/port" : "",
        !quote.leadTime ? "Production and delivery lead time" : "",
        !quote.evidenceUrl ? "Source/evidence URL" : "",
        !quote.certificates?.length ? "Applicable certificates and verification" : ""
      ].filter(Boolean)
    })),
    comparisonNote: "Compare like-for-like specifications, currency, quantity breaks, Incoterm, named place, payment terms and delivery schedule. Do not rank suppliers on price alone; verify identity, capacity, documents and references independently."
  };
}

export function buildBuyerMarketResearchBrief(input: {
  product: string;
  targetMarket: string;
  buyerType?: string;
}) {
  return {
    researchSubject: input.product,
    targetMarket: input.targetMarket,
    buyerType: input.buyerType || "Importers, distributors and relevant industrial/commercial buyers",
    suggestedSearchQueries: [
      `${input.product} importers in ${input.targetMarket}`,
      `${input.product} distributors wholesalers ${input.targetMarket}`,
      `${input.product} trade associations import statistics ${input.targetMarket}`
    ],
    evidenceToCollect: [
      "Buyer or distributor official website and business identity",
      "Product fit, grades, standards and target customer segment",
      "Import activity or market demand supported by dated sources",
      "Relevant import regulations, standards and labelling requirements",
      "Contact channel published by the business",
      "Source date and URL for every material claim"
    ],
    note: "This is a market-research plan. It does not claim that any buyer has been verified or is currently purchasing."
  };
}
