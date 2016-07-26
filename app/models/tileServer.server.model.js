'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Visualisation Schema
 */
var TileServerSchema = new Schema({
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
	    form:  {label:'Tileserver url (zxy)', size:'large'},
    },
    active: {
	    type: Boolean,
	    form:  {label:'Actief', size:'large'},
    }
});

var TileServer;

try {
  TileServer = mongoose.model('TileServer');
} catch (e) {
  TileServer = mongoose.model('TileServer', TileServerSchema);
}