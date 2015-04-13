(function(_) {
    "use strict";

    // Fix Browser(IE) "console" issue
    // IE 6,7,8 without "console"
    // IE9 without console.error
    // IE10 without console.debug
    (function() {
        function noop() {}
        // Prevent no console in IE
        if (!_.console) {
            _.console = {
                "log": noop,
                "warn": noop,
                "debug": noop,
                "info": noop,
                "error": noop
            };
        }
    })();

    /* Environment Variables */
    // Use release files or source files
    var RELEASE = true;
    // Use origin JS or compress JS, show blurb ID
    var ISDEBUG = _.ISDEBUG || false;
    var CLASS_ISDEBUG = "debug";

    // Virtual path
    var VIRTUAL_DIRECTORY = location.port === "8088" ? "/staging" : "";

    // User Agent? Mobile or PC
    var ISMOBILE = $(".phase.desktop:visible").length > 0 ? false : true;

    /* Context Variables */
    // Provide by MASTERPAGE
    var DOMAIN = _.DOMAIN || "http://" + location.host;
    var CACHESERVER = _.CACHESERVER || "http://" + location.host;
    var SERVICEDOMAIN = _.DOMAIN || "";

    var CACHEKEY = _.CACHEKEY || "";
    var SERVICECACHEKEY = _.SERVICECACHEKEY || "";

    // RequireJS Configuration
    var DEPENDS = ["require", "jquery", "troopjs", "modernizr", "respond"];
    var PATH_SCRIPTS = "./assets/js/";

    // IMPORTANT:
    // Use "requirejs" to fix IE 6, 7, 8
    //_.require = {
    _.requirejs.config({
        "context": "vcleanse",
        "baseUrl": PATH_SCRIPTS,
        "packages": [ /*Skin*/ {
            "name": "bootstrap",
            "location": "_shared/bootstrap/3.2.0",
            "main": ISDEBUG ? "bootstrap" : "bootstrap.min"
        }, {
            "name": "skin",
            "location": "skin",
            "main": ISDEBUG ? "main" : "main.min"
        }, /*Global*/ {
            "name": "json2",
            "location": "_shared/json2/e39bd4b7e6",
            "main": ISDEBUG ? "json2" : "json2.min"
        }, {
            "name": "underscore",
            "location": "_shared/underscore/1.7.0",
            "main": ISDEBUG ? "underscore" : "underscore.min"
        }, {
            "name": "underscore.string",
            "location": "_shared/underscore.string/2.3.0",
            "main": ISDEBUG ? "underscore.string" : "underscore.string.min"
        }, {
            "name": "modernizr",
            "location": "_shared/modernizr/2.6.2",
            "main": ISDEBUG ? "modernizr" : "modernizr.min"
        }, {
            "name": "poly",
            "location": "_shared/poly/0.6.0",
            "main": "poly"
        }, {
            "name": "when",
            "location": "_shared/when/2.5.1",
            "main": "when"
        }, {
            "name": "respond",
            "location": "_shared/respond/1.4.2",
            "main": ISDEBUG ? "respond" : "respond.min"
        }, {
            "name": "swipe",
            "location": "_shared/swipe/2.0.0",
            "main": ISDEBUG ? "swipe" : "swipe.min"
        }, /*RequireJS*/ {
            "name": "text",
            "location": "_shared/requirejs-text/2.0.10",
            "main": ISDEBUG ? "text" : "text.min"
        }, {
            "name": "css",
            "location": "_shared/require-css/0.0.8",
            "main": ISDEBUG ? "css" : "css.min"
        }, /*jQuery*/ {
            "name": "jquery",
            "location": "_shared/jquery/1.10.2",
            "main": ISDEBUG ? "jquery" : "jquery.min"
        }, {
            "name": "jquery.cookie",
            "location": "_shared/jquery.cookie/1.4.0",
            "main": ISDEBUG ? "jquery.cookie" : "jquery.cookie.min"
        }, {
            "name": "jquery.validation",
            "location": "_shared/jquery.validation/1.11.1",
            "main": ISDEBUG ? "jquery.validate" : "jquery.validate.min"
        }, {
            "name": "jquery.textchange",
            "location": "_shared/jquery.textchange/1.0.0",
            "main": ISDEBUG ? "jquery.textchange" : "jquery.textchange.min"
        }, {
            "name": "jquery.formatter",
            "location": "_shared/jquery.formatter/0.0.4",
            "main": ISDEBUG ? "jquery.formatter" : "jquery.formatter.min"
        }, /*jQuery UI*/ {
            "name": "jquery.ui.core",
            "location": "_shared/jquery.ui/1.10.3",
            "main": "jquery.ui.core"
        }, {
            "name": "jquery.ui.widget",
            "location": "_shared/jquery.ui/1.10.3",
            "main": "jquery.ui.widget"
        }, {
            "name": "jquery.ui.mouse",
            "location": "_shared/jquery.ui/1.10.3",
            "main": "jquery.ui.mouse"
        }, {
            "name": "jquery.ui.position",
            "location": "_shared/jquery.ui/1.10.3",
            "main": "jquery.ui.position"
        }, {
            "name": "jquery.ui.datepicker",
            "location": "_shared/jquery.ui/1.10.3",
            "main": "jquery.ui.datepicker"
        }, {
            "name": "jquery.ui.datepicker-zh-CN",
            "location": "_shared/jquery.ui/1.10.3/i18n",
            "main": "jquery.ui.datepicker-zh-CN"
        }, {
            "name": "jquery.easing",
            "location": "_shared/jquery.easing/1.3.0",
            "main": ISDEBUG ? "jquery.easing" : "jquery.easing.min"
        }, {
            "name": "jquery.animate-colors",
            "location": "_shared/jquery.animate-colors/1.6.0",
            "main": ISDEBUG ? "jquery.animate-colors" : "jquery.animate-colors.min"
        }, /*TroopJS*/ {
            "name": "troopjs",
            "location": "_shared/troopjs/2.0.1",
            "main": ISDEBUG ? "maxi" : "maxi.min"
        }, /*LESS*/ {
            "name": "less",
            "location": "_shared/less/1.4.1",
            "main": ISDEBUG ? "less" : "less.min"
        }, /*Widget*/ {
            "name": "widget",
            "location": CACHEKEY ? CACHEKEY + "/" + "widget" : "widget",
            "main": RELEASE ? (ISDEBUG ? "site" : "site.min") : ""
        }],

        "map": {
            "*": {
                "template": "troopjs-requirejs/template"
            }
        },

        "shim": {
            "jquery.ui.mouse": {
                deps: [
                    "jquery.ui.core",
                    "jquery.ui.widget"
                ]
            },
            "jquery.ui.datepicker": {
                deps: [
                    "jquery.ui.mouse"
                ]
            },
            "jquery.ui.datepicker-zh-CN": {
                deps: [
                    "jquery.ui.datepicker"
                ]
            },
            'underscore': {
                exports: '_'
            },
            "underscore.string": {
                deps: ["underscore"]
            }
        },

        "config": {},
        "waitSeconds": 0,

        "deps": RELEASE ? (function() {
            DEPENDS.push("widget");
            return DEPENDS;
        })() : (function() {
            DEPENDS.push("less");
            return DEPENDS;
        })(),

        "callback": function Boot(contextRequire, $) {
            var baseRequire = ["troopjs-browser/application/widget",
                "troopjs-browser/route/widget",
                "widget/cookie/main",
                "widget/daynight/init",
                "underscore",
                "underscore.string"
            ];

            // Start
            contextRequire(baseRequire, function(Application, RouteWidget, cookie, Daynight, _, _str) {

                // Mix in non-conflict functions to Underscore namespace
                _.mixin(_str.exports());

                // Page Context
                define("context", {
                    /* Environment Variables */
                    "isDebug": ISDEBUG,
                    "isMobile": ISMOBILE,
                    "virtualDirectory": VIRTUAL_DIRECTORY,

                    /* Context Variables */
                    "domain": DOMAIN,
                    "serviceDomain": SERVICEDOMAIN,
                    "cacheServer": CACHESERVER,
                    "cacheKey": CACHEKEY,
                    "serviceCacheKey": SERVICECACHEKEY,

                    /* Event support */
                    "clickEvent": Modernizr.touch ? "touchstart click" : "click",

                    "daynight": new Daynight().init()
                });

                // Styling by debug
                if (ISDEBUG) {
                    $(document.documentElement).addClass(CLASS_ISDEBUG);
                }

                // DOM Ready
                $(function() {
                    new Application($("html"),
                        "bootstrap",
                        new RouteWidget($(window), "route")
                    ).start();
                });
            });

        }
    });

})(this);