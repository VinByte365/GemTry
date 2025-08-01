const bcrypt = require('bcrypt');
const { parse } = require('dotenv');
const db = require('../config/database');
//Good
exports.fetchAllUser = (req, res) => {
    const sql = `
        SELECT 
            user_id, 
            name, 
            email, 
            role, 
            is_active AS status, 
            created_at 
        FROM user
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ msg: 'Internal Server Error' });
        }

        res.status(200).json(result);
    });
};
//Good
exports.createNewUser = async (req, res) => {
    const { name, email, password, contact, city, role } = req.body;
    const is_active = req.body.is_active ?? 1; // Default to active if not provided
    let image = null;

    if (!name || !email) {
        return res.status(400).json({ msg: 'Name and email are required.' });
    }

    // Handle optional image upload (from multer)
    if (req.file) {
    image = `storage/users/${req.file.filename}`;
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : '';

    const sql = `
        INSERT INTO user 
        (name, email, password, contact, city, img, role, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(
        sql,
        [
            name,
            email,
            hashedPassword || '',
            contact || '',
            city || '',
            image,
            role || 'user',
            is_active
        ],
        (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).json({ msg: 'Internal Server Error', err });
            }

            return res.status(201).json({
                msg: 'User created successfully!',
                userId: result.insertId
            });
        }
    );
};
//Good
exports.fetchOneUser = (req, res) => {
    const id = parseInt(req.params.id);
    const sql = `
        SELECT user_id, name, email, password, contact, city, img, role, is_active, created_at
        FROM user
        WHERE user_id = ?
    `;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ msg: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ msg: `User with ID ${id} not found.` });
        }

        res.status(200).json({ user: result[0] });
    });
};
//Good
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
};

exports.updateUserDetails = async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email, password, contact, city, role, is_active } = req.body;

    if (!name || !email) {
        return res.status(400).json({ msg: 'Name and email are required.' });
    }

    const fetchSQL = 'SELECT * FROM user WHERE user_id = ?';

    // Use a promise wrapper to await query result
    db.query(fetchSQL, [id], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ msg: 'Database error while fetching user.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ msg: `User with ID ${id} not found.` });
        }

        const existing = results[0];

        // Image logic
        const image = req.file ? `storage/users/${req.file.filename}` : existing.img;

        // Hash the password only if provided
        let finalPassword = existing.password;
        if (password) {
            try {
                finalPassword = await bcrypt.hash(password, 10);
            } catch (hashErr) {
                console.error('Error hashing password:', hashErr);
                return res.status(500).json({ msg: 'Password encryption failed.' });
            }
        }

        const updatedUser = {
            name: name || existing.name,
            email: email || existing.email,
            password: finalPassword,
            contact: contact || existing.contact,
            city: city || existing.city,
            img: image,
            role: role || existing.role,
            is_active: typeof is_active !== 'undefined' ? parseInt(is_active) : existing.is_active
        };

        const updateSQL = `
            UPDATE user 
            SET name = ?, email = ?, password = ?, contact = ?, city = ?, img = ?, role = ?, is_active = ?
            WHERE user_id = ?`;

        const params = [
            updatedUser.name,
            updatedUser.email,
            updatedUser.password,
            updatedUser.contact,
            updatedUser.city,
            updatedUser.img,
            updatedUser.role,
            updatedUser.is_active,
            id
        ];

        db.query(updateSQL, params, (err) => {
            if (err) {
                console.error('Update error:', err);
                return res.status(500).json({ msg: 'Failed to update user.', err });
            }

            return res.status(200).json({ msg: 'User updated successfully.', UserId: id });
        });
    });
};

exports.BulkActionStatus = (req, res) => {
    const { ids, status } = req.body;

    // Validate input
    if (!Array.isArray(ids) || typeof status === 'undefined') {
        return res.status(400).json({ msg: 'userIds (array) and status (0 or 1) are required.' });
    }

    // Build SQL
    const sql = `UPDATE user SET is_active = ? WHERE user_id IN (${ids.map(() => '?').join(',')})`;
    const params = [status, ...ids];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Bulk status update failed:', err);
            return res.status(500).json({ msg: 'Failed to perform bulk status update.', err });
        }

        return res.status(200).json({
            msg: `Status updated for ${result.affectedRows} user(s).`,
            updatedCount: result.affectedRows
        });
    });
};

exports.BulkActionDelete = (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: 'userIds must be a non-empty array.' });
    }

    const sql = `DELETE FROM user WHERE user_id IN (${ids.map(() => '?').join(',')})`;

    db.query(sql, ids, (err, result) => {
        if (err) {
            console.error('Bulk delete failed:', err);
            return res.status(500).json({ msg: 'Failed to delete users.', err });
        }

        return res.status(200).json({
            msg: `${result.affectedRows} user(s) successfully deleted.`,
            deletedCount: result.affectedRows
        });
    });
};
