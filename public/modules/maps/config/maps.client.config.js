'use strict';

// Configuring the Maps module
angular.module('maps').run(['Menus', 'gettextCatalog',
	function(Menus, gettextCatalog) {
		
		// Translate menu item
		var title = gettextCatalog.getString('Maps');
		
		// Set top bar menu items
		Menus.addMenuItem('topbar', title, 'maps', '/maps', true);
	}
]);