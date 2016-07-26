/**
 * The map center objects specifies a map location where the map can be centered on
 *
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * MapCenter Schema
 */
var MapCenterSchema = new Schema({
    name: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Naam'},
	    list:true
    },
    description: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Beschrijving'},
    },
    lat: { 
            type: String,
            trim: true,
            default: '50.800974',
	    required:true,
	    form:  {label:'Latitude'},
    },
    lng: {
            type: String,
            trim: true,
            default: '2.638917',
	    required:true,
	    form:  {label:'Longitude'},
    },
    zoom: {
            type: String,
            trim: true,
            default: '9',
	    required:true,
	    form:  {label:'Zoom level'},
    },
});

var MapCenter;

try {
  var MapCenter = mongoose.model('MapCenter');
} catch (e) {
  MapCenter = mongoose.model('MapCenter', MapCenterSchema);
}