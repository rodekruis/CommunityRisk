'use strict';

// Configuring the Articles module
angular.module('dashboards').run(['Menus', 'gettextCatalog',
	function(Menus, gettextCatalog) {
		// Translate menu item
		var title = gettextCatalog.getString('Dashboards');
		
		// Set top bar menu items
		Menus.addMenuItem('topbar', title, 'dashboards', '/dashboards', true);
	}
]);