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
