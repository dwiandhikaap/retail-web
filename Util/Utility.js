/* 
    A.S.U

    A   - Anti
    S   - Sus
    U   - Utility
*/
function isStringSus(string){
    return !(string.match("^[A-Za-z0-9]+$"));
}

module.exports = {
    isStringSus: isStringSus
}