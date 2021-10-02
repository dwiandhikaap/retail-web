const { Router } = require("express");
const { dbValidateCartEntries, dbRetrieveCartEntries, dbValidateCartTransaction } = require("../../../Util/DatabaseHandler/Cart");

const router = Router()

router.post('/pay', async(req, res) => {
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


module.exports = router;