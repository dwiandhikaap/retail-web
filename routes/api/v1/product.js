const { Router } = require("express");
const { dbGetBarangList, dbGetBarang, dbGetCategoryList } = require("../../../Util/DatabaseHandler/Barang");
const { isRequestQueryValid } = require("../../../Util/Utility");
const fs = require("fs")
const path = require("path")

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

    console.log(req.query);

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
        await dbGetBarang(productId)
    )
})

router.get("/get_category_list", async(req, res) => {
    const categoryList = (await dbGetCategoryList()).map(val => Object.values(val)[0]);

    res.send(categoryList);
})

router.get("/img", async(req,res) => {
    const id = parseInt(req.query.id);
    if(isNaN(id)){
        res.status(400).end();
        return;
    }

    const imgPath = path.join(__dirname, '../../../public/product/img');
    const fileExtensions = [".jpg", ".jpeg", ".png"]

    for(extension of fileExtensions){
        if(fs.existsSync(path.join(imgPath, `${id}${extension}`))){
            res.sendFile(`${id}${extension}`, {
                root: imgPath
            })
            return;
        }
    }

    res.status(404).end()

})

module.exports = router;