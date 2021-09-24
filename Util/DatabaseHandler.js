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

async function dbGetCartData(user_id, sortMode, filter){
    let resolvedValue = 0;
    if(filter.toUpperCase() == "RESOLVED"){
        resolvedValue = 1;
    }

    const filterString = `
        AND resolved=${resolvedValue}
    `

    let queryString = `
        SELECT cart_data.*, barang.product_name, barang.price, barang.discount 
        FROM cart_data
        LEFT JOIN barang
        ON cart_data.barangid = barang.id
        WHERE personId="${user_id}" ${filter != "UNFILTERED" ? filterString : ""}
        ORDER by cartId ${sortMode};
    `

    return (await con.query(queryString))[0];
}

async function dbFindExistingUserCart(personId, barangId){
    const queryString = `
        SELECT * FROM cart_data
        WHERE barangId="${barangId}" AND personId="${personId}";
    `

    const cartFound = (await con.query(queryString))[0][0];

    if(!cartFound){
        return false;
    }
    
    return cartFound;
}

async function dbIncreaseCartQuantity(cartData, increment){
    const cartItemQuantity = cartData.barangJumlah;
    
    if(!await dbIsStockEnough(cartData.barangId, cartItemQuantity + increment)){
        throw new Error("Stock is not enough!")
    }

    const queryString = `
        UPDATE cart_data
        set barangJumlah = barangJumlah+${increment}
        where cartId="${cartData.cartId}";
    `

    await con.query(queryString);
}

async function dbIsStockEnough(productId, quantity){
    // JavaScript god-tier variable naming 🗿
    const queryString = `
        SELECT stock FROM barang WHERE id=${productId};
    `

    return (await con.query(queryString))[0][0].stock >= quantity;
}

async function dbCreateCartData(personId, productId, count){
    const insertNewCartData = `
        INSERT INTO cart_data(barangId, barangJumlah, personId, resolved)

        VALUES("${productId}", "${count}", "${personId}", 0);
    `
    
    if(!await dbIsStockEnough(productId, count)){
        throw new Error("Stock is not enough!");
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
    for(cartEntry of cartEntries){
        const {barangId, barangJumlah, resolved} = cartEntry;
        const {stock,price,discount} = selectedItemsObj[barangId];

        if(resolved.readUInt8() == 1){
            throw new Error("Cart data is already resolved!"); // avoid paying paid item
        }

        if(stock < barangJumlah){
            throw new Error("Stock is less than order quantity!");
        }
        totalPrice += price*barangJumlah*(100-discount)/100;
    }

    // TODO: make util function to calculate totalPrice with tax, promo, etc..
    // currently just hardcoded the tax
    totalPrice = totalPrice*110/100;

    if(await dbGetUserBalance(userId) < totalPrice){
        throw new Error("Insufficient user balance!");
    };

    for(cartEntry of cartEntries){
        const {cartId, barangId, barangJumlah} = cartEntry;
        
        await dbDecreaseBarangStock(barangId, barangJumlah);
        await dbResolveCart(cartId);
    }

    await dbDecreaseUserBalance(userId, totalPrice);
}

async function dbDecreaseBarangStock(barangId, decrement){
    const queryString = `
        UPDATE barang
        set stock = stock-${decrement}
        where id="${barangId}";
    `

    await con.query(queryString);
}

async function dbDecreaseUserBalance(userId, decrement){
    const queryString = `
        UPDATE person
        set balance = balance-${decrement}
        where id="${userId}";
    `

    await con.query(queryString);
}

async function dbResolveCart(cartId){
    const queryString = `
        UPDATE cart_data
        set resolved = 1
        where cartId="${cartId}";
    `

    await con.query(queryString);
}

// todo, make db utils here

module.exports = {
    dbInit : dbInit,
    dbGetData : dbGetData,
    dbGetCartData : dbGetCartData,
    dbCreateUser : dbCreateUser,
    dbFindExistingUserCart : dbFindExistingUserCart,
    dbIncreaseCartQuantity : dbIncreaseCartQuantity,
    dbIsStockEnough : dbIsStockEnough,
    dbCreateCartData : dbCreateCartData,
    dbRetrieveCartEntries : dbRetrieveCartEntries,
    dbValidateCartEntries : dbValidateCartEntries,
    dbValidateCartTransaction : dbValidateCartTransaction,
    dbIsEmailRegistered : dbIsEmailRegistered,
    dbAuthUser : dbAuthUser,
    dbGetIDByEmail : dbGetIDByEmail,
    dbGetUserByID : dbGetUserByID
}