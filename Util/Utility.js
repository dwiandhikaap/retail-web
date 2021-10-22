/* 
    A.S.U

    A   - Anti
    S   - Sus
    U   - Utility
*/
function isStringSus(string){
    return !(string.match("^[A-Za-z0-9-_]+$"));
}

// TODO: use escaped symbol instead
function isRequestQueryValid(string){
    return !(string.match("^[A-Za-z0-9_ &-]+$"));
}

function clamp(num, min, max){
    return (num > max ? max : (num < min ? min : num))
}

module.exports = {
    isStringSus: isStringSus,
    isRequestQueryValid: isRequestQueryValid,
    clamp: clamp
}