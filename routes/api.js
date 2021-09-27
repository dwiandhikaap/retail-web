const { Router } = require("express");
const { dbGetData } = require("../Util/DatabaseHandler")
const { dbGetUserByID } = require("../Util/DatabaseHandler/User");
const { dbGetCartData, dbCreateCartData, dbValidateCartEntries, dbRetrieveCartEntries, dbValidateCartTransaction, dbIncreaseCartQuantity, dbFindExistingUserCart } = require("../Util/DatabaseHandler/Cart");
const { createPromoCode, getPromoDetails } = require("../Util/DatabaseHandler/Promo");

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

router.get("/get_cart", async(req, res) => {
    if(!req.session.isAuth){
        res.status(401).send("User is not authenticated!");
        return;
    }

    const userId = req.session.user_id;
    let filter = req.query.filter;
    let maxCount = parseInt(req.query.max);
    let sortMode = req.query.sort;

    if(sortMode == undefined || sortMode.toUpperCase() != 'DESC'){
        sortMode = 'ASC';
    }

    if(filter == undefined || (filter.toUpperCase() != 'RESOLVED' && filter.toUpperCase() != 'UNRESOLVED') ){
        filter = 'UNFILTERED';
    }

    try {
        const items = await dbGetCartData(userId, sortMode, filter);
        if(isNaN(maxCount)){
            res.status(200).send({
                items: items,
                itemRemaining: 0
            });
            return;
        }
        
        const itemRemaining = Math.max(Object.keys(items).length - maxCount, 0);
        res.status(200).send({
            items: items.slice(0, maxCount),
            itemRemaining: itemRemaining
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error); 
    }
})

router.post("/add_to_cart", async(req, res) => {
    if(!req.session.isAuth){
        res.status(401).send("User is not authenticated!");
        return;
    }

    const userId = req.session.user_id;
    const productId = parseInt(req.body.id);
    const productCount = parseInt(req.body.count); 
    
    if(isNaN(productId) || productId < 0 || isNaN(productCount) || productCount <= 0){
        res.status(400).send("Invalid cart data");
        return;
    }

    /* console.log(await dbFindExistingUserCart(userId, productId));
    console.log(await dbIsStockEnough(productId, 467)) */
    try {
        const existingCart = await dbFindExistingUserCart(userId, productId);
        if(existingCart){
            dbIncreaseCartQuantity(existingCart, productCount);
        }        
        else{
            await dbCreateCartData(userId, productId, productCount);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server database issue, try again later!"); 
        return;
    }  

    res.status(200).end()
})

router.get('/is_authenticated', (req, res) => {
    res.status(200).send(req.session.isAuth ? true : false);
})

router.post('/transaction/pay', async(req, res) => {
    if(!req.session.isAuth){
        res.status(401).send("User is not authenticated!");
        return;
    } 

    const userId = req.session.user_id;
    const cartIds = new Set();  // Ignore duplicate entries

    const { promoCode, checkoutCartData } = req.body;

    // Sanitize any sus string , we only accept number
    for(cartItem of checkoutCartData){
        const parsedCartId = parseInt(cartItem.cartId);
        if(isNaN(parsedCartId)){
            res.status(400).send("Invalid cart id!");
            return;
        }
        cartIds.add(parsedCartId);
    }

    const cartEntries = await dbRetrieveCartEntries(cartIds);
    if(Object.keys(cartEntries).length == 0){
        res.status(400).send("No such cart data is found!");
        return;
    }

    try {
        dbValidateCartEntries(cartEntries, userId);
        await dbValidateCartTransaction(cartEntries, promoCode, userId)
    } catch (error) {
        if( error.code == "INVALID_CART_REQUEST" || 
            error.code == "REJECTED_PROMO_CODE"){
            res.status(400).send(error.message)
            return;
        }

        console.log(error);
        res.status(503).send("Server database issue, try again later!"); 
        return;
    }

    res.send("ok")
    return;
})

router.post('/promo/create', async(req, res) => {
    const promoData = req.body;
    try {
        await createPromoCode(promoData);
    } catch (error) {
        if(error.code == "INVALID_PROMO_DATA"){
            res.status(400).send(error.message);
            return;
        }

        console.log(error);
        res.status(400).end();
        return;
    }

    res.status(200).end();
})

router.post('/promo/details', async(req, res) => {
    const { totalSpent, code } = req.body;
    
    if(  totalSpent == undefined || !code){
        res.status(400).end();
        return;
    }

    try {
        var promoDetails = await getPromoDetails(totalSpent, code)
        promoDetails.info = "Promo dapat digunakan!";
        res.status(200).send(JSON.stringify(promoDetails));
    } catch (error) {
        console.log();
        if(error.code == "REJECTED_PROMO_CODE"){
            res.status(200).send(JSON.stringify({
                discount: 0,
                message: "",
                info: error.message
            }));
            return;
        }

        res.status(503).send("Server database issue, try again later!"); 
        console.log(error);
        return;
    }
})


module.exports = router;