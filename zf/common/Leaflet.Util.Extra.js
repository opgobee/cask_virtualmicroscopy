/*
 * L.Util extra's for custom use
 */

L.Util.humanReadable = function(meters) {
    var exp = Math.floor(Math.log(meters) / Math.LN10),
        resunits = '', scaleExp = 0

    if(exp < -6) {
        resunits = "nm"
        scaleExp = -9
    }else if(exp < -3) {
        resunits = "&micro;m"
        scaleExp = -6
    }else if (exp < 0) {
        resunits = "mm"
        scaleExp = -3
    }else if(exp < 3) {
        resunits = "m"
    }else { //if(exp < 6) {
        resunits = "km"
        scaleExp = 3
    }
    
    return {magnitude:meters/Math.pow(10,scaleExp), unit:resunits}
}
    
// Parses ?key=value&key=value
L.Util.parseParamString = function (searchUrl) {
    if(searchUrl[0] != "?") return {};

    var parsedParams = {};
    
    searchUrl.substring(1).split('&').forEach(function(paramPair) {
        var splitPair = decodeURIComponent(paramPair).split("=");
        parsedParams[splitPair[0].trim()] = splitPair[1] ? splitPair[1].trim() : true;
    })
    return parsedParams;
}