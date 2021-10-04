const { sqlQuery } = require("../DatabaseHandler");

async function dbCreateTransactionEvent(personId, total_price, promo, final_price){
    const queryString = `
        INSERT INTO \`transaction_event\` (personId, total_price, promo, final_price, transaction_date)
        
        VALUES(${personId}, ${total_price}, ${promo}, ${final_price}, CURRENT_TIMESTAMP());
    `;

    return (await sqlQuery(queryString))[0].insertId;
}

async function dbCreateTransactionData(transactionId, cartId, cart_price, discount){
    const queryString = `
        INSERT INTO \`transaction_data\` (transactionId, cartId, cart_price, discount)

        VALUES("${transactionId}", "${cartId}", "${cart_price}", "${discount}");
    `

    await sqlQuery(queryString);
}

async function dbGetTransactionEventByPerson(personId){
    const queryString = `
        SELECT * FROM transaction_event

        WHERE personId=${personId};
    `

    return (await sqlQuery(queryString))[0];
}

async function dbGetTransactionData(transactionId){
    const queryString = `
        SELECT * FROM transaction_data

        WHERE transactionId=${transactionId};
    `

    return (await sqlQuery(queryString))[0];
}

module.exports = {
    dbCreateTransactionEvent : dbCreateTransactionEvent,
    dbCreateTransactionData : dbCreateTransactionData,
    
    dbGetTransactionData : dbGetTransactionData,
    dbGetTransactionEventByPerson : dbGetTransactionEventByPerson
}