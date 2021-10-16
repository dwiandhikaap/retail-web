const { Router } = require("express");
const { dbGetData, dbGetBarangList } = require("../../../Util/DatabaseHandler/Barang");
const { isRequestQueryValid } = require("../../../Util/Utility");

const router = Router()

router.get("/shop_items", async(req, res) => {
    let category = req.query.category;
    let sortMode = req.query.sort || "";
    let page = parseInt(req.query.page);

    for(const query of [category, sortMode]){
        if(query){
            if(isRequestQueryValid(query)){
                res.status(400).send("Invalid request query!");
                return;
            }
        }
    };

    try {
        var barangData = await dbGetBarangList(category, sortMode, page);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
        return;
    }

    res.status(200).send(barangData);
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