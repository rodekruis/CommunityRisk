var init = require("./config/init");
init();
var cleanup = require("./app/cleanup.js");

console.log("Cleanup starting");
cleanup(function() {
  console.log("Setup finished.");
  process.exit();
});
