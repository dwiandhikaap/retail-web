const { sqlQuery } = require("../DatabaseHandler");

async function dbCreateTransactionEvent(personId, total_price, promo, final_price){
    const queryString = `
        INSERT INTO \`transaction_event\` (personId, total_price, promo, final_price, transaction_date)
        
        VALUES(${personId}, ${total_price}, ${promo}, ${final_price}, CURRENT_TIMESTAMP());
    `;

    return (await sqlQuery(queryString))[0].insertId;
}

async function dbCreateTransactionData(transactionId, cartId, product_name, item_price, cart_price, discount){
    const queryString = `
        INSERT INTO \`transaction_data\` (transactionId, cartId, product_name, item_price, cart_price, discount)

        VALUES("${transactionId}", "${cartId}", "${product_name}", ${item_price}, "${cart_price}", "${discount}");
    `

    await sqlQuery(queryString);
}

async function dbGetTransactionEventByPerson(personId){
    const queryString = `
        SELECT transaction_event.transactionId, transaction_event.total_price, transaction_event.promo, transaction_event.final_price, transaction_event.transaction_date, person.name FROM transaction_event
        LEFT JOIN person
        ON person.id = transaction_event.personId

        WHERE personId=${personId}
        ORDER BY transactionId DESC;
    `

    return (await sqlQuery(queryString))[0];
}

async function dbGetTransactionData(transactionId){
    const queryString = `
        SELECT transaction_data.cartId, transaction_data.product_name, transaction_data.item_price, transaction_data.cart_price, transaction_data.discount , cart_data.barangId, cart_data.barangJumlah
        FROM transaction_data
        LEFT JOIN cart_data
        ON cart_data.cartId = transaction_data.cartId
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