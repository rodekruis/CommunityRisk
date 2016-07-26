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
var MarkerStyleSchema = new Schema({
    name: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Name'},
	    list:true
    },
    radius: { 
            type: Number,
            trim: true,
            default: 8,
	    required:true,
	    form:  {label:'Radius'},
    },
    color: {
            type: String,
            trim: true,
            default: 'white',
	    required:true,
	    form:  {label:'Font color'},
    },
    opacity: { 
            type: Number,
            trim: true,
            default: 1.0,
	    required:true,
	    form:  {label:'Font opacity'},
    },
    dashArray: {
            type: String,
            trim: true,
            default: '3',
	    required:true,
	    form:  {label:'Distance between dashes'},
    },
    fillColor: { 
            type: String,
            trim: true,
            default: '#666666',
	    required:true,
	    form:  {label:'Background color'},
    },
    fillOpacity: { 
            type: Number,
            trim: true,
            default: 0.3,
	    required:true,
	    form:  {label:'Background opacity'},
    }
});

var MarkerStyleSchema;

try {
  var MarkerStyle = mongoose.model('MarkerStyle');
} catch (e) {
  MarkerStyle = mongoose.model('MarkerStyle', MarkerStyleSchema);
}