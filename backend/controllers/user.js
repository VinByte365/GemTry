const { parse } = require('dotenv');
const db = require('../config/database');

exports.fetchAllUser = (req, res) => {
    const sql = 'SELECT * FROM user';

    db.query(sql, (err, result, fields) => {
        if (err) {
            return console.error('Error: ', err) && res.status(500);
        }
        res.status(200).json(result);
    })
}


//Image Handling Missing
exports.createNewUser = (req, res) => {
   const { name, email, password, contact, city, img, role, status } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ msg: 'Name and email are required.' });
        }
    
        const sql = 'INSERT INTO user (name, email, password, contact, city, img, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
        db.query(sql, [name, email, password || '', contact || '', city || '', img || '', role || 'user', status || 'active'], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Internal Server Error', err });
            }

            return res.status(201).json({ msg: 'User created successfully!', Userid: result.insertId });
        });
    }

exports.fetchOneUser = (req, res) => {
    const id = parseInt(req.params.id);
    const sql = `SELECT * FROM user WHERE user_id = ?`;
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error: ', err);
            return res.status(500).json({ msg: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ msg: `User with ID: ${id} not found.` });
        }

        res.status(200).json({ user: result[0] });
    });
}

exports.deleteUser = (req, res) => {
    const id = parseInt(req.params.id);
    const fetchSQL = `SELECT * FROM user WHERE user_id = ?`;
    
    db.query(fetchSQL, [id], (err, result) => {
        if (err) {
            console.error('Error: ', err);
            return res.status(500).json({ msg: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ msg: `User with ID: ${id} not found.` });
        }

        const deleteSQL = `DELETE FROM user WHERE user_id = ?`;

        db.query(deleteSQL, [id], (err, success) => {
            if (err) {
                console.error('Error: ', err);
                return res.status(500).json({ msg: 'Error deleting user' });
            }
            return res.json({ msg: `User ${id} successfully deleted.` });
        });
    });
}

//Image Handling Missing, logic for unchanged fields need to be implemented.
exports.updateUserDetails = (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email, password, contact, city, img, role, status } = req.body;
        
    if (!name || !email) {
        return res.status(400).json({ msg: 'Name and email are required.' });
    }
    
    // Build dynamic SQL query based on provided fields
    let sql = 'UPDATE user SET name = ?, email = ?';
    let params = [name, email];
    
    if (contact) {
        sql += ', contact = ?';
        params.push(contact);
    }
    if (city) {
        sql += ', city = ?';
        params.push(city);
    }
    if (password) {
        sql += ', password = ?';
        params.push(password);
    }
    if (img) {
        sql += ', img = ?';
        params.push(img);
    }
    if (role) {
        sql += ', role = ?';
        params.push(role);
    }
    if (status) {
        sql += ', status = ?';
        params.push(status);
    }
    
    sql += ' WHERE user_id = ?';
    params.push(id);
    
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ msg: 'Internal Server Error', err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: `User with ID: ${id} not found.` });
        }

        return res.status(200).json({ msg: 'User updated successfully!', Userid: id });
    });
}

//Bulk Action Logic
exports.BulkActionStatus = (req, res) => {

};

exports.BulkActionDelete = (req, res) => {

};