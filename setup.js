var init = require("./config/init")(),
  config = require("./config/config");

var cleanup = require("./app/cleanup.js");

console.log("Cleanup starting");
cleanup(function() {
  console.log("Setup finished.");
  process.exit();
});
