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
var MapBoundsSchema = new Schema({
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
    latSW: { 
            type: String,
            trim: true,
            default: '50.800974',
	    required:true,
	    form:  {label:'Latitude  South-West point'},
    },
    lngSW: {
            type: String,
            trim: true,
            default: '2.638917',
	    required:true,
	    form:  {label:'Longitude South-West point'},
    },
    latNE: {
            type: String,
            trim: true,
            default: '7.450928',
	    required:true,
	    form:  {label:'Latitude North-East point'},
    },
    lngNE: {
            type: String,
            trim: true,
            default: '5.1060363',
	    required:true,
	    form:  {label:'Longitude North-East point'},
    },
});

var MapBounds;

try {
  var MapBounds = mongoose.model('MapBounds');
} catch (e) {
  MapBounds = mongoose.model('MapBounds', MapBoundsSchema);
}