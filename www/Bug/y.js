///<amd-module name="rmsajax" />

import customEvent = require("event.custom");

var slice = [].slice;

// States that a resource can be in
var PREFETCHING = 1,
	PREFETCHED = 2,
	LOADING = 3,
	LOADED = 4;

var currentRun = 0;

//Prefix used to register resources as app resources
var AppResourcePrefix = "A:";

//Deferred content container ID
var FDDeferContainerID = "fRmsDefer";
var APPDeferContainerID = "aRmsDefer";

// Holds all the script and style objects to be post-loaded
var scripts = {};
var styles = {};

// Holds the list of callbacks to be executed after ALL resources have been downloaded
var callbacks = [];

// Holds the list of JavaScript and css requests
var jsRequests = [];
var cssRequests = [];

var toString = Object.prototype.toString;

var _d = document;

// Edge useragent regular expression
var edgeRegex = /edge/i;

// The onload function is used to register a callback function for a given list of css or js keys
//      E.g. rms.onload(["jsKey1", "jsKey2"], ["cssKey1", "cssKey2"], function () { alert("done"); });
// The function also supports registering a callback function to be executed
// when ALL the resources have been loaded
//      E.g. rms.onload(function () { alert("All Done"); });
export function onload(...args: any[]) {

	if (args.length == 0) {
		return;
	}

	var callback = args[args.length - 1];

	if (args.length == 1) {
		// Global callback
		if (isFunction(callback)) {
			callbacks.push(callback);
		}
	} else if (args.length == 3) {
		var jsKeys = args[0];
		var cssKeys = args[1];
		var cb = args[2];

		if (isArray(jsKeys) && isArray(cssKeys) && isFunction(cb)) {
			registerResources(scripts, jsKeys, cb);
			registerResources(styles, cssKeys, cb);
		}
	}

	return window["rms"];
}

// This function is used to register one or more javascript resources for post-onload
// For e.g. _w.rms.js({ "key1": "http://www.bing.com/Shared.js" }, { "key2": "http://www.bing.com/fd/sa/PostContent.js" });
export function js() {
	var args = arguments;

	jsRequests.push(args);

	for (var i = 0; i < args.length; i++) {
		var resource = args[i];
		registerResourceObj(resource, scripts);

		// if resource is on demand then load instantly and fetch without prefetching
		if (resource.d) {
			loadScript.call(null, resource);
		}
	}

	return window["rms"];
}

// This function is used to register one or more css resources for post-onload
export function css() {
	var args = arguments;

	cssRequests.push(args);

	for (var i = 0; i < args.length; i++) {
		registerResourceObj(args[i], styles);
	}

	return window["rms"];
}

// This function instructs RMS to start downloading the post-onload resources
export function start(): void {
	// Adds global callbacks to every resource registered with the system
	wireUpGlobalCallbacks();

	var isLoadingResource = false;
	for (var i = 0; i < jsRequests.length; i++) {
		isLoadingResource = loadScript.apply(null, slice.call(jsRequests[i], 0)) || isLoadingResource;
	}

	for (var j = 0; j < cssRequests.length; j++) {
		isLoadingResource = loadCss.apply(null, slice.call(cssRequests[j], 0)) || isLoadingResource;
	}

	if (!isLoadingResource) {
		for (var i = 0; i < callbacks.length; i++) {
			callbacks[i]();
		}
	}
}

// Loads a script
function loadScript(): boolean {
	var args = arguments;

	if (args.length === 0) {
		return false;
	}

	var firstScript = scripts[getKeyFromScriptObject(args[0])];

	if (args.length > 1) {
		// download the scripts without executing
		var scriptsToPrefetch = getScripts.apply(null, args);
		for (var i = 0; i < scriptsToPrefetch.length; i++) {
			var script = scriptsToPrefetch[i];
			script.run = currentRun;

			prefetch(script, function(s) {
				return function() {
					onPrefetchScriptCompleted(s, scriptsToPrefetch)
				}
			}(script));
		}
	} else {
		firstScript.run = currentRun;
		fetchScript(firstScript, function() {
			onFetchScriptCompleted(firstScript);
		});
	}

	return true;
}

// Downloads a resource without executing it
function prefetch(resource: any, callback: any) {
	if (resource.state) {
		return;
	}

	resource.state = PREFETCHING;

	if (isInline(resource)) {
		callback();
		return;
	}

	/* If IsIE, use image tags prefetch the javascript.
    
	   window["ActiveXObject"] !== undefined check can be used to detect all versions of IE until IE11
	   For IE12, this check no longer works and we need to explicitly check user agent.
	   
	   Example Edge useragent: (https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx)
	   Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.<OS build number>
	*/
	if (window["ActiveXObject"] !== undefined || edgeRegex.test(navigator.userAgent)) {
		// If IE use the image tags
		var image = new Image();
		image.onload = callback;
		image.onerror = callback;
		image.src = resource.url;
	} else {
		var obj = <HTMLElement> _d.createElement('object');
        obj.setAttribute("width", "0");
        obj.setAttribute("height", "0");
        obj.setAttribute("aria-hidden", "true");
        obj.onload = callback;
        obj.onerror = callback;
        obj.setAttribute("data", resource.url);

        _d.body.appendChild(obj);
    }
}

function onPrefetchScriptCompleted(script: any, scriptList?: any) {
    if (script.run != currentRun) {
        return;
    }

    script.state = PREFETCHED;
    loadNextScripts(scriptList);
}

function callFetchScriptClosure(script: any, scriptList: any) {
    if (script.run != currentRun) {
        return;
    }

    fetchScript(script, function(res) {
        return function () { onFetchScriptCompleted(res, scriptList); };
    } (script));
}

function onFetchScriptCompleted(script: any, scriptList?: any) {
    if (script.run != currentRun) {
        return;
    }

    script.state = LOADED;
    invokeCallbacks(script);

    if (!scriptList) {
        return;
    }

    loadNextScripts(scriptList);
}

function loadNextScripts(scriptList: any) {
    for (var i = 0; i < scriptList.length; i++) {
        var s = scriptList[i];

        switch (s.state) {
            case PREFETCHED:
                {
                    callFetchScriptClosure(s, scriptList);
                    return;
                }

            case LOADED:
                {
                    continue;
                }
        }

        return;
    }
}

function getKeyFromScriptObject(obj) {
    for (var key in obj) {
        return key;
    }
}

function loadCss(): boolean {
    // TODO
    return false;
}

// Invokes all the event handlers registered for a given resource
function invokeCallbacks(resource) {
    for (var i = 0; i < resource.callbacks.length; i++) {
        resource.callbacks[i].dec();
    }
}

// Creates a script tag and attaches it to the body
function fetchScript(script, callback) {
    if (script.state == LOADING || script.state == LOADED) {
        return;
    }

    script.state = LOADING;

    var scriptTag = <HTMLScriptElement>_d.createElement('SCRIPT');
    scriptTag["type"] = 'text/javascript';
    scriptTag.setAttribute("data-rms", "1");

    scriptTag.onreadystatechange = scriptTag.onload = function () {
        var state = scriptTag.readyState;

        if (!state || /loaded|complete/.test(state)) {
            processCallback(callback);
        }
    };

    if (!isInline(script)) {
        scriptTag["src"] = script.url;
        _d.body.appendChild(scriptTag);

        // The onreadystate change event will process the callback
    }
    else {
        var containerId = script.app ? APPDeferContainerID : FDDeferContainerID, div, childNodes;
        if ((div = _d.getElementById(containerId)) && (childNodes = div.childNodes) && childNodes[script.pos]) {
            var textString = childNodes[script.pos]["innerHTML"];
            if(textString !== "")
            {
                // The html comment portion needs to be stripped of this text content
                var htmlCommentStartLen = 4;
                var htmlCommentEndLen = 3;
                var textLen = textString.length;
                var prefixText = textString.substring(0, htmlCommentStartLen);
                var suffixText = textString.substring((textLen - htmlCommentEndLen), textLen);
                if (prefixText == "<!--" && suffixText == "-->") {
                    textString = textString.substring(htmlCommentStartLen, textLen - htmlCommentEndLen);
                }

                scriptTag["text"] = textString;

                _d.body.appendChild(scriptTag);
            }
        }

        // For inline scripts, do not rely on onreadystate change to fire (Does not work in chrome and safari)
        // Since script execution is synchronous, call the callback state here.
        processCallback(callback);
    }

}

function processCallback(callback) {
    if (!callback.done) {
        callback.done = true;
        callback();
    }
}

// Represents a callback object that monitors itself as all its dependencies are downloaded and executed
// When the counts reach 0 for all dependencies, the callback executes itself
var callbackObj = function (cb) {
    var count = 0;
    var done = false;

    this.inc = function () {
        !done && count++;
    }

    this.dec = function () {
        if (!done) {
            count--;

            if (count == 0) {
                done = true;
                cb();
            }
        }
    }
}

function isFunction(obj: any) {
    return toString.call(obj) == '[object Function]';
}

function isArray(obj: any) {
    return toString.call(obj) == '[object Array]';
}

function registerResources(resources, keys, callback) {
    var resourceColl = [];

    var cbObj = new callbackObj(callback);

    for (var i = 0; i < keys.length; i++) {
        var resource = resources[keys[i]];

        if (!resource) {
            resource = register(resources, keys[i]);
        }

        registerCallbackWithResource(resource, cbObj);
    }
}

function wireUpGlobalCallbacks() {
    for (var i = 0; i < callbacks.length; i++) {
        var cbObj = new callbackObj(callbacks[i]);

        for (var script in scripts) {
            registerCallbackWithResource(scripts[script], cbObj);
        }

        for (var style in styles) {
            registerCallbackWithResource(styles[style], cbObj);
        }
    }
}

function registerCallbackWithResource(resource: any, cbObj: any) {
    resource.callbacks.push(cbObj);
    cbObj.inc();
}

function registerResourceObj(obj: any, resources: any) {
    for (var key in obj) {
        if (typeof (obj[key]) != undefined) {
            return register(resources, key, obj[key]);
        }
    }
}

function register(resources, key: string, loc?: any) {
    if (!resources[key]) {
        resources[key] = { "callbacks": [], "onPrefetch": [] };
        resources[key].key = key;
    }

    //Check for application prefix
    if (key.indexOf(AppResourcePrefix) == 0) {
        resources[key].app = true;
    }

    if (!isNaN(loc)) {
        // if loc is a number, this is an inline resource
        resources[key].pos = loc;
    }
    else {
        // Its not a number so, url
        resources[key].url = loc;
    }

    return resources[key];
}

function getScripts() {
    var scriptList = [];
    for (var i = 0; i < arguments.length; i++) {
        var key = getKeyFromScriptObject(arguments[i]);
        scriptList.push(scripts[key]);
    }

    return scriptList;
}

function isInline(resource) {
    return !resource.url;
}

export function reset() : void {
    scripts = {};
    styles = {};

    callbacks = [];

    jsRequests = [];
    cssRequests = [];

    currentRun += 1;

    // Remove placeholders so we can start fresh
    var fdContainer = document.getElementById(FDDeferContainerID);
    if (fdContainer) fdContainer.parentNode.removeChild(fdContainer);

    var appContainer = document.getElementById(APPDeferContainerID);
    if (appContainer) appContainer.parentNode.removeChild(appContainer);

    wireup();
}

function wireup() : void {
    customEvent.bind("onP1Lazy",
      function () {
          onload(function () { customEvent.fire("onP1"); });
          start();
      },
      true // Bind retroactively -- will fire even if "OnP1Lazy" has been fired before this call
    );
}

wireup();

//Legacy support
window["rms"] = { onload: onload, js: js, start: start }