'use strict';

// Configuring the Maps module
angular.module('core').run(['gettextCatalog', 'Authentication',
    function(gettextCatalog, Authentication){
        
        var language = 'nl_NL';
        var user = Authentication.user;
        if (user && user.language && user.language !== '') {
            language = user.language.id;
        }
        gettextCatalog.currentLanguage = language;
        gettextCatalog.debug = true;
    }
]);