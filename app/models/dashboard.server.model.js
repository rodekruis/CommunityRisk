'use strict';
var util = require('util');

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

function BaseSchema(){

	Schema.apply(this, arguments);  
	
	this.add( 
	{
		sourceId: {
			type: String,
			trim: true,
			default: '',
			required:true,
			form:  {label:'Unique Source Identifier', size:'large', order: 1}
		},
		name: {
			type: String,
			trim: true,
			default: '',
			required:true,
			form:  {label:'Name', size:'large', order: 2}
		},
		description: {
			type: String,
			default: '',
			trim: true,
			form:  {label:'Description', type:'textarea', size:'large', rows:5, order: 3},
			required: false
		},
		isPublic: {
			type: Boolean,
			form:  {label:'Public dataset?'},
			default: false
		},
		isActive: {
			type: Boolean,
			form:  {label:'Source Active?'},
			default: true			
		}
	});
}

util.inherits(BaseSchema, Schema);

var SourceSchema = new BaseSchema();

SourceSchema.virtual('type').get(function () { return this.__t; });  

var FileUrlSourceSchema = new BaseSchema({
    format: {
		 type: String, 
		 default: 'GeoJSON', 
		 enum: ['GeoJSON', 'CSV'],
		 form:  {label:'File format', size:'large', order: 4}
	},
	url: {
		type: String,
		trim: true,
		default: '',
		required:true,
		form:  {label:'URL to CSV', size:'large', order: 5}
    }
});

var FileLocalSourceSchema = new BaseSchema({
    file: {
        type: String,
        trim: true,
        default: '',
	    required:true,
		form:  {help:'name of the file including path and extension', label:'File identifier', size:'large', order: 4}		
    },
	format: {
		 type: String, 
		 default: 'GeoJSON', 
		 enum: ['GeoJSON', 'CSV'],
		 form:  {label:'File Format', size:'large', order: 5}
	}
});

var GoogleSpreadsheetSourceSchema = new BaseSchema({
	key: {
		type: String,
		trim: true,
		default: '',
		required:true,
		form:  {label:'Spreadsheet unique key', size:'large', order: 4}
    },
	columns: {
		type: String,
		required:true,
		form:  {label:'Spreadsheet columns to include (comma separated)', size:'large', order: 5}

    }
});

var DropboxSourceSchema = new BaseSchema({
    file: {
        type: String,
        trim: true,
        default: '',
	    required:true,
		form:  {label:'File identifier', size:'large', order: 4}
		
    }
});

var CartoDBSourceSchema = new BaseSchema({
    query: {
        type: String,
        trim: true,
        default: '',
	    required:true,
		form:  {label:'CartDB SQL Query', size:'large', order: 4}
    },
	format: {
		 type: String, 
		 default: 'GeoJSON', 
		 enum: ['GeoJSON', 'Array'],
		 form:  {label:'File Format', size:'large', order: 5}
	}
});


var Source;

try {
  Source = mongoose.model('Source');
} catch (e) {
  Source = mongoose.model('Source', SourceSchema);
}

Source.discriminator('FileUrlSource', FileUrlSourceSchema);  
Source.discriminator('FileLocalSource', FileLocalSourceSchema);
Source.discriminator('DropboxSource', DropboxSourceSchema);
Source.discriminator('GoogleSpreadsheetSource', GoogleSpreadsheetSourceSchema);
Source.discriminator('CartoDBSource', CartoDBSourceSchema);

/**
 * Dashboard Schema
 */
var DashboardSchema = new Schema({
	name: {
		type: String,
		default: '',
		trim: true,
		form:  {label:'Name', size:'large'},
		required: 'Name cannot be blank'		
	},
	description: {
		type: String,
		default: '',
		trim: true,
		form:  {label:'Description', type:'textarea', size:'large', rows:5},
		required: 'Title cannot be blank'
	},
	url: {
		type: String,
		default: '',
		trim: true,
		form:  {label:'url', size:'large'},
		required: 'Url to template file needs to be given'
	},
	isPublic: {
	    type: Boolean,
		form:  {label:'Public for everyone'},
	    default: false
	    
	},
	roles: {
		type: [{
			type: String,
			enum: ['user', 'admin']
		}],
		default: ['user']
	},
	FileLocalSources: {
		type: [FileLocalSourceSchema]
	},
	DropboxSources: {
		type: [DropboxSourceSchema]
	},
	CartoDBSources: {
		type: [CartoDBSourceSchema]
	},
	FileUrlSources: {
		type: [FileUrlSourceSchema]
	},
	GoogleSpreadsheetSources: {
		type: [GoogleSpreadsheetSourceSchema]
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
	
});

mongoose.model('Dashboard', DashboardSchema);