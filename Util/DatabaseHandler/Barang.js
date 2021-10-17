const { sqlQuery } = require("../DatabaseHandler");
const { clamp } = require("../Utility");

async function dbIsStockEnough(productId, quantity){
    const queryString = `
        SELECT stock FROM barang WHERE id=${productId};
    `

    return (await sqlQuery(queryString))[0][0].stock >= quantity;
}

async function dbDecreaseBarangStock(barangId, decrement){
    const queryString = `
        UPDATE barang
        set stock = stock-${decrement}
        where id="${barangId}";
    `

    await sqlQuery(queryString);
}

async function dbIncreaseBarangSold(barangId, increment){
    const queryString = `
        UPDATE barang
        set sold = sold+${increment}
        where id="${barangId}";
    `

    await sqlQuery(queryString);
}

async function dbGetBarangAvailablePage(category){
    let queryString = `
        SELECT * from barang
        WHERE stock > 0
    `
    if(category){
        queryString += ` AND category="${category}"`;
    }

    const itemsFound = (await sqlQuery(queryString+';'))[0];

    return Math.ceil(Object.keys(itemsFound).length/10);
}

async function dbGetBarangList(category, sortMode, page){
    const availablePage = await dbGetBarangAvailablePage(category);

    let queryString = `
        SELECT * from barang
        WHERE stock > 0
    `
    if(category){
        queryString += ` AND category="${category}"`;
    }

    let orderString = '';
    switch(sortMode.toUpperCase()){
        case "PRICE_LOW": {
            orderString = "ASC";
            break;
        }
        case "PRICE_HIGH": {
            orderString = "desc";
            break;
        }
    }

    if(orderString){
        queryString += ` ORDER BY price ${orderString}`;
    }

    queryString += ` LIMIT 10`;
    
    if(page){
        const offset = clamp(page-1, 0, availablePage-1)*10;
        queryString += ` OFFSET ${offset}`;
    }



    const itemFound = (await sqlQuery(queryString+';'))[0];

    return {
        availablePage: availablePage,
        items: itemFound
    }
}

module.exports = {
    dbDecreaseBarangStock : dbDecreaseBarangStock,
    dbIsStockEnough : dbIsStockEnough,
    dbIncreaseBarangSold: dbIncreaseBarangSold,
    dbGetBarangList: dbGetBarangList
}