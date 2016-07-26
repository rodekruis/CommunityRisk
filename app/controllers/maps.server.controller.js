'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	AMap = mongoose.model('AMap'),
	_ = require('lodash');

/**
 * Get the error message from error object
 */
var getErrorMessage = function(err) {
	var message = '';

	if (err.code) {
		switch (err.code) {
			case 11000:
			case 11001:
				message = 'Map already exists';
				break;
			default:
				message = 'Something went wrong';
		}
	} else {
		for (var errName in err.errors) {
			if (err.errors[errName].message) message = err.errors[errName].message;
		}
	}

	return message;
};

/**
 * Create a Map
 */
exports.create = function(req, res) {
	var map = new AMap(req.body);
	map.user = req.user;

	map.save(function(err) {
		if (err) {
			return res.send(400, {
				message: getErrorMessage(err)
			});
		} else {
			res.jsonp(map);
		}
	});
};

/**
 * Show the current map
 */
exports.read = function(req, res) {
	res.jsonp(req.map);
};

/**
 * Update a map
 */
exports.update = function(req, res) {
	var map = req.map;

	map = _.extend(map, req.body);

	map.save(function(err) {
		if (err) {
			return res.send(400, {
				message: getErrorMessage(err)
			});
		} else {
			res.jsonp(map);
		}
	});
};

/**
 * Delete an map
 */
exports.delete = function(req, res) {
	var map = req.map;

	map.remove(function(err) {
		if (err) {
			return res.send(400, {
				message: getErrorMessage(err)
			});
		} else {
			res.jsonp(map);
		}
	});
};

/**
 * List of AMaps
 */
exports.list = function(req, res) {
	
	// If user is not logged in, add criteria for selecting public maps only
	var criteria = '';
	if (typeof(req.user) === 'undefined') {
		criteria = { 'isPublic': true} ;
	}
	
	AMap.find(criteria).sort('-created')
		.populate('user', 'displayName')
		.populate('baseMap')
		.populate('mapBounds')
		.populate('mapCenter')
		.populate('category')
		.exec(function(err, maps) {
		if (err) {
			return res.send(400, {
				message: getErrorMessage(err)
			});
		} else {
			res.jsonp(maps);
		}
	});
	
};

/**
 * AMap middleware
 */
exports.mapByID = function(req, res, next, id) {
	
	// If user is not logged in, add criteria for selecting public maps only
	var criteria = {'_id': id};
	if (typeof(req.user) === 'undefined') {
		criteria = { '_id': id, 'isPublic': true} ;
	}
	
	AMap.findOne(criteria)
		.populate('user', 'displayName')
		.populate('baseMap')
		.populate('mapBounds')
		.populate('mapCenter')
		.exec(function(err, doc){
			
			var options = {
				path: 'wfsLayer.markerStyle',
				model: 'MarkerStyle'
		        };
    
			if (err) return next(err);
			if (!doc) return res.send(400, { message: 'Failed to load map: ' + id });
			
			
			AMap.populate(doc, options, 
			      function(err, mapWithMarkerStyle){
					if (err) return res.json(500); //eturn next(err);
					if (!mapWithMarkerStyle) return res.send(400, { message: 'Failed to load wfsLayer: ' + doc._id });//return next(new Error('Failed to load map ' + id));
					
					var options = {
						path: 'wfsLayer.featureStyle',
						model: 'FeatureStyle'
					};
		    
					if (err) return next(err);
					if (!mapWithMarkerStyle) return res.send(400, { message: 'Failed to load map: ' + id });
					
					
					AMap.populate(mapWithMarkerStyle, options, 
					      function(err, mapWithFeatureStyle){
							if (err) return res.json(500); //return next(err);
							if (!mapWithFeatureStyle) return res.send(400, { message: 'Failed to load wfsLayer: ' + doc._id });//return next(new Error('Failed to load map ' + id));
							req.map = mapWithFeatureStyle;
							next();
					      }
					); 
			      }
			);     
		});
		/*.exec(function(err, map) {
			if (err) return next(err);
			if (!map) return res.send(400, { message: 'Failed to load map: ' + id });//return next(new Error('Failed to load map ' + id));
			req.map = map;
			next();
		});*/
};

/**
 * Map authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.map.user.id !== req.user.id) {
		return res.send(403, {
			message: 'User is not authorized'
		});
	}
	next();
};

