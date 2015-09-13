"use strict";

var dir = process.argv[2];
if (dir) {
    require("child_process").exec("npm link " + dir,
        function(error, stdout, stderr) {
            console.log(stdout);
            console.error(stderr);
            if (error) {
                console.error("ERROR: " + error);
                process.exit(error.code);
            } else {
                process.exit(0);
            }
        }
    );
} else {
    console.error("ERROR: Please specify a local path to the vivliostyle.js repository.");
    process.exit(1);
}
