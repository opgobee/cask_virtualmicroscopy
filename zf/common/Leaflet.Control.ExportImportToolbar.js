var ExportShapes = L.ToolbarAction.extend({
            options: {
                toolbarIcon: {
                    html: 'file_upload',
                    tooltip: 'Annotate a structure',
                    className: 'material-icons'
                }
            },
            addHooks: function () {
                map.setView([-0.00035653427200000004, 0.001317843968], 3)
            }
        });

var ImportShapes = L.ToolbarAction.extend({
            options: {
                toolbarIcon: {
                    html: 'file_download',
                    tooltip: 'Annotate a structure',
                    className: 'material-icons'
                }
            },
            addHooks: function () {
                map.setView([-0.00035653427200000004, 0.001317843968], 3)
            }
        });
        
L.ExportImportToolbar = L.Toolbar.Control.extend({
    options: {
        position: 'topleft',
        actions: [
              ExportShapes,
              ImportShapes
              //Add shape
              // Export shapes
              // Import Shapes
        ],
        className: '' // Style the toolbar with Leaflet.draw's custom CSS
    }
});
    
L.exportimporttoolbar = function (options) {
	return new L.ExportImportToolbar(options);
};