L.FeatureProperties = L.Class.extend({
    getProperties: function() {
        return (this.feature && this.feature.properties) || {}
    },
    
    setProperties: function(properties) {
        if(!this._isFeature()) { 
            this._initFeature()
        }
        
        L.extend(this.feature.properties, properties)
    },
    
    _isFeature: function() {
        return false
    },
    
    _initFeature: function() {
        if(!this.feature) {
            L.extend(this, {feature: {} })
        }
        
        if(!this.feature.type || this.feature.type !== 'Feature') {
            L.extend(this.feature, {type: 'Feature' })
        }

        if(!this.feature.properties) {
            L.extend(this.feature, {properties: {} })
        }
    }
});

L.extend(L.Mixin, {FeatureProperties: L.FeatureProperties.prototype})

L.Layer.include(L.Mixin.FeatureProperties)