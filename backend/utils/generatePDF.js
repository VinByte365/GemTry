const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateOrderPDF(order, items, user) {
    const doc = new PDFDocument({ margin: 50 });
    const receiptsDir = path.join(__dirname, '../receipts');

    if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir);
    }

    const filePath = path.join(receiptsDir, `order-${order.order_id}.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // === Header ===
    doc
        .fontSize(22)
        .text('GemTry Receipt', { align: 'center' })
        .moveDown();

    doc
        .fontSize(14)
        .text(`Order Receipt`, { align: 'center' })
        .moveDown();

    // === Order Info ===
    doc
        .fontSize(10)
        .text(`Order ID: ${order.order_id}`)
        .text(`Order Date: ${new Date(order.order_placed).toLocaleDateString()}`)
        .text(`Order Status: ${order.order_status}`)
        .moveDown();

    // === Customer Info ===
    doc
        .text(`Customer: ${user.first_name || 'Customer'}`)
        .text(`Email: ${user.email}`)
        .moveDown();

    // === Table Headers ===
    doc
        .fontSize(12)
        .text('Item', 50, doc.y, { width: 200 })
        .text('Qty', 250, doc.y, { width: 100, align: 'center' })
        .text('Price', 350, doc.y, { width: 100, align: 'right' })
        .moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // horizontal line
    doc.moveDown(0.5);

    // === Items ===
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = item.order_price * item.qty;
        doc
            .fontSize(10)
            .text(item.item_name, 50, doc.y, { width: 200 })
            .text(item.qty.toString(), 250, doc.y, { width: 100, align: 'center' })
            .text(`$${itemTotal.toFixed(2)}`, 350, doc.y, { width: 100, align: 'right' });
        return sum + itemTotal;
    }, 0);

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // line before total
    doc.moveDown(1);

    // === Totals ===
    doc
        .fontSize(12)
        .text('Subtotal:', 350, doc.y, { width: 100, align: 'right' })
        .text(`$${subtotal.toFixed(2)}`, 450, doc.y, { width: 100, align: 'right' });

    doc.moveDown(2);

    // === Footer ===
    doc
        .fontSize(10)
        .text('Thank you for your purchase!', { align: 'center' })
        .text('If you have any questions, contact customer.support@gemtry.com', { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

module.exports = generateOrderPDF;
