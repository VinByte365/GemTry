const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 8000;

const path = require('path');

let items = [
    { "id": 1, "name": "Keyboard"},
    { "id": 2, "name": "System Unit"},
    { "id": 3, "name": "Mouse"},
    { "id": 4, "name": "Monitor"}
];

app.get('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const filtered = items.filter(item => item.id === id)

    res.json(filtered)


});

// app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'))
// });

// app.get('/about', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'about.html'))
// });

app.listen(port, () => console.log(`Server running on port ${port}`));