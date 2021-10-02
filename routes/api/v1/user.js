const { Router } = require("express");
const { dbGetUserByID } = require("../../../Util/DatabaseHandler/User");

const router = Router()

router.get("/user_profile", async(req, res) => {
    if(!req.session.isAuth){
        res.status(403).end();
        return;
    }

    const user_id = req.session.user_id;
    const barangData = await dbGetUserByID(user_id);
    res.status(200).send(barangData);
})

router.get('/is_authenticated', (req, res) => {
    res.status(200).send(req.session.isAuth ? true : false);
})

module.exports = router;