const { Router } = require("express");
const { dbIsEmailRegistered, dbAuthUser, dbGetIDByEmail } = require("../Util/DatabaseHandler");
const path = require("path");
const express = require("express");

const router = Router();

router.use("/", express.static(path.join(__dirname, '../public/login')));

router.post("/", async(req, res) => {
    const { email, password } = req.body;
    try {
        if(!(email && password)){
            res.status(400).send("Data pengguna tidak valid!");
            return;
        }

        const isRegistered = await dbIsEmailRegistered(email);
        if(!isRegistered){
            res.status(400).send("Email tidak ditemukan!");
            return;
        }

        const isAuth = await dbAuthUser(email, password);
        //console.log(isAuth);
        if(!isAuth){
            res.status(400).send("Password salah!");
            return;
        }

        const user_id = await dbGetIDByEmail(email);
        req.session.isAuth = true;
        req.session.user_id = user_id;
        res.status(200).end();

    } catch (err) {
        console.log(err);
    }
})

module.exports = router;