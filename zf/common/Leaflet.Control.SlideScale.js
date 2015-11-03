L.Control.Scale.include({
    _updateMetric: function (maxMeters) {
        var meters = this._getRoundNum(maxMeters),
            defaultUnit = {magnitude: meters > 1000 ? meters/1000 : meters, unit: meters > 1000 ? 'km' : 'm'}
            humanReadable = L.Util.humanReadable ? L.Util.humanReadable(meters) : defaultUnit;
            humanString = Math.round(humanReadable.magnitude)+" "+humanReadable.unit;

        this._updateScale(this._mScale, humanString, meters / maxMeters );
    },

    _getRoundNum: function (num) {
        var pow10 = Math.pow(10, Math.floor(Math.log(num) / Math.LN10)),
            d = num / pow10;

        d = d >= 10 ? 10 :
            d >= 5 ? 5 :
            d >= 3 ? 3 :
            d >= 2 ? 2 : 1;

        return pow10 * d;
    }
})