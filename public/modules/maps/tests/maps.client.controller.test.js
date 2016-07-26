'use strict';

(function() {
	// Maps Controller Spec
	describe('MapsController', function() {
		// Initialize global variables
		var MapsController,
			scope,
			$httpBackend,
			$stateParams,
			$location;

		// The $resource service augments the response object with methods for updating and deleting the resource.
		// If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
		// the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
		// When the toEqualData matcher compares two objects, it takes only object properties into
		// account and ignores methods.
		beforeEach(function() {
			jasmine.addMatchers({
				toEqualData: function(util, customEqualityTesters) {
					return {
						compare: function(actual, expected) {
							return {
								pass: angular.equals(actual, expected)
							};
						}
					};
				}
			});
		});

		// Then we can start by loading the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
		// This allows us to inject a service but then attach it to a variable
		// with the same name as the service.
		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {
			// Set a new global scope
			scope = $rootScope.$new();

			// Point global variables to injected services
			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$location = _$location_;

			// Initialize the Maps controller.
			MapsController = $controller('MapsController', {
				$scope: scope
			});
		}));
		/*
		it('$scope.find() should create an array with at least one map object fetched from XHR', inject(function(Maps) {
			// Create sample map using the Maps service
			var sampleMap = new Maps({
				title: 'An Map about MEAN',
				content: 'MEAN rocks!'
			});

			// Create a sample maps array that includes the new map
			var sampleMaps = [sampleMap];

			// Set GET response
			$httpBackend.expectGET('maps').respond(sampleMaps);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.maps).toEqualData(sampleMaps);
		}));

		it('$scope.findOne() should create an array with one map object fetched from XHR using a mapId URL parameter', inject(function(Maps) {
			// Define a sample map object
			var sampleMap = new Maps({
				title: 'An Map about MEAN',
				content: 'MEAN rocks!'
			});

			// Set the URL parameter
			$stateParams.mapId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/maps\/([0-9a-fA-F]{24})$/).respond(sampleMap);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.map).toEqualData(sampleMap);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Maps) {
			// Create a sample map object
			var sampleMapPostData = new Maps({
				title: 'An Map about MEAN',
				content: 'MEAN rocks!'
			});

			// Create a sample map response
			var sampleMapResponse = new Maps({
				_id: '525cf20451979dea2c000001',
				title: 'An Map about MEAN',
				content: 'MEAN rocks!'
			});

			// Fixture mock form input values
			scope.title = 'An Map about MEAN';
			scope.content = 'MEAN rocks!';

			// Set POST response
			$httpBackend.expectPOST('maps', sampleMapPostData).respond(sampleMapResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.title).toEqual('');
			expect(scope.content).toEqual('');

			// Test URL redirection after the map was created
			expect($location.path()).toBe('/maps/' + sampleMapResponse._id);
		}));

		it('$scope.update() should update a valid map', inject(function(Maps) {
			// Define a sample map put data
			var sampleMapPutData = new Maps({
				_id: '525cf20451979dea2c000001',
				title: 'An Map about MEAN',
				content: 'MEAN Rocks!'
			});

			// Mock map in scope
			scope.map = sampleMapPutData;

			// Set PUT response
			$httpBackend.expectPUT(/maps\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/maps/' + sampleMapPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid mapId and remove the map from the scope', inject(function(Maps) {
			// Create new map object
			var sampleMap = new Maps({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new maps array and include the map
			scope.maps = [sampleMap];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/maps\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleMap);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.maps.length).toBe(0);
		}));
		
		*/
	});
}());