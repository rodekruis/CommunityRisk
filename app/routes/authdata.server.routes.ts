import { getAuthData } from "../controllers/authdata.server.controller";

module.exports = function (app) {
  app.route('/authdata')
    .get(getAuthData);
};

