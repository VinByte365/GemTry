const { parse } = require('dotenv');
const db = require('../config/database');

exports.fetchAllOrder = (req, res) => {
    const sql = 'SELECT * FROM orders';

    db.execute(sql, (err, result, fields) => {
        if (err) {
            return console.error('Error: ', err) && res.status(500);
        }
        res.status(200).json(result);
    })
}

exports.updateOrderStatus = (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'shipped', 'cancelled', 'delivered'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const query = `
        UPDATE orders 
        SET order_status = ? 
        WHERE order_id = ?
    `;

    db.query(query, [status, orderId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully' });
    });
};
