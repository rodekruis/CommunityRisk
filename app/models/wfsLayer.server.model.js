'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * WFS Layer Schema
 */
/*var WfsLayerSchema = new Schema({
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
	    form:  {label:'Tileserver url (WFS)', size:'large'},
    },
    active: {
	    type: Boolean,
	    form:  {label:'Actief', size:'large'},
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
			enum: ['EPSG3857', 'EPSG4326', 'EPSG3395', 'Simple']
		}],
		default: ['EPSG3857']
	},
});

var WfsLayer;

try {
  var WfsLayer = mongoose.model('WfsLayer');
} catch (e) {
  var WfsLayer = mongoose.model('WfsLayer', WfsLayerSchema);
}
*/