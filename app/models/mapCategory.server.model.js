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
var MapCategorySchema = new Schema({
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
    }
});

var MapCategory;

try {
  var MapCategory = mongoose.model('MapCategory');
} catch (e) {
  MapCategory = mongoose.model('MapCategory', MapCategorySchema);
}