_w["EventsToDuplicate"] = [];
;_w["useSharedLocalStorage"] = false;
;///<amd-module name="shared" />
///<reference path="..\Declarations\Shared.d.ts"/>
define("shared", ["require", "exports"], function (require, exports) {
    var isIE = sb_ie;
    function forEach(array, closure) {
        var len = array.length;
        for (var i = 0; i < len; i++) {
            closure(array[i]);
        }
    }
    exports.forEach = forEach;
    function wrap(functionRef) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        // Typescript automatically injects code that creates the args array using arguments.
        // Hence there is no need to use the [].slice trick over here.
        return function () {
            functionRef.apply(null, args);
        };
    }
    exports.wrap = wrap;
    function preventDefault(evt) {
        if (isIE && event) {
            event.returnValue = false;
        }
        if (evt && typeof evt.preventDefault === "function") {
            evt.preventDefault();
        }
    }
    exports.preventDefault = preventDefault;
    function stopPropagation(evt) {
        if (isIE && event) {
            event.cancelBubble = true;
        }
        if (evt && typeof evt.stopPropagation === "function") {
            evt.stopPropagation();
        }
    }
    exports.stopPropagation = stopPropagation;
    function getOffset(element, leftOrTop, parentElement) {
        var offset = 0;
        while (element && element.offsetParent && element != (parentElement || document.body)) {
            offset += element["offset" + leftOrTop];
            element = element["offsetParent"];
        }
        return offset;
    }
    exports.getOffset = getOffset;
    function getTime() {
        return new Date().getTime();
    }
    exports.getTime = getTime;
    /* Internal Functions only available for legacy purposes */
    function getEvent(e) {
        return isIE ? event : e;
    }
    function getEventTarget(e) {
        return isIE ? (event ? event.srcElement : null) : e.target;
    }
    function getMouseInTarget(e) {
        return isIE ? (event ? event.fromElement : null) : e.relatedTarget;
    }
    function getMouseOutTarget(e) {
        return isIE ? (event ? event.toElement : null) : e.relatedTarget;
    }
    function withinElement(element, targetElement, parentElement) {
        while (element && element != (parentElement || document.body)) {
            if (element == targetElement)
                return !0; // return true
            element = element["parentNode"];
        }
        return !1; // return false
    }
    function changeLocation(url) {
        window.location.href = url;
    }
    function setOpacity(elem, nOpacity) {
        elem.style.filter = (nOpacity >= 100) ? "" : "alpha(opacity=" + nOpacity + ")";
        elem.style.opacity = nOpacity / 100;
    }
    // Legacy Support
    window["sj_b"] = document.body;
    window["sb_de"] = document.documentElement;
    window["sj_wf"] = wrap;
    window["sj_pd"] = preventDefault;
    window["sj_sp"] = stopPropagation;
    window["sj_go"] = getOffset;
    window["sj_ev"] = getEvent;
    window["sj_et"] = getEventTarget;
    window["sj_mi"] = getMouseInTarget;
    window["sj_mo"] = getMouseOutTarget;
    window["sj_we"] = withinElement;
    window["sb_gt"] = getTime;
    window["sj_so"] = setOpacity;
    window["sj_lc"] = changeLocation;
});
;// Bug 860425 : Ajaxserp: Rewrite script in typescript once amd allows forking of file
define('env', ["require", "exports", "shared"], function (require, exports, __shared__) {
    var shared = __shared__;
    var timeouts = [];
    var intervals = [];
    var realSetTimeout;
    var realClearTimeout;
    var realSetInterval;
    function wrapFunctionCall(code, args) {
        if (args.length && typeof code === "function") {
            return function () { return code.apply(null, args); };
        }
        else {
            return code;
        }
    }
    realSetTimeout = window.setTimeout;
    function setTimeout(code, delay) {
        var args = [].slice.apply(arguments).slice(2);
        var wrapped = wrapFunctionCall(code, args);
        var timeout;
        if (window.setImmediate && !window.setImmediate.Override && (!delay || delay <= 16)) {
            timeout = 'i' + setImmediate(wrapped);
        }
        else {
            timeout = realSetTimeout(wrapped, delay);
        }
        timeouts.push(timeout);
        return timeout;
    }
    exports.setTimeout = setTimeout;
    realSetInterval = window.setInterval;
    function setInterval(code, delay) {
        var args = [].slice.apply(arguments).slice(2);
        var interval = realSetInterval(wrapFunctionCall(code, args), delay);
        intervals.push(interval);
        return interval;
    }
    exports.setInterval = setInterval;
    function clear() {
        shared.forEach(timeouts, clearTimeout);
        shared.forEach(intervals, window["clearInterval"]);
        timeouts.length = 0;
        intervals.length = 0;
    }
    exports.clear = clear;
    realClearTimeout = window.clearTimeout;
    function clearTimeout(id) {
        if (id == null) {
            return;
        }
        if (typeof id === "string" && id.indexOf("i") === 0) {
            window.clearImmediate(parseInt(id.substr(1), 10));
        }
        else {
            realClearTimeout(id);
        }
    }
    exports.clearTimeout = clearTimeout;
    window["sb_rst"] = realSetTimeout;
    window.setTimeout = window["sb_st"] = setTimeout;
    window.setInterval = window["sb_si"] = setInterval;
    window.clearTimeout = window["sb_ct"] = clearTimeout;
});
;// Bug 860425 : Ajaxserp: Rewrite script in typescript once amd allows forking of file
define('event.custom', ["require", "exports", "shared", "env"], function (require, exports, __shared__, __env__) {
    var shared = __shared__;
    var env = __env__;
    var hash = {};
    var persistentEventPrefix = "ajax.";
    function register(id) {
        // returns hash[id] if it is defined, or the result of hash[id] being intialized to an array (which is a reference to hash[id])
        return (hash[id] || (hash[id] = []));
    }
    function fireHandler(handler, customEvent) {
        // handler "d" property is the delay before calling handler
        if (handler["d"]) {
            env.setTimeout(shared.wrap(handler, customEvent), handler["d"]);
        }
        else {
            handler(customEvent);
        }
    }
    function reset(customEventsToPersist) {
        for (var id in hash) {
            if (!(id.indexOf(persistentEventPrefix) === 0) && !(customEventsToPersist != null && customEventsToPersist[id] != null)) {
                delete hash[id];
            }
        }
    }
    exports.reset = reset;
    // fire event
    function fire(id) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        // register event in the event hash (if not already registered by bind)
        var handlers = register(id);
        // set an event property on the handler array that contains arguments passed to fire - used in "bind" for retroactively binding to an event
        var customEvent = handlers["e"] = arguments;
        for (var i = 0; i < handlers.length; i++) {
            if (handlers[i].alive) {
                fireHandler(handlers[i].func, customEvent);
            }
        }
    }
    exports.fire = fire;
    // bind event
    function bind(id, eventHandler, isRetro, delay) {
        // register event in the global event hash (if not already registered by fire)
        var handlers = register(id);
        if (eventHandler) {
            eventHandler["d"] = delay;
            handlers.push({
                func: eventHandler,
                alive: true
            });
            // if binding is retroactive and the event has fired, call the handler immediately passing a reference to the last-fired event object
            isRetro && handlers["e"] && fireHandler(eventHandler, handlers["e"]);
        }
    }
    exports.bind = bind;
    // unbind event
    function unbind(id, eventHandler) {
        for (var i = 0, handlers = hash[id]; handlers && i < handlers.length; i++) {
            if (handlers[i].func == eventHandler && handlers[i].alive) {
                handlers[i].alive = false;
                break;
            }
        }
    }
    exports.unbind = unbind;
    // Legacy Support
    _w["sj_evt"] = {
        bind: bind,
        unbind: unbind,
        fire: fire
    };
});
;///<amd-module name="event.native" />
define("event.native", ["require", "exports", "event.custom"], function (require, exports, custom) {
    function bind(element, eventName, callback, isCapture) {
        //console.log("native-bind: " + eventName);
        var elementOk = (element === window || element === document || element === document.body);
        if (element) {
            // Divert some native bindings to custom events
            if (elementOk && eventName == 'load') {
                custom.bind("onP1", callback, true);
            }
            else if (elementOk && eventName == 'unload') {
                custom.bind("unload", callback, true);
            }
            else if (element.addEventListener) {
                element.addEventListener(eventName, callback, isCapture);
            }
            else if (element.attachEvent) {
                element.attachEvent("on" + eventName, callback);
            }
            else {
                element["on" + eventName] = callback;
            }
        }
    }
    exports.bind = bind;
    function unbind(element, eventName, callback, isCapture) {
        //console.log("native-unbind: " + eventName);
        var elementOk = (element === window || element === document || element === document.body);
        if (element) {
            if (elementOk && eventName == 'load') {
                custom.unbind("onP1", callback);
            }
            else if (elementOk && eventName == 'unload') {
                custom.unbind("unload", callback);
            }
            else if (element.removeEventListener) {
                element.removeEventListener(eventName, callback, isCapture);
            }
            else if (element.detachEvent) {
                element.detachEvent("on" + eventName, callback);
            }
            else {
                element["on" + eventName] = null;
            }
        }
    }
    exports.unbind = unbind;
    // Legacy Support
    window["sj_be"] = bind;
    window["sj_ue"] = unbind;
});
;///<amd-module name="dom" />
///<reference path="..\Declarations\Shared.d.ts"/>
define("dom", ["require", "exports", "env", "shared", "event.native", "event.custom"], function (require, exports, env, shared, nativeEvents, customEvents) {
    function loadJS(scriptName, isRenderedRemotely /*,[el, event]*/) {
        // attach each element/event pair to load function
        var args = arguments;
        var el, evt;
        var i = 2;
        var script = { n: scriptName };
        for (; i < args.length; i += 2) {
            el = args[i];
            evt = args[i + 1];
            nativeEvents.bind(el, evt, shared.wrap(load, script, isRenderedRemotely, el, evt));
        }
        function load(script, isRenderedRemotely, elementBoundToLoad, eventBoundToLoad) {
            // unbind event
            elementBoundToLoad && nativeEvents.unbind(elementBoundToLoad, eventBoundToLoad, load);
            // do not download any script until 5 ms after onP1 fires
            customEvents.bind("onP1", function () {
                if (!script.l) {
                    // mark script as loaded so it won't get loaded again
                    // this is necessary because we support attaching multiple events to trigger loading
                    script.l = 1;
                    // load script
                    var scriptElement = createElement("script");
                    scriptElement.setAttribute("data-rms", "1");
                    scriptElement.src = (isRenderedRemotely ? "/fd/sa/" + _G.Ver : "/sa/" + _G.AppVer) + "/" + script.n + ".js";
                    _d.body.appendChild(scriptElement);
                }
            }, true, 5);
        }
        // no element/event pairs passed, load immediately
        i < 3 && load(script, isRenderedRemotely);
    }
    exports.loadJS = loadJS;
    function getCssHolder() {
        var cssHolder = _d.getElementById("ajaxStyles");
        if (!cssHolder) {
            cssHolder = _d.createElement("div");
            cssHolder.id = "ajaxStyles";
            _d.body.insertBefore(cssHolder, _d.body.firstChild);
        }
        return cssHolder;
    }
    exports.getCssHolder = getCssHolder;
    function includeScript(scriptString) {
        var script = createElement("script");
        script["type"] = 'text/javascript';
        script["text"] = scriptString;
        script.setAttribute("data-bing-script", "1");
        document.body.appendChild(script);
        // Remove the script element from DOM after processing it
        env.setTimeout(function () {
            document.body.removeChild(script);
        }, 0);
    }
    exports.includeScript = includeScript;
    function includeScriptReference(scriptUrl) {
        var script = createElement("script");
        script["type"] = 'text/javascript';
        script["src"] = scriptUrl;
        // Remove the script element from DOM after processing it
        script["onload"] = env.setTimeout(function () {
            document.body.removeChild(script);
        }, 0);
        document.body.appendChild(script);
    }
    exports.includeScriptReference = includeScriptReference;
    function includeCss(cssString) {
        var style = getElementById("ajaxStyle");
        if (!style) {
            style = createElement("style");
            style.setAttribute("data-rms", "1");
            style.id = "ajaxStyle";
            getCssHolder().appendChild(style);
        }
        if (style.textContent !== undefined) {
            style.textContent += cssString;
        }
        else {
            style["styleSheet"]["cssText"] += cssString;
        }
    }
    exports.includeCss = includeCss;
    /* Internal Methods for Legacy Support */
    function getElementById(id) {
        return _d.getElementById(id);
    }
    function createElement(tagName, id, className) {
        var element = _d.createElement(tagName);
        if (id)
            element.id = id;
        if (className)
            element.className = className;
        return element;
    }
    _w["_ge"] = getElementById;
    _w["sj_ce"] = createElement;
    _w["sj_jb"] = loadJS;
    _w["sj_ic"] = includeCss;
});
;///<amd-module name="cookies" />
///<reference path="..\Declarations\Shared.d.ts"/>
define("cookies", ["require", "exports"], function (require, exports) {
    var cookieAccessDenied = false;
    var expiredDateString = (new Date(0)).toGMTString();
    var parseCookiesRegex = new RegExp("([^=]+)=([^;]*)(; )?", "g");
    var parseCrumbsRegex = new RegExp("([^=]+)=([^&]*)&?", "g");
    try {
        var cookie = _d.cookie;
    }
    catch (e) {
        cookieAccessDenied = true;
    }
    function get(cookieName, crumbName) {
        if (cookieAccessDenied) {
            return null;
        }
        var cookieMatch = _d.cookie.match(new RegExp("\\b" + cookieName + "=[^;]+"));
        if (crumbName && cookieMatch) {
            var crumbMatch = cookieMatch[0].match(new RegExp("\\b" + crumbName + "=([^&]*)"));
            return crumbMatch ? crumbMatch[1] : null;
        }
        return cookieMatch ? cookieMatch[0] : null;
    }
    exports.get = get;
    function set(cookieName, crumbName, crumbValue, isPersistent, path, expires) {
        if (cookieAccessDenied) {
            return null;
        }
        var newCookie;
        var newCrumb = crumbName + "=" + crumbValue;
        var cookieString = get(cookieName);
        if (cookieString) {
            var oldCrumbValue = get(cookieName, crumbName);
            newCookie = (oldCrumbValue ? cookieString.replace(crumbName + "=" + oldCrumbValue, newCrumb) : cookieString + "&" + newCrumb); // crumb doesnt exist add the crumb
        }
        else {
            newCookie = cookieName + "=" + newCrumb;
        }
        var domain = location.hostname.match(/([^.]+\.[^.]*)$/);
        var validPeriod = (expires && expires > 0) ? expires * 60000 : 63072000000 /*2 years*/;
        var expireDate = new Date(new Date().getTime() + Math.min(validPeriod, 63072000000));
        _d.cookie = newCookie + (domain ? ";domain=" + domain[0] : "") + (isPersistent ? ";expires=" + expireDate.toGMTString() : "") + (path ? ";path=" + path : "");
    }
    exports.set = set;
    function clear(cookieName) {
        if (!cookieAccessDenied) {
            var newCookie = cookieName + '=';
            var domain = location.hostname.match(/([^.]+\.[^.]*)$/);
            _d.cookie = newCookie + (domain ? ";domain=" + domain[0] : "") + ";expires=" + expiredDateString;
        }
    }
    exports.clear = clear;
    // Parse cookie string into an object array
    function parse() {
        var returnObject = null;
        if (!cookieAccessDenied) {
            returnObject = {};
            var documentCookie = _d.cookie;
            var currentCookie;
            while (currentCookie = parseCookiesRegex.exec(documentCookie)) {
                var currentCrumb;
                var crumbsObject = {};
                var hasCrumbs = false;
                while (currentCrumb = parseCrumbsRegex.exec(currentCookie[2])) {
                    hasCrumbs = true;
                    crumbsObject[currentCrumb[1]] = currentCrumb[2];
                }
                if (!hasCrumbs) {
                    crumbsObject = currentCookie[2];
                }
                returnObject[currentCookie[1]] = crumbsObject;
            }
        }
        return returnObject;
    }
    exports.parse = parse;
    // Legacy Support
    _w["sj_cook"] = { get: get, set: set, clear: clear, parse: parse };
});
;define("rmsajax", ["require", "exports", "event.custom"], function (require, exports, customEvent) {
    var slice = [].slice;
    // States that a resource can be in
    var PREFETCHING = 1, PREFETCHED = 2, LOADING = 3, LOADED = 4;
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
    function onload() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (args.length == 0) {
            return;
        }
        var callback = args[args.length - 1];
        if (args.length == 1) {
            // Global callback
            if (isFunction(callback)) {
                callbacks.push(callback);
            }
        }
        else if (args.length == 3) {
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
    exports.onload = onload;
    // This function is used to register one or more javascript resources for post-onload
    // For e.g. _w.rms.js({ "key1": "http://www.bing.com/Shared.js" }, { "key2": "http://www.bing.com/fd/sa/PostContent.js" });
    function js() {
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
    exports.js = js;
    // This function is used to register one or more css resources for post-onload
    function css() {
        var args = arguments;
        cssRequests.push(args);
        for (var i = 0; i < args.length; i++) {
            registerResourceObj(args[i], styles);
        }
        return window["rms"];
    }
    exports.css = css;
    // This function instructs RMS to start downloading the post-onload resources
    function start() {
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
    exports.start = start;
    // Loads a script
    function loadScript() {
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
                prefetch(script, function (s) {
                    return function () {
                        onPrefetchScriptCompleted(s, scriptsToPrefetch);
                    };
                }(script));
            }
        }
        else {
            firstScript.run = currentRun;
            fetchScript(firstScript, function () {
                onFetchScriptCompleted(firstScript);
            });
        }
        return true;
    }
    // Downloads a resource without executing it
    function prefetch(resource, callback) {
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
        }
        else {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", resource.url, true);
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4) {
                    callback();
                }
            };
            xmlhttp.send();
        }
    }
    function onPrefetchScriptCompleted(script, scriptList) {
        if (script.run != currentRun) {
            return;
        }
        script.state = PREFETCHED;
        loadNextScripts(scriptList);
    }
    function callFetchScriptClosure(script, scriptList) {
        if (script.run != currentRun) {
            return;
        }
        fetchScript(script, function (res) {
            return function () {
                onFetchScriptCompleted(res, scriptList);
            };
        }(script));
    }
    function onFetchScriptCompleted(script, scriptList) {
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
    function loadNextScripts(scriptList) {
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
    function loadCss() {
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
        var scriptTag = _d.createElement('SCRIPT');
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
        }
        else {
            var containerId = script.app ? APPDeferContainerID : FDDeferContainerID, div, childNodes;
            if ((div = _d.getElementById(containerId)) && (childNodes = div.childNodes) && childNodes[script.pos]) {
                var textString = childNodes[script.pos]["innerHTML"];
                if (textString !== "") {
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
        };
        this.dec = function () {
            if (!done) {
                count--;
                if (count == 0) {
                    done = true;
                    cb();
                }
            }
        };
    };
    function isFunction(obj) {
        return toString.call(obj) == '[object Function]';
    }
    function isArray(obj) {
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
    function registerCallbackWithResource(resource, cbObj) {
        resource.callbacks.push(cbObj);
        cbObj.inc();
    }
    function registerResourceObj(obj, resources) {
        for (var key in obj) {
            if (typeof (obj[key]) != undefined) {
                return register(resources, key, obj[key]);
            }
        }
    }
    function register(resources, key, loc) {
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
    function reset() {
        scripts = {};
        styles = {};
        callbacks = [];
        jsRequests = [];
        cssRequests = [];
        currentRun += 1;
        // Remove placeholders so we can start fresh
        var fdContainer = document.getElementById(FDDeferContainerID);
        if (fdContainer)
            fdContainer.parentNode.removeChild(fdContainer);
        var appContainer = document.getElementById(APPDeferContainerID);
        if (appContainer)
            appContainer.parentNode.removeChild(appContainer);
        wireup();
    }
    exports.reset = reset;
    function wireup() {
        customEvent.bind("onP1Lazy", function () {
            onload(function () {
                customEvent.fire("onP1");
            });
            start();
        }, true);
    }
    wireup();
    //Legacy support
    window["rms"] = { onload: onload, js: js, start: start };
});
;///<reference path="..\..\Declarations\Shared.d.ts"/>
_w["InstrumentationConfig"] = { VisibilityEventEnabled: false };
;/// <reference path="..\..\Declarations\Shared.d.ts"/>
_w["LogUploadCapFeatureEnabled"] = false;
;/// <reference path="..\..\Declarations\Shared.d.ts"/>
_w["InstLogQueueKeyFetcher"] = {
    Get: function (path) {
        // For old build of windows 10, keeping existing logic of splitting EventLong queue
        var queueKeyPrefix = "eventLogQueue";
        var queueKey;
        if (path.indexOf("proactive") == 1 || path.indexOf("search") == 1 || path.indexOf("zinc") == 1) {
            queueKey = queueKeyPrefix + "_Online";
        }
        else {
            queueKey = queueKeyPrefix + "_Offline";
        }
        return queueKey;
    },
    GetSharedLocation: function () {
        return "eventLogQueue_Shared";
    },
    CanUploadSharedMessages: function (path) {
        if (_w["useSharedLocalStorage"] && path.indexOf("AS/API") === 1) {
            return true;
        }
        else {
            return false;
        }
    }
};
;0;
;///<amd-module name="clientinst_xls" />
///<reference path="..\..\Declarations\Shared.d.ts"/>
define("clientinst_xls", ["require", "exports", "env", "event.native", "event.custom", "shared"], function (require, exports, env, nativeEvents, customEvents, shared) {
    var LogType;
    (function (LogType) {
        LogType[LogType["EVENT"] = 0] = "EVENT";
        LogType[LogType["MASTER_PAGE_IMPRESSION"] = 1] = "MASTER_PAGE_IMPRESSION";
    })(LogType || (LogType = {}));
    var MUID = "MUID";
    var _CachedFlightsJoined = null;
    var EventType_CIQueueError = "CIQueueError";
    var clientInstConfig;
    var MilliSecondsInADay = 1000 * 60 * 60 * 24;
    // Sequence attributes to be logged with events
    var sequenceIndex;
    var startTime;
    // initialized below in a try/catch block
    var localStorage;
    var incompleteMpis = [];
    var populatePageInfo;
    var lastPageUrl;
    function initializeConfig() {
        // Default settings
        var FLUSH_INTERVAL = 5000;
        var RETRY_INTERVAL = 1000;
        // We need to stay below 1Mb, which is roughly 500k chars (pessimistically)
        var MAX_STORAGE_USE = 500000;
        // XLS returns 404 if given more than 200kb at once, so we will send no more than 100k chars
        var MAX_BATCH_SIZE = 100000;
        var QUEUE_DUMP_INTERVAL = 500;
        var PAGE_INFO_TIMEOUT = 5000;
        // Number of characters allowed to upload per interval per scenario per device
        // Limit is 15Mb and interval is 30 days. (2 bytes are needed per char)
        var LOG_UPLOAD_CAP_SIZE_IN_CHAR = 15 * 1024 * 1024 * 0.5;
        var LOG_UPLOAD_CAP_INTERVAL_IN_DAYS = 30;
        function assignDefaultConfigSetting(key, value) {
            if (typeof clientInstConfig[key] === "undefined") {
                clientInstConfig[key] = value;
            }
        }
        if (!_w['ClientInstConfig']) {
            _w['ClientInstConfig'] = {};
        }
        clientInstConfig = ClientInstConfig;
        // Apply default settings if some of the settings are not defined
        assignDefaultConfigSetting("flushInterval", FLUSH_INTERVAL);
        assignDefaultConfigSetting("retryInterval", RETRY_INTERVAL);
        assignDefaultConfigSetting("maxStorageUse", MAX_STORAGE_USE);
        assignDefaultConfigSetting("maxBatchSize", MAX_BATCH_SIZE);
        assignDefaultConfigSetting("queueDumpInterval", QUEUE_DUMP_INTERVAL);
        assignDefaultConfigSetting("waitForPageInfo", false);
        assignDefaultConfigSetting("pageInfoTimeout", PAGE_INFO_TIMEOUT);
        assignDefaultConfigSetting("logUploadCapSizeInChar", LOG_UPLOAD_CAP_SIZE_IN_CHAR);
        assignDefaultConfigSetting("logUploadCapIntervalInDays", LOG_UPLOAD_CAP_INTERVAL_IN_DAYS);
        assignDefaultConfigSetting("isInstrumentationEnabled", true);
    }
    function initializeEventSequence() {
        sequenceIndex = 0;
        startTime = _G.ST ? _G.ST.getTime() : 0;
    }
    /*
    Logs instrumentation errors
    Error types:
    - QueueOverflow
    - InvalidIncompleteImpressions;
    - PageInfoTimedOut
    - QueueRestoreFailed
    - QueueRestoreInvalidItems
    If sendDirect is set to true, the method bypasses the regular queue and tries to send the message directly
    It is needs to cases when queue processing is likely broken (as when the queue is overflowing in online mode)
    */
    function logError(errorType, failCount, impressionGuid, sendDirect) {
        var eventData = {
            errorType: errorType,
            failCount: failCount
        };
        collectCommonEventProperties(eventData);
        if (!sendDirect) {
            LogEvent(EventType_CIQueueError, eventData, null, null, null, impressionGuid, null, null);
        }
        else {
            var logEvent = {
                impressionGuid: impressionGuid,
                previousImpressionGuid: null,
                timestamp: shared.getTime(),
                type: 0 /* EVENT */,
                data: {
                    eventType: EventType_CIQueueError,
                    eventData: eventData
                }
            };
            var payload = createPayload([logEvent], []);
            try {
                var errorRequest = sj_gx();
                errorRequest.open("POST", _G.XLS, true);
                errorRequest.send(payload);
            }
            catch (e) {
                throw e;
            }
        }
    }
    // This module encapsulates message queue operations:
    // - enqueing
    // - batching items up to given batch size
    // - cleaning up processed items
    // - dumping queue to disk and restoring it on initialization
    // We keep the event queue in memory but dump it to localStorage every now and then in case the app exits or crashes
    var Queue;
    (function (Queue) {
        var queue = [];
        var logUploadIntervalStartDateValue;
        var uploadedLogSizeInInterval;
        var localStorageAvailable = false;
        // A handle used to schedule dumps of queue to storage
        var dumpTimer = null;
        // This array contains items that have failed to be processed by XLS multiple times
        var retryList = [];
        var path = _w.location.pathname;
        var queueKey = InstLogQueueKeyFetcher.Get(path);
        var sharedQueueKey = InstLogQueueKeyFetcher.GetSharedLocation();
        var uploadShared = InstLogQueueKeyFetcher.CanUploadSharedMessages(path);
        function canUseLocalStorage() {
            return localStorageAvailable && clientInstConfig.isInstrumentationEnabled;
        }
        function dumpToStorage(dumpToSharedStorage) {
            if (dumpToSharedStorage === void 0) { dumpToSharedStorage = false; }
            if (!canUseLocalStorage()) {
                return;
            }
            var valuesJson = trimQueueForStorage(dumpToSharedStorage);
            try {
                var writeLocation;
                if (dumpToSharedStorage) {
                    writeLocation = sharedQueueKey;
                }
                else {
                    writeLocation = queueKey;
                }
                localStorage[writeLocation] = valuesJson;
                localStorage[writeLocation + "_logUploadIntervalStartDate"] = logUploadIntervalStartDateValue;
                localStorage[writeLocation + "_uploadedLogSizeInInterval"] = uploadedLogSizeInInterval;
            }
            catch (e) {
                if (e.name.toLowerCase().indexOf("quota") >= 0) {
                    // if the error is something like QUOTA_EXCEEDED_ERR, then the localStorage append failed;
                    // the exact error message is unfortunately different across browsers, but appears to always
                    // contain the string "quota"
                    localStorageAvailable = false;
                }
                else {
                    throw e;
                }
            }
        }
        Queue.dumpToStorage = dumpToStorage;
        // Schedules a dump to storage at some point in near future when (supposedly) all queue operations are done for the time being
        // If the dump is already scheduled, it is rescheduled because the queue may not be done yet
        function scheduleDump() {
            if (canUseLocalStorage()) {
                if (dumpTimer) {
                    sb_ct(dumpTimer);
                }
                dumpTimer = sb_st(dumpToStorage, clientInstConfig.queueDumpInterval);
            }
        }
        // Creates a JSON representation of queue item and sets the size field on it
        function serialize(obj, updateSize) {
            var json = JSON.stringify(obj);
            var size = json.length + 3; // 3+1=4 chars reserved for size value
            obj.size = size;
            return updateSize ? json.replace('"size":0', '"size":' + size) : json;
        }
        function wrapLogObject(obj) {
            if (_CachedFlightsJoined === null && typeof (_CachedFlights) !== "undefined" && _CachedFlights.sort) {
                _CachedFlightsJoined = _CachedFlights.sort().join(",");
            }
            return {
                log: obj,
                lastSendErrorTimeStamp: 0,
                inProgress: false,
                size: 0,
                flights: _CachedFlightsJoined
            };
        }
        // Initializes the Queue by trying to read it from localStorage
        function initialize() {
            if (localStorage) {
                initializeLogUploadCounter();
                var storedJson = localStorage[queueKey];
                queue = [];
                // If string representation doesn't exist or is empty, it's likely that this is the first run or the cache has been cleared
                if (typeof storedJson === "string" || storedJson && storedJson.length !== 0) {
                    try {
                        queue = JSON.parse(storedJson);
                        if (queue.some(function (obj) { return !obj.log; })) {
                            logError("PrimaryQueueRestoreInvalidItems", queue.length, _G.IG);
                            queue = [];
                        }
                        else {
                            var queueLength = queue.length;
                            if (queueLength > 0) {
                                for (var i = 0; i < queueLength; i++) {
                                    queue[i].inProgress = false;
                                }
                                scheduleQueueFlush();
                            }
                        }
                    }
                    catch (e) {
                        // Whatever was there, we can't use it
                        logError("PrimaryQueueRestoreFailed", 0, _G.IG);
                    }
                }
                localStorage[queueKey] = "[]";
                localStorageAvailable = true;
            }
        }
        Queue.initialize = initialize;
        // Produces a batch of queue items to upload to server
        // If isRetry is set to true, the items are taken from the retry list (previously failed items)
        function getBatch(isRetry) {
            var events = [];
            var mpis = [];
            var src = isRetry ? retryList[0] : queue;
            if (uploadShared) {
                var storedSharedJson = localStorage[sharedQueueKey];
                // If string representation doesn't exist or is empty, there is nothing in the shared local storage to upload
                if (typeof storedSharedJson === "string" && storedSharedJson.length !== 0) {
                    try {
                        var sharedQueue = JSON.parse(storedSharedJson);
                        if (sharedQueue.some(function (obj) { return !obj.log; })) {
                            logError("SharedQueueRestoreInvalidItems", sharedQueue.length, _G.IG);
                        }
                        else {
                            if (src) {
                                Array.prototype.push.apply(src, sharedQueue);
                            }
                            else {
                                src = sharedQueue;
                            }
                        }
                    }
                    catch (e) {
                        logError("SharedQueueRestoreFailed", 0, _G.IG);
                    }
                }
                localStorage[sharedQueueKey] = "[]";
            }
            if (src) {
                var batchSize = 0;
                var queueLength = src.length;
                for (var i = 0; i < queueLength; i++) {
                    var elem = src[i];
                    // Skip failed items if we are not retrying
                    if (!isRetry && elem.lastSendErrorTimeStamp) {
                        continue;
                    }
                    batchSize += elem.size;
                    if (batchSize <= clientInstConfig.maxBatchSize) {
                        elem.inProgress = true;
                        var log = elem.log;
                        if (log.type == 1 /* MASTER_PAGE_IMPRESSION */) {
                            mpis.push(elem);
                        }
                        else {
                            events.push(elem);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return {
                events: events,
                masterPageImpressions: mpis,
                length: events.length + mpis.length,
                isRetryBatch: isRetry
            };
        }
        Queue.getBatch = getBatch;
        // Clears sent items from the queue
        // Returns a value indicating whether there are items outstanding
        function clearSentItems(clearOnlyRetryItems) {
            // Removing everything that has been sent
            queue = queue.filter(function (v) { return !v.inProgress && (!clearOnlyRetryItems || !!v.lastSendErrorTimeStamp); });
            scheduleDump();
            return queue.length > 0;
        }
        Queue.clearSentItems = clearSentItems;
        function isEventQueueError(event) {
            return event.log.type === 0 /* EVENT */ && event.log.data && event.log.data.eventType === EventType_CIQueueError;
        }
        // Marks items that failed to upload
        // The parameter indicates whether they failed because they are corrupt (server returned bad request) or other reason (5xx, etc.)
        function markFailedItems(badRequest, useRetryQueue) {
            var repeatedlyFailedItems = [];
            var srcQueue = useRetryQueue ? retryList[0] : queue;
            // Might want to consider replacing the closure with a separate named method to improve perf
            var i = 0;
            while (i < srcQueue.length) {
                var v = srcQueue[i];
                if (v.inProgress) {
                    if (badRequest) {
                        // Remove in progress item out of main queue and try to add it to retry queue
                        srcQueue.splice(i, 1);
                        // Add to retry queue only if it is not CIQueueError, as CIQueueError can be put in queue to replace a 4xx lof upload failure
                        if (!isEventQueueError(v)) {
                            v.lastSendErrorTimeStamp = shared.getTime();
                            repeatedlyFailedItems.push(v);
                        }
                    }
                    else {
                        v.inProgress = false;
                        i++;
                    }
                }
                else {
                    i++;
                }
            }
            var failedItemCount = repeatedlyFailedItems.length;
            if (failedItemCount == 1) {
                // If a single item submission failed, then the item is broken,
                // remove it from the queue
                logError("InvalidLogMessage", 1, repeatedlyFailedItems[0].log.impressionGuid);
            }
            else if (failedItemCount > 0) {
                // Splitting the failed batch in half and adding the pieces to the retry list
                var halfSize = failedItemCount / 2;
                retryList.push(repeatedlyFailedItems.slice(0, halfSize));
                retryList.push(repeatedlyFailedItems.slice(halfSize));
            }
            scheduleDump();
        }
        Queue.markFailedItems = markFailedItems;
        // Acknowledges a retry has been made successfully
        function recordRetryAttempt() {
            if (retryList.length > 0) {
                var currentRetryQueue = retryList[0];
                // Remove in-progress items out of current retry queue
                var i = 0;
                while (i < currentRetryQueue.length) {
                    var v = currentRetryQueue[i];
                    if (v.inProgress) {
                        currentRetryQueue.splice(i, 1);
                    }
                    else {
                        i++;
                    }
                }
                // If no in-progress item left in current retry queue, remove this queue from retry queue list
                if (currentRetryQueue.length == 0) {
                    retryList.shift();
                }
            }
        }
        Queue.recordRetryAttempt = recordRetryAttempt;
        // If the queue is exceeding storage limit, some old messages are deleted to free up space
        function trimQueueForStorage(clearQueue) {
            var storedQueue = JSON.stringify(queue);
            var storageDeficit = storedQueue.length - clientInstConfig.maxStorageUse;
            var queueLength = queue.length;
            if (storageDeficit > 0) {
                var spaceAllocated = 0;
                for (var i = 0; i < queueLength; i++) {
                    var elementSize = queue[i].size;
                    spaceAllocated += elementSize + 1; // Added 1 for the comma
                    if (spaceAllocated >= storageDeficit) {
                        // Remove i+1 oldest elements from the beginning of the queue
                        queue.splice(0, i + 1);
                        logError("QueueOverflow", i + 1, _G.IG, true);
                        break;
                    }
                }
            }
            var returnValue = JSON.stringify(queue);
            if (clearQueue) {
                queue.splice(0, queueLength);
            }
            return returnValue;
        }
        // Adds an event to the queue and schedules it to be dumped to disk
        function append(event) {
            var envelope = wrapLogObject(event);
            serialize(envelope, false);
            // Skip all log request after log upload limit reached in an interval
            if (canUploadLog(envelope.size)) {
                queue.push(envelope);
            }
            scheduleDump();
        }
        Queue.append = append;
        // Initializes log upload counter...
        // log upload counter interval start date and total size of log uploaded in current interval is stored in app local storage.
        // When we first encounter a new interval start a new counter and delete old interval's data.
        // Also in case of erroneous storage data, we reset it.
        // It also uses different local storage key for different scenario, like QF & MyStuff, similar to log queue
        function initializeLogUploadCounter() {
            var logUploadIntervalStartDateKey = queueKey + "_logUploadIntervalStartDate";
            var uploadedLogSizeInIntervalKey = queueKey + "_uploadedLogSizeInInterval";
            logUploadIntervalStartDateValue = localStorage[logUploadIntervalStartDateKey];
            uploadedLogSizeInInterval = localStorage[uploadedLogSizeInIntervalKey];
            var curDateTimeValue = sb_gt();
            if (logUploadIntervalStartDateValue == undefined || uploadedLogSizeInInterval == undefined) {
                resetLogUploadCounter(curDateTimeValue);
            }
            else if (diffOfDateInDays(logUploadIntervalStartDateValue, curDateTimeValue) >= clientInstConfig.logUploadCapIntervalInDays) {
                resetLogUploadCounter(curDateTimeValue);
            }
        }
        function resetLogUploadCounter(currentDateValue) {
            logUploadIntervalStartDateValue = currentDateValue;
            uploadedLogSizeInInterval = 0;
        }
        function diffOfDateInDays(previousDateValue, laterDateValue) {
            var diffValueInMillisec = laterDateValue - previousDateValue;
            var diffInDays = diffValueInMillisec / MilliSecondsInADay;
            return diffInDays;
        }
        // If instrumentation is disabled, return false always
        // otherwise, if LogUploadCap feature is disabed, return true always.
        // 1) If the current interval the same as the previous active interval.  If not reset counters.
        // Then check:
        // 2) Have we already gone over our limit? If so, reject the request.If not:
        // 3) Have we written enough bytes to go over our limit? If so, flip the cutoff switch (by making logUploadSize=Max) and reject the request and log LogUploadSizeLimitReached.
        // 4) If you get this far allow the request and increment the log size counter.
        function canUploadLog(size) {
            if (!clientInstConfig.isInstrumentationEnabled) {
                return false;
            }
            if (!LogUploadCapFeatureEnabled) {
                return true;
            }
            var curDateTimeValue = sb_gt();
            if (diffOfDateInDays(logUploadIntervalStartDateValue, curDateTimeValue) >= clientInstConfig.logUploadCapIntervalInDays) {
                resetLogUploadCounter(curDateTimeValue);
            }
            if (uploadedLogSizeInInterval >= clientInstConfig.logUploadCapSizeInChar) {
                return false;
            }
            var totalUploadSizeIfAllowThisUpload = uploadedLogSizeInInterval + size;
            if (totalUploadSizeIfAllowThisUpload >= clientInstConfig.logUploadCapSizeInChar) {
                // At this point if we upload this log, it will cross the limit, so we reached the limit.
                // We want not to upload this log and all subsequent logs. Also log a message that we have reached limit.
                // To stop this log upload, returning false
                // To stop all subsequent logs, setting max value to uploadedLogSizeInInterval, so that canUploadLog fails from next time onwards
                logError("LogUploadSizeLimitReached", 1, _G.IG, true);
                uploadedLogSizeInInterval = clientInstConfig.logUploadCapSizeInChar;
                return false;
            }
            uploadedLogSizeInInterval = totalUploadSizeIfAllowThisUpload;
            return true;
        }
    })(Queue || (Queue = {}));
    // Executed the at the time the script is loaded
    function initializeClientLogging() {
        initializeConfig();
        initializeEventSequence();
        // if a new page is loaded via AJAX, this script doesn't get reloaded, so some variables need to be reinitialized
        customEvents.bind("ajax.unload", initializeEventSequence);
        try {
            localStorage = _w.localStorage;
            Queue.initialize();
        }
        catch (e) {
        }
        function onPageInfoTimeout() {
            if (!populatePageInfo) {
                populatePageInfo = function () {
                };
            }
            completeImpressions();
            logError("PageInfoTimedOut", 0, _G.IG);
        }
        var pageInfoTimeoutHandle = null;
        if (clientInstConfig.waitForPageInfo) {
            // Start submitting events not waiting for page info to arrive after pageInfoTimeout has elapsed
            pageInfoTimeoutHandle = sb_st(onPageInfoTimeout, clientInstConfig.pageInfoTimeout);
        }
        sj_evt.bind("ClientInst.PageInstInfo", function (args) {
            if (pageInfoTimeoutHandle) {
                sb_ct(pageInfoTimeoutHandle);
                pageInfoTimeoutHandle = null;
            }
            populatePageInfo = args[1];
            if (populatePageInfo) {
                completeImpressions();
            }
        });
    }
    // Completes and enqueues the impressions that were put away due to waiting for page data
    function completeImpressions() {
        var failedToParse = 0;
        while (incompleteMpis.length > 0) {
            var impressionRecord;
            try {
                var impressionStr = incompleteMpis.shift();
                impressionRecord = JSON.parse(impressionStr);
            }
            catch (e) {
                failedToParse++;
                continue;
            }
            if (populatePageInfo) {
                populatePageInfo(impressionRecord.data);
            }
            enqueue(impressionRecord);
        }
        if (failedToParse > 0) {
            logError("InvalidIncompleteImpressions", failedToParse, _G.IG);
        }
    }
    function enqueue(obj) {
        Queue.append(obj);
        scheduleQueueFlush();
    }
    function escapeCData(s) {
        // if eventData contains the raw string "]]>",
        // it'll end the CDATA section prematurely
        return JSON.stringify(s).replace(/]]>/g, "]]]]><![CDATA[>");
    }
    function buildEventPayload(event, payload, uploadTimestamp) {
        payload.push("<E>", "<T>Event.", event.data.eventType, "</T>", "<IG>", event.impressionGuid, "</IG>");
        if (event.previousImpressionGuid) {
            payload.push("<PrevIG>", event.previousImpressionGuid, "</PrevIG>");
        }
        if (event.dominantImpressionGuid && event.previousImpressionGuid) {
            payload.push("<DominantIG>", event.dominantImpressionGuid, "</DominantIG>");
        }
        var eventDs = event.data.dataSources;
        if (eventDs) {
            payload.push("<DS><![CDATA[", escapeCData(eventDs), "]]></DS>");
        }
        var pageLayout = event.data.pageLayout;
        if (pageLayout && validatePageLayout(pageLayout)) {
            payload.push("<Page><L><![CDATA[", escapeCData(pageLayout), "]]></L></Page>");
        }
        var eventData = event.data.eventData;
        if (!eventData) {
            eventData = event.data.eventData = {};
        }
        eventData["UTS"] = uploadTimestamp;
        if (_w["LogOffline"] === true) {
            eventData["isOffline"] = navigator.onLine ? 0 : 1;
        }
        payload.push("<D><![CDATA[", escapeCData(eventData), "]]></D>", "<TS>", event.timestamp, "</TS>", "</E>");
    }
    // it's particularly important that we validate page layout information before uploading to the server - 
    // if an invalid payload is uploaded here, logmerge will obliterate the entire page information and make
    // analysis of what was on the page impossible.
    function validatePageLayout(pageLayout) {
        var validElement = false;
        try {
            if (pageLayout instanceof Array) {
                validElement = pageLayout.every(validatePageLayout);
            }
            else {
                validElement = !!pageLayout["T"];
                var children = pageLayout["L"];
                if (validElement && children) {
                    validElement = validatePageLayout(children);
                }
            }
        }
        catch (elementIssue) {
            SharedLogHelper.LogWarning("PageLayoutValidationException", null, elementIssue);
            return false;
        }
        if (!validElement) {
            SharedLogHelper.LogWarning("PageLayoutValidationException", pageLayout, null);
        }
        return validElement;
    }
    function buildMasterPageImpressionPayload(impressionObject, payload, uploadTimestamp) {
        function escapeValue(value) {
            return value ? value.replace(/&/g, "&amp;").replace(/"/g, "&quot;") : "";
        }
        var impression = impressionObject.data;
        payload.push("<Group>", "<M>", "<IG>", impressionObject.impressionGuid, "</IG>", "<DS><![CDATA[", escapeCData(impression.dataSources), "]]></DS>");
        var clientInfo = impression.enrichedClientInfo;
        if (!clientInfo) {
            clientInfo = {};
        }
        clientInfo['ImpressionUrl'] = impression.impressionUrl;
        if (_G.AppVer) {
            clientInfo["ResourcesVersion"] = _G.AppVer;
        }
        var eventData = impressionObject.data.eventData;
        if (!eventData) {
            eventData = impressionObject.data.eventData = {};
        }
        eventData["EnrichedClientInfo"] = clientInfo;
        eventData["TS"] = impression.clientTimestamp;
        eventData["UTS"] = uploadTimestamp;
        var uxClassification = impression.uxClassification;
        if (uxClassification) {
            eventData['UxClassification'] = uxClassification;
        }
        if (_w["sj_cook"] && sj_cook.parse) {
            eventData["Cookies"] = sj_cook.parse();
        }
        payload.push("<D><![CDATA[", escapeCData(eventData), "]]></D>");
        payload.push("<Page>", "<Name>", impression.pageName, "</Name>", "<L><![CDATA[", escapeCData(impression.layoutNodes), "]]></L>", "</Page>", "<TS>", impressionObject.timestamp, "</TS>", "<Ovr>", "<requestInfo key=\"RawQuery\" value =\"", escapeValue(impression.rawQuery), "\"/>", "<requestInfo key=\"IsQuery\" value =\"", escapeValue(impression.isQuery.toString()), "\"/>", "<requestInfo key=\"Form\" value=\"", escapeValue(impression.form), "\"/>");
        var userInfoOverrides = impression.userInfoOverrides;
        for (var p in userInfoOverrides) {
            if (userInfoOverrides.hasOwnProperty(p)) {
                payload.push("<userInfo key=\"", escapeValue(p), "\" value=\"", escapeValue(userInfoOverrides[p]), "\"/>");
            }
        }
        payload.push("<userInfo key=\"AppName\" value=\"", escapeValue(impression.appName), "\"/>", "</Ovr>", "</M>", "</Group>");
    }
    function collectCommonEventProperties(eventData) {
        var href = window.location.href;
        if (!lastPageUrl || href.indexOf(lastPageUrl) !== 0) {
            var endOfPath = href.indexOf("?");
            if (endOfPath < 0) {
                endOfPath = href.indexOf("#");
            }
            lastPageUrl = (endOfPath < 0) ? href : href.substring(0, endOfPath);
            var thresholdUtilities = _w["ThresholdUtilities"];
            if (thresholdUtilities) {
                var formCode = thresholdUtilities.getUrlParameter(href, "FORM");
                if (formCode) {
                    lastPageUrl += "?FORM=" + formCode;
                }
            }
        }
        // Hack this into the CurUrl field as that's currently supported in the BOND schemas
        eventData["CurUrl"] = lastPageUrl;
        var pageDebug = _w["PageDebug"];
        var pageName = (pageDebug) ? pageDebug.canvas : _G.PN;
        // Hack a page name into the Pivot field whenever we can.
        eventData["Pivot"] = pageName;
        if (typeof ThresholdUtilities !== "undefined" && _w["SearchAppWrapper"] && _w["SearchAppWrapper"].CortanaApp) {
            ThresholdUtilities.getCortanaHeaders(function (headers) {
                if (headers) {
                    // the client has a few headers to indicate features that we need to report via NIF
                    var headerValue;
                    if (headerValue = headers["X-BM-ClientFeatures"]) {
                        eventData["CF"] = headerValue;
                    }
                    if (headerValue = headers["X-BM-FlightedFeatures"]) {
                        eventData["FF"] = headerValue;
                    }
                }
            });
        }
        return eventData;
    }
    function createPayload(events, masterPageImpressions) {
        var payload = ["<ClientInstRequest>"];
        var payloadUploadTime = shared.getTime();
        var muid = _G.CID || sj_cook.get(MUID, MUID);
        if (muid) {
            payload.push("<CID>", muid, "</CID>");
        }
        if (events.length > 0) {
            payload.push("<Events>");
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                buildEventPayload(event, payload, payloadUploadTime);
            }
            payload.push("</Events>");
        }
        if (masterPageImpressions.length > 0) {
            for (var i = 0; i < masterPageImpressions.length; i++) {
                var impression = masterPageImpressions[i];
                buildMasterPageImpressionPayload(impression, payload, payloadUploadTime);
            }
        }
        payload.push("</ClientInstRequest>");
        return payload.join('');
    }
    // Queue flush operations
    var queueFlushers = {
        mainQueue: {
            getInterval: function () { return clientInstConfig.flushInterval; }
        },
        retryQueue: {
            getInterval: function () { return clientInstConfig.retryInterval; }
        }
    };
    // Schedules a flush of either main queue or retry queue (determined by the parameter)
    function scheduleQueueFlush(useRetryQueue, async) {
        if (useRetryQueue === void 0) { useRetryQueue = false; }
        if (async === void 0) { async = true; }
        if (clientInstConfig.isInstrumentationEnabled) {
            var flusher = useRetryQueue ? queueFlushers.retryQueue : queueFlushers.mainQueue;
            if (!flusher.flushTimeoutHandle) {
                flusher.flushTimeoutHandle = env.setTimeout(function () { return flushSingleQueue(useRetryQueue, flusher, false, async); }, flusher.getInterval());
            }
        }
    }
    // Flushes the given queue
    function flushSingleQueue(useRetryQueue, flusher, forceFlush, async) {
        if (async === void 0) { async = true; }
        sb_ct(flusher.flushTimeoutHandle);
        flusher.flushTimeoutHandle = null;
        // Give priority to the main queue
        // It will call the retry queue after it's done
        if (useRetryQueue && queueFlushers.mainQueue.inProgressUpload) {
            return;
        }
        else if (!useRetryQueue && queueFlushers.retryQueue.inProgressUpload) {
            queueFlushers.retryQueue.inProgressUpload.abort();
        }
        // If there's already a request in progress sending this queue and it has been running for a while, cancel it
        // in case anything has been added to the queue since that send request was initiated.
        if (flusher.inProgressUpload) {
            var elapsedTime = shared.getTime() - flusher.requestSentTimestamp;
            if (forceFlush || elapsedTime > clientInstConfig.flushInterval) {
                flusher.inProgressUpload.abort();
                if (forceFlush) {
                    logError("SendAbortedForceFlush", 1, _G.IG);
                }
                else {
                    logError("SendTimedOut", 1, _G.IG);
                }
            }
            else {
                // Give it some time, it will schedule a subsequent flush
                return;
            }
        }
        var batch = Queue.getBatch(useRetryQueue);
        if (batch.length == 0) {
            return;
        }
        // each element in the batch can potentially be from a different flight set and needs to be in a separate upload
        var flightsToEventsMap = {};
        if (_w["finheader"]) {
            for (var eventIndex in batch.events) {
                var eventFromBatch = batch.events[eventIndex];
                var batchEventFlights = eventFromBatch.flights;
                if (!flightsToEventsMap[batchEventFlights]) {
                    flightsToEventsMap[batchEventFlights] = { events: [], mpis: [] };
                }
                flightsToEventsMap[batchEventFlights].events.push(eventFromBatch.log);
            }
            for (var mpiIndex in batch.masterPageImpressions) {
                var mpiFromBatch = batch.masterPageImpressions[mpiIndex];
                var batchMpiFlights = mpiFromBatch.flights;
                if (!flightsToEventsMap[batchMpiFlights]) {
                    flightsToEventsMap[batchMpiFlights] = { events: [], mpis: [] };
                }
                flightsToEventsMap[batchMpiFlights].mpis.push(mpiFromBatch.log);
            }
        }
        else {
            flightsToEventsMap[""] = { events: batch.events.map(function (storedLog) { return storedLog.log; }), mpis: batch.masterPageImpressions.map(function (storedLog) { return storedLog.log; }) };
        }
        for (var flights in flightsToEventsMap) {
            var request = sj_gx();
            request.open("POST", _G.XLS, async);
            var completionCallback = sj_df(processXhrPost, request, flusher, useRetryQueue);
            if (async) {
                // If a single upload takes longer than our normal upload interval we should cancel it and prepare for another upload attempt.
                // Don't use really small test values as timeouts - they'll break tests badly.
                if (clientInstConfig.flushInterval >= 1000) {
                    request.timeout = clientInstConfig.flushInterval;
                }
                request.onload = completionCallback;
            }
            request.setRequestHeader("Content-type", "text/xml");
            if (_w["finheader"] && flights !== "") {
                request.setRequestHeader("X-MSEdge-ExternalExpType", "JointCoord");
                request.setRequestHeader("X-MSEdge-ExternalExp", flights);
            }
            flusher.inProgressUpload = request;
            flusher.requestSentTimestamp = shared.getTime();
            request.send(createPayload(flightsToEventsMap[flights].events, flightsToEventsMap[flights].mpis));
            // If we made a synchronous call we can process the content immediately without waiting for more eventing
            if (!async) {
                // Pass a shim for ProgressEvent
                completionCallback(null);
            }
        }
    }
    function processXhrPost(progressEvent, request, flusher, useRetryQueue) {
        if (request.readyState === 4) {
            flusher.inProgressUpload = null;
            var responseClass = Math.floor(request.status / 100);
            if (responseClass === 2) {
                // If this is the main queue, and there are items left,
                // schedule another flush
                if (Queue.clearSentItems(useRetryQueue) && !useRetryQueue) {
                    scheduleQueueFlush(false);
                }
                scheduleQueueFlush(true);
            }
            else if (responseClass === 4) {
                // This means bad request;
                // the queue will rearrange items to try to figure out which items failed
                Queue.markFailedItems(true, useRetryQueue);
                scheduleQueueFlush(true);
            }
            else {
                // This means most likely that the either the service
                // or the client is offline
                Queue.markFailedItems(false, useRetryQueue);
            }
            if (useRetryQueue) {
                Queue.recordRetryAttempt();
            }
        }
    }
    function flushMainQueue(force, async) {
        if (force === void 0) { force = false; }
        if (async === void 0) { async = true; }
        flushSingleQueue(false, queueFlushers.mainQueue, force, async);
    }
    function createLogObject(eventType, eventData, eventName, dataSources, pageInfo, impressionGuid, previousImpressionGuid, dominantImpressionGuid) {
        var eventObj = {};
        collectCommonEventProperties(eventObj);
        if (eventData) {
            if (typeof eventData === "string") {
                eventObj.Text = eventData;
            }
            else {
                for (var key in eventData) {
                    if (eventData.hasOwnProperty(key)) {
                        eventObj[key] = eventData[key];
                    }
                }
            }
        }
        if (eventName) {
            eventObj.T = "CI." + eventName;
        }
        var timestamp = shared.getTime();
        eventObj.TS = timestamp;
        eventObj.RTS = timestamp - startTime;
        eventObj.SEQ = sequenceIndex++;
        var eventToLog = {
            type: 0 /* EVENT */,
            impressionGuid: impressionGuid != null ? impressionGuid : _G.IG,
            previousImpressionGuid: previousImpressionGuid,
            timestamp: timestamp,
            data: {
                eventType: eventType,
                eventData: eventObj,
                dataSources: dataSources,
                pageLayout: pageInfo
            },
            dominantImpressionGuid: dominantImpressionGuid
        };
        return eventToLog;
    }
    function sendImmediateRequest(events) {
        var request = sj_gx();
        request.open("POST", _G.XLS);
        request.setRequestHeader("Content-type", "text/xml");
        request.send(createPayload(events, []));
    }
    // Public interface methods
    function LogEvent(eventType, eventData, eventName, dataSources, pageInfo, impressionGuid, previousImpressionGuid, dominantImpressionGuid) {
        if (EventsToDuplicate && eventType === "Click" && EventsToDuplicate.indexOf("duplicateClickOnLs") >= 0) {
            _G.GPImg = new Image;
            _G.GPImg.src = _G.gpUrl + 'IG=' + _G.IG + '&ID=' + eventData["AppNS"] + "," + eventData["K"];
            // in order to prevent uploading a double click we change the name of the click event that the xls uploader will use
            eventType = "XlsDelayedClick";
        }
        if (!_G.XLS) {
            throw new Error("_G.XLS is necessary for clientinst_xls, but it is not defined");
        }
        if (!clientInstConfig.isInstrumentationEnabled) {
            return;
        }
        var eventToLog = createLogObject(eventType, eventData, eventName, dataSources, pageInfo, impressionGuid, previousImpressionGuid, dominantImpressionGuid);
        if (EventsToDuplicate && (EventsToDuplicate.indexOf("ALL") >= 0 || EventsToDuplicate.indexOf(eventType) >= 0)) {
            var duplicatedEvent = createLogObject("Immediate" + eventType, eventData, eventName, dataSources, pageInfo, impressionGuid, previousImpressionGuid, dominantImpressionGuid);
            sendImmediateRequest([duplicatedEvent]);
        }
        enqueue(eventToLog);
    }
    exports.LogEvent = LogEvent;
    function LogMasterPageImpression(impression) {
        if (!clientInstConfig.isInstrumentationEnabled) {
            return;
        }
        if (populatePageInfo) {
            populatePageInfo(impression);
        }
        impression.clientTimestamp = shared.getTime();
        var eventData = impression["eventData"];
        if (!eventData) {
            eventData = impression["eventData"] = {};
        }
        collectCommonEventProperties(eventData);
        var impressionRecord = {
            type: 1 /* MASTER_PAGE_IMPRESSION */,
            impressionGuid: impression.impressionGuid ? impression.impressionGuid : _G.IG,
            previousImpressionGuid: null,
            timestamp: impression.clientTimestamp,
            data: impression
        };
        if (EventsToDuplicate && (EventsToDuplicate.indexOf("ALL") >= 0 || EventsToDuplicate.indexOf("masterPageImpression") >= 0)) {
            var duplicatedEvent = createLogObject("ImmediateMaster", eventData, impression.impressionUrl, impression.dataSources, impression.layoutNodes, impression.impressionGuid, null, null);
            sendImmediateRequest([duplicatedEvent]);
        }
        if (populatePageInfo || !clientInstConfig.waitForPageInfo) {
            enqueue(impressionRecord);
        }
        else {
            incompleteMpis.push(JSON.stringify(impressionRecord));
        }
    }
    exports.LogMasterPageImpression = LogMasterPageImpression;
    function Log(eventType, eventId, name, forceFlush) {
        // deprecated
        var keyValuePairs = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            keyValuePairs[_i - 4] = arguments[_i];
        }
        if (!clientInstConfig.isInstrumentationEnabled) {
            return;
        }
        var eventObj = {};
        if (keyValuePairs) {
            for (var i = 0; i < keyValuePairs.length; i += 2) {
                eventObj[keyValuePairs[i]] = keyValuePairs[i + 1];
            }
        }
        var timestamp = shared.getTime();
        eventObj.T = "CI." + eventType;
        eventObj.TS = timestamp;
        eventObj.RTS = timestamp - startTime;
        eventObj.SEQ = sequenceIndex++;
        eventObj.Name = name;
        eventObj[typeof eventId === "number" ? "K" : "FID"] = eventId;
        collectCommonEventProperties(eventObj);
        enqueue({
            type: 0 /* EVENT */,
            impressionGuid: _G.IG,
            previousImpressionGuid: null,
            timestamp: startTime,
            data: {
                eventType: eventType,
                eventData: eventObj
            }
        });
    }
    exports.Log = Log;
    /* This function is exposed to allow external code to wire up
       events that we know will interrupt the flow of the page to push
       instrumentation data to the server before it's too late.
       Click events and visiblity state changes are good examples of when this should be used. */
    function ForceFlush(async) {
        if (async === void 0) { async = true; }
        Queue.dumpToStorage();
        flushMainQueue(true, async);
    }
    exports.ForceFlush = ForceFlush;
    // Initial actions
    initializeClientLogging();
    function FlushMainQueueDontForce(ev) {
        Queue.dumpToStorage();
        flushMainQueue(false);
    }
    exports.FlushMainQueueDontForce = FlushMainQueueDontForce;
    function SaveLogsToSharedStorage() {
        Queue.dumpToStorage(true);
    }
    exports.SaveLogsToSharedStorage = SaveLogsToSharedStorage;
    //method to be used from test code to reset back to an initial state
    function ResetState() {
        _CachedFlightsJoined = null;
        _CachedFlights = undefined;
    }
    exports.ResetState = ResetState;
    customEvents.bind("onP1", FlushMainQueueDontForce, true);
    customEvents.bind("ajax.postload", FlushMainQueueDontForce, true);
    nativeEvents.bind(_w, "beforeunload", ForceFlush, false);
    _w["Log"] = { Log: Log };
    _w["Log2"] = { LogEvent: LogEvent, LogMasterPageImpression: LogMasterPageImpression, ForceFlush: ForceFlush, FlushMainQueueDontForce: FlushMainQueueDontForce, SaveLogsToSharedStorage: SaveLogsToSharedStorage, ResetState: ResetState };
});
;0;
;var CoreUtilities;
(function (CoreUtilities) {
    // Contains utility functions that are common to Threshold clients - Cortana, Spartan OneBox etc.
    // Do not include client specfic code here.
    function deferFunction(functionPointer) {
        var originalArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            originalArgs[_i - 1] = arguments[_i];
        }
        return deferMethod.apply(null, [null, functionPointer].concat(originalArgs));
    }
    CoreUtilities.deferFunction = deferFunction;
    function deferMethod(sourceObject, functionPointer) {
        var originalArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            originalArgs[_i - 2] = arguments[_i];
        }
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (!args || args.length === 0) {
                args = originalArgs;
            }
            else {
                for (var i in originalArgs) {
                    if (originalArgs.hasOwnProperty(i)) {
                        args.push(originalArgs[i]);
                    }
                }
            }
            return functionPointer.apply(sourceObject, args);
        };
    }
    CoreUtilities.deferMethod = deferMethod;
    // gets a property out of an object. 
    // should be used in cases where object has a lot of layers of properties.
    // the arguments will be object, list of properties. 
    // it works recursively so it will keep calling itself with the current object and the rest of the properties.
    // e.g. var a = { b: { c: { d: "e" } } } to get to "e", you can call getProperty(a, b, c, d)
    // will return null if any of the layers don't have what was passed in (e. g. getProperty(a, b, d))
    function getProperty() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var currentState = args[0];
        for (var i = 1; i < args.length; i++) {
            if (currentState) {
                currentState = currentState[args[i]];
            }
            else {
                return null;
            }
        }
        return currentState;
    }
    CoreUtilities.getProperty = getProperty;
    // Legacy Support
    window["sj_df"] = deferFunction;
    window["sj_dm"] = deferMethod;
    window["sj_gp"] = getProperty;
})(CoreUtilities || (CoreUtilities = {}));
;///<reference path="..\..\Declarations\Shared.d.ts"/>
///<reference path="../../../../../../Cortana/src/Content/Script/Declarations/ClientTestHooks.d.ts" />
var LoggerModule;
(function (LoggerModule) {
    var LogSeverity;
    (function (LogSeverity) {
        LogSeverity[LogSeverity["None"] = 0] = "None";
        LogSeverity[LogSeverity["Error"] = 1] = "Error";
        LogSeverity[LogSeverity["Warning"] = 2] = "Warning";
    })(LogSeverity || (LogSeverity = {}));
    var logEventType = "ClientInst";
    var rCharRegex = /\r/g;
    var doubleNCharRegex = /\n\n/g;
    // Duplicate error/warning logging in unnecessary as they will not add new debug informaiton
    // Reducing maxClientErrorPerType and maxClientWarningPerType to 1
    var clientErrors = {};
    var maxClientErrorPerType = 1;
    var clientWarnings = {};
    var maxClientWarningPerType = 1;
    function LogFatalError(keyName, text, exception, lineNumber, columnNumber) {
        (new Image).src = _G.lsUrl + '&Type=Event.ClientInst' + '&DATA=[{"T":"CI.Error","FID":"CI","Name":"JSError","Text":' + keyName + '}]';
        Log(1 /* Error */, clientErrors, maxClientErrorPerType, keyName, text, exception, lineNumber, columnNumber);
    }
    LoggerModule.LogFatalError = LogFatalError;
    function LogError(keyName, text, exception, lineNumber, columnNumber) {
        Log(1 /* Error */, clientErrors, maxClientErrorPerType, keyName, text, exception, lineNumber, columnNumber);
    }
    LoggerModule.LogError = LogError;
    function LogWarning(keyName, text, exception) {
        Log(2 /* Warning */, clientWarnings, maxClientWarningPerType, keyName, text, exception);
    }
    LoggerModule.LogWarning = LogWarning;
    var errorFilter = function (exception, keyName) {
        return false;
    };
    function RegisterErrorFilter(newTrigger) {
        errorFilter = newTrigger;
    }
    LoggerModule.RegisterErrorFilter = RegisterErrorFilter;
    function Log(severity, errorDictionary, maxCountPerType, keyName, extraInfo, exception, lineNumber, columnNumber) {
        var logType = "Error";
        // Deduping log just based on keyName will over dedupe, as we have log like below two examples ...
        // LogError("MyStuffOnlineFederationError", "invalid response");
        // LogError("MyStuffOnlineFederationError", "failed response");
        // So, We need to consider text message also in identifier
        // For the same reason we need to consider expection as well, as we may get different exception in catch
        // E.g. try{...} catch (e) { SharedLogHelper.LogError("GetPropertyException", propertyKey, e); }
        // NOTE: We've reduced the identifier key down to not process text or exception values to match the behavior of LogError which was suppressing a lot more events.
        // We likely need a better logging mechanism that will collect failures and tally counts or stacks under a single value.
        var logIdentifier = severity + keyName;
        var numberOfExceptionForKey = errorDictionary[logIdentifier];
        if (typeof numberOfExceptionForKey !== "number") {
            numberOfExceptionForKey = 0;
        }
        if (errorFilter(exception, keyName)) {
            return;
        }
        var where = keyName.substr(0, "http://".length) == "http://" || keyName.substr(0, "https://".length) == "https://" ? "" : keyName;
        var logEventData = {
            Text: null,
            Stack: null,
            Meta: _w.location.href,
            Line: lineNumber,
            Char: columnNumber,
            Name: "JSError"
        };
        // Defer calculation if we can.  If we decide to not to record this exception we don't need to compute this data.
        Object.defineProperty(logEventData, "Text", { get: sj_df(generateLogText, logEventData, where, extraInfo, severity, exception) });
        Object.defineProperty(logEventData, "Stack", { get: sj_df(generateLogStack, logEventData, extraInfo, severity, exception) });
        if (numberOfExceptionForKey < maxCountPerType) {
            // Log in the console if we serialized the event to the server
            var consoleMessage = JSON.stringify(logEventData);
            var consoled = false;
            if (severity === 1 /* Error */) {
                console.error(consoleMessage);
                consoled = true;
            }
            else if (severity === 2 /* Warning */) {
                console.warn(consoleMessage);
                logType = "Warning";
                consoled = true;
            }
            Log2.LogEvent(logEventType, logEventData, logType, null, null, null, null, null);
            errorDictionary[logIdentifier] = numberOfExceptionForKey + 1;
            if (consoled) {
                setProperty(logEventData, "c", 1);
            }
        }
        if (sj_evt) {
            // We pass on logEventData instead of the actual raw message string so we only JSON.stringify this object as needed
            sj_evt.fire("ErrorInstrumentation", null, logEventData, severity, exception);
        }
    }
    function getErrorLines(logEventData, severity, exception) {
        var errorLines = logEventData["errorLines"];
        if (!errorLines) {
            var stack = ((severity === 1 /* Error */) && exception) ? (exception.stack || exception.message) : null;
            errorLines = (exception ? (stack || exception) + "" : "").replace(rCharRegex, "").replace(doubleNCharRegex, "\n").replace(location.href, "self").split("\n");
            if (errorLines.length > 1 && errorLines[0] === errorLines[1]) {
                errorLines = errorLines.slice(1);
            }
            setProperty(logEventData, "errorLines", errorLines);
        }
        return errorLines;
    }
    function generateLogText(logEventData, where, extraInfo, severity, exception) {
        // Cache the logText for this object on it in case anyone tries to read this multiple times in a row
        var logText = logEventData["logTextCache"];
        if (!logText) {
            var errorCode = exception ? exception['number'] : null;
            var errorLines = getErrorLines(logEventData, severity, exception);
            logText = (where ? "[" + where + "] " : "") + (errorCode ? errorCode + " " : "") + errorLines[0];
            if (extraInfo == "Uncaught " + logText) {
                logText = extraInfo;
            }
            setProperty(logEventData, "logTextCache", logText);
        }
        return logText;
    }
    function generateLogStack(logEventData, extraInfo, severity, exception) {
        // Cache the logStack for this object on it in case anyone tries to read this multiple times in a row
        var logStack = logEventData["logStackCache"];
        if (!logStack) {
            var errorLines = getErrorLines(logEventData, severity, exception);
            logStack = logEventData.Text + (extraInfo && extraInfo != logEventData.Text ? "\n" + extraInfo : "") + (errorLines.length > 1 ? "\n" + errorLines.slice(1).join("\n") : "");
            setProperty(logEventData, "logStackCache", logStack);
        }
        return logStack;
    }
    // Setting properties this way makes the properties non-enumerable by default and hides them from JSON.stringify
    function setProperty(object, propertyName, v) {
        Object.defineProperty(object, propertyName, { value: v });
    }
})(LoggerModule || (LoggerModule = {}));
_w["SharedLogHelper"] = { LogError: LoggerModule.LogError, LogWarning: LoggerModule.LogWarning, RegisterErrorFilter: LoggerModule.RegisterErrorFilter };
;///<reference path="..\..\Declarations\Shared.Utilities.d.ts"/>
var VisibilityChangeHelperModule;
(function (VisibilityChangeHelperModule) {
    var handlers = [];
    var initialized = false;
    function Register(cortanaApp, doc, callback) {
        if (!initialized) {
            if (cortanaApp && doc) {
                cortanaApp.addEventListener("statechanged", logVisibilityChange);
                sj_be(doc, "visibilitychange", logVisibilityChange, false);
            }
            initialized = true;
        }
        // if we are called to register the same callback more than once, only allow the first register
        if (handlers.indexOf(callback) === -1) {
            handlers.push(callback);
        }
    }
    VisibilityChangeHelperModule.Register = Register;
    function GetHandlers() {
        return handlers;
    }
    VisibilityChangeHelperModule.GetHandlers = GetHandlers;
    function logVisibilityChange(evt) {
        // check if click recently detected it was moving off page and flushed everything
        // if so, we don't need to do any work here and can return. Using 100ms as our cutoff
        // because that should be short enough that a click leading off page will be within the
        // limit, but long enough that a human won't be navigating that quickly
        var clickFlushedRecently = false;
        if (_w["clickFlushedTime"]) {
            if (sb_gt() - _w["clickFlushedTime"] < 100) {
                clickFlushedRecently = true;
            }
        }
        // if the event has been marked as synthetic then we know it came from our own visibility logger
        // in this case we don't need to do anything else and we can safely return
        if (evt["synthetic"] === true) {
            return;
        }
        try {
            var visibilityState;
            var documentVisible;
            // if the event is coming from the app, we need to use newState to determine
            // the visibilityState and hidden values, otherwise we are in browser and can
            // just check document
            var newState = evt["newState"];
            if (typeof newState !== "undefined") {
                documentVisible = newState !== 0;
                visibilityState = newState === 0 ? "hidden" : "visible";
            }
            else {
                documentVisible = !document["hidden"];
                visibilityState = document["visibilityState"];
            }
            // Box model will pick up the visibility event and force a synchronous flush for hidden visibility events
            // custom events are fired synchronously, so we shouldn't have to worry about our thread giving up control
            if (!clickFlushedRecently) {
                sj_evt.fire("visibility", documentVisible, newState);
            }
            // Only run handlers if we are losing visibility
            // Reference: http://www.w3.org/TR/page-visibility/#sec-visibilitychange-event
            if (visibilityState !== "visible") {
                for (var index in handlers) {
                    var handler = handlers[index];
                    handler();
                }
                if (_w["useSharedLocalStorage"]) {
                    Log2.SaveLogsToSharedStorage();
                }
                else {
                    if (clickFlushedRecently) {
                        Log2.FlushMainQueueDontForce();
                    }
                    else {
                        Log2.ForceFlush();
                    }
                }
            }
            // fire a native visibilitychange event for all other code that has bound to it
            var syntheticEvent = document.createEvent("event");
            syntheticEvent.initEvent("visibilitychange", true, true);
            syntheticEvent["synthetic"] = true;
            document.dispatchEvent(syntheticEvent);
        }
        catch (e) {
            SharedLogHelper.LogFatalError("SharedLogVisibilityFailure", null, e);
        }
    }
})(VisibilityChangeHelperModule || (VisibilityChangeHelperModule = {}));
_w["VisibilityChangeEventHelper"] = { Register: VisibilityChangeHelperModule.Register, GetHandlers: VisibilityChangeHelperModule.GetHandlers };
;var sj_anim = function (updateFunc) {
    // const
    var _intervalValue = 25; // millisecond
    var _self = this;
    var _el, _interval, _beginTime, _endTime, _firstStep, _lastStep, _stepSize, _currentStep, _callback;
    _self.init = function (el, firstStep, lastStep, stepSize, callback) {
        _el = el;
        _firstStep = firstStep;
        _lastStep = lastStep;
        _stepSize = stepSize;
        _callback = callback;
        if (stepSize == 0) {
            _endTime = _beginTime;
            _callback && _callback();
            return;
        }
        if (!_currentStep)
            _currentStep = _firstStep;
        !_interval && _self.start();
    };
    _self.start = function () {
        _beginTime = sb_gt();
        _endTime = Math.abs(_lastStep - _currentStep) / _stepSize * _intervalValue;
        _interval = setInterval(_self.next, _intervalValue);
    };
    _self.stop = function () {
        clearInterval(_interval);
        _interval = 0;
    };
    _self.next = function () {
        var timeExpired = sb_gt() - _beginTime;
        var animationComplete = timeExpired >= _endTime;
        _currentStep = _firstStep + ((_lastStep - _firstStep) * timeExpired / _endTime);
        if (animationComplete) {
            _self.stop();
            _currentStep = _lastStep;
        }
        updateFunc(_el, _currentStep);
        animationComplete && _callback && _callback();
    };
    _self.getInterval = function () {
        return _intervalValue;
    };
};
;var sj_fader = function () {
    return new sj_anim(function (el, step) {
        sj_so(el, step);
    });
};
;///<amd-module name="framework" />
define("framework", ["require", "exports", "event.custom"], function (require, exports, customEvents) {
    customEvents.bind("onPP", function () {
        customEvents.fire("onP1Lazy");
    }, true);
});
;/// <reference path="..\Declarations\Shared.d.ts"/>
/// <reference path="..\Declarations\Threshold.Utilities.d.ts" />
/// <reference path="..\..\..\..\..\Threshold\src\Content\Script\Declarations\SearchAppWrapper.d.ts" />
var ShowWebView;
(function (ShowWebView) {
    var jsExceptionOccurred = false;
    sj_evt.bind("ErrorInstrumentation", function () { return jsExceptionOccurred = true; });
    sj_be(_w, "load", function () {
        var cortanaApp = SearchAppWrapper.CortanaApp;
        sj_evt.fire("BeforeShowWebView");
        if (!jsExceptionOccurred) {
            var showWebViewMethodName = "showWebViewAsync";
            if (cortanaApp && cortanaApp[showWebViewMethodName]) {
                ThresholdUtilities.wrapApiCallWithTimeout(cortanaApp, showWebViewMethodName, "SWV", null, 500, null);
            }
        }
    });
})(ShowWebView || (ShowWebView = {}));
;///<reference path="..\..\Declarations\Shared.d.ts"/>
_w["LogOffline"] = false;
;