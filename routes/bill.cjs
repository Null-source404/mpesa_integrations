// Connects to endpoint urls
const express = require("express");
const router = express.Router();
const { splitBill, handleCallback, getBillStatus } = require("../controllers/billController.cjs");

// 👇 Add this temporarily
console.log("splitBill:", splitBill);
console.log("handleCallback:", handleCallback);
console.log("getBillStatus:", getBillStatus);

router.post('/split-bill', splitBill);
router.post('/callback', handleCallback);
router.get('/bill-status/:billId', getBillStatus);
module.exports = router;
