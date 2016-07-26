'use strict';

angular.module('forms').controller('FormsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Forms',
	function($scope, $stateParams, $location, Authentication, Forms) { //, 
		$scope.authentication = Authentication;
		
		$scope.find = function() {
			$scope.forms = Forms.query();
		};
	}
]);