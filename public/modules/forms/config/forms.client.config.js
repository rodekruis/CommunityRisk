'use strict';

/**
 * Only allow admin to see this module
 */
angular.module('dashboards').run(['Menus', 'gettextCatalog',
	function(Menus, gettextCatalog) {
		// Translate menu item
		var title = gettextCatalog.getString('Data management');
		
		// Set top bar menu items
		Menus.addMenuItem('topbar', title, 'forms', 'forms', true/*, ['admin']*/);
	}
]);

/**
 * Register bootstrap3 framework and /forms prefix for forms-angular node-module
 */
angular.module('formsAngular').config(['cssFrameworkServiceProvider' ,function(cssFrameworkService) {
	cssFrameworkService.setOptions({framework:'bs3'});
}]);