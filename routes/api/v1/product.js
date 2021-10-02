const { Router } = require("express");
const { dbGetData } = require("../../../Util/DatabaseHandler")

const router = Router()

router.get("/shop_items", async(req, res) => {
    res.send(
        await dbGetData("barang", 1,10)
    )
})

router.get("/product_data", async(req, res) => {
    const productId = parseInt(req.query.id)

    if(isNaN(productId) || productId < 0){
        res.status(400).end();
        return;
    }

    res.send(
        await dbGetData("barang", productId)
    )
})

module.exports = router;