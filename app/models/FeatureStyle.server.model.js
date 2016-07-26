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
var FeatureStyleSchema = new Schema({
    name: {
            type: String,
            trim: true,
            default: '',
	    required:true,
	    form:  {label:'Name'},
	    list:true
    },
    weight: { 
            type: Number,
            trim: true,
            default: 2,
	    required:true,
	    form:  {label:'Font weight'},
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

var FeatureStyle;

try {
  FeatureStyle = mongoose.model('FeatureStyle');
} catch (e) {
  FeatureStyle = mongoose.model('FeatureStyle', FeatureStyleSchema);
}