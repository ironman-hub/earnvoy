const PDFDocument = require("pdfkit");

function generateReceiptPdf({ receiptNumber, user, payment, listing }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).fillColor("#0E2B2E").text("earnvoy", { align: "left" });
    doc.fontSize(10).fillColor("#555").text("Payment receipt", { align: "left" });
    doc.moveDown(1.5);

    doc.fillColor("#000").fontSize(12);
    doc.text(`Receipt number: ${receiptNumber}`);
    doc.text(`Date: ${new Date(payment.createdAt || Date.now()).toLocaleString("en-GB")}`);
    doc.text(`Billed to: ${user.username} (${user.email})`);
    doc.moveDown();

    doc.fontSize(13).text("Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Type: ${payment.type === "LISTING_FEE" ? "Listing posting fee" : "Contact details unlock fee"}`);
    if (listing) {
      doc.text(`Route: ${listing.departureAirport} -> ${listing.destinationAirport}`);
      doc.text(`Listing ID: ${listing.id}`);
    }
    doc.text(`Payment method: ${payment.method}`);
    doc.moveDown();

    doc.fontSize(14).text(`Total paid: £${Number(payment.amount).toFixed(2)} ${payment.currency}`, {
      align: "right",
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#777").text(
      "earnvoy connects travellers and senders only. earnvoy is not a courier, escrow service, " +
        "payment guarantor, or insurance provider, and is not responsible for the safe delivery, " +
        "condition, or legality of any items exchanged between users. This receipt confirms payment " +
        "of a platform connection fee only.",
      { align: "left" }
    );

    doc.end();
  });
}

module.exports = { generateReceiptPdf };
