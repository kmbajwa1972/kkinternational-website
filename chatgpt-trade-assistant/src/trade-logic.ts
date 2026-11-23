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
