const express = require("express");
const { Router } = require("express");
const path = require("path");

const { dbIsEmailRegistered, dbCreateUser } = require("../Util/DatabaseHandler/User");

const router = Router();

router.use("/", express.static(path.join(__dirname, '../public/register')));


router.post("/", async (req, res) =>{
    const { name, email, password } = req.body;
    try {
        if(!(name && email && password)){
            res.status(400).send("Invalid user data!")
            return;
        }

        const isRegistered = await dbIsEmailRegistered(email);
        if(!isRegistered){
            await dbCreateUser(name, email, password);
            res.status(200).end();
        }
        else{
            res.status(400).send("Email has already registered!");
        }

    } catch (err) {
        console.error(err);
    }
})

module.exports = router;