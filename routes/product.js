const express = require(`express`);
const path = require('path')
const { Router } = require('express');
//const { dbGetData } = require('../Util/DatabaseHandler');

const router = Router();

router.get("/", (req, res, next) => {
    router.use("/", express.static(path.join(__dirname, '../public/product')));
    router.use("/global", express.static(path.join(__dirname, '../public/global')));

    //res.send("asdaiksduas")
    next();
});

/* router.post("/product_data", async(req, res) => {
    const { productId } = req.body;

    if(productId == NaN || productId < 0){
        res.status(400).end();
        return;
    }

    const productData = await dbGetData('barang', productId);

    res.status(200).send(productData)
});
 */

module.exports = router;