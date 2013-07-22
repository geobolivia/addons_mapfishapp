Ext.namespace("GEOR.Addons");

GEOR.Addons.InsertCSV = function(map, options) {
    this.map = map;
    this.options = options;
    this.layer = null;
};

GEOR.Addons.InsertCSV.prototype = {
    
    item: null,
    stores: {},
    layer: null,
    win: null,
    jsonFormat: null,
    geojsonFormat: null,
    
    //for the marker
    tamanio: 0,				// Icon size.
    icono:null,				// The marker icon.
    offset: 0,
    //for the marker
    
    _insertLayer: null,

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
        var lang = OpenLayers.Lang.getCode();
       
        this.jsonFormat = new OpenLayers.Format.JSON();
        this.geojsonFormat = new OpenLayers.Format.GeoJSON();
        
        _insertLayer = new OpenLayers.Layer.Markers("addon_Insert_csv", {
            displayInLayerSwitcher: false
        });
        
               
        this.layer= _insertLayer;
        
        this.map.addLayer(this.layer);
        
        this.item = new Ext.menu.Item({
            text: record.get("title")[lang],
            iconCls: 'insertcsv-icon',
            qtip: record.get("description")[lang],
            handler: this.showWindow,
            scope: this
        });
        return this.item;
    },

    showWindow: function() {
        //<-------------- Create the Form
        var myForm = new Ext.form.FormPanel({
                width: 370,
                html: "<input id='inputFile' type='file' name='uploaded'/>",
                buttons: [{   
                          //<---------------------------------------------- 
                          text: 'Add',
                          handler: function(){
                              poneMarkador();         
                          }
                          //<---------------------------------------------->
                      }],
                listeners: {
                    afterrender: function() {
                        var itemFile = document.getElementById("inputFile");            
                        itemFile.addEventListener('change', readSingleFile, false);
                    }
                }
            });
        //-------------------------------------------------------------------------
        function nroLin(miCadena){
            var nroLineas = 0;
            for(var k = 0; k<= miCadena.length; k++){
                if(miCadena.charAt(k) === "\n"){
                    nroLineas++;
                }
            }
            return nroLineas;
        };
        
        function buscaDato(lin){
            var dato = "";
            var indice = 0;
            var caracter = lin.charAt(indice);
            while (caracter !== ";"){
                dato = dato + (lin.charAt(indice));
                caracter = lin.charAt(indice);
                indice = indice + 1;
            }
            return parseFloat(dato);
        }
        
        function poneMarkador(){
            var myNumero=nroLin(myFile);
            
            tamanio = new OpenLayers.Size(21, 25);
            offset = new OpenLayers.Pixel(-(tamanio.w / 2), -tamanio.h);
            icono = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', tamanio, offset);
            
            var indice = 0;
            var lat=0;
            var lon = 0;
            for(var i = 0; i< myNumero; i++){
                
                var linea = "";
                var caracter = myFile.charAt(indice);
                
                while (caracter !== "\n"){
                    
                    linea = linea + (myFile.charAt(indice));
                    caracter = myFile.charAt(indice);
                    indice = indice +1;
                }
                
                //<---------- Manejar la linea
                lat = buscaDato(linea);
                lon = buscaDato( linea.substring((linea.indexOf(';') + 1) , (linea.length)) );

                if (i !== 0) {
                    if (i === 1) {
                        _insertLayer.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(lat, lon).transform(
                                new OpenLayers.Projection("EPSG:4326"), 					// Transformar from WGS 1984
                                new OpenLayers.Projection("EPSG:900913") 						// a Spherical Mercator Projection.
                        ), icono));
                    }else{
                        _insertLayer.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(lat, lon).transform(
                            new OpenLayers.Projection("EPSG:4326"), 					// Transformar from WGS 1984
                            new OpenLayers.Projection("EPSG:900913") 						// a Spherical Mercator Projection.
                         ), icono.clone()));
                    }
                }
                
                
            }
            
            this.layer = _insertLayer;
            alert("Correct Insersion");
        }
        //-------------------------------------------------------------------------
        
        if (!this.win) {
            this.win = new Ext.Window({
                closable: true,
                closeAction: 'hide',
                width: 390,
                height:110,
                title: OpenLayers.i18n("addon_insertcsv_popup_title"),
                border: false,
                buttonAlign: 'left',
                layout: 'fit',
                //
                items : [{
                            xtype: 'label',
                            forId: 'idlabel',
                            text: "Choose The File: "
                          },
                            myForm
                         ],
                listeners: {
                    "hide": function() {
                    },
                    scope: this
                }
            });
        }
        this.win.show();
    },
        
            
    destroy: function() {
        this.win.hide();
        this.layer = null;
        this.map = null;
    }
};

function readSingleFile(evt) {
    var f = evt.target.files[0];  
    
    if (f) {
        var r = new FileReader();
        r.onload = function(e) { 
            var contents = e.target.result;
            myFile = contents;
        }
        r.readAsText(f);
    } else { 
        alert("Failed to load file");
    }
}

var myFile="";