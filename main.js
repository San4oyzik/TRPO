const express = require('express');
require('dotenv/config');
const { MESSAGE, PORT } = require ('./const');
const app = express();
const userRoutes = require('./routes/userRoutes');

app.use(express.json())

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '<http://localhost:3000>');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Прописаны GET запросы

app.get('/', (req, res) => {
    res.send(MESSAGE.SERVER_RUNNING)
})

app.use('/user', userRoutes);

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});