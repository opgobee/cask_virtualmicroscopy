L.Control.Legend = L.Control.extend({  
    options: {
        position: 'bottomright',
        containerClass: 'leaflet-control-legend'
    },

    initialize: function(content, options) {
        if(content) {
            this.setContent(content);
        }
        
        L.Util.setOptions(this, options);
    },

    onAdd: function (map) {
        this._container = L.DomUtil.create('div', this.options.containerClass);
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.disableScrollPropagation(this._container);
        
       map.whenReady(this.update, this);
        
        return this._container;
    },
    
    onRemove: function() {
    
    },
    
    setContent: function(content) {
        this._content = content;
        this.update();
        return this;
    },
    
    update: function() {
        this._updateContent();
    },
    
    _updateContent: function() {
        if(!this._map || !this._container) { 
            return this; 
        }
        
        //Empty legend
        while (this._container.lastChild) {
            this._container.removeChild(this._container.lastChild);
        }
        
		var content = (typeof this._content === 'function') ? this._content(this) : this._content;

        if(content === false) {
            this.hideLegend();
            return;
        } else {
            this.showLegend();
        }
        
        if (typeof content === 'string') {
			this._container.innerHTML = content;
		} else {
			this._container.appendChild(content);
		}
	},
	
	hideLegend: function() {
	    this._container.style.display = 'none';
	},
	
	showLegend: function() {
	    this._container.style.display = 'block';	
	}
});

L.control.legend = function (content, options) {
    return new L.Control.Legend(content, options);
};


L.Control.OverlayLegend = L.Control.Legend.extend({

    initialize: function(overlay, options) {
        this._overlay = overlay;
        
        this._overlayItems = [];
        
        L.Util.setOptions(this, options);
        
        this.setContent(this._contentUpdate);
    },
    
    _contentUpdate: function() {
        var overlays = [], overlayItems = [];
        
        if(this._overlay instanceof L.LayerGroup) {
            overlays = this._overlay.getLayers();
        } else if(this._overlay instanceof L.Path){
            overlays.push(this._overlay)
        } else {
            return false;
        }
        var overlayList = L.DomUtil.create('ul', 'leaflet-legend-overlays', this._container);
        overlays.forEach(function(overlay) {
            if(!(overlay instanceof L.Path)) { return; }
            var overlayItem = L.DomUtil.create('li', 'leaflet-legend-overlay', overlayList);

            var overlayName = overlay.feature && overlay.feature.properties && overlay.feature.properties.name || "Overlay"

            var colorBox = L.DomUtil.create('i', '', overlayItem);
            colorBox.style.background = overlay.options.color;
            
            overlayItem.appendChild(document.createTextNode(overlayName));
            
            overlayItems[L.stamp(overlay)] = overlayItem;
        });
        
        this._overlayItems = overlayItems;
        return overlayList;
    },

    getOverlayItems: function() {
        return this._overlayItems;
    },
    
    getOverlayItem: function(overlay) {
        return this._overlayItems && this._overlayItems[L.stamp(overlay)] || false;
    }
});

L.control.overlaylegend = function (layer, options) {
    return new L.Control.OverlayLegend(layer, options);
};