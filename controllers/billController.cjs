// db connection commented out for now
// const pool = require("../db/connection.cjs");

const { stkPush } = require("../services/mpesa.cjs");

const splitBill = async (req, res) => {
    const { total, phones } = req.body;
    const splitAmount = Math.ceil(total / phones.length);
    const billId = Math.random().toString(36).slice(2, 10).toUpperCase();

    try {
        for (const phone of phones) {
            const stkResponse = await stkPush(phone, splitAmount);
            console.log("STK Response:", stkResponse);
        }
        res.status(200).json({ message: "STK pushes sent", billId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 👇 Define these too — even if empty for now
const handleCallback = async (req, res) => {
    const { stkCallback } = req.body.Body;

    if (stkCallback.ResultCode === 0) {
        console.log("✅ Payment received:", stkCallback.CallbackMetadata);
    } else {
        console.log("❌ Payment failed:", stkCallback.ResultDesc);
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
};

const getBillStatus = async (req, res) => {
    const { billId } = req.params;
    res.status(200).json({ billId, participants: [] }); // empty for now
};

module.exports = { splitBill, handleCallback, getBillStatus };