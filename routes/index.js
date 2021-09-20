const express = require(`express`);
const path = require('path')
const { Router } = require('express');

const router = Router();

router.use("/", express.static(path.join(__dirname, '../public/index')));
router.use("/global", express.static(path.join(__dirname, '../public/global')));

/* router.get("/", async(req, res) => {
    if(!req.session.isAuth){
        res.redirect("/login");
        console.log("asdasd")

        return;
    }
    //console.log("asdas")
    //res.sendFile('home')
    //res.status(200).render('index.ejs')    
}); */


module.exports = router;