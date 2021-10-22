function InvalidCartRequest(message){
    const error = new Error(message)
    
    error.code = "INVALID_CART_REQUEST";
    return error;
}

function CartNotFound(message){
    const error = new Error(message)
    
    error.code = "CART_NOT_FOUND";
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

function PromoQuotaExceeded(message){
    const error = new Error(message)
    
    error.code = "PROMO_QUOTA_EXCEEDED";
    return error;
}


module.exports = {
    InvalidCartRequest : InvalidCartRequest,
    CartNotFound : CartNotFound,
    RejectedPromoCode : RejectedPromoCode,
    InvalidPromoData : InvalidPromoData,
    PromoQuotaExceeded: PromoQuotaExceeded
}