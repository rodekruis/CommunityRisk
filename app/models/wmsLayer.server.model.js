'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * WMS Layer Schema
 */
/*var WmsLayerSchema = new Schema({
    name: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Naam', size:'large'},
	    list:true
    },
    description: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Beschrijving', size:'large'},
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
	    form:  {label:'Actief', size:'large'},
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
    zIndex: {
            type: String,
	    trim: true,
            default: '50',
	    form:  {label:'WMS layer zIndex on map', size:'large'},
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
			enum: ['EPSG3857', 'EPSG4326', 'EPSG3395', 'Simple']
		}],
		default: ['EPSG3857']
	},
});

var WmsLayer;

try {
  var WmsLayer = mongoose.model('WmsLayer');
} catch (e) {
  var WmsLayer = mongoose.model('WmsLayer', WmsLayerSchema);
}*/