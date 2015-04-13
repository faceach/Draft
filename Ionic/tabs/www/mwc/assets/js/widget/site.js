
define('troopjs-requirejs/template!widget/loading/index.html',[],function() { return function template(data) { var o = "<div class=\"loading-spinner\">\r\n    <div class=\"loading-spinner-logo\">\r\n        <div class=\"loading-spinner-icon\"></div>\r\n    </div>\r\n    <p></p>\r\n</div>"; return o; }; });
define('widget/loading/main',["troopjs-core/component/gadget",
    "jquery",
    "template!./index.html"
], function(Gadget, $, template) {
    "use strict";

    return Gadget.extend(function($el) {
        var me = this;
        me.$el = $el;
    }, {
        "sig/start": function() {
            var me = this;

            if (!me.$el || me.$el.length <= 0) {
                return;
            }

            me.$el.html(template);
        },
        "error": function(msg){
            var me = this;

            var $loadingSpinner = me.$el.find(".loading-spinner");
            $loadingSpinner.addClass("error");

            // Append error msg
            if(msg){
                $loadingSpinner.find("> p").text(msg);
            }
        }
    });
});
define('widget/ajaxquery/main',["jquery",
    "when",
    "context",
    "widget/loading/main"
], function($, when, context, Loading) {
    "use strict";

    return function(option, $el) {
        var me = this;
        var deferred = when.defer();

        var loading;
        if ($el && $el.length > 0) {
            loading = new Loading($el);
        }

        // Parameters check
        if (!option) {
            console.log('Ajax call without option!');
            deferred.reject(new Error('Ajax call without option!'));
        }
        if (!option.url) {
            console.log('Ajax call without url!');
            deferred.reject(new Error('Ajax call without url!'));
        }

        // Apply cachekey while start a HTTP GET request
        if (option.type.toUpperCase() === "GET" && context.serviceCacheKey) {
            // Add version
            $.extend(true, option, {
                data: {
                    "v": context.serviceCacheKey
                }
            });
        } /*else if (option.type.toUpperCase() === "POST") {
            // Add content type
            // Only JSON format as post data
            $.extend(true, option, {
                contentType: "application/json; charset=UTF-8"
            });
        }*/
        // For local test environment
        if (!context.serviceDomain) {
            // USE HTTP GET
            $.extend(true, option, {
                type: "GET"
            });
        }

        // Ajax
        var request = $.ajax(option);

        function ajaxReturnHandler() {
            request.done(function(data) {
                var statusCode;
                var description;
                if (data) {
                    deferred.resolve(data);
                } else {
                    statusCode = data.StatusCode || -999;
                    description = data.Description || "";
                    if (loading) {
                        loading.error("Service with error! [" + statusCode + "]");
                    }
                    deferred.reject(statusCode);
                }
            });

            request.fail(function(jqXHR, textStatus) {
                if (loading) {
                    loading.error("Service with error!");
                }

                deferred.reject(new Error('Ajax call failed.'));
            });
        }

        // Add loading icon
        if (loading) {
            loading.start().then(ajaxReturnHandler);
        } else {
            // Execute ajax result
            ajaxReturnHandler();
        }

        return deferred.promise;
    };

});
define('widget/basic/cloneobject',["jquery",
    "underscore"
], function($, _) {
    "use strict";

    return function cloneObject(myObj) {

        if (typeof(myObj) !== 'object') {
            return myObj;
        }
        if (myObj === null) {
            return myObj;
        }

        var myNewObj = _.isArray(myObj) ? [] : {};
        var assignment = false;

        for (var i in myObj) {
            if (myObj.hasOwnProperty(i)) {
                myNewObj[i] = cloneObject(myObj[i]);

                assignment = true;
            }
        }

        return assignment ? myNewObj : myObj;
    };

});
define('widget/basic/number',["jquery"], function($) {
    "use strict";

    return {
        "getDecimal": function(numeral, digits) {
            digits = digits || 2;
            // 18.00
            numeral = parseFloat(numeral);
            if (isNaN(numeral)) {
                return false;
            }

            /*var times = Math.pow(10, digits);

            // get two decimal while decimal > 2
            // 23.3456 --> 23.35
            var floatNumeral = Math.round(numeral * times) / times;
            var stringNumeral = floatNumeral.toString();
            var pos = stringNumeral.indexOf('.');
            if (pos < 0) {
                pos = stringNumeral.length;
                stringNumeral += '.';
            }
            while (stringNumeral.length <= pos + digits) {
                stringNumeral += '0';
            }
            return stringNumeral;*/

            // USE toFixed()
            return numeral.toFixed(digits);
        }
    };
});
define('widget/troophash/main',["jquery"], function($) {
    "use strict";

    return {
        "parse": function(hashPath) {
            if (!hashPath || hashPath.length <= 0) {
                return false;
            }

            var hashMap = {};

            var i = 0;
            var iLens = hashPath.length;

            for (i = 0; i < iLens; i += 2) {
                hashMap[hashPath[i]] = hashPath[i + 1];
            }

            return hashMap;
        },
        "extend": function(hashExt) {
            var me = this;

            if (!hashExt) {
                return;
            }
            var hash = location.hash || "";
            // #package/1/packagegroup/1
            var hashMap = hash ? me.parse(hash.substr(1).split("/")) : {};

            // Extend
            _.extend(hashMap, hashExt);

            var hashKey;
            var hashVal;
            var hashStr = "";
            for (hashKey in hashMap) {
                hashVal = hashMap[hashKey];
                if (hashVal || !isNaN(hashVal)) {
                    hashStr += "/" + hashKey + "/" + hashMap[hashKey];
                }
            }

            // Refresh hash
            location.hash = hashStr.substr(1);
        }
    };
});

define('troopjs-requirejs/template!widget/campaign/index.html',[],function() { return function template(data) { var o = "";
    var scene = data.scene;
o += "\r\n<div class=\"campaign-topic\">\r\n    <h1>\r\n        What's your smarter living style?\r\n    </h1>\r\n    <small class=\"campaign-topic-subtitle\">\r\n        Find out now. OR Answer, and find out!\r\n        <i class=\"left\"></i>\r\n        <i class=\"right\"></i>\r\n    </small>\r\n    <p>\r\n        "; if (data.daynight) { o += "\r\n            It's a beautiful day, and I'm...\r\n        "; } else { o += "\r\n            It's the beginning of the night, and I'm...\r\n        "; } o += "\r\n    </p>\r\n</div>\r\n<div class=\"campaign-fn\">\r\n    <div class=\"oblique-container page-width\">\r\n        <ul class=\"oblique oblique-lg\">\r\n        ";
            (function(){
                var i = 0;
                var iLens = scene.length;
                var extCssClass = "";
                for(i = 0; i < iLens; i++){
                    extCssClass = "";
                    if (i === 0) {
                        extCssClass = "left";
                    } else if (i === 2) {
                        extCssClass = "right";
                    }
                    renderScene(scene[i], extCssClass);
                }
            })();
        o += "\r\n        </ul>\r\n        <div class=\"oblique-side left\"></div>\r\n        <div class=\"oblique-side right\"></div>\r\n    </div>\r\n</div>\r\n\r\n"; function renderScene(scene, extCssClass) { o += "\r\n    <li class=\"campaign-lifestyle " + extCssClass+ "\">\r\n        <img src=\"" +data.cacheServer+ "/assets/images/desktop/bg/" +(scene.picture || '')+ ".png\" width=\"100%\" alt=\"\">\r\n        <div class=\"oblique-strip\">\r\n            <a href=\"#\" data-action=\"choosescene\" data-scene-id=\"" +(scene.id)+ "\" data-t-cat=\"mwc2015-smartlife\" data-t-act=\"click\" data-t-label=\"scene-" +(scene.name || '')+ "\">\r\n                " +(scene.name || '')+ "\r\n                <span class=\"caret caret-r\"></span>\r\n            </a>\r\n        </div>\r\n    </li>\r\n"; }  return o; }; });

define('troopjs-requirejs/template!widget/campaign/mobile.html',[],function() { return function template(data) { var o = "";
    var scene = data.scene;
o += "\r\n<div class=\"campaign-topic\">\r\n    <h1>\r\n        What's your smarter living style?\r\n    </h1>\r\n    <small class=\"campaign-topic-subtitle\">\r\n        Find out now. OR Answer, and find out!\r\n        <i class=\"left\"></i>\r\n        <i class=\"right\"></i>\r\n    </small>\r\n    <p>\r\n        "; if (data.daynight) { o += "\r\n            It's a beautiful day, and I'm...\r\n        "; } else { o += "\r\n            It's the beginning of the night, and I'm...\r\n        "; } o += "\r\n    </p>\r\n</div>\r\n<div class=\"campaign-fn\">\r\n    <ul class=\"scenestrip\">\r\n    ";
        (function(){
            var i = 0;
            var iLens = scene.length;
            var extCssClass = "";
            for(i = 0; i < iLens; i++){
                if (i === 0) {
                    extCssClass = "left";
                } else if (i === 2) {
                    extCssClass = "right";
                }
                renderScene(scene[i], extCssClass);
            }
        })();
    o += "\r\n    </ul>\r\n</div>\r\n\r\n"; function renderScene(scene, extCssClass) { o += "\r\n    <li class=\"campaign-lifestyle " + extCssClass+ "\">\r\n        <img src=\"" +data.cacheServer+ "/assets/images/mobile/bg/" +(scene.picture || '')+ ".jpg\" width=\"100%\" alt=\"\">\r\n        <div class=\"scenestrip-text\">\r\n            <a href=\"#\" data-action=\"choosescene\" data-scene-id=\"" +(scene.id)+ "\" data-t-cat=\"mwc2015-smartlife\" data-t-act=\"click\" data-t-label=\"scene-" +(scene.name || '')+ "\">\r\n                " +(scene.name || '')+ "\r\n            </a>\r\n        </div>\r\n    </li>\r\n"; }  return o; }; });
define('widget/campaign/main',["troopjs-browser/component/widget",
    "jquery",
    "context",
    "widget/ajaxquery/main",
	"widget/troophash/main",
    "template!./index.html",
    "template!./mobile.html"
], function(Widget, $, context, ajaxQuery, troopHash, template, templateMobile) {
	"use strict";

    var URI_SCENE = "./api/scene.json";

	return Widget.extend(function($element, widgetName, isMobile) {
        var me = this;

        if(!context.isMobile !== !isMobile)
        {
            me.stop();
            return;
        }

        me.isMobile = isMobile || false;
        me.template = me.isMobile ? templateMobile : template;
    }, {
        "render": function(){
            var me = this;
            var $me = me.$element;

            $me.siblings().hide();
            $me.show();

            ajaxQuery({
                url: URI_SCENE,
                type: "GET",
                dataType: "json"
            }, $me).then(function(data) {
                me.html(me.template, {
                    "cacheServer": context.cacheServer,
                    "daynight": context.daynight,
                    "scene": context.daynight ? data.day : data.night
                });
            });
        },
        "hub:memory/route": function(uriPath, uriEvent) {
            var me = this;
            var $me = me.$element;

            var hashPath = uriPath.path;
            if (!hashPath) {
                me.render();
                return;
            }
            var hashMap = troopHash.parse(hashPath);
            var step = parseInt(hashMap.step, 10);

            if (step && step > 1) {
                return;
            }

            me.render();
        },
        "dom:[data-action=choosescene]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;

            var $e = $(e.currentTarget);
            var sceneId = $e.data("sceneId");

            // Goto step 2
            troopHash.extend({
                "step": 2,
                "scene": sceneId
            });
        }
	});
});
define('widget/cookie/main',["jquery",
	"when",
	"jquery.cookie"
], function($, when) {
	"use strict";

	// Cookie dictionary, use lowercase for all key
	var cookieDict = {
		"fb_info": "FB_INFO"
	};

	return {
		"set": function(key, value, opt) {
			if (key === undefined) {
				return when.reject("key is undefined");
			}
			if (value === undefined) {
				return when.reject("value is undefined");
			}

			key = cookieDict[key.toLowerCase()];
			if (!key) {
				return when.reject("key is not registed");
			}

			$.cookie(key, value, opt);

			return when.resolve();
		},
		"get": function(key) {
			//Read all available cookies
			if (key === undefined) {
				return when.reject("key is undefined");
			}
			key = cookieDict[key.toLowerCase()];

			var val = key ? $.cookie(key) : "";

			return val ? when.resolve(val) : when.reject("No cookie for " + key);
		},
		"getVal": function(key) {
			//Read all available cookies
			if (key === undefined) {
				return;
			}
			key = cookieDict[key.toLowerCase()];

			var val = key ? $.cookie(key) : "";

			return val;
		},
		"getAll": function() {
			return when.resolve($.cookie());
		},
		"rm": function(key, opt) {
			if (key === undefined) {
				return when.reject("key is undefined");
			}
			key = cookieDict[key.toLowerCase()];
			if (!key) {
				return when.reject("key is not registed");
			}

			$.removeCookie(key, opt);

			return when.resolve();
		}
	};

});
define('widget/daynight/init',["troopjs-core/component/base",
    "widget/cookie/main"
], function(Component, cookie) {
    "use strict";

    // Day: 7:00 to 19:00, otherwise night
    var DAYNIGHT_MIN = 7;
    var DAYNIGHT_MAX = 19;

    return Component.extend({
        "init": function() {
            // Get client time
            var now = new Date();
            // Default: day
            var hour = now.getHours();

            if(hour >= DAYNIGHT_MIN && hour < DAYNIGHT_MAX){
                return true;
            }
            else {
                return false;
            }

            /*
            if(hour >= DAYNIGHT_MIN && hour < DAYNIGHT_MAX){
                return false;
            }
            else {
                return true;
            }*/
        }
    });

});
define('widget/daynight/main',["troopjs-browser/component/widget",
    "jquery",
    "context"
], function(Widget, $, context) {
    "use strict";

    return Widget.extend({
        "sig/start": function() {
            var me = this;
            var $me = me.$element;

            if (context.daynight) {
                $me.removeClass("night").addClass("day");
            } else {
                $me.removeClass("day").addClass("night");
            }
        }
    });
});
define('widget/feature/map',{
        "1": "sapphireglass",
        "2": "elegantappearance",
        "3": "instantnotifications",
        "4": "heartratedetection",
        "5": "customizability",
        "6": "googlefunctions",
        "7": "touchscreen",
        "8": "stylishdesign",
        "9": "instantnotifications",
        "10": "motionrecognition",
        "11": "polysomnography",
        "12": "bluetoothearpiece",
        "13": "fashionablestyle",
        "14": "highsoundquality",
        "15": "waterproof",
        "16": "dustproof",
        "17": "mp3store",
        "18": "touchscreen",
        "19": "stylishdesign",
        "20": "instantnotifications",
        "21": "motionrecognition",
        "22": "polysomnography",
        "23": "bluetoothearpiece",
        "24": "touchscreen",
        "25": "stylishdesign",
        "26": "instantnotifications",
        "27": "motionrecognition",
        "28": "polysomnography",
        "29": "bluetoothearpiece",
        "30": "fashionablestyle",
        "31": "highsoundquality",
        "32": "waterproof",
        "33": "dustproof",
        "34": "mp3store",
        "35": "touchscreen",
        "36": "stylishdesign",
        "37": "instantnotifications",
        "38": "motionrecognition",
        "39": "polysomnography",
        "40": "bluetoothearpiece",
        "41": "sapphireglass",
        "42": "elegantappearance",
        "43": "instantnotifications",
        "44": "heartratedetection",
        "45": "customizability",
        "46": "googlefunctions",
        "47": "fashionablestyle",
        "48": "highsoundquality",
        "49": "waterproof",
        "50": "dustproof",
        "51": "mp3store",
        "52": "touchscreen",
        "53": "stylishdesign",
        "54": "instantnotifications",
        "55": "motionrecognition",
        "56": "polysomnography",
        "57": "bluetoothearpiece",
        "58": "sapphireglass",
        "59": "elegantappearance",
        "60": "instantnotifications",
        "61": "heartratedetection",
        "62": "customizability",
        "63": "googlefunctions",
        "64": "touchscreen",
        "65": "stylishdesign",
        "66": "instantnotifications",
        "67": "motionrecognition",
        "68": "polysomnography",
        "69": "bluetoothearpiece"
});

define('troopjs-requirejs/template!widget/feature/index.html',[],function() { return function template(data) { var o = "";
    var scene = data.scene;
    var features = data.features;
    var map = data.map;

    var i, j;
    var iStart = 0;
    var iLens = features.length % 2 === 0 ? features.length/2 : (features.length + 1)/2;
    var jStart = iLens;
    var jLens = features.length;
o += "\r\n<div class=\"campaign-topic\">\r\n    <h1>\r\n        What's your smarter living style?\r\n    </h1>\r\n    <small class=\"campaign-topic-subtitle\">\r\n        Find out now.\r\n        <i class=\"left\"></i>\r\n        <i class=\"right\"></i>\r\n    </small>\r\n    <p>\r\n        When you are in " +(scene.name || '')+ ". What kind of function you would like your smart device to have?\r\n        <br>\r\n        <span>(Please Choose three options in order)</span>\r\n    </p>\r\n</div>\r\n<div class=\"campaign-fn\">\r\n    <div class=\"oblique-container page-width\">\r\n        <ul class=\"oblique oblique-lg cf\">\r\n            <li class=\"campaign-lifestyle left campaign-lifestyle-feature\">\r\n                <div class=\"oblique-subcontainer\">\r\n                    <ul class=\"oblique\">\r\n                        ";
                            for(i = iStart; i < iLens; i++) {
                                renderFeature(features[i], i+1);
                            }
                        o += "\r\n                    </ul>\r\n                    <div class=\"oblique-side left\"></div>\r\n                </div>\r\n            </li>\r\n            <li class=\"campaign-lifestyle campaign-lifestyle-active\">\r\n                <img src=\"" +data.cacheServer+ "/assets/images/desktop/bg/" +(scene.picture || '')+ ".png\" width=\"100%\" alt=\"\">\r\n                <div class=\"oblique-strip\">\r\n                    <a href=\"#\" data-action=\"choosefeature\" data-scene-id=\"" +(scene.id)+ "\">\r\n                        ANNOUNCED\r\n                        <span class=\"caret caret-r\"></span>\r\n                    </a>\r\n                    <!--a class=\"inlineblock btn-facebook\" data-action=\"loginfacebook\">\r\n                        LOGIN\r\n                        <span class=\"caret caret-r\"></span>\r\n                    </a-->\r\n                </div>\r\n            </li>\r\n            <li class=\"campaign-lifestyle right campaign-lifestyle-feature\">\r\n                <div class=\"oblique-subcontainer\">\r\n                    <ul class=\"oblique\">\r\n                        ";
                            for(j = jStart; j < jLens; j++) {
                                renderFeature(features[j], j + 1 - jStart);
                            }
                        o += "\r\n                    </ul>\r\n                    <div class=\"oblique-side right\"></div>\r\n                </div>\r\n            </li>\r\n        </ul>\r\n    </div>\r\n</div>\r\n\r\n"; 
function renderFeature(feature, index) { 
    var seq = Math.ceil(index/3).toString() + (index%3 === 0 ? 3 : index%3).toString();
    var iconName = map[feature.id.toString()];
o += "\r\n    <li class=\"campaign-feature campaign-feature-" +seq+ "\">\r\n        <div class=\"cf campaign-feature-icon campaign-feature-icon-" +iconName+ "\">\r\n            <span class=\"campaign-feature-icon-text\">" +(feature.name || "")+ "</span>\r\n            <a class=\"campaign-feature-active\" data-action=\"addfeature\" data-feature-id=\"" +feature.id+ "\" data-t-cat=\"mwc2015-smartlife\" data-t-act=\"click\" data-t-label=\"feature-" +iconName+ "\"></a>\r\n            <a class=\"campaign-feature-add\" data-action=\"addfeature\" data-feature-id=\"" +feature.id+ "\" data-t-cat=\"mwc2015-smartlife\" data-t-act=\"click\" data-t-label=\"feature-" +iconName+ "\"></a>\r\n        </div>\r\n    </li>\r\n"; }  return o; }; });

define('troopjs-requirejs/template!widget/feature/mobile.html',[],function() { return function template(data) { var o = "";
    var scene = data.scene;
    var features = data.features;
    var map = data.map;

    var i, j;
    var iStart = 0;
    var iLens = features.length;
o += "\r\n<div class=\"campaign-topic\">\r\n    <h1>\r\n        What's your smarter living style?\r\n    </h1>\r\n    <small class=\"campaign-topic-subtitle\">\r\n        Find out now.\r\n        <i class=\"left\"></i>\r\n        <i class=\"right\"></i>\r\n    </small>\r\n    <p>\r\n        When you are in " +(scene.name || '')+ ". What kind of function you would like your smart device to have?\r\n        <br>\r\n        <span>(Please Choose three options in order)</span>\r\n    </p>\r\n</div>\r\n<div class=\"campaign-fn\">\r\n    <div class=\"oblique-container feature-cnt-" +iLens+ " page-width\">\r\n        <div class=\"oblique-subcontainer\">\r\n            <ul class=\"oblique\">\r\n                ";
                    for(i = iStart; i < iLens; i++) {
                        renderFeature(features[i], i+1);
                    }
                o += "\r\n            </ul>\r\n            <div class=\"oblique-side left\"></div>\r\n            <div class=\"oblique-side right feature-cnt-" +iLens+ "\">\r\n                <a href=\"#\" class=\"btn\" data-action=\"choosefeature\" data-scene-id=\"" +(scene.id)+ "\">\r\n                    ANNOUNCED\r\n                    <span class=\"arrow arrow-r\"></span>\r\n                </a>\r\n                <!--a class=\"inlineblock btn-facebook\" data-action=\"loginfacebook\">\r\n                    LOGIN\r\n                    <span class=\"caret caret-r\"></span>\r\n                </a-->\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n"; 
function renderFeature(feature, index) { 
    var seq = Math.ceil(index/3).toString() + (index%3 === 0 ? 3 : index%3).toString();
    var iconName = map[feature.id.toString()] || "";
o += "\r\n    <li class=\"campaign-feature campaign-feature-" +seq+ "\">\r\n        <div class=\"cf campaign-feature-icon campaign-feature-icon-" +iconName+ "\">\r\n            <span class=\"campaign-feature-icon-text\">" +(feature.name || "")+ "</span>\r\n            <a class=\"campaign-feature-active\" data-action=\"addfeature\" data-feature-id=\"" +feature.id+ "\" data-t-cat=\"mwc2015-smartlife\" data-t-act=\"click\" data-t-label=\"feature-" +iconName+ "\"></a>\r\n            <a class=\"campaign-feature-add\" data-action=\"addfeature\" data-feature-id=\"" +feature.id+ "\" data-t-cat=\"mwc2015-smartlife\" data-t-act=\"click\" data-t-label=\"feature-" +iconName+ "\"></a>\r\n        </div>\r\n    </li>\r\n"; }  return o; }; });
define('widget/feature/main',["troopjs-browser/component/widget",
    "jquery",
    "when",
    "context",
    "widget/cookie/main",
    "widget/ajaxquery/main",
    "widget/troophash/main",
    "widget/feature/map",
    "template!./index.html",
    "template!./mobile.html",
    "underscore"
], function(Widget, $, when, context, cookie, ajaxQuery, troopHash, map, template, templateMobile) {
    "use strict";

    var URI_SCENE = "./api/scene.json";
    var URI_LOAD_FEATURES = context.serviceDomain + "service/loadfeatures";
    var URI_SAVE_USER = context.serviceDomain + "service/saveuser";
    var URI_SAVE_FEATURES = context.serviceDomain + "service/savechoice";

    if (context.isDebug) {
        URI_LOAD_FEATURES = "./api/loadfeatures.json";
    }

    var FEATURE_MAX = 3;

    return Widget.extend(function($element, widgetName, isMobile) {
        var me = this;

        if(!context.isMobile !== !isMobile)
        {
            me.stop();
            return;
        }
        me.isMobile = isMobile || false;
        me.template = me.isMobile ? templateMobile : template;

        me.selectedFeatures = [];
    }, {
        "hub:memory/route": function(uriPath, uriEvent) {
            var me = this;
            var $me = me.$element;

            var hashPath = uriPath.path;
            if (!hashPath) {
                return;
            }
            var hashMap = troopHash.parse(hashPath);
            var step = parseInt(hashMap.step, 10);
            var sceneId = me.sceneId = parseInt(hashMap.scene, 10);

            if (step !== 2) {
                return;
            }

            $me.siblings().hide();
            $me.show();

            when.join(ajaxQuery({
                url: URI_SCENE,
                type: "GET",
                dataType: "json"
            }), ajaxQuery({
                url: URI_LOAD_FEATURES,
                data: {
                    "scene_id": sceneId,
                },
                type: context.isDebug ? "GET" : "POST",
                dataType: "json"
            })).then(function(data) {
                var dataScene = data[0];
                var dataFeature = data[1];

                var scenes = context.daynight ? dataScene.day : dataScene.night;
                var scene;
                _.each(scenes, function(e, i) {
                    if (e.id === sceneId) {
                        scene = e;
                    }
                });

                // Render
                me.html(me.template, {
                    "cacheServer": context.cacheServer,
                    "daynight": context.daynight,
                    "scene": scene,
                    "features": dataFeature,
                    "map": map
                });
            });
        },
        "dom:[data-action=addfeature]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;

            var $e = $(e.currentTarget);
            var featureId = $e.data("featureId");

            if (_.indexOf(me.selectedFeatures, featureId) >= 0) {
                // Remove
                me.selectedFeatures = _.without(me.selectedFeatures, featureId);
                $e.parents("li").removeClass("active");
            } else {
                // Add
                if (me.selectedFeatures.length >= FEATURE_MAX) {
                    alert("Please Choose three options in order");
                    return;
                }
                me.selectedFeatures.push(featureId);
                $e.parents("li").addClass("active");
            }
            //console.log(me.selectedFeatures);
        },
        "dom:[data-action=choosefeature]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;

            if (me.selectedFeatures.length < FEATURE_MAX) {
                alert("Please Choose three options in order");
                return;
            }

            if (context.isDebug) {
                // Goto step 3
                troopHash.extend({
                    "step": 3
                });

                return;
            }

            // Facebook login & submit feature choice
            me.checkFacebookLogin().then(function(fbid) {
                me.saveFeature(fbid);
            });
        },
        "saveFeature": function(fbid) {
            var me = this;
            var $me = me.$element;

            // Save features
            ajaxQuery({
                url: URI_SAVE_FEATURES,
                data: {
                    "fbid": fbid, // Facebook ID
                    "scene_id": me.sceneId,
                    "first_choice": me.selectedFeatures[0],
                    "second_choice": me.selectedFeatures[1],
                    "third_choice": me.selectedFeatures[2]
                },
                type: "POST",
                dataType: "json"
            }, $me).then(function(data) {
                // Goto step 3
                troopHash.extend({
                    "step": 3
                });
            });
        },
        "checkFacebookLogin": function() {
            var me = this;
            var $me = me.$element;
            var deferredFacebookInfo = when.defer();

            var deferredMe = when.defer();
            var deferredMePicture = when.defer();

            // Popup login form
            function facebookLogin() {
                FB.login(function(response) {
                    if (response.authResponse) {
                        console.log('Welcome!  Fetching your information.... ');
                        //console.log(response); // dump complete info
                        access_token = response.authResponse.accessToken; //get access token
                        user_id = response.authResponse.userID; //get FB UID

                        // Check Login Status
                        FB.getLoginStatus(function(response) {
                            statusChangeCallback(response);
                        });
                    } else {
                        //user hit cancel button
                        console.log('User cancelled login or did not fully authorize.');
                    }
                }, {
                    scope: 'email'
                });
            }

            // This is called with the results from from FB.getLoginStatus().
            function statusChangeCallback(response) {
                console.log('statusChangeCallback');
                console.log(response);
                // The response object is returned with a status field that lets the
                // app know the current login status of the person.
                // Full docs on the response object can be found in the documentation
                // for FB.getLoginStatus().
                if (response.status === 'connected') {
                    // Logged into your app and Facebook.

                    // Connect to Facebook
                    FB.api('/me', function(response) {
                        deferredMe.resolver.resolve(response);
                    });
                    FB.api("/me/picture", {
                        "redirect": false,
                        "height": 200,
                        "width": 200,
                        "type": "normal"
                    }, function(response) {
                        deferredMePicture.resolver.resolve(response.data);
                    });
                } else if (response.status === 'not_authorized') {
                    // The person is logged into Facebook, but not your app.
                    console.log('Please log ' + 'into this app.');
                    facebookLogin();
                } else {
                    // The person is not logged into Facebook, so we're not sure if
                    // they are logged into this app or not.
                    console.log('Please log ' + 'into Facebook.');
                    facebookLogin();
                }
            }

            // This function is called when someone finishes with the Login
            // Button.  See the onlogin handler attached to it in the sample
            // code below.
            FB.getLoginStatus(function(response) {
                statusChangeCallback(response);
            });

            when.join(deferredMe.promise, deferredMePicture.promise).then(function(data) {
                var fbMe = data[0];
                var fbMePicture = data[1];

                if (!fbMe.id) {
                    return;
                }
                
                /*
                email: ""
                first_name: ""
                gender: "male"
                id: "xxx"
                last_name: ""
                link: "https://www.facebook.com/app_scoped_user_id/xxx/"
                locale: "en_GB"
                name: ""
                timezone: 8
                updated_time: "2013-02-17T10:04:54+0000"
                verified: true
                */
                var fbData = {
                    "fbid": fbMe.id,
                    "name": fbMe.name || "",
                    "pic": fbMePicture.url || "",
                    "link": fbMe.link || "",
                    "email": fbMe.email || "",
                    "locale": fbMe.locale || "en_US",
                    "gender": fbMe.gender || "male"
                };

                // Save to cookit
                cookie.set("fb_info", JSON.stringify(fbData), {
                    path: "/"
                });

                // Save by service
                ajaxQuery({
                    url: URI_SAVE_USER,
                    data: fbData,
                    type: "POST",
                    dataType: "json"
                }, $me).then(function() {
                    // Resolve & Save feature
                    deferredFacebookInfo.resolver.resolve(fbData.fbid);
                });
            });

            return deferredFacebookInfo.promise;
        }
    });
});

define('troopjs-requirejs/template!widget/logo/index.html',[],function() { return function template(data) { var o = "";
    var srcLogo = data.daynight ? "logo_day.png" : "logo_night.png";
o += "\r\n<img src=\"" +data.cacheServer+ "/assets/images/desktop/" +srcLogo+ "\" alt=\"Huawei\">"; return o; }; });

define('troopjs-requirejs/template!widget/logo/mobile.html',[],function() { return function template(data) { var o = "";
    var srcLogo = data.daynight ? "logo_day.png" : "logo_night.png";
o += "\r\n<img src=\"" +data.cacheServer+ "/assets/images/mobile/" +srcLogo+ "\" alt=\"Huawei\">"; return o; }; });
define('widget/logo/main',["troopjs-browser/component/widget",
    "jquery",
    "context",
    "template!./index.html",
    "template!./mobile.html"
], function(Widget, $, context, template, templateMobile) {
    "use strict";

    return Widget.extend(function($element, widgetName, isMobile) {
        var me = this;

        me.isMobile = isMobile || false;
        me.template = me.isMobile ? templateMobile : template;
    }, {
        "sig/start": function() {
            var me = this;
            var $me = me.$element;

                me.html(me.template, {
                    "cacheServer": context.cacheServer,
                    "daynight": context.daynight
                });
        }
    });
});

define('troopjs-requirejs/template!widget/popupbox/index.html',[],function() { return function template(data) { var o = "<div class=\"popupbox-cover\" style=\"\r\n    position: " + (data.position || "fixed") + ";\r\n    z-index: " + (data.zIndex || 1) + ";\r\n    background-color: " + (data.bgColor || "#000") + ";\r\n    opacity: " + (data.opacity || 0.8) + ";\r\n    _filter: alpha(opacity=" + (data.opacity || 0.8) * 100 + ");\r\n    margin-top: " + (data.top || 0) + "px;\r\n\">\r\n    "; if (data.keySupport) { o += "\r\n        <style>\r\n            input.popupbox-keysupport\r\n            {\r\n                width: 1px;\r\n                height: 1px;\r\n                border-width: 0;\r\n                overflow: hidden;\r\n                background-color: transparent;\r\n                outline: none;\r\n                position: absolute;\r\n                top: -1px;\r\n            }\r\n        </style>\r\n        <input class=\"popupbox-keysupport\" type=\"text\" />\r\n    "; } o += "\r\n</div>\r\n<div class=\"popupbox\" style=\"\r\n    position: " + (data.position || "fixed") + ";\r\n    z-index: " + (data.zIndex || 1) + ";\r\n    margin-top: " + (data.top || 0) + "px;\r\n\">\r\n    <div class=\"popupbox-main\" "; if(data.closeble){ o += "data-action=\"closepopupbox\""; } o += " style=\"\r\n        height: 100%;\r\n        "; if(!data.fullSize) { o += "\r\n            text-align: center;\r\n        "; } o += "\r\n    \">\r\n        "; if(!data.isInnerClose) { closeButton(data.hasCloseButton); } o += "\r\n        <div class=\"popupbox-content popupbox-out\" style=\"\r\n            "; if(!data.fullSize) { o += "\r\n                text-align: left;\r\n                display: inline-block;\r\n                *display: inline;\r\n                *zoom: 1;\r\n            "; } o += "\r\n        \">\r\n            "; if(data.isInnerClose) { closeButton(data.hasCloseButton); } o += "\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n"; function closeButton(exist) { o += "\r\n    "; if (exist) { o += "\r\n        <style>\r\n            .popupbox-close\r\n            {\r\n                position: absolute;\r\n                right: 0;\r\n                top: 0;\r\n                cursor: pointer;\r\n            }\r\n        </style>\r\n        <a class=\"popupbox-close hidden-print\" title=\"Close\">&times;</a>\r\n    "; } o += "\r\n"; } o += "\r\n<style>\r\n    style\r\n    {\r\n        display: none;\r\n    }\r\n    /*\r\n    * Animation for pop effect\r\n    */\r\n    /* No animation */\r\n    .popupbox-in\r\n    {\r\n        visibility: visible;\r\n    }\r\n    .popupbox-out\r\n    {\r\n        visibility: hidden;\r\n    }\r\n    /* With animation */\r\n    .popupbox-pop {\r\n        -webkit-transform-origin: 50% 50%;\r\n        -moz-transform-origin: 50% 50%;\r\n    }\r\n    .popupbox-pop.popupbox-in {\r\n        visibility: visible;\r\n        opacity: 1;\r\n        box-shadow: 0 0 30px #666;\r\n        -webkit-transform: scale(1);\r\n\r\n        -webkit-animation-name: popin;\r\n        -moz-animation-name: popin;\r\n        -webkit-animation-duration: 200ms;\r\n        -moz-animation-duration: 200ms;\r\n        -webkit-animation-timing-function: ease-out;\r\n        -moz-animation-timing-function: ease-out;\r\n    }\r\n    .popupbox-pop.popupbox-out {\r\n        visibility: visible;\r\n        opacity: 0;\r\n        -webkit-transform: scale(.8);\r\n\r\n        -webkit-animation-name: popout;\r\n        -moz-animation-name: popout;\r\n        -webkit-animation-duration: 100ms;\r\n        -moz-animation-duration: 100ms;\r\n        -webkit-animation-timing-function: ease-in;\r\n        -moz-animation-timing-function: ease-in;\r\n    }\r\n    @-webkit-keyframes popin {\r\n        from {\r\n            -webkit-transform: scale(.8);\r\n            opacity: 0;\r\n        }\r\n        to {\r\n            -webkit-transform: scale(1);\r\n            opacity: 1;\r\n        }\r\n    }\r\n    @-webkit-keyframes popout {\r\n        from {\r\n            -webkit-transform: scale(1);\r\n            opacity: 1;\r\n        }\r\n        to {\r\n            -webkit-transform: scale(.8);\r\n            opacity: 0;\r\n        }\r\n    }\r\n    /* evc style */\r\n    .popupbox-cover,\r\n    .popupbox\r\n    {\r\n        position: fixed;\r\n        left: 0;\r\n        top: 0;\r\n        width: 100%;\r\n        height: 100%;\r\n        overflow: hidden;\r\n    }\r\n    .popupbox-main,\r\n    .popupbox-content\r\n    {\r\n        position: relative;\r\n    }\r\n    .popupbox-main\r\n    {\r\n        overflow-y: auto;\r\n        overflow-x: hidden;\r\n    }\r\n    .popupbox-content\r\n    {\r\n        -webkit-transition: margin-top .3s ease-out;\r\n        -moz-transition: margin-top .3s ease-out;\r\n        -o-transition: margin-top .3s ease-out;\r\n        transition: margin-top .3s ease-out;\r\n    }\r\n</style>"; return o; }; });
define('widget/popupbox/main',["troopjs-browser/component/widget",
    "troopjs-browser/loom/weave",
    "jquery",
    "template!./index.html"
], function(Widget, weave, $, template) {
    "use strict";

    function keySupport() {
        var ua = navigator.userAgent;
        return ua.indexOf("Windows NT") >= 0 || ua.indexOf("Macintosh") >= 0;
    }

    function cssAnimate($el, noAnimation) {
        if (!$el || $el.length <= 0) {
            return {
                "popIn": $.noop,
                "popOut": $.noop
            };
        }
        // Add animate CSS?
        if (noAnimation) {
            $el.removeClass("popupbox-pop");
        } else {
            $el.addClass("popupbox-pop");
        }

        return {
            "popIn": function() {
                $el.removeClass("popupbox-out").addClass("popupbox-in");
            },
            "popOut": function() {
                $el.removeClass("popupbox-in").addClass("popupbox-out");
            }
        };
    }

    return Widget.extend(function(args) {
        var me = this;
        // Arguments
        me.el = args.$el || "body";
        me.msg = args.msg || "";
        // overLap: "cancel"/"replace"/"overlap"
        me.overLap = args.overLap || "replace";
        // stick at top of the popup
        me.stick = args.stick || false;
        // In stick mode, keep a gap to top
        me.stickTop = args.stickTop || 0;
        // Gap between object element & popup box(e.g. Show Header while popup)
        me.top = args.top || 0;
        // Support animation?
        me.noAnimation = args.noAnimation || false;
        // styling
        me.bgColor = args.bgColor || "#fff";
        me.opacity = args.opacity || 0.6;
        me.position = args.position || "fixed";
        me.zIndex = args.zIndex || 1;
        me.fullSize = args.fullSize || false;
        // button options
        me.closeble = args.closeble || false;
        me.closeButtonHide = args.closeButtonHide || false;
        me.closeButtonList = args.closeButtonList || [];
        me.closeInner = args.closeInner || false;
        me.closeCallback = args.closeCallback || $.noop;
    }, {
        "open": function() {
            var me = this;
            var deferred = $.Deferred();
            var $container = $(me.el);

            function evClose() {
                if (me.closeButtonList.length > 0) {
                    // Read all the buttons
                    $.each(me.closeButtonList, function(i, el) {
                        // Events
                        me.$popupBox.on("click", "[data-action=closepopupbox]", function(e) {
                            //e.preventDefault();

                            if ($(e.target).data("action") !== "closepopupbox") {
                                return;
                            }
                            me.close();
                        });
                        me.$popupBox.on("click", el, function(e) {
                            e.preventDefault();
                            me.close();
                        });
                    });
                }
            }

            function escClose() {
                var $keySupportInput = me.$popupBoxCover.find("input.popupbox-keysupport");
                if ($keySupportInput.length > 0) {
                    $keySupportInput.focus().keydown(function(e) {
                        if (e.which == 27) {
                            me.close();
                        }
                        e.preventDefault();
                    });
                }
            }

            function resize() {
                $(window).resize(function(e) {
                    me.centralize();
                });
            }

            // If the container doesn't exist, use body instead.
            if ($container.length <= 0) {
                $container = $("body");
            }
            // overlap
            var $existPopupBox = $container.find(" > div.popupbox, > div.popupbox-cover");
            if ($existPopupBox.length > 0) {
                if (me.overLap === "cancel") {
                    deferred.reject();
                    return deferred.promise();
                } else if (me.overLap === "replace") {
                    $existPopupBox.remove();
                }
            }
            // Generate the html
            me.$popupBoxWrapper = $(template({
                "bgColor": me.bgColor,
                "opacity": me.opacity,
                "position": me.position,
                "zIndex": me.zIndex,
                "top": me.top,
                "fullSize": me.fullSize,
                "keySupport": keySupport(),
                "closeble": me.closeble,
                "hasCloseButton": (me.closeble && !me.closeButtonHide),
                "isInnerClose": me.closeInner
            }));
            me.$popupBoxCover = me.$popupBoxWrapper.filter(".popupbox-cover");
            me.$popupBox = me.$popupBoxWrapper.filter(".popupbox");
            me.$popupBoxMain = me.$popupBox.find(".popupbox-main");
            me.$popupBoxContent = me.$popupBox.find(".popupbox-content");

            // Register window resize event
            if (!me.stick) {
                resize();
            }
            // Transfer msg to jQuery Object
            var $msg = $(me.msg);
            // Append Content, use 'prepend' to make 'close button' render at the end.
            me.$popupBoxContent.prepend($msg);
            // Append to DOM
            me.$popupBoxWrapper.appendTo($container);
            // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ //
            // Async: Weave msg before append to DOM
            weave.apply($msg.find("[data-weave]")).then(function() {
                // Centralize the content
                me.centralize();
            });
            //me.centralize();
            // Append close button
            if (me.closeble) {
                me.closeButtonList.push("a.popupbox-close");
                // Attach close events
                evClose();
                // Attach ESC key event
                escClose();
            }
            // Show popup box
            if (me.noAnimation) {
                // Show Cover
                me.$popupBoxCover.show();
                // Show Content
                cssAnimate(me.$popupBoxContent, true).popIn();
                // Resolve
                deferred.resolve();
            } else {
                // Show Cover
                me.$popupBoxCover.fadeIn(400, function() {
                    // Show Content after Cover showed
                    cssAnimate(me.$popupBoxContent).popIn();
                    // Resolve
                    deferred.resolve();
                });
            }
            return deferred.promise();
        },
        "close": function(noCallback) {
            var me = this;
            var deferred = $.Deferred();

            function callback() {
                if (!noCallback) {
                    me.closeCallback();
                }
            }
            if (me.noAnimation) {
                // Hide Content
                cssAnimate(me.$popupBoxContent, true).popOut();
                // Hide Cover
                me.$popupBoxCover.hide();
                // Run close callback
                callback();
                // Remove popup elements
                me.$popupBoxWrapper.remove();
                // Resolve
                deferred.resolve();
            } else {
                // Hide Content
                cssAnimate(me.$popupBoxContent).popOut();
                window.setTimeout(function() {
                    // Hide Cover after Content hid
                    me.$popupBoxCover.fadeOut(200, function() {
                        // Run close callback after cover hid
                        callback();
                        // Remove popup elements
                        me.$popupBoxWrapper.remove();
                        // Resolve
                        deferred.resolve();
                    });
                }, 100);
            }
            return deferred.promise();
        },
        "centralize": function() {
            var me = this;
            // $out: Cover
            var $out = me.$popupBox;
            // $in: Content
            var $in = me.$popupBoxContent;
            // Get height of both container & content
            var hOut = $out.height();
            var hIn = $in.outerHeight();
            // calculate: keep top while stick, otherwise centralize the content in vertical
            var mTop = me.stick ? me.stickTop : Math.floor((hOut - hIn) / 2);
            // Never hide or be cut
            mTop = mTop < 0 ? 0 : mTop;
            // Apply to dom
            $in.css("margin-top", mTop);
            return me;
        }
    });
});
define('widget/querystring/main',["jquery",
    "when"
], function($, when) {
    "use strict";

    return {
        // Get Request from URL, retrun an object {query1: value1, query2: value2}
        getRequest: function() {
            var url = location.search;
            var theRequest = {};
            if (url.indexOf("?") !== -1) {
                var str = url.substr(1);
                var strs = str.split("&");
                for (var i = 0, l = strs.length; i < l; i++) {
                    theRequest[(strs[i].split("=")[0]).toLowerCase()] = unescape(strs[i].split("=")[1]);
                }
            }
            return theRequest;
        }
    };
});
define('widget/result/map',{
        "1": {
                "name": "watch",
                "nameImage": "text_watch.png",
                "picture": ["watch_01.png", "watch_02.png", "watch_03.png"],
                "slogan": ["Timeless design", "Smart connectivity", "Smart tracking"],
                "link": "http://consumer.huawei.com/minisite/worldwide/huawei-watch/index.htm"
        },
        "2": {
                "name": "talkband b2",
                "nameImage": "text_talkband_b2.png",
                "picture": ["talkband_b2_01.png", "talkband_b2_02.png", "talkband_b2_03.png"],
                "slogan": ["Premium design", "Intelligent tracking", "Seamless connection"],
                "link": "http://consumer.huawei.com/minisite/worldwide/talkband-b2/index.htm"
        },
        "3": {
                "name": "talkband n1",
                "nameImage": "text_talkband_n1.png",
                "picture": ["talkband_n1_01.png", "talkband_n1_02.png", "talkband_n1_03.png"],
                "slogan": ["Impressive sound, Hands-free talking", "Fitness with tracking", "Beautifully designed, Suitable for all occasions"],
                "link": "http://consumer.huawei.com/minisite/worldwide/talkband-n1/index.htm"
        }
});

define('troopjs-requirejs/template!widget/result/index.html',[],function() { return function template(data) { var o = "";
    var fbInfo = data.fbInfo;
    var result = data.result;
    var map = data.map;

    var report_1 = result.first_choice_string.replace("xx%", "<strong>" + result.first_choice_percent + "%</strong>");
    var report_2 = result.second_choice_string.replace("xx%", "<strong>" + result.second_choice_percent + "%</strong>");
    var report_3 = result.third_choice_string.replace("xx%", "<strong>" + result.third_choice_percent + "%</strong>");

    var product = map[result.product_id];

    var productPicture = product.picture;
    var i = 0;
    var iLens = productPicture.length;

    var productSlogan = product.slogan;
    var j = 0;
    var jLens = productSlogan.length;
o += "\r\n<div class=\"campaign-fn\">\r\n    <div class=\"page-width campaign-result\">\r\n        <div class=\"campaign-result-report cf\">\r\n            <div class=\"campaign-result-report-title\">\r\n                <div class=\"inlineblock\">\r\n                    " +result.nick_name+ " " +fbInfo.name+ "\r\n                </div>\r\n                <a class=\"inlineblock\" href=\"" +fbInfo.link+ "\" target=\"_blank\">                \r\n                    <img class=\"inlineblock\" src=\"" +fbInfo.pic+ "\" alt=\"\">\r\n                </a>\r\n            </div>\r\n            <div class=\"campaign-result-report-item campaign-result-report-item-1\">\r\n                <div class=\"inlineblock campaign-result-report-data\">\r\n                    " +report_1+ "\r\n                </div>\r\n                <img class=\"inlineblock\" src=\"" +data.cacheServer+ "/assets/images/desktop/icon/report/preference_" +result.first_choice+ ".png\" alt=\"\">\r\n            </div>\r\n            <div class=\"campaign-result-report-item campaign-result-report-item-2\">\r\n                <div class=\"inlineblock campaign-result-report-data\">\r\n                    " +report_2+ "\r\n                </div>\r\n                <img class=\"inlineblock\" src=\"" +data.cacheServer+ "/assets/images/desktop/icon/report/preference_" +result.second_choice+ ".png\" alt=\"\">\r\n            </div>\r\n            <div class=\"campaign-result-report-item campaign-result-report-item-3\">\r\n                <div class=\"inlineblock campaign-result-report-data\">\r\n                    " +report_3+ "\r\n                </div>\r\n                <img class=\"inlineblock\" src=\"" +data.cacheServer+ "/assets/images/desktop/icon/report/preference_" +result.third_choice+ ".png\" alt=\"\">\r\n            </div>\r\n            <div class=\"campaign-result-report-item campaign-result-report-viewall\">\r\n                <div class=\"campaign-result-report-inside\">\r\n                    <a class=\"inlineblock btn-facebook\" data-action=\"sharefacebook\" data-result-id=\"" +result.id+ "\">\r\n                        SHARE\r\n                        <span class=\"caret caret-r\"></span>\r\n                    </a>\r\n                    <!--a class=\"inlineblock btn-viewall\" href=\"#\">\r\n                        VIEW ALL RESULT\r\n                        <span class=\"caret caret-r\"></span>\r\n                    </a-->\r\n                </div>\r\n            </div>\r\n        </div>\r\n        <div class=\"campaign-result-product\">\r\n            <div class=\"thumbnail\">\r\n                <p class=\"thumbnail-pre\">AS THE RESULT, WE RECOMMEND</p>\r\n                <h3>\r\n                    <img src=\"" +data.cacheServer+ "/assets/images/desktop/product/" +product.nameImage+ "\" alt=\"" +product.name+ "\">\r\n                </h3>\r\n                <div class=\"swipe\" data-weave=\"widget/swipe/main\" data-disable-bullets=\"true\" data-auto=\"3000\">\r\n                    <div class=\"swipe-wrap\">\r\n                        "; for(i=0; i<iLens; i++){ o += "\r\n                            <div>\r\n                                <img src=\"" +data.cacheServer+ "/assets/images/desktop/product/" +productPicture[i]+ "\" alt=\"" +product.name+ "\">\r\n                            </div>\r\n                        "; } o += "\r\n                    </div>\r\n                </div>\r\n                <div class=\"caption\">\r\n                    <ul>\r\n                        "; for(j=0; j<jLens; j++){ o += "\r\n                            <li>" +productSlogan[j]+ "</li>\r\n                        "; } o += "\r\n                    </ul>\r\n                    <p>\r\n                        <a href=\"" +product.link+ "\" target=\"_blank\" class=\"btn\">\r\n                            LEARN MORE\r\n                            <span class=\"arrow arrow-r\"></span>\r\n                        </a>\r\n                    </p>\r\n                </div>\r\n            </div>\r\n        </div>                        \r\n    </div>\r\n</div>"; return o; }; });

define('troopjs-requirejs/template!widget/result/mobile.html',[],function() { return function template(data) { var o = "";
    var fbInfo = data.fbInfo;
    var result = data.result;
    var map = data.map;

    var report_1 = result.first_choice_string.replace("xx%", "<strong>" + result.first_choice_percent + "%</strong>");
    var report_2 = result.second_choice_string.replace("xx%", "<strong>" + result.second_choice_percent + "%</strong>");
    var report_3 = result.third_choice_string.replace("xx%", "<strong>" + result.third_choice_percent + "%</strong>");

    var product = map[result.product_id];

    var productPicture = product.picture;
    var i = 0;
    var iLens = productPicture.length;

    var productSlogan = product.slogan;
    var j = 0;
    var jLens = productSlogan.length;
o += "\r\n<div class=\"campaign-fn\">\r\n    <div class=\"page-width campaign-result\">\r\n        <div class=\"campaign-result-report cf\">\r\n            <div class=\"campaign-result-report-title\">\r\n                <div class=\"inlineblock\">\r\n                    " +result.nick_name+ " " +fbInfo.name+ "\r\n                </div>\r\n                <a class=\"inlineblock\" href=\"" +fbInfo.link+ "\" target=\"_blank\">                \r\n                    <img class=\"inlineblock\" src=\"" +fbInfo.pic+ "\" alt=\"\">\r\n                </a>\r\n            </div>\r\n            <div class=\"campaign-result-report-item campaign-result-report-item-1\">\r\n                <img class=\"inlineblock\" src=\"" +data.cacheServer+ "/assets/images/desktop/icon/report/preference_" +result.first_choice+ ".png\" alt=\"\">\r\n                <div class=\"inlineblock campaign-result-report-data\">\r\n                    " +report_1+ "\r\n                </div>\r\n            </div>\r\n            <div class=\"campaign-result-report-item campaign-result-report-item-2\">\r\n                <div class=\"inlineblock campaign-result-report-data\">\r\n                    " +report_2+ "\r\n                </div>\r\n                <img class=\"inlineblock\" src=\"" +data.cacheServer+ "/assets/images/desktop/icon/report/preference_" +result.second_choice+ ".png\" alt=\"\">\r\n            </div>\r\n            <div class=\"campaign-result-report-item campaign-result-report-item-3\">\r\n                <img class=\"inlineblock\" src=\"" +data.cacheServer+ "/assets/images/desktop/icon/report/preference_" +result.third_choice+ ".png\" alt=\"\">\r\n                <div class=\"inlineblock campaign-result-report-data\">\r\n                    " +report_3+ "\r\n                </div>\r\n            </div>\r\n            <div class=\"campaign-result-report-item campaign-result-report-viewall\">\r\n                <div class=\"campaign-result-report-inside\">\r\n                    <a class=\"inlineblock btn-facebook\" data-action=\"sharefacebook\" data-result-id=\"" +result.id+ "\">\r\n                        SHARE\r\n                        <span class=\"caret caret-r\"></span>\r\n                    </a>\r\n                </div>\r\n                <!--div class=\"campaign-result-report-inside\">\r\n                    <a class=\"inlineblock btn-viewall\" href=\"#\">\r\n                        VIEW ALL RESULT\r\n                        <span class=\"caret caret-r\"></span>\r\n                    </a>\r\n                </div-->\r\n            </div>\r\n        </div>\r\n        <div class=\"campaign-result-product\">\r\n            <div class=\"thumbnail\">\r\n                <p class=\"thumbnail-pre\">\r\n                \tAS THE RESULT, WE RECOMMEND\r\n                \t<i class=\"left\"></i>\r\n                \t<i class=\"right\"></i>\r\n                </p>\r\n                <h3>\r\n                    <img src=\"" +data.cacheServer+ "/assets/images/desktop/product/" +product.nameImage+ "\" alt=\"" +product.name+ "\">\r\n                </h3>\r\n                <div class=\"swipe\" data-weave=\"widget/swipe/main\" data-disable-bullets=\"true\" data-auto=\"3000\">\r\n                    <div class=\"swipe-wrap\">\r\n                        "; for(i=0; i<iLens; i++){ o += "\r\n                            <div>\r\n                                <img src=\"" +data.cacheServer+ "/assets/images/desktop/product/" +productPicture[i]+ "\" alt=\"" +product.name+ "\">\r\n                            </div>\r\n                        "; } o += "\r\n                    </div>\r\n                </div>\r\n                <div class=\"caption\">\r\n                    <ul>\r\n                        "; for(j=0; j<jLens; j++){ o += "\r\n                            <li>" +productSlogan[j]+ "</li>\r\n                        "; } o += "\r\n                    </ul>\r\n                    <p>\r\n                        <a href=\"" +product.link+ "\" target=\"_blank\" class=\"btn\">\r\n                            LEARN MORE\r\n                            <span class=\"arrow arrow-r\"></span>\r\n                        </a>\r\n                    </p>\r\n                </div>\r\n            </div>\r\n        </div>                        \r\n    </div>\r\n</div>"; return o; }; });
define('widget/result/main',["troopjs-browser/component/widget",
    "jquery",
    "context",
    "widget/cookie/main",
    "widget/ajaxquery/main",
    "widget/troophash/main",
    "widget/result/map",
    "template!./index.html",
    "template!./mobile.html"
], function(Widget, $, context, cookie, ajaxQuery, troopHash, map, template, templateMobile) {
    "use strict";

    var URI_RESULT = context.serviceDomain + "service/loaduserresult";

    if (context.isDebug) {
        var URI_RESULT = "./api/loaduserresult.json";
    }

    return Widget.extend(function($element, widgetName, isMobile) {
        var me = this;

        if(!context.isMobile !== !isMobile)
        {
            me.stop();
            return;
        }
        me.isMobile = isMobile || false;
        me.template = me.isMobile ? templateMobile : template;
    }, {
        "hub:memory/route": function(uriPath, uriEvent) {
            var me = this;
            var $me = me.$element;

            var hashPath = uriPath.path;
            if (!hashPath) {
                return;
            }
            var hashMap = troopHash.parse(hashPath);
            var step = parseInt(hashMap.step, 10);

            if (step !== 3) {
                return;
            }

            $me.siblings().hide();
            $me.show();

            if (context.isDebug) {
                ajaxQuery({
                    url: URI_RESULT,
                    type: "GET",
                    dataType: "json"
                }, $me).then(function(data) {
                    me.html(me.template, {
                        "cacheServer": context.cacheServer,
                        "daynight": context.daynight,
                        "result": data,
                        "map": map,
                        "fbInfo": {
                            "fbid": "0",
                            "name": "Alejandro",
                            "pic": "./assets/images/desktop/logo.png",
                            "link": "http://www.huawei.com",
                            "email": "master@huawei.com"
                        }
                    });
                });

                return;
            }

            cookie.get("fb_info").then(function(fbInfo) {
                var fbData = JSON.parse(fbInfo);

                ajaxQuery({
                    url: URI_RESULT,
                    data: {
                        "fbid": fbData.fbid
                    },
                    type: "POST",
                    dataType: "json"
                }, $me).then(function(data) {
                    me.html(me.template, {
                        "cacheServer": context.cacheServer,
                        "daynight": context.daynight,
                        "result": data,
                        "map": map,
                        "fbInfo": fbData
                    });
                });
            }, function (argument) {
                // Goto index page
                troopHash.extend({
                    "step": 1
                });

                return;
            });
        },
        "dom:[data-action=sharefacebook]/click": function(e) {
            e.preventDefault();
            var me = this;
            var $me = me.$element;

            var $e = $(e.currentTarget);
            var resultId = $e.data("resultId");

            // Call Facebook share API
            FB.ui({
                method: 'feed',
                link: 'http://www.hcmwc2015.com',
                caption: 'Huawei MWC 2015',
                picture: "http://www.hcmwc2015.com/assets/images/share/share_" + resultId + ".png"
            }, function(response) {
                if(response && response.post_id){
                    alert("Done!");
                }else {
                    //alert("System is busy, please try again.");
                }
            });
        }
    });
});

define('troopjs-requirejs/template!widget/swipe/index.html',[],function() { return function template(data) { var o = "";
    var swipeLens = data.swipeLens;
    var startSlide = data.startSlide;
    var disableBullets = data.disableBullets;
    var bulletsPos = data.bulletsPos;
    var i = 0;
o += "\r\n<ul class=\"bullets hor\">\r\n    "; for(i=0;i<swipeLens;i++){o += "\r\n        <li class=\"bullets-item "; if (i === startSlide) { o += "on"; } o += "\">\r\n            <a>&bull;</a>\r\n        </li>\r\n    "; } o += "\r\n</ul>\r\n<style>\r\n    .bullets {\r\n        "; if(disableBullets) { o += "\r\n            display: none;\r\n        "; } else { o += "\r\n            display: inline-block;\r\n        "; } o += "\r\n        padding: 0;\r\n        margin: 0;\r\n        "; if (bulletsPos === "right") { o += "\r\n            position: absolute;\r\n            bottom: 5px;\r\n            right: 10px;\r\n        "; } else if (bulletsPos === "left") { o += "\r\n            position: absolute;\r\n            bottom: 5px;\r\n            left: 10px;\r\n        "; } o += "\r\n    }\r\n    .bullets > li {\r\n        list-style: none;\r\n        margin-left: 4px;\r\n    }\r\n    .bullets > li > a {\r\n        margin-top: 1px;\r\n        display: block;\r\n        width: 6px;\r\n        height: 6px;\r\n        overflow: hidden;\r\n        background-color: #fff;\r\n        border: 1px solid #666;\r\n        border-radius: 10px;\r\n        text-indent: -5000px;\r\n    }\r\n    .bullets > li.on > a {\r\n        margin-top: 0;\r\n        width: 8px;\r\n        height: 8px;\r\n        background-color: #333;\r\n        border-color: transparent;\r\n    }\r\n\r\n</style>"; return o; }; });
define('widget/swipe/main',["troopjs-browser/component/widget",
    "jquery",
    "template!./index.html",
    "swipe"
], function (Widget, $, template) {
    "use strict";

    return Widget.extend(function ($element, widgetName) {
        var me = this;
    }, {
        "sig/start": function () {
            var me = this;
            var $me = me.$element;

            var startSlide = parseInt($me.data("startSlide"), 10) || 0;
            var speed = parseInt($me.data("speed"), 10) || 300;
            var auto = parseInt($me.data("auto"), 10) || 0;
            var continuous = $me.data("continuous") || true;
            var disableScroll = $me.data("disableScroll") || false;
            var disableBullets = $me.data("disableBullets") || false;
            var stopPropagation = $me.data("stopPropagation") || false;
            // center, left, right
            var bulletsPos = $me.data("bulletsPos") || "center";

            var swipeLens = $me.find(".swipe-wrap").children().length || 0;

            var $swipeBullets = $(template({
                "swipeLens": swipeLens,
                "startSlide": startSlide,
                "bulletsPos": bulletsPos,
                "disableBullets": disableBullets
            }));
            $me.append($swipeBullets);
            var $bullets = $swipeBullets.find("> li.bullets-item");

            $me.Swipe({
                startSlide: startSlide,
                speed: speed,
                auto: auto,
                continuous: continuous,
                disableScroll: disableScroll,
                stopPropagation: stopPropagation,
                callback: function (i, e) {
                    $bullets.removeClass("on");
                    $bullets.eq(i).addClass("on");
                },
                transitionEnd: function (index, elem) {
                }
            });

        }
    });
});
define('widget/time/main',["troopjs-core/component/gadget",
  "jquery",
  "context"
], function(Gadget, $, context) {
  "use strict";

  var WEEK_START_DAY = 1; // Monday

  function geti18n() {
    var lngMap = {
      "en": {
        "week": [
          ['Sunday', 'Sun'],
          ['Monday', 'Mon'],
          ['Tuesday', 'Tue'],
          ['Wednesday', 'Wed'],
          ['Thursday', 'Thu'],
          ['Friday', 'Fri'],
          ['Saturday', 'Sat']
        ]
      },
      "cn": {
        "week": [
          ['星期日', '日'],
          ['星期一', '一'],
          ['星期二', '二'],
          ['星期三', '三'],
          ['星期四', '四'],
          ['星期五', '五'],
          ['星期六', '六']
        ]
      }
    };
    var lng = context.language || "en";
    return lngMap[lng];
  }

  return Gadget.extend({
    "getZeroDate": function(date) {
      // all date should formatted in: 00:00:00
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    },
    "getShortDate": function(date) {
      return (date.getMonth() + 1) + "/" + date.getDate();
    },
    "getWeekStartDate": function(date) {
      var me = this;
      var inst = date.getDay() - WEEK_START_DAY;
      inst = inst >= 0 ? inst : (inst + 7);
      return me.addDay(date, inst * -1);
    },
    "getDayOfWeekFromMonday": function(date) {
      // 0 = Monday; 6 = Sunday;
      return date.getDay() === 0 ? 6 : date.getDay() - 1;
    },
    "getStrDate": function(date, sep) {
      // 2013/10/10
      if (!date) {
        return "";
      }
      // Reinit Date Object
      date = new Date(date);
      sep = sep || "/";
      // all date should formatted in: 2013/10/10
      return date.getFullYear().toString() +
        sep +
        (date.getMonth() + 1).toString() +
        sep +
        date.getDate().toString();
    },
    "getWeekName": function(day, isAbbr) {
      day = (!isNaN(day) && (day < 7)) ? day : 0;
      var i = isAbbr ? 1 : 0;
      var arrWeekName = geti18n().week;
      return arrWeekName[day][i];
    },
    "addDay": function(date, inst) {
      var temp = new Date(date);
      return new Date(temp.setDate(temp.getDate() + inst));
    },
    "addMonth": function(date, inst) {
      var temp = new Date(date);
      return new Date(temp.setMonth(temp.getMonth() + inst));
    },
    "getDateByString": function(strDate) {
      // "2013-09-10" --> 1378771200000 ms
      var d = new Date(strDate);
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0);

      return d;
    },
    "compareDate": function(baseDate, toCompareDate) {
      // Compare two dates and returns:
      //  -1 : if toCompareDate < baseDate
      //   0 : if toCompareDate === baseDate
      //   1 : if toCompareDate > baseDate
      // NaN : if baseDate or toCompareDate is an illegal date
      // NOTE: The code inside isFinite does an assignment (=).
      return (
        isFinite(baseDate = baseDate.valueOf()) &&
        isFinite(toCompareDate = toCompareDate.valueOf()) ?
        (toCompareDate > baseDate) - (toCompareDate < baseDate) :
        NaN);
    },
    "between": function(baseDate, fromDate, toDate) {
      var me = this;

      if (me.compareDate(baseDate, fromDate) <= 0 && me.compareDate(baseDate, toDate) >= 0) {
        return true;
      } else {
        return false;
      }
    },
    "dayDiff": function(baseDate, toCompareDate) {
      // Get diff days between two Date
      return parseInt((toCompareDate - baseDate) / (1000 * 60 * 60 * 24), 10);
    },
    "weekDiff": function(baseDate, toCompareDate) {
      // Get diff weeks between two Date
      return parseInt((toCompareDate - baseDate) / (1000 * 60 * 60 * 24 * 7), 10);
    },
    "getNearestWeekdayDate": function(date, wdays) {
      var me = this;
      if (!date) {
        return date;
      }

      var day = date.getDay();
      // Has weekdays, select recent date(the nearest date after startdate) match weekdays
      if (wdays && wdays.length > 0) {
        do {
          date = me.addDay(date, 1);
          day = date.getDay();
        } while (wdays.indexOf(day) < 0);
      }

      return date;
    }
  });
});
