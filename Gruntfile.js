module.exports = function(grunt) {

    grunt.initConfig({

        wintersmith: {
            "build": {}
        },

        "gh-pages": {
            options: {
                base: "build",
                branch: "master"
            },
            src: ["*"]
        }

    });

    grunt.loadNpmTasks("grunt-wintersmith");
    grunt.loadNpmTasks("grunt-gh-pages");

    grunt.registerTask("deploy", ["wintersmith:build", "gh-pages"]);

}
