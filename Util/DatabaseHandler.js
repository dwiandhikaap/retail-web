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

// TODO: replace this with multiple getData function for each table
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

module.exports = {
    dbInit : dbInit,
    sqlQuery : sqlQuery,

    dbGetData : dbGetData
}