const db = require('../config/database');

exports.totalItem = (req, res) => {
    const countSQL = 'SELECT COUNT(*) as total_items from items';
    db.query(countSQL, (err, values) => {
        if (err) {
            return console.error('Error: ', err);
        }
        
        return res.json(values)
    })
};