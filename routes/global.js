const express = require("express");
const { Router } = require("express");
const path = require('path')
const nocache = require('nocache')


const router = Router();

router.use(nocache())

router.use('/', express.static(path.join(__dirname, '../public/global')))

module.exports = router;