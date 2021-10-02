const { Router } = require("express");
const { dbGetCartData, dbCreateCartData,dbIncreaseCartQuantity, dbFindExistingUserCart, dbGetCartOwner, dbUpdateCartQuantity, dbDeleteCart } = require("../../../Util/DatabaseHandler/Cart");

const router = Router();

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

router.post("/update_cart", async(req, res) => {
    if(!req.session.isAuth){
        res.status(401).send("User is not authenticated!");
        return;
    }

    const userId = req.session.user_id;
    const cartId = parseInt(req.body.cartId);
    const quantity = parseInt(req.body.quantity); 
    
    if(isNaN(cartId) || cartId < 0 || isNaN(quantity) || quantity <= 0){
        res.status(400).send("Invalid cart data");
        return;
    }

    const ownerId = await dbGetCartOwner(cartId);
    if(ownerId != userId){
        res.status(403).send("User is not authorized!");
        return;
    }

    try {
        await dbUpdateCartQuantity(cartId, quantity);
    } catch (error) {
        if( error.code == "INVALID_CART_REQUEST" || 
            error.code == "CART_NOT_FOUND"){
                res.status(400).send(error.message);
                return;
            }
        res.status(400).send("Unknown Error!");
        return;
    }

    res.status(200).end();
})

router.post("/delete_cart", async(req, res) =>{
    if(!req.session.isAuth){
        res.status(401).send("User is not authenticated!");
        return;
    }

    const userId = req.session.user_id;
    const cartId = parseInt(req.body.cartId);

    if(isNaN(cartId) || cartId < 0){
        res.status(400).send("Invalid cart id!");
        return;
    }

    const ownerId = await dbGetCartOwner(cartId);
    if(ownerId != userId){
        res.status(403).send("User is not authorized!");
        return;
    }

    try {
        await dbDeleteCart(cartId);
    } catch (error) {
        console.log(error);
        res.status(400).send("");
        return;
    }

    res.status(200).end();
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

module.exports = router;