function InvalidCartRequest(message){
    const error = new Error(message)
    
    error.code = "INVALID_CART_REQUEST";
    return error;
}

function RejectedPromoCode(message){
    const error = new Error(message)
    
    error.code = "REJECTED_PROMO_CODE";
    return error;
}

function InvalidPromoData(message){
    const error = new Error(message)
    
    error.code = "INVALID_PROMO_DATA";
    return error;
}


module.exports = {
    InvalidCartRequest : InvalidCartRequest,
    RejectedPromoCode : RejectedPromoCode,
    InvalidPromoData : InvalidPromoData
}