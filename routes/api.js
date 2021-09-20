const { Router } = require("express");
const { dbGetUserByID, dbGetData, dbCreateCartData } = require("../Util/DatabaseHandler");

const router = Router();

router.get("/user_profile", async(req, res) => {
    if(!req.session.isAuth){
        res.status(403).end();
        return;
    }

    const user_id = req.session.user_id;
    const barangData = await dbGetUserByID(user_id);
    res.status(200).send(barangData);
})

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

router.get("/add_to_cart", async(req, res) => {
    const userId = req.session.user_id;
    const productId = parseInt(req.query.id)
    const productCount = parseInt(req.query.count)

    if(isNaN(productId) || productId < 0 || isNaN(productCount) || productCount <= 0){
        res.status(400).end();
        return;
    }

    try {
        await dbCreateCartData(userId, productId, productCount);
    } catch (error) {
        res.status(400).end(); 
        return;
    }

    res.status(200).end()
})

router.get('/is_authenticated', (req, res) => {
    res.status(200).send(req.session.isAuth ? true : false);
})

module.exports = router;