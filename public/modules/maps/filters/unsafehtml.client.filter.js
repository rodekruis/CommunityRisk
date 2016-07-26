'use strict';

angular.module('maps')

.filter('unsafehtml', ['$sce',
	function($sce) {
		return function(input) {
			return $sce.trustAsHtml(input);
		};
	}
])

.filter('unsafesource', ['$sce',
	function($sce) {
		return function(input) {
			return $sce.trustAsResourceUrl(input);
		};
	}
]);



