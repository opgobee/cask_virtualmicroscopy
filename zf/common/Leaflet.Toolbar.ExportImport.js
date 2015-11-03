var ShowLink = L.ToolbarAction.extend({
    options: {
        toolbarIcon: {
            html: '<input class="leaflet-label-input" type="text">',
            className: 'action-text-field'
        },
    },
    
    initialize: function(map, options, parentAction) {
     //   console.log(map, options)
        L.ToolbarAction.prototype.initialize.call(this, options);
        this._map = map;
        this._featureLayer = this.options.layer
        this._storageController = this.options.storage
        
        parentAction.registerShowHook(L.bind(this.onShow, this))
    },
    
    _getInput: function() {
        if(!this._inputField){
            this._inputField = this._icon.getElementsByTagName('input')[0]
        }
        return this._inputField;
    },
    
    onShow: function(caller) {
      
        var inputEle = this._getInput();
        
        inputEle.value = "Loading.."
        inputEle.disabled = true;
        
        this._storageController.save(this._featureLayer,L.bind(this.onLink,this));
    },
    
    onLink: function(storageID) {
        var inputEle = this._getInput()
        
        inputEle.value = this._getLink(storageID)
        inputEle.disabled = false;
        inputEle.focus();
        inputEle.setSelectionRange(0, inputEle.value.length);
    },
    
    _getLink: function (dataValue) {
        var url = window.location || document.location;
        var searchParams = L.Util.parseParamString(url.search)
        var newSearch = L.Util.getParamString(L.extend(searchParams, {data: dataValue} ))
        
        return url.origin + url.pathname + newSearch + url.hash;
    },
    
    addHooks: function () {
       this.disable()
    },
    
    removeHooks: function() {
        this.toolbar.remove()
    }
});

var ExportShapes = L.ToolbarAction.extend({
    options: {
        toolbarIcon: {
            html: '<i class="material-icons">link</i>',
            tooltip: 'Export shapes',
        },
        
        subToolbar: new (L.Toolbar.extend({}))({
            actions: [ShowLink,DoneAction]
        }),
    },
    
    initialize: function(map, options) {
        L.ToolbarAction.prototype.initialize.call(this, options);
        this._map = map;
        this._showHooks = []
    },

    registerShowHook: function(fn) {
        this._showHooks.push(fn);
    },

    addHooks: function () {
        for(hook in this._showHooks) {
            this._showHooks[hook](this)
        }      
    },
    
    doneAction: function() {
        this.disable()
    },
})

var ImportShapes = L.ToolbarAction.extend({
    options: {
        toolbarIcon: {
            html: '<i class="material-icons">done</i>',
            tooltip: 'Done editing',
        },
    },
    
    initialize: function(map, options) {
        L.ToolbarAction.prototype.initialize.call(this, options);
        this._map = map;
        this._featureLayer = this.options.feature
        this._storageController = this.options.storage
    },

    addHooks: function () {
        this._storageController.load(storageID, L.bind(function(storageID) {
            console.log(geoJSON)
            this.disable()
        }, this));
        
    },
    
    removeHooks: function() {
        this.toolbar.remove()
    }
})