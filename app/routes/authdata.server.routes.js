"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var authdata_server_controller_1 = require("../controllers/authdata.server.controller");
module.exports = function (app) {
    app.route('/authdata')
        .get(authdata_server_controller_1.getAuthData);
};
//# sourceMappingURL=authdata.server.routes.js.map