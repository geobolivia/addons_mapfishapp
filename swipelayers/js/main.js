Ext.namespace("GEOR.Addons");

GEOR.Addons.SwipeLayers = function(map, options) {
    this.map = map;
    this.options = options;
    this.control = null;
    this.item = null;
};

// If required, may extend or compose with Ext.util.Observable
GEOR.Addons.SwipeLayers.prototype = {
    mmap: null,
    mapFront: null,
    mapBack: null,
    pFront: null,
    pBack: null,
    layers: null,
    
    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
        var lang = OpenLayers.Lang.getCode();
        /*var item = new Ext.menu.CheckItem({
                text: record.get("title")[lang],
                qtip: record.get("description")[lang],
                //iconCls: "addon-magnifier",
                checked: false,
                listeners: {
                    "checkchange": this.onCheckchange,
                    scope: this
                }
            });*/
        this.item = new Ext.menu.Item({
            text: record.get("title")[lang],
            iconCls: 'icon',
            qtip: record.get("description")[lang],
            handler: this.showWindow,
            scope: this
        });
        mmap = this.map;
        mapFront = this.createMap();
        mapBack = this.createMap();
        
        pFront = this.createMapPanel('mapFront', mapFront);
        pBack = this.createMapPanel('mapBack', mapBack);
        
        this.layers = this.getLayers();
        //this.item = item;
        return this.item;
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        this.control && this.control.destroy();
        this.control = null;
        this.map = null;
    },
    
    showWindow: function(){
        if (!this.win) {
            this.cbx = new Ext.form.Checkbox({
                checked: true,
                boxLabel: OpenLayers.i18n("sync map extent")
            });
            this.win = new Ext.Window({
                layout: 'fit',
                width: 600,
                height: 450,
                resizable: false,
                iconCls: 'icon',
                closeAction: 'hide',
                plain: true,
                layout:'border',
                items: [{
                region: 'north',
                height: 45,
                items: [this.createForm()]
            },{
                region: 'center',
                height: 300,
                items: [pFront, pBack]
            },{
                region: 'south',
                height: 30,
                items: [
                    //new Ext.slider.MultiSlider({
                    new Ext.Slider({
                        width: 550,
                        value: 50,
                        minValue: 0,
                        maxValue: 100,
                        listeners: {
                            change: function(slider, e) {
                                // get the slider's thumbs' values
                                var vals = slider.getValues();
                                var mapBack = Ext.get('mapBack');
                                var mapFront = Ext.get('mapFront');
                                var sizeBack = mapBack.getSize();
                                
                                var w = sizeBack.width * vals / 100;
                                mapFront.setWidth(w);
                            }
                        }
                    })
                ],
                margins: '0 0 0 30'
                }, {
                    region: 'west',
                    width: 30,
                    height: 100,
                    items: [
                        new Ext.Slider({
                            height: 338,
                            vertical: true,
                            value: 50,
                            minValue: 0,
                            maxValue: 100,
                            listeners: {
                                change: function(slider, e) {
                                    // get the slider's thumbs' values
                                    var vals = slider.getValues();
                                    var mapBack = Ext.get('mapBack');
                                    var mapFront = Ext.get('mapFront');
                                    var sizeBack = mapBack.getSize();
                                    var h = sizeBack.height - (sizeBack.height * vals / 100);
                                    mapFront.setHeight(h);
                                }
                            }
                        })
                    ],
                    margins: '0 0 0 0'
                }]
                /*buttons: [{
                 text: 'Close',
                 handler: function(){
                 win.hide();
                 }
                 }]*/
            });
        }
        this.update();
        this.win.show();
    },
	
    createForm: function() {
        return new Ext.FormPanel({
            labelWidth: 40, // label settings here cascade unless overridden
            labelAlign: 'left',
            width: '100%',
            frame: true,
            bodyStyle: 'padding:5px 5px 0',
            items: [{
                layout: 'column',
                items: [{
                    columnWidth: .5,
                    layout: 'form',
                    items: [this.createComboBox('cbboxFront','Front', this.layers)]
                }, {
                    columnWidth: .5,
                    layout: 'form',
                    items: [this.createComboBox('cbboxBack','Back',this.layers)]
                }]
            }]
        });
    },
    
    getLayers: function(){
        var layers = new Array();
        var layer = null;
        var layersVisible = this.map.layers;

        for(var i=layersVisible.length -1 ; i>= 0 ; i--){
            layer = this.map.layers[i];
            if (layer.CLASS_NAME === "OpenLayers.Layer.WMS" && layer.visibility) {
                layers.push([layer.id,layer.name]);
            }
        }

        return new Ext.data.ArrayStore({
            fields: ['abbr','layer'],
            data : layers 
        });
    },
            
    createComboBox: function(id, field, store){
        var combo = new Ext.form.ComboBox({
            id: id,
            store: store,
            displayField:'layer',
            editable:false,
            mode: 'local',
            triggerAction: 'all',
            fieldLabel: field,
            emptyText:'Select a layer...',  
            width: 200,
            onSelect: function(record) {
                var i, newLayer;                
                if(this.id == "cbboxFront"){
                    for(i=mapFront.layers.length -1 ; i >= 0 ; i--){
                        mapFront.removeLayer(mapFront.layers[i]);
                    }
                    newLayer = mmap.getLayer(record.data.abbr).clone();
                    newLayer.isBaseLayer=true;
                    mapFront.addLayer(newLayer);
                    mapFront.zoomToScale(mmap.getScale());
                } else if(this.id == "cbboxBack") {
                    for(i=mapBack.layers.length -1 ; i >= 0 ; i--){
                        mapBack.removeLayer(mapBack.layers[i]);
                    }
                    newLayer = mmap.getLayer(record.data.abbr).clone();
                    newLayer.isBaseLayer=true;
                    mapBack.addLayer(newLayer);
                    mapBack.zoomToScale(mmap.getScale());
                }
                this.setValue(record.data.layer);
                this.collapse();
            }
        });
        return combo;
    },
    
    createMap: function(){
        var map = new OpenLayers.Map({
            projection: this.map.projection,
            units: this.map.units,
            scales: this.map.scales
        });
        //map.addControl(new OpenLayers.Control.LayerSwitcher());
        return map;
    },
            
    createMapPanel: function(id, map){
        return new GeoExt.MapPanel({
            id: id,
            region: "center",
            width: '100%',
            height: 340,
            map: map,
            center: this.map.center,
            zoom: 6
        });
    },
    
    removeLayers: function(map){
        if(map){
            for(var i=map.layers.length -1 ; i >= 0 ; i--){
                map.removeLayer(map.layers[i]);
            }
        }
    },
    
    update: function(){
       
    }
};