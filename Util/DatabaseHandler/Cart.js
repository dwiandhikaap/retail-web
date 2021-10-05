const { InvalidCartRequest, CartNotFound } = require("../CustomException");
const { sqlQuery } = require("../DatabaseHandler");
const { dbIsStockEnough, dbDecreaseBarangStock } = require("./Barang");
const { applyPromoCode } = require("./Promo");
const { dbCreateTransactionEvent, dbCreateTransactionData } = require("./Transaction");
const { dbGetUserBalance, dbDecreaseUserBalance } = require("./User");

async function dbGetCartById(cartId){
    const queryString = `
    SELECT * FROM cart_data
    WHERE cartId="${cartId}";
    `;

    const result = (await sqlQuery(queryString))[0][0];
    return result;
}

async function dbGetCartOwner(cartId){
    const queryString = `
    SELECT personId FROM cart_data
    WHERE cartId="${cartId}";
    `;

    const result = (await sqlQuery(queryString))[0][0].personId;
    return result;
}

async function dbUpdateCartQuantity(cartId, quantity){
    const cartData = await dbGetCartById(cartId);
    if(!cartData){
        throw new CartNotFound("User cart is not found!");
    }

    if(!await dbIsStockEnough(cartData.barangId, quantity)){
        throw new InvalidCartRequest("Stock is not enough!")
    }

    const queryString = `
        UPDATE cart_data
        SET barangJumlah=${quantity}
        WHERE cartId="${cartId}";
    `;

    await sqlQuery(queryString);
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

    return (await sqlQuery(queryString))[0];
}

async function dbFindExistingUserCart(personId, barangId){
    const queryString = `
        SELECT * FROM cart_data
        WHERE barangId="${barangId}" AND personId="${personId}"
        AND RESOLVED=0;
    `

    const cartFound = (await sqlQuery(queryString))[0][0];

    if(!cartFound){
        return false;
    }
    
    return cartFound;
}

async function dbIncreaseCartQuantity(cartData, increment){
    const cartItemQuantity = cartData.barangJumlah;
    
    if(!await dbIsStockEnough(cartData.barangId, cartItemQuantity + increment)){
        throw new InvalidCartRequest("Stock is not enough!")
    }

    const queryString = `
        UPDATE cart_data
        set barangJumlah = barangJumlah+${increment}
        where cartId="${cartData.cartId}";
    `

    await sqlQuery(queryString);
}

async function dbCreateCartData(personId, productId, count){
    const insertNewCartData = `
        INSERT INTO cart_data(barangId, barangJumlah, personId, resolved)

        VALUES("${productId}", "${count}", "${personId}", 0);
    `
    
    if(!await dbIsStockEnough(productId, count)){
        throw InvalidCartRequest("Stock is not enough!");
    }
    
    await sqlQuery(insertNewCartData);
}

async function dbDeleteCart(cartId){
    const queryString = `
        DELETE FROM cart_data
        WHERE cartId=${cartId};
    `

    await sqlQuery(queryString);
}

async function dbRetrieveCartEntries(cartIds){
    const cartIdsString = [...cartIds].toString();
    const queryString = `
        -- @BLOCK
        SELECT * FROM cart_data
        WHERE cartId in (${cartIdsString})
    `
    
    const result = (await sqlQuery(queryString))[0];
    return result;
}

function dbValidateCartEntries(cartEntries, userId){
    for (cartEntry of cartEntries){
        if(cartEntry.personId != userId){
            throw InvalidCartRequest("Current user is different from at least one of the cart owner!");
        }
    }
}

async function dbValidateCartTransaction(cartEntries, promoCode, userId){
    const barangIds = cartEntries.map(cartEntry => cartEntry.barangId)
    const queryString = `
        -- @BLOCK
        SELECT id,price,stock,discount FROM barang
        WHERE id in (${barangIds.toString()})
    `
    const selectedItems = (await sqlQuery(queryString))[0];
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
            throw InvalidCartRequest("Cart data is already resolved!"); // avoid paying paid item
        }

        if(stock < barangJumlah){
            throw InvalidCartRequest("Stock is less than order quantity!");
        }

        const cart_price =  Math.floor(price*barangJumlah*(100-discount)/100);
        cartEntry.cart_price = cart_price;
        totalPrice += cart_price;
    }

    const discount = await applyPromoCode(totalPrice, promoCode);
    finalPrice = Math.floor((totalPrice*110/100)-discount);

    if(await dbGetUserBalance(userId) < finalPrice){
        throw InvalidCartRequest("Insufficient user balance!");
    };

    // Everything is okay, execute payment
    const transactionId = await dbCreateTransactionEvent(userId, totalPrice, discount, finalPrice);

    for(cartEntry of cartEntries){
        const {cartId, barangId, barangJumlah} = cartEntry;
        const {discount:barangDiscount, price} = selectedItemsObj[barangId];

        await dbDecreaseBarangStock(barangId, barangJumlah);
        await dbResolveCart(cartId);
        await dbCreateTransactionData(transactionId, cartId, price, cartEntry.cart_price, barangDiscount);
    }
    
    await dbDecreaseUserBalance(userId, finalPrice);
}

async function dbResolveCart(cartId){
    const queryString = `
        UPDATE cart_data
        set resolved = 1
        where cartId="${cartId}";
    `

    await sqlQuery(queryString);
}

module.exports = {
    dbGetCartData : dbGetCartData,
    dbGetCartOwner : dbGetCartOwner,
    dbFindExistingUserCart : dbFindExistingUserCart,
    dbUpdateCartQuantity : dbUpdateCartQuantity,
    dbIncreaseCartQuantity : dbIncreaseCartQuantity,
    dbCreateCartData : dbCreateCartData,
    dbDeleteCart : dbDeleteCart,
    dbRetrieveCartEntries : dbRetrieveCartEntries,
    dbValidateCartEntries : dbValidateCartEntries,
    dbValidateCartTransaction : dbValidateCartTransaction,
    dbResolveCart : dbResolveCart
}