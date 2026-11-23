import test from "node:test";
import assert from "node:assert/strict";
import { calculateLandedCost, buildSupplierRfq } from "../src/trade-logic.js";

test("landed cost adds only the values supplied by the user", () => {
  const result = calculateLandedCost({
    goodsValue: 1000, freight: 100, insurance: 10,
    customsDuty: 50, taxes: 25, otherCharges: 15, currency: "usd"
  });
  assert.equal(result.currency, "USD");
  assert.equal(result.estimatedLandedCost, 1200);
  assert.match(result.note, /not a customs assessment/);
});

test("landed cost rounds the final estimate to two decimals", () => {
  const result = calculateLandedCost({
    goodsValue: 10.105, freight: 0, insurance: 0,
    customsDuty: 0, taxes: 0, otherCharges: 0, currency: "EUR"
  });
  assert.equal(result.estimatedLandedCost, 10.11);
});

test("RFQ draft includes core request details and is not sent", () => {
  const result = buildSupplierRfq({
    product: "Sulphur 80% WDG", specification: "80% WDG",
    quantity: "25 MT", destinationCountry: "Pakistan",
    preferredIncoterm: "CIF Karachi", buyerCompany: "K.K International"
  });
  assert.match(result.subject, /Sulphur 80% WDG/);
  assert.match(result.draft, /Required quantity: 25 MT/);
  assert.match(result.draft, /Preferred Incoterm: CIF Karachi/);
  assert.match(result.draft, /quotation validity/);
});


import { buildSupplierResearchBrief, compareSupplierQuotes, buildBuyerMarketResearchBrief } from "../src/trade-logic.js";

test("supplier research brief creates targeted query and verification checklist", () => {
  const result = buildSupplierResearchBrief({
    product: "textile yarn", specification: "30/1 cotton combed",
    targetCountry: "China", quantity: "20 MT", supplierType: "manufacturer"
  });
  assert.match(result.suggestedSearchQuery, /manufacturer factory/);
  assert.match(result.suggestedSearchQuery, /China/);
  assert.ok(result.evidenceToCollect.length >= 5);
  assert.match(result.note, /not a live supplier search/);
});

test("quote comparison identifies missing commercial and verification details", () => {
  const result = compareSupplierQuotes([{
    supplierName: "Sample supplier", country: "China", productSpecification: "Cotton yarn 30/1"
  }]);
  assert.ok(result.suppliers[0].missingInformation.includes("Minimum order quantity"));
  assert.ok(result.suppliers[0].missingInformation.includes("Source/evidence URL"));
  assert.match(result.comparisonNote, /Do not rank suppliers on price alone/);
});

test("buyer market brief generates focused market research queries", () => {
  const result = buildBuyerMarketResearchBrief({ product: "basmati rice", targetMarket: "Malaysia" });
  assert.equal(result.targetMarket, "Malaysia");
  assert.ok(result.suggestedSearchQueries.some((query) => query.includes("importers")));
});
