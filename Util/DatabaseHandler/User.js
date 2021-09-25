const { sqlQuery } = require("../DatabaseHandler");
const bcrypt = require('bcrypt');

async function dbCreateUser(name, email, password){
    const hashedPassword = await bcrypt.hash(password, 11);
    const cmd = `
    INSERT INTO person(name, email, password, balance)

    VALUES("${name}", "${email}", "${hashedPassword}", 0.0);
    `
    
    await sqlQuery(cmd);
}

async function dbIsEmailRegistered(email){
    const cmd = `
    SELECT email FROM person WHERE email="${email}"
    `
    const result = (await sqlQuery(cmd))[0]

    if(Object.keys(result).length == 1){
        return true;
    }

    return false;
}

async function dbAuthUser(email, password){
    const cmd = `
    SELECT password FROM person WHERE email="${email}"
    `
    const result = (await sqlQuery(cmd))[0]

    const isEqual = await bcrypt.compare(password, result[0].password)
    return isEqual;
}

async function dbGetIDByEmail(email){
    const cmd = `
    SELECT id FROM person WHERE email="${email}"
    `
    const result = (await sqlQuery(cmd))[0];

    return result[0].id;
}

async function dbGetUserByID(user_id){
    const cmd = `
    SELECT name,balance FROM person WHERE id="${user_id}"
    `
    return (await sqlQuery(cmd))[0][0];
}

async function dbGetUserBalance(user_id){
    const queryString = `
        -- @BLOCK
        SELECT balance FROM person
        WHERE id="${user_id}";
    `

    return (await sqlQuery(queryString))[0][0].balance;
}

async function dbDecreaseUserBalance(userId, decrement){
    const queryString = `
        UPDATE person
        set balance = balance-${decrement}
        where id="${userId}";
    `

    await sqlQuery(queryString);
}


module.exports = {
    dbCreateUser : dbCreateUser,
    dbAuthUser : dbAuthUser,
    dbIsEmailRegistered : dbIsEmailRegistered,
    dbGetIDByEmail : dbGetIDByEmail,
    dbGetUserByID : dbGetUserByID,
    dbGetUserBalance : dbGetUserBalance,
    dbDecreaseUserBalance : dbDecreaseUserBalance
}