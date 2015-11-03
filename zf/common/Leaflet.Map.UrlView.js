/*
 * L.Handler.UrlView is used by L.Map to update the current position in the url as parameters
 */

L.Map.UrlView = L.Handler.extend({
	addHooks: function () {
		var urlViewParams = L.Util.parseParamString(window.location.search);
        if(urlViewParams.zoom && urlViewParams.lat && urlViewParams.lng)  {
	        this._map.setView(L.latLng(urlViewParams.lat, urlViewParams.lng),urlViewParams.zoom)
	        this._map.urlSetView = true;
	    }

		L.DomEvent.on(this._map, 'moveend', this._onMapMoved, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map, 'moveend', this._onMapMoved, this);
	},

	_onMapMoved: function (e) {
	    var urlParams = L.Util.parseParamString(window.location.search),
	        mapView = this._getMapView()

        this._updateSearchLocation(L.Util.getParamString(L.extend(urlParams, mapView)))
	},

    _updateSearchLocation: function(searchLocation) {
        window.history.replaceState(null, null, searchLocation)
    },

	_getMapView: function() {
	    var mapCenter = this._map.getCenter(),
	        mapZoom = this._map.getZoom();

	    return {zoom: mapZoom, lat: mapCenter.lat, lng: mapCenter.lng}
	}
});

if(window.history && L.Util.parseParamString) {
    L.Map.mergeOptions({
        urlView: false,
        urlSetView: false
    });
    
    L.Map.addInitHook('addHandler', 'urlView', L.Map.UrlView);
}