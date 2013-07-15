OpenLayers.Control.SwipeLayers = OpenLayers.Class(OpenLayers.Control, {
    CLASS_NAME: 'OpenLayers.Control.Swipelayers',
            
    destroy: function () {
        // if (this.map) is monkey patching by fvanderbiest
        if (this.map) {
            this.map.events.un({
                move: this.update,
                changebaselayer: this.changelayer,
                scope: this
            });

            if (this.followCursor) {
                this.map.events.un({
                    zoomend: this.update,
                    mousemove: this.updateFromCursor,
                    scope: this
                });
            }
        }
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
        // monkey patching (fvanderbiest)
        // see https://github.com/fredj/openlayers-magnifier/issues/2
        if (this.mmap) {
            this.mmap.destroy();
        }
    }
});