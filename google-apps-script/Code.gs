/**
 * K.K. International website enquiry handler.
 *
 * Deploy this file as a Google Apps Script Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * The first deployment prompts the account owner to authorize email sending.
 * This script routes only to the two fixed office addresses below.
 */

const OFFICE_RECIPIENTS = Object.freeze({
  pakistan: "kkinternational@gmail.com",
  malaysia: "bajwa255@yahoo.com"
});

const ALLOWED_FIELDS = [
  "Full name",
  "Company",
  "Your country",
  "Email",
  "Phone / WhatsApp",
  "Product category",
  "Quantity / estimated volume",
  "Destination country / port",
  "Shipping terms",
  "Payment method",
  "Trading arrangement",
  "Product origin country",
  "Production / supply capacity",
  "Minimum order quantity",
  "Certifications / documents",
  "Message"
];

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    // Honeypot: silently accept automated submissions without sending email.
    if (String(p.website || "").trim()) {
      return response_("success");
    }

    const office = String(p.office || "").toLowerCase();
    const recipient = OFFICE_RECIPIENTS[office];
    if (!recipient) throw new Error("Please select a valid receiving office.");

    const name = clean_(p["Full name"]);
    const email = clean_(p.Email);
    const company = clean_(p.Company);
    const message = clean_(p.Message);
    if (!name || !company || !email || !message) {
      throw new Error("Please complete all required fields.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("The sender email address is not valid.");
    }

    const enquiryType = String(p.enquiryType || "buy") === "sell"
      ? "SELLER / SUPPLIER ENQUIRY"
      : "BUYER ENQUIRY";

    const lines = [
      "New " + enquiryType + " — K.K. International",
      "Receiving office: " + (office === "pakistan" ? "Pakistan" : "Malaysia"),
      ""
    ];

    ALLOWED_FIELDS.forEach(function(field) {
      const value = clean_(p[field]);
      if (value) lines.push(field + ": " + value);
    });

    MailApp.sendEmail({
      to: recipient,
      replyTo: email,
      subject: "New " + enquiryType + " — K.K. International",
      body: lines.join("\n"),
      name: "K.K. International Website"
    });

    return response_("success");
  } catch (err) {
    console.error(err);
    return response_("error");
  }
}

function clean_(value) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 4000);
}

function response_(status) {
  const html = '<!doctype html><html><body><script>' +
    'window.top.postMessage({type:"kk-enquiry-result",status:"' + status + '"},"*");' +
    '</script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
