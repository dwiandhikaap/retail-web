const express = require("express");
const { Router } = express;
const path = require("path");

const router = Router();

router.get("/", express.static(path.join(__dirname, "../public/transaksi")));

module.exports = router;