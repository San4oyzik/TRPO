const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MESSAGE, PORT } = require ('./const');
const app = express();
const userRoutes = require('./routes/userRoutes');

app.use(express.json())

app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.get('/', (req, res) => {
    res.send(MESSAGE.SERVER_RUNNING)
})

app.use('/user', userRoutes);

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});