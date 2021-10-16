const { RejectedPromoCode, InvalidPromoData } = require("../CustomException");
const { sqlQuery } = require("../DatabaseHandler");
const { isStringSus } = require("../Utility");

async function createPromoCode(promoData){
    const {code:_code, type:_type, value:_value, quota:_quota, min_spent: _min_spent, active:_active} = promoData;

    for(data of promoData){
        if(isStringSus(data.toString())){
            throw new InvalidPromoData("Sus string is detected")
        }
    }

    // Default value for everything
    const code = _code || makeid(12);
    const quota = _quota || -1;
    const value = _value || 0;
    const type = _type || "DISCOUNT_MONEY";
    const min_spent = _min_spent || 0;    
    const active = _active ? 1 : 0;

    const queryString = `
    INSERT INTO promo_code(code, type, value, quota, min_spent, is_active)

    VALUES("${code}", "${type}", "${value}", "${quota}", "${min_spent}", "${active}");
    `

    await sqlQuery(queryString)
} 

async function getPromoCodeData(code){
    if(isStringSus(code)){
        throw new RejectedPromoCode("sus promo code!");
    }

    const queryString = `
    SELECT * FROM promo_code
    WHERE code="${code}";
    `

    return (await sqlQuery(queryString))[0][0];
}

async function decreaseQuotaPromoCode(code){
    // We dont actually need to check , 
    // but just in case we need it in future changes..
    if(isStringSus(code)){
        throw new RejectedPromoCode("sus promo code!");
    }

    const queryString = `
        UPDATE promo_code
        set quota = quota-1
        where code="${code}";
    `

    await sqlQuery(queryString);
}

async function validatePromoData(totalSpent, promoData){
    const {code, quota, min_spent, is_active} = promoData;

    if(!(code.match("^[A-Za-z0-9]+$"))){
        throw new RejectedPromoCode("Invalid promo code!");
    }

    if(!is_active){
        throw new RejectedPromoCode("Promo code is currently not active!");
    }

    if(totalSpent < min_spent){
        throw new RejectedPromoCode("Your total payment does not meet the minimum criteria!");
    }

    if(quota == 0){
        throw new RejectedPromoCode("This promo has exceeded the maximum quota!");
    }

    return true;
}

async function getPromoMessage(promoData){
    const { type, value, min_spent } = promoData;

    let discountValue;
    switch(type){
        case "DISCOUNT_PERCENT" : {
            discountValue = `${value}%`;
            break;
        }
        case "DISCOUNT_MONEY" : {
            discountValue = moneyFormat(value);
            break;
        }
    }
    
    let promoMessage = `Potongan harga sebesar ${discountValue}`

    if(min_spent > 0){
        promoMessage += (` dengan minimum transaksi ${moneyFormat(min_spent)}`)
    }

    return promoMessage;
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function moneyFormat(amount){
    return amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
}

/* EXPORT FUNCTIONS BELOW */

async function calculatePromoDiscount(totalSpent, promoData){    
    if(!await validatePromoData(totalSpent, promoData)){
        return;
    }

    const { value } = promoData;
    let discount = 0.0;

    switch(promoData.type){
        case "DISCOUNT_PERCENT" : {
            discount = totalSpent * value/100;
            break;
        }
        case "DISCOUNT_MONEY" : {
            discount = value;
            break;
        }
        default : {
            throw new RejectedPromoCode("Unknown promo code type!");
        }
    }

    return Math.round(discount);
}

async function applyPromoCode(totalSpent, code){
    if(code == undefined || code == ""){
        return 0;
    }

    const promoData = await getPromoCodeData(code);

    if(!promoData){
        throw new RejectedPromoCode("Unknown promo code!");
    }

    const discount = await calculatePromoDiscount(totalSpent, promoData);
    if(code.quota > 0){
        await decreaseQuotaPromoCode(code);
    }

    return discount;
}

async function getPromoDetails(total, code){
    if(code == undefined || code == ""){
        return 0;
    }

    const promoData = await getPromoCodeData(code);

    if(!promoData){
        throw new RejectedPromoCode("Unknown promo code!");
    }

    const discount = await calculatePromoDiscount(total, promoData);
    const message = await getPromoMessage(promoData);

    return {discount, message}
}

module.exports = {
    createPromoCode : createPromoCode,
    getPromoDetails : getPromoDetails,
    applyPromoCode : applyPromoCode,
}