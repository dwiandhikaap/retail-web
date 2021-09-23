const express = require("express");
const { Router } = require("express");
const path = require('path')

const router = Router();

router.get('/', (res, req, next) =>{
    router.use('/', express.static(path.join(__dirname, '../public/checkout')))
    router.use('/global', express.static(path.join(__dirname, '../public/global')))
    
    next();
})

module.exports = router;