L.Storage = L.Storage || {}
L.Storage.Myjson = L.Class.extend({
    options: {
        exportUrl: 'https://api.myjson.com/bins',
        importUrl: 'https://api.myjson.com/bins/{id}'
    },
    
    initialize: function (options) {
		L.setOptions(this, options);
	},

    load: function(myjsonID, callback) {
        if(myjsonID == "" || myjsonID === true || myjsonID === false) {
            return false
        }
        
        var xmlhttp = new XMLHttpRequest(),
            importUrl = L.Util.template(this.options.importUrl, {id:myjsonID})
            
        xmlhttp.open("GET", importUrl, true)
        
        //status 200, parse geoJson
        L.DomEvent.on(xmlhttp, 'readystatechange', function(e) {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                callback(JSON.parse(xmlhttp.responseText))
            }else if(xmlhttp.readyState == 4) {
                console.warn('No results from mysjon storage..');
                return false;
            }
        }, this)
        
        xmlhttp.send()
    },
    
    save: function(layer, callback) {
        if(!layer || !layer.toGeoJSON) { 
            return;
        }
        var geojson = layer.toGeoJSON();
        if(geojson.features.length == 0) {
            callback("")
            return;
        }
        
        var xmlhttp = new XMLHttpRequest()
        xmlhttp.open("POST", this.options.exportUrl, true)
        xmlhttp.setRequestHeader("Content-type","application/json; charset=utf-8")
        
        //status 201, parse .uri
        L.DomEvent.on(xmlhttp, 'readystatechange', function(e) {
            if (xmlhttp.readyState == 4  && xmlhttp.status == 201) {
                var url = JSON.parse(xmlhttp.responseText).uri
                var storageID = url.split('/').slice(-1)[0]
                callback(storageID)
            }else if(xmlhttp.readyState == 4) {
                console.warn('Could not save to myjson storage', this);
                return false;
            }
        }, this)
        
        xmlhttp.send(JSON.stringify(geojson))
    }    
})

L.storage = L.storage || {}
L.storage.myjson = function (options) {
	return new L.Storage.Myjson(options);
};