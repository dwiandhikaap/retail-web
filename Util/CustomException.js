function InvalidCartRequest(message){
    const error = new Error(message)
    
    error.code = "INVALID_CART_REQUEST";
    return error;
}

module.exports = {
    InvalidCartRequest : InvalidCartRequest
}