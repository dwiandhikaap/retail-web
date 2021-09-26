const { sqlQuery } = require("../DatabaseHandler");

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

module.exports = {
    dbDecreaseBarangStock : dbDecreaseBarangStock,
    dbIsStockEnough : dbIsStockEnough
}