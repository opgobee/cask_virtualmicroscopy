var RulerAction = L.ToolbarAction.extend({
    options: {
        toolbarIcon: {
            html: '<i class="material-icons">straighten</i>',
            tooltip: 'Measure',
            className: 'leaflet-control-ruler-measure'
        },
        
        subToolbar: new (L.Toolbar.extend({}))({
            actions: [CancelAction]
        })
    },
    
    initialize: function(map, options) {
        L.ToolbarAction.prototype.initialize.call(this, options);
        
        this._map = map;
        
        this._rulerHandler = new L.Handler.Ruler(map, this.options)
        
        this._rulerHandler.on('ruler:deleted', this.disable, this)
    },
    
    addHooks: function () {
        if(this._rulerHandler.enabled())
        {
            this._rulerHandler.disable();
        }
        this._rulerHandler.enable();
    },
    
    removeHooks: function() {
        this._rulerHandler.disable();
    },
    
    cancelAction: function() {
        this.disable()
    }
    
});