const express = require(`express`);
const path = require('path')
const { Router } = require('express');
const nocache = require('nocache')

const router = Router();

router.use(nocache())
router.use("/", express.static(path.join(__dirname, '../public/index')));

module.exports = router;