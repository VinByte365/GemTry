const db = require('../config/database');
const sendEmail = require('../utils/sendEmail');
const generatePDF = require('../utils/generatePDF');
const fs = require('fs');

exports.fetchAllOrder = (req, res) => {
    const sql = `
        SELECT 
            o.order_id,
            o.order_status,
            o.order_placed,
            u.name as customer_name,
            u.email as customer_email,
            u.contact as customer_contact,
            COALESCE(SUM(ol.order_price * ol.qty), 0) as total_amount,
            COUNT(ol.orderline_id) as item_count
        FROM orders o
        LEFT JOIN user u ON o.user_id = u.user_id
        LEFT JOIN orderlines ol ON o.order_id = ol.order_id
        GROUP BY o.order_id, o.order_status, o.order_placed, u.name, u.email, u.contact
        ORDER BY o.order_placed DESC
    `;

    db.execute(sql, (err, result, fields) => {
        if (err) {
            console.error('Error: ', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json(result);
    });
}


exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        // Update order status
        await db.promise().query(`UPDATE orders SET order_status = ? WHERE order_id = ?`, [status, orderId]);

        // Get updated order
        const [orderRows] = await db.promise().query(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
        const order = orderRows[0];
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Get customer info
        const [userRows] = await db.promise().query(`SELECT * FROM user WHERE user_id = ?`, [order.user_id]);
        const user = userRows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Get ordered items
        const [itemRows] = await db.promise().query(`
            SELECT ol.*, i.item_name 
            FROM orderlines ol
            JOIN items i ON ol.item_id = i.item_id
            WHERE ol.order_id = ?
        `, [orderId]);

        const items = itemRows;

        // Prepare email message
        let emailMessage = '';
        switch (status.toLowerCase()) {
            case 'pending':
                emailMessage = `Your order #${orderId} has been accepted and is now pending.`;
                break;
            case 'shipping':
                emailMessage = `Your order #${orderId} is on the way!`;
                break;
            case 'delivered':
                emailMessage = `Your order #${orderId} has been delivered. Enjoy!`;
                break;
            case 'cancelled':
                emailMessage = `Your order #${orderId} has been cancelled.`;
                break;
            default:
                emailMessage = `Your order #${orderId} status is now: ${status}.`;
        }

                const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4CAF50;">Order Update: #${orderId}</h2>

            <p>${emailMessage}</p>

            <p>
              Please find your updated receipt attached to this email.
              If you have any questions, feel free to contact our support team.
            </p>

            <p>Thank you for shopping with us!</p>

            <hr style="border: none; border-top: 1px solid #eee;" />

            <p style="font-size: 12px; color: #888;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        `;

        // Generate PDF receipt
        const pdfPath = await generatePDF(order, items, user);
        
        // Send email with attachment
        await sendEmail({
            email: user.email,
            subject: `Order Status Update: ${status}`,
            message: emailHtml,
            attachments: [
                {
                    filename: `order-${orderId}.pdf`,
                    path: pdfPath,
                    contentType: 'application/pdf'
                }
            ]
        });

        // Optionally delete the PDF after sending
        fs.unlink(pdfPath, err => {
            if (err) console.error('Failed to delete PDF file:', err);
        });

        // Send response
        res.status(200).json({
            success: true,
            message: 'Order status updated, email with receipt sent.'
        });

    } catch (err) {
        console.error('Error in updateOrderStatus:', err);
        res.status(500).json({ error: 'Server error' });
    }
};


// function buildOrderEmail(order, items, user, status, statusMessage) {

//     const itemListHtml = items.map(item => `
//         <tr>
//             <td>${item.item_name}</td>
//             <td style="text-align:center;">${item.qty}</td>
//             <td style="text-align:right;">$${(item.order_price * item.qty).toFixed(2)}</td>
//         </tr>
//     `).join('');

//     const subtotal = items.reduce((sum, item) => sum + item.order_price * item.qty, 0).toFixed(2);

//     return `
//         <div style="font-family: Arial, sans-serif;">
//             <h2>Order Receipt - #${order.order_id}</h2>
//             <p>Hello ${user.first_name || 'Customer'},</p>
//             <p><strong>${statusMessage}</strong></p>

//             <table width="100%" border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse; margin-top: 20px;">
//                 <thead>
//                     <tr>
//                         <th>Item</th>
//                         <th>Qty</th>
//                         <th>Price</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     ${itemListHtml}
//                 </tbody>
//             </table>

//             <p><strong>Subtotal:</strong> $${subtotal}</p>
//             <p><strong>Order Placed:</strong> ${new Date(order.order_placed).toLocaleDateString()}</p>
//             <p><strong>Status:</strong> ${status}</p>

//             <p>Thank you for shopping with us!</p>
//         </div>
//     `;
// }
//

//for admin page
exports.fetchOneOrder = (req, res) => {
    const orderId = req.params.id;
    console.log('Fetching order details for order ID:', orderId);
    // Fetch order details with customer info
    const orderQuery = `
        SELECT 
            o.order_id,
            o.order_status,
            o.order_placed,
            u.name as customer_name,
            u.email as customer_email,
            u.contact as customer_contact,
            u.city as customer_city,
            COALESCE(SUM(ol.order_price * ol.qty), 0) as total_amount
        FROM orders o
        LEFT JOIN user u ON o.user_id = u.user_id
        LEFT JOIN orderlines ol ON o.order_id = ol.order_id
        WHERE o.order_id = ?
        GROUP BY o.order_id, o.order_status, o.order_placed, u.name, u.email, u.contact, u.city
    `;
    
    // Fetch order items
    const itemsQuery = `
        SELECT 
            ol.orderline_id,
            ol.qty,
            ol.order_price,
            i.item_name,
            i.item_img,
            (ol.order_price * ol.qty) as line_total
        FROM orderlines ol
        LEFT JOIN items i ON ol.item_id = i.item_id
        WHERE ol.order_id = ?
    `;
    
    db.query(orderQuery, [orderId], (err, orderResult) => {
        if (err) {
            console.error('Error fetching order:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (orderResult.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = orderResult[0];
        
        // Fetch order items
        db.query(itemsQuery, [orderId], (err, itemsResult) => {
            if (err) {
                console.error('Error fetching order items:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            order.items = itemsResult;
            res.status(200).json({ order });
        });
    });
};

exports.fetchUserOrders = async (req, res) => {
    const userId = req.user?.id;

    try {
        // Get all orders for the user
        const [orders] = await db.promise().query(`
            SELECT 
                o.order_id,
                o.order_status AS status,
                o.order_placed AS created_at,
                COALESCE(SUM(ol.order_price * ol.qty), 0) AS total_amount
            FROM orders o
            LEFT JOIN orderlines ol ON o.order_id = ol.order_id
            WHERE o.user_id = ?
            GROUP BY o.order_id, o.order_status, o.order_placed
            ORDER BY o.order_placed DESC
        `, [userId]);

        // If no orders, return empty array
        if (orders.length === 0) return res.status(200).json([]);

        // Get all items for all orders
        const orderIds = orders.map(o => o.order_id);
        const [items] = await db.promise().query(`
            SELECT 
                ol.order_id,
                ol.qty AS quantity,
                ol.order_price AS item_price,
                i.item_name,
                i.item_img
            FROM orderlines ol
            JOIN items i ON ol.item_id = i.item_id
            WHERE ol.order_id IN (?)
        `, [orderIds]);

        // Group items under their respective orders
        const orderMap = {};
        orders.forEach(order => {
            order.items = [];
            orderMap[order.order_id] = order;
        });

        items.forEach(item => {
            orderMap[item.order_id].items.push(item);
        });
console.log('Orders with items:', items);
        res.status(200).json(orders);

    } catch (err) {
        console.error('Error fetching user orders with items:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

