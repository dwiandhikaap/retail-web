require('dotenv').config()

const mysql = require('mysql2/promise')

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

async function sqlQuery(queryString){
    return await con.query(queryString);
}



module.exports = {
    dbInit : dbInit,
    sqlQuery : sqlQuery,
}