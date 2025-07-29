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
   const { name, email, password, contact, city, img  } = req.body;
        
        if (!name || !email || !password || !contact || !city) {
            return res.status(400).json({ msg: 'All fields are required.' });
        }
    
        const sql = 'INSERT INTO user (name, email, password, contact, city, img) VALUES (?, ?, ?, ?, ?, ?)';
    
        db.query(sql, [name, email, password, contact, city, img], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Internal Server Error', err });
            }

            return res.status(201).json({ msg: 'User created successfully!', Userid: result.insertId })
        })
    }

exports.fetchOneUser = (req, res) => {
    const id = parseInt(req.params.id);
    const sql = `SELECT * FROM user WHERE user_id = ${id}`
    db.query(sql, (err, values) => {
        if (err) {
            return console.error('Error: ', err);
        };

        const oneUser = values.find(user => user.id === user.id)

        if (!oneUser) {
            return res.status(404).json({ msg: `ID: ${id} not found.` });
        }

        res.status(200).json({ msg: `User ${id} found` });
    }
    )}

exports.deleteUser = (req, res) => {
    const id = parseInt(req.params.id);
    const fetchSQL = `SELECT * FROM user WHERE user_id = ${id}`;
    db.query(fetchSQL, (err, values) => {
        if (err) {
            return console.error('Error: ', err);
        };

        const oneUser = values.find(user => user.id === user.id)

        if (!oneUser) {
            return res.status(404).json({ msg: `ID: ${id} not found.` });
        }

        const deleteSQL = `DELETE FROM user WHERE user_id = ${id}`;

        db.query(deleteSQL, (err, success) => {
            if (err) {
                return console.error('Error: ', err);
            }
            return res.json({ msg: `User ${id} successfully deleted.` });
        });
    }
    )
}

//Image Handling Missing, logic for unchanged fields need to be implemented.
exports.updateUserDetails = (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email, password, contact, city, img } = req.body;
        
    if (!name || !email || !password || !contact || !city) {
        return res.status(400).json({ msg: 'All fields are required.' });
    }
    
    const sql = 'UPDATE user SET name = ?, email = ?, password = ?, contact = ?, city = ?, img = ? WHERE user_id = ?';
    
    db.execute(sql, [name, email, password, contact, city, img, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ msg: 'Internal Server Error', err });
        }

        return res.status(201).json({ msg: 'User updated successfully!', Userid: id })
    })
}

//Bulk Action Logic
exports.BulkActionStatus = (req, res) => {

};

exports.BulkActionDelete = (req, res) => {

};