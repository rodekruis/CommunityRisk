'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Visualisation Schema
 */
var VisualisationSchema = new Schema({
    name: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Name', size:'large'},
	    list:true
    },
    description: {
		type: String,
		default: '',
		trim: true,
		form:  {label:'Description', type:'textarea', size:'large', rows:5},
		required: true
	},
    apiUrl: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'CartoDB API url', size:'large'},
    },
    created: {
	    type: Date,
	    form:  {label:'Date created', size:'large'},
    },
    active: {
	    type: Boolean,
	    form:  {label:'Acive', size:'large'},
	    default: false,
    },
    visible: {
	    type: Boolean,
	    form:  {label:'Show when loading map', size:'large'},
	    default: false,
    },
    zindex: {
            type: String,
            trim: true,
            default: '10',
	    required:true,
	    form:  {label:'Z-Index (order)'},
    },
    /*,
    tableName: {
            type: String,
            trim: true,
            default: '',
	    required:false,
	    form:  {label:'Naam tabel', size:'large'},
    },
    tableColumns: {
            type: String,
            trim: true,
	    required:false,
	    form:  {label:'Kolommen uit tabel', size:'large'},
    },
    groups: {
	    type: String,
            trim: true,
	    required:false,
	    form:  {label:'Groepen', size:'large'},
    }*/
});

var Visualisation;

try {
  Visualisation = mongoose.model('Visualisation');
} catch (e) {
  Visualisation = mongoose.model('Visualisation', VisualisationSchema);
}

/**
 * WMS Layer Schema
 */
var WmsLayerSchema = new Schema({
    name: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Name', size:'large'},
	    list:true
    },
    description: {
		type: String,
		default: '',
		trim: true,
		form:  {label:'Description', type:'textarea', size:'large', rows:5},
		required: true
	},
    url: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Tileserver url (WMS)', size:'large'},
    },
    active: {
	    type: Boolean,
	    form:  {label:'Active', size:'large'},
    },
        visible: {
	    type: Boolean,
	    form:  {label:'Show when loading map', size:'large'},
	    default: false,
    },
    zindex: {
            type: String,
            trim: true,
            default: '10',
	    required:true,
	    form:  {label:'Z-Index (order)'},
    },
    layers: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Comma-separated list of WMS layers to show', size:'large'},
    },
    styles: {
            type: String,
            trim: true,
            default: '',
	    form:  {label:'Comma-separated list of WMS styles', size:'large'},
    },
    format: {
            type: String,
            trim: true,
            default: 'image/png',
	    form:  {label:'WMS image format', size:'large'},
    },
    version: {
            type: String,
            trim: true,
            default: '1.1.1',
	    form:  {label:'WMS service version number', size:'large'},
    },
    transparent: {
            type: Boolean,
            default: true,
	    form:  {label:'WMS images transparant', size:'large'},
    },
    opacity: {
            type: String,
	    trim: true,
            default: '1.0',
	    form:  {label:'WMS layer opacity', size:'large'},
    },
    tiled : {
	    type: Boolean,
	    default: true,
	    form: {label:'Is the layer tiled?'}
    },
    featureInfo : {
	    type: Boolean,
	    default: false,
	    form: {label:'Feature info can be retreived'}
    },
    legendOptions: {
            type: String,
	    trim: true,
            default: '',
	    form:  {label:'WMS legend options (json)', size:'large'},
    },    
    crs: {
		type: [{
			type: String,
			enum: ['EPSG3857', 'EPSG4326', 'EPSG3395', 'EPSG28992', 'Simple']
		}],
		default: ['EPSG4326']
	},
});

var WmsLayer;

try {
  var WmsLayer = mongoose.model('WmsLayer');
} catch (e) {
  var WmsLayer = mongoose.model('WmsLayer', WmsLayerSchema);
}

/**
 * WFS Layer Schema
 */
var WfsLayerSchema = new Schema({
    name: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Name', size:'large'},
	    list:true
    },
    description: {
		type: String,
		default: '',
		trim: true,
		form:  {label:'Description', type:'textarea', size:'large', rows:5},
		required: true
	},
    url: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Tileserver url (WFS)', size:'large'},
    },   
    active: {
	    type: Boolean,
	    form:  {label:'Active', size:'large'},
    },
        visible: {
	    type: Boolean,
	    form:  {label:'Show when loading map', size:'large'},
	    default: false,
    },
    zindex: {
            type: String,
            trim: true,
            default: '10',
	    required:true,
	    form:  {label:'Z-Index (volgorde)'},
    },
    featureType: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Comma-separated list of WFS Feature type', size:'large'},
    },
    hoverProperty: {
            type: String,
            trim: true,
            default: '',
	    form:  {label:'GeoJson property that is shown when hovered', size:'large'},
    },
    version: {
            type: String,
            trim: true,
            default: '2.0.0',
	    form:  {label:'WFS service version number', size:'large'},
    },
    transparent: {
            type: Boolean,
            default: true,
	    form:  {label:'WFS images transparant', size:'large'},
    },
    opacity: {
            type: String,
	    trim: true,
            default: '1.0',
	    form:  {label:'WFS layer opacity', size:'large'},
    },
    markerStyle: {
	    type: Schema.Types.ObjectId,
	    ref: 'MarkerStyle',
	    form:  {label:'Marker style'},
	    required: false
    },
    featureStyle: {
	    type: Schema.Types.ObjectId,
	    ref: 'FeatureStyle',
	    form:  {label:'Feature style'},
	    required: false
    },
    crs: {
		type: [{
			type: String,
			enum: ['EPSG3857', 'EPSG4326', 'EPSG3395', 'EPSG28992', 'Simple']
		}],
		default: ['EPSG4326']
	},
});

var WfsLayer;

try {
  var WfsLayer = mongoose.model('WfsLayer');
} catch (e) {
  var WfsLayer = mongoose.model('WfsLayer', WfsLayerSchema);
}

/**
 * Map Schema
 *
 */
var MapSchema = new Schema({
	created: {
		type: Date,
		default: Date.now,
		form: { hidden: true }
	},
	title: {
		type: String,
		default: '',
		trim: true,
		required: true,
		form:  {label:'Name'},
		list:true
	},
	description: {
		type: String,
		default: '',
		trim: true,
		form:  {label:'Description', type:'textarea', size:'large', rows:5},
		required: true
	},
	active: {
		type: Boolean,
		form:  {label:'Active', size:'large'},
	},
	category: {
		type: Schema.Types.ObjectId,
		ref: 'MapCategory'
	},
	isPublic: {
	    type: Boolean,
	    required:true,
	    default: false,
	    form:  {label:'Public map for everyone', size:'large'},
	},
	baseMap: {
		type: Schema.Types.ObjectId,
		ref: 'TileServer',
		form:  {label:'Base map'}
	},
	icon: {
		type: String,
		default: 'glyphicon glyphicon-map-marker',
		trim: true,
		required: true,
		form: {type: 'icon', help: 'Choose bootstrap, font awesome or humanitarian font css class. https://localhost/#!/icons'}
	},
	mapCenter: {
		type: Schema.Types.ObjectId,
		ref: 'MapCenter',
		form:  {label:'Map center'},
		required: true
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	visualisation: {
		type: [VisualisationSchema]
	},
	wmsLayer: {
		type: [WmsLayerSchema]
	},
	wfsLayer: { type: [WfsLayerSchema]
	},

});

// the model is registered as AMap instead of Map. The Map object is dedicated to the framework itself
var AMap;

try {
  AMap = mongoose.model('AMap');
} catch (e) {
  AMap = mongoose.model('AMap', MapSchema);
}
