require('dotenv').config()

//const { resolveInclude } = require('ejs');
//const mysql = require('mysql2');
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt');

var con = undefined;

async function dbInit(){
    con = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    con.connect()
    .catch((err) => console.error(err))
    .then(console.log("Database is connected!"))
}

async function dbGetData(table, index_start, index_end){
    let indexRangeStr = ` BETWEEN ${index_start} AND ${index_end}`;

    if(index_end === undefined){
        indexRangeStr = `=${index_start}`;
    }

    const cmd = `
    SELECT * FROM ${table}

    WHERE id${indexRangeStr}
    `
    return (await con.query(cmd))[0];
}

async function dbCreateUser(name, email, password){
    const hashedPassword = await bcrypt.hash(password, 11);
    const cmd = `
    INSERT INTO person(name, email, password, balance, cart_data)

    VALUES("${name}", "${email}", "${hashedPassword}", 0.0, "");
    `
    
    await con.query(cmd);
}

async function dbIsEmailRegistered(email){
    const cmd = `
    SELECT email FROM person WHERE email="${email}"
    `
    const result = (await con.query(cmd))[0]

    if(Object.keys(result).length == 1){
        return true;
    }

    return false;
}

async function dbAuthUser(email, password){
    const cmd = `
    SELECT password FROM person WHERE email="${email}"
    `
    const result = (await con.query(cmd))[0]

    const isEqual = await bcrypt.compare(password, result[0].password)
    return isEqual;
}

async function dbGetIDByEmail(email){
    const cmd = `
    SELECT id FROM person WHERE email="${email}"
    `
    const result = (await con.query(cmd))[0];

    return result[0].id;
}

async function dbGetUserByID(user_id){
    const cmd = `
    SELECT name,balance FROM person WHERE id="${user_id}"
    `
    return (await con.query(cmd))[0][0];
}

async function dbGetUserBalance(user_id){
    const queryString = `
        -- @BLOCK
        SELECT balance FROM person
        WHERE id="${user_id}";
    `

    return (await con.query(queryString))[0][0].balance;
}

async function dbGetCartData(user_id, sortMode){
    let queryString = `
    SELECT cart_data.*, barang.product_name, barang.price, barang.discount 
    FROM cart_data
    LEFT JOIN barang
    ON cart_data.barangid = barang.id
    WHERE personId="${user_id}" 
    ORDER by cartId ${sortMode};`

    return (await con.query(queryString))[0];
}

async function dbCreateCartData(personId, productId, count){
    // JavaScript god-tier variable naming 🗿
    const checkIfStockIsEnough = `
        SELECT * FROM barang WHERE id=${productId};
    `

    const insertNewCartData = `
        INSERT INTO cart_data(barangId, barangJumlah, personId)

        VALUES("${productId}", "${count}", "${personId}");
    `
    
    const queryBarangResult = (await con.query(checkIfStockIsEnough))[0]
    if(queryBarangResult.length == 0 || queryBarangResult[0].stock < count){
        throw new Error("lmao");
    }

    await con.query(insertNewCartData);
}

async function dbRetrieveCartEntries(cartIds){
    const cartIdsString = [...cartIds].toString();
    const queryString = `
        -- @BLOCK
        SELECT * FROM cart_data
        WHERE cartId in (${cartIdsString})
    `
    
    const result = (await con.query(queryString))[0];
    return result;
}

function dbValidateCartEntries(cartEntries, userId){
    for (cartEntry of cartEntries){
        if(cartEntry.personId != userId){
            throw new Error("Current user is different from at least one of the cart owner!");
        }
    }
}

async function dbValidateCartTransaction(cartEntries, userId){
    const barangIds = cartEntries.map(cartEntry => cartEntry.barangId)
    const queryString = `
        -- @BLOCK
        SELECT id,price,stock,discount FROM barang
        WHERE id in (${barangIds.toString()})
    `
    const selectedItems = (await con.query(queryString))[0];
    let selectedItemsObj = new Object();
    for(item of selectedItems){
        const {id, ...itemData} = item;
        selectedItemsObj[id] = itemData;
    }

    let totalPrice = 0;
    for(entry of cartEntries){
        const {barangId, barangJumlah} = entry;
        const {stock,price,discount} = selectedItemsObj[barangId];

        if(stock < barangJumlah){
            throw new Error("Stock is less than order quantity!");
        }
        totalPrice += price*barangJumlah*(100-discount)/100;
    }

    if(await dbGetUserBalance(userId) < totalPrice){
        throw new Error("Insufficient user balance!");
    };

    console.log(cartEntries);
}

// todo, make db utils here

module.exports = {
    dbInit : dbInit,
    dbGetData : dbGetData,
    dbGetCartData : dbGetCartData,
    dbCreateUser : dbCreateUser,
    dbCreateCartData : dbCreateCartData,
    dbRetrieveCartEntries : dbRetrieveCartEntries,
    dbValidateCartEntries : dbValidateCartEntries,
    dbValidateCartTransaction : dbValidateCartTransaction,
    dbIsEmailRegistered : dbIsEmailRegistered,
    dbAuthUser : dbAuthUser,
    dbGetIDByEmail : dbGetIDByEmail,
    dbGetUserByID : dbGetUserByID
}