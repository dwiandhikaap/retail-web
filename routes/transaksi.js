const express = require("express");
const { Router } = express
const path = require('path')

const router = Router();

router.use('/', express.static(path.join(__dirname, '../public/transaksi')))

module.exports = router;