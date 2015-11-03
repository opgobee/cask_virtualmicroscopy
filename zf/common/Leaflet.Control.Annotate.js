L.Control.Annotate = L.Control.extend({
    options: {
        position: 'topleft',
        controlClassName: 'leaflet-control-annotate',
        editTools: L.Editable,
        editOptions: {drawingCSSClass: 'leaflet-control-annotate'}
    },
    
    onAdd: function (map) {
        this._editTools = new this.options.editTools(this._map,this.options.editOptions)
        
        var controlClass = this.options.controlClassName,
            barContainer = L.DomUtil.create('div', controlClass + ' leaflet-bar')

        this._createButton('mode_edit', 'Create a new annotation', controlClass + '-polygon material-icons', barContainer, this._initNewPolygon)
        this._createButton('link', 'Export annotations', controlClass + '-export material-icons', barContainer, this._exportFeatures)

        return barContainer;
    },

    _createButton: function (html, title, className, container, fn) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		L.DomEvent
		    .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
		    .on(link, 'click', L.DomEvent.stop)
		    .on(link, 'click', fn, this)
		    .on(link, 'click', this._refocusOnMap, this);

		return link;
	},
	
    _initNewPolygon: function (e) {
        this._editTools.startPolygon()
    },
    
    _exportFeatures: function(e) {
        var geoJSON = this._editTools.featuresLayer.toGeoJSON()
        console.log(JSON.stringify(geoJSON))
    },
    
    _importGeoJson: function(geoJson) {
        var featuresLayer = this._editTools.featuresLayer
        var tools = this._editTools;
        
        L.geoJson(geoJson, {
            onEachFeature: function (feature, layer) {
                var flatLayers = (layer.getLayers && layer.getLayers()) || [layer]
                flatLayers.forEach(function (l) {
                    L.Util.setOptions(l,{editOptions: {editTools: tools}})
                    featuresLayer.addLayer(l)
                    l.enableEdit()
                })
            }
        })
            
    }
});
    
L.control.annotate = function (options) {
	return new L.Control.Annotate(options);
};

//Mixin for MyJson api JSON storage
L.Control.Annotate.mergeOptions({
    myJsonExportUrl: 'https://api.myjson.com/bins',
    myJsonImportUrl: 'https://api.myjson.com/bins/{id}'
})

L.Control.Annotate.include({
    
    //overwrite original function and forward event
    _exportFeatures: function(e)
    {
        this.exportToMyjson(e);
    },
    
    exportToMyjson: function(e) {
        var geoJSON = this._editTools.featuresLayer.toGeoJSON()
        
        var xmlhttp = new XMLHttpRequest()
        xmlhttp.open("POST", this.options.myJsonExportUrl, true)
        xmlhttp.setRequestHeader("Content-type","application/json; charset=utf-8")
        xmlhttp.onreadystatechange = L.bind(this._onExportStateChange, this)
        
        xmlhttp.send(JSON.stringify(geoJSON))
    },
    
    _onExportStateChange: function (e) {
        var xmlhttp = e.srcElement
        
        if (xmlhttp.readyState == 4) {
            if(xmlhttp.status == 201) {
                console.log(JSON.parse(xmlhttp.responseText).uri);
            } else {
                console.warn('Error:', xmlhttp);
            }
        }
    },
    
    importFromMyJson: function(myJsonBin) {
        var xmlhttp = new XMLHttpRequest(),
            importUrl = L.Util.template(this.options.myJsonImportUrl, {id:myJsonBin})
            
        xmlhttp.open("GET", importUrl, true)
        xmlhttp.onreadystatechange = L.bind(this._onImportStateChange, this)
        xmlhttp.send()
    },
    
    _onImportStateChange: function (e) {
        var xmlhttp = e.srcElement
        
        if (xmlhttp.readyState == 4) {
            if(xmlhttp.status == 200) {
                var geoJson = JSON.parse(xmlhttp.responseText);
                this._importGeoJson(geoJson)
            } else {
                console.warn('Error:', xmlhttp);
            }
        }
    }
})