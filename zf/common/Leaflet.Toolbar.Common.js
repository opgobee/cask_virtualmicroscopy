var DoneAction = L.ToolbarAction.extend({
    options: {
        toolbarIcon: {
            html: '<i class="material-icons">done</i>',
            tooltip: 'Done',
        },
    },
    
    addHooks: function () {
        if(!this.toolbar.parentToolbar || !this.toolbar.parentToolbar._active){ return; }
        
        if(this.toolbar.parentToolbar._active.doneAction) {
            this.toolbar.parentToolbar._active.doneAction()
        }
    }
});

var CancelAction = L.ToolbarAction.extend({
    options: {
        toolbarIcon: {
            html: '<i class="material-icons">cancel</i>',
            tooltip: 'Cancel',
        },
    },
    
    addHooks: function () {
        if(!this.toolbar.parentToolbar || !this.toolbar.parentToolbar._active){ return; }
        
        if(this.toolbar.parentToolbar._active.cancelAction) {
            this.toolbar.parentToolbar._active.cancelAction()
        }
    }
});