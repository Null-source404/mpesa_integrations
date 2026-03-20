// index.cjs
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const bill = require("./routes/bill.cjs"); // 👈 .cjs extension

const app = express();

app.use(cors());         // 👈 actually use it
app.use(express.json());

app.use('/api', bill);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});