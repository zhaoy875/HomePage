'use strict'

var ASSETS_DIR = 'assets/';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
       
        /* JS代码检查 */
        jshint: {
            all: {
                options: {
                    '-W069': true,
                    '-W064': true,
                    '-W040': true
                },
                src: ['assets/scripts/*.js', 'assets/scripts/module/*.js', 'assets/scripts/util/*.js']
            }
        },
        /* CSS代码检查 */
        csslint: {
            strict: {
                options: {
                    import: false
                },
                src: ['css/*.css']
            }
        },
        cssmin: {
            add_banner: {
                options: {
                    banner: '/* HomePage css file */'
                },
                files: {
                    'path/to/output.css': ['path/to/**/*.css']
                }
            },
            minify: {
                expand: true,
                cwd: 'css/',
                src: ['*.css', '!*.min.css'],
                dest: 'css/release',
                ext: '.min.css'
            }
        },
        less: {
            dev: {
                files: [{
                    expand: true,
                    cwd: ASSETS_DIR + 'less',
                    src: ['*.less'],
                    dest: ASSETS_DIR + 'css',
                    ext: '.css'
                }]
            },
            bootstrap: {
                files: {
                    'assets/css/lib/bootstrap-homepage.css': 'assets/less/lib/bootstrap/bootstrap.less'
                }
            }
        },
        watch: {
            'less-dev': {
                files: [ASSETS_DIR + 'less/*.less', ASSETS_DIR + 'less/partials/**/*.less'],
                tasks: ['less:dev']
            },
            'less-bootstrap': {
                files: [ASSETS_DIR + 'less/lib/bootstrap/**/*.less'],
                tasks: ['less:bootstrap']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['less', 'watch']);
    grunt.registerTask('js-hint', 'JS代码质量检查', ['jshint']);
    grunt.registerTask('css-lint', 'CSS代码质量检查', ['csslint']);
    grunt.registerTask('minify-css', 'CSS代码压缩', ['cssmin']);
};
