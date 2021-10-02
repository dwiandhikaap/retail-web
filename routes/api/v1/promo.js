const { Router } = require("express");
const { createPromoCode, getPromoDetails } = require("../../../Util/DatabaseHandler/Promo");

const router = Router();

router.post('/create', async(req, res) => {
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

router.post('/details', async(req, res) => {
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