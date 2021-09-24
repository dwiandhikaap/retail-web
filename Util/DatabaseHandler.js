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

    return new Promise((resolve, reject) => {
        try {
            const cmd = `
            SELECT * FROM ${table}

            WHERE id${indexRangeStr}
            `
            con.query(cmd, (err, result) => {
                if(err) throw err;

                resolve(result);
            })
        } catch (error) {
            reject(error);
        }
    })
}

async function dbCreateUser(name, email, password){
    const hashedPassword = await bcrypt.hash(password, 11);
    const cmd = `
    INSERT INTO person(name, email, password, balance, cart_data)

    VALUES("${name}", "${email}", "${hashedPassword}", 0.0, "");
    `
    
    con.query(cmd, (err, result) => {
        if(err) throw err;

        //console.log(result);
    })
}

async function dbIsEmailRegistered(email){
    return new Promise((resolve, reject) => {
        const cmd = `
        SELECT email FROM person WHERE email="${email}"
        `
        con.query(cmd, function async(err, result) {
            if(err) return reject(err);

            if(Object.keys(result).length == 1){
                resolve(true);
            }
            resolve(false);
        })
    })
}

async function dbAuthUser(email, password){
    return new Promise((resolve, reject) => {
        const cmd = `
        SELECT password FROM person WHERE email="${email}"
        `
        con.query(cmd, async(err, result) => {
            if(err) return reject(err);

            const isEqual = await bcrypt.compare(password, result[0].password)
            resolve(isEqual);
        })
    })
}

async function dbGetIDByEmail(email){
    return new Promise((resolve, reject) => {
        const cmd = `
        SELECT id FROM person WHERE email="${email}"
        `
        con.query(cmd, async(err, result) => {
            if(err) return reject(err);

            resolve(result[0].id);
        })
    })
}

async function dbGetUserByID(user_id){
    return new Promise((resolve, reject) => {
        const cmd = `
        SELECT * FROM person WHERE id="${user_id}"
        `
        con.query(cmd, async(err, result) => {
            if(err) return reject(err);

            resolve(result[0]);
        })
    })
}

async function dbGetCartData(user_id, sortMode){
    return new Promise((resolve, reject) => {
        let cmd = `
        SELECT cart_data.*, barang.product_name, barang.price, barang.discount 
        FROM cart_data
        LEFT JOIN barang
        ON cart_data.barangid = barang.id
        WHERE personId="${user_id}" 
        ORDER by cartId ${sortMode};`


        con.query(cmd, async(err, result) => {
            if(err) return reject(err);

            resolve(result);
        })
    })
}

async function dbCreateCartData(personId, productId, count){
    return new Promise((resolve, reject) => {
        
        // JavaScript god-tier variable naming 🗿
        const checkIfStockIsEnough = `
            SELECT * FROM barang WHERE id=${productId};
        `

        const insertNewCartData = `
            INSERT INTO cart_data(barangId, barangJumlah, personId)
    
            VALUES("${productId}", "${count}", "${personId}");
        `
        
        // could use mysql2 promise but couldn't bother refactoring everything else 😔
        // TODO: now that i use mysql2, pls refactor this hot garbage below
        con.query(checkIfStockIsEnough, (err, result) => {
            if(err || result.length == 0 || result[0].stock < count){
                reject("lmao");

                return;
            }
            con.query(insertNewCartData, (err, result) => {
    
                if(err){
                    reject("lmao");
                    return;
                }
                
                resolve("poggers");
            })
        })
        
            
    })
}

async function dbValidateCartEntries(cartIds, userId){
    for (cartId of cartIds){
        const queryString = `
            -- @BLOCK
            SELECT personId FROM cart_data
            WHERE cartId=${cartId}
        `
        
        const result = await con.query(queryString);
        if (result[0][0].personId != userId){
            return false
        }
    }

    return true;
}

// todo, make db utils here

module.exports = {
    dbInit : dbInit,
    dbGetData : dbGetData,
    dbGetCartData : dbGetCartData,
    dbCreateUser : dbCreateUser,
    dbCreateCartData : dbCreateCartData,
    dbValidateCartEntries : dbValidateCartEntries,
    dbIsEmailRegistered : dbIsEmailRegistered,
    dbAuthUser : dbAuthUser,
    dbGetIDByEmail : dbGetIDByEmail,
    dbGetUserByID : dbGetUserByID
}