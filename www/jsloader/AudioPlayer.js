/*
Audio Player TypeScript
    After page loading, initializes player-control: Mode_HTML5|WindowsMediaPlayer|Flash|Disabled, and creates wrapper as IAudioPlayerWrapper
    Disables all buttons if initialization failure: icon: Icon_Disabled
    Handle state transitions: State_Stopped|Loading|Playing|Paused, event(clk=clicked,opl=onplaying,end=ended,timeout), Icon_Play|Spinning|Pause
    Support multiple segments
    Instrument: Step_Init|Start|Load|End
*/
///<reference path="Declarations\Shared.d.ts" />
var AudPla;
(function (AudPla) {
    // global options
    var initialized = false; // the global intialization flag
    var loadExpirationSeconds; // load expiration in seconds
    var isFlashEnabled; // enable flash player wrapper
    // global variables
    var wrapperMode = 0 /*Mode_None*/; // mode: 0 /*Mode_None*/ 1 /*Mode_Disabled*/ 2 /*Mode_HTML5*/ 3 /*Mode_WindowsMediaPlayer*/ 4 /*Mode_Flash*/
    var audioPlayerWrapper = null; // audio wrapper
    AudPla.ca = null; // audio control using <audio>, export for the audio wrapper object to callback
    AudPla.co = null; // audio control using <object>, export for the audio wrapper object to callback
    AudPla.cs = null; // audio control using <span> and <object>, export for the audio wrapper object to callback
    // button options
    var enablePause = false;
    // button variables
    var buttonSelected = null; // button selected
    var segments; // the array of the audio source url segments of the button selected
    var segmentIndex = 0; // index of the current audio source url segment
    var state = 0 /*State_Stopped*/; // state: 0 /*State_Stopped*/; 1 /*State_Loading*/; 2 /*State_Playing*/; 3 /*State_Paused*/
    var loadExpirationTime = 0; // load-expiration time
    // instrumentation
    var instButton = null; // instrumentation button selected
    var instInitCode = ""; // instrumentation init code
    var instInitTimeMs = 0; // instrumentation init time in milliseconds
    var instStartCode = ""; // instrumentation start code
    var instStartTimeMs = 0; // instrumentation start time in milliseconds
    var instLoadCode = ""; // instrumentation load code
    var instLoadTimeMs = 0; // instrumentation load time in milliseconds
    var instEndCode = ""; // instrumentation end code
    var instEndTimeMs = 0; // instrumentation  end time in milliseconds
    function ini(// initialize, which is called by spark, export for page-loading script
        loadExpirationSecondsParam, initPlayerWrapperOnLoad, isFlashEnabledParam) {
        if (initialized) {
            return;
        }
        initialized = true;
        isFlashEnabled = isFlashEnabledParam;
        loadExpirationSeconds = loadExpirationSecondsParam;
        if (!initPlayerWrapperOnLoad) {
            return;
        }
        sj_evt.bind("onPP", initAudioPlayerWrapper, true); // isRetro = true; onPP = Signals that the performance-ping request has been sent
    }
    AudPla.ini = ini;
    function initAudioPlayerWrapper() {
        if (wrapperMode == 1) {
            return false;
        }
        if (wrapperMode > 1) {
            return true;
        }
        var icons = [];
        if (_d.getElementsByClassName) {
            var elementCollection = _d.getElementsByClassName("sw_play");
            for (var i = 0; i < elementCollection.length; i++) {
                icons.push(elementCollection[i]);
            }
        }
        else {
            var divs = _d.getElementsByTagName("div");
            for (var i = 0; i < divs.length; i++) {
                var div = divs[i];
                if (div.className.search(/\bsw_play\b/g) == -1) {
                    continue;
                }
                icons.push(div);
            }
        }
        if (!icons || !icons[0]) {
            // Can't instrument because we have no link from any button
            return false;
        }
        var buttons = [];
        for (var i = 0; i < icons.length; i++) {
            var dataType = icons[i].getAttribute("data-type");
            if (dataType != "audioplay") {
                continue;
            }
            buttons.push(icons[i].parentNode);
        }
        var button = buttons[0];
        if (!button) {
            // Can't instrument because we have no link from any button
            return false;
        }
        var container = locateElement(button, "A", "SPAN", 0);
        if (!container) {
            var newCont = sj_ce("span");
            newCont.style.display = "none";
            button.appendChild(newCont);
            container = locateElement(button, "A", "SPAN", 0);
            if (!container) {
                wrapperMode = 1;
                disableButtons(buttons);
                instrument(0, "NoCont", true, button); // InitCode: NoCont = Fail to locate the container node
                return false;
            }
        }
        // try HTML5
        container.innerHTML = "<audio controls onplaying='AudPla.opl();' onended='AudPla.end();'/>";
        var audioElement = locateElement(container, "SPAN", "AUDIO", 0);
        if (audioElement && audioElement.play instanceof Function) {
            AudPla.ca = audioElement;
            wrapperMode = 2;
            audioPlayerWrapper = {
                pla: function (url) {
                    AudPla.ca.src = url;
                    AudPla.ca.play();
                },
                pau: function () {
                    AudPla.ca.pause();
                },
                res: function () {
                    AudPla.ca.play();
                }
            };
            instrument(0, "Html5", true, button); // InitCode: Html5 = init successfully with HTML5
            return true;
        }
        // try WindowsMediaPlayer
        container.innerHTML = "<object classid='clsid:6bf52a52-394a-11d3-b153-00c04f79faa6'/>";
        var objectElement = locateElement(container, "SPAN", "OBJECT", 0);
        if (objectElement && objectElement.controls) {
            AudPla.co = objectElement;
            wrapperMode = 3;
            audioPlayerWrapper = {
                pla: function (url) {
                    AudPla.co.URL = url;
                    AudPla.co.controls.play();
                },
                pau: function () {
                    AudPla.co.controls.pause();
                },
                res: function () {
                    AudPla.co.controls.play();
                }
            };
            instrument(0, "WMP", true, button); // InitCode: WMP = init successfully with Windows Media Player
            return true;
        }
        // try Flash if enabled
        // adapted from private\frontend\Answers\services\Dictionary\src\Content\Script\DictionaryPronunciation.js
        if (isFlashEnabled) {
            var playerHtml = getFlashPlayer("", false);
            container.innerHTML = playerHtml;
            if (container.children[0] != null && container.children[0].AllowFullScreen != null) {
                AudPla.cs = container;
                wrapperMode = 4;
                audioPlayerWrapper = {
                    pla: function (url) {
                        AudPla.cs.innerHTML = getFlashPlayer(url, true);
                    },
                    pau: function () {
                        AudPla.cs.innerHTML = "";
                    },
                    res: function () {
                    }
                };
                instrument(0, "Flash", true, button); // InitCode: Flash = init successfully with Flash
                return true;
            }
        }
        wrapperMode = 1;
        disableButtons(buttons);
        instrument(0, "Fail", true, button); // InitCode: Fail = initialization failure
        return false;
    }
    function getFlashPlayer(url, startPlay) {
        var flashVars = "snd=" + encodeURIComponent(url);
        var swfPath = "/sa/" + _G.AppVer + "/DictPron.swf";
        var startPlayString = startPlay ? "true" : "false";
        var playerHtml = "<object " + "type=\"application/x-shockwave-flash\" " + "height=\"1\" width = \"1\" ";
        if (!sb_ie) {
            playerHtml += "data=\"" + swfPath + "\"";
        }
        playerHtml += ">";
        playerHtml += "<param name=\"movie\" value=\"" + swfPath + "\" /" + "><param name=\"FlashVars\" value=\"" + flashVars + "\" /" + "><param name=\"allowscriptaccess\" value=\"sameDomain\" /" + "><param name=\"quality\" value=\"best\" /" + "><param name=\"play\" value=\"" + startPlayString + "\" /" + "><param name=\"loop\" value=\"false\" /" + "></object>";
        return playerHtml;
    }
    function disableButtons(buttons) {
        for (var i = 0; i < buttons.length; i++) {
            showIcon(3, buttons[i]);
        }
    }
    function clk(// on clicked, export for play button "onclick" attribute
        button, enablePauseParam, enableLoadingAnimation) {
        var urls = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            urls[_i - 3] = arguments[_i];
        }
        if (!initialized) {
            return;
        }
        if (!refocus(button)) {
            return;
        }
        enablePause = wrapperMode == 4 ? false : enablePauseParam; // Mode_Flash does not support pause and resume
        switch (state) {
            case 0: {
                showIcon(enableLoadingAnimation ? 1 : 4);
                segments = urls;
                segmentIndex = 0;
                audioPlayerWrapper.pla(segments[0]);
                loadExpirationTime = sb_gt() + loadExpirationSeconds * 1000;
                sb_st(monitorThread, 1000);
                state = 1;
                instrument(1, "OK", false); // StartCode: OK = okay
                if (wrapperMode != 4) {
                    break;
                }
                opl(); // Mode_Flash does not support on-playing callback
                sb_st(end, 1200); // Mode_Flash does not support on-ended callback
                break;
            }
            case 1: {
                showIcon(0);
                audioPlayerWrapper.pau();
                state = 0;
                instrument(2, "UserAbort", true); // LoadCode: UserAbort = Fail to load because user aborted
                break;
            }
            case 2: {
                showIcon(0);
                audioPlayerWrapper.pau();
                if (enablePause) {
                    state = 3;
                    instrument(3, "Pause", true); // EndCode: Pause = end because user clicked pause
                    break;
                }
                state = 0;
                instrument(3, "Stop", true); // EndCode: Pause = end because user clicked stop
                break;
            }
            case 3: {
                showIcon(2);
                audioPlayerWrapper.res();
                sb_st(monitorThread, 1000);
                state = 2;
                instrument(1, "Resume", false); // StartCode: Resume = start because user clicked resume
                break;
            }
        }
    }
    AudPla.clk = clk;
    function refocus(button) {
        if (buttonSelected == button) {
            return true;
        }
        if (buttonSelected) {
            showIcon(0);
            audioPlayerWrapper.pau();
            state = 0;
            instrument(3, "Refocus", true); // EndCode: Refocus = End because user focus on another button
            buttonSelected = button;
            state = 0;
            return true;
        }
        if (!initAudioPlayerWrapper()) {
            return false;
        }
        buttonSelected = button;
        state = 0;
        return true;
    }
    function opl() {
        if (!initialized) {
            return;
        }
        if (state != 1 || !buttonSelected) {
            return;
        }
        showIcon(enablePause ? 2 : 4);
        state = 2;
        instrument(2, "OK", false); // LoadCode: OK = OK
    }
    AudPla.opl = opl;
    function end() {
        if (!initialized) {
            return;
        }
        segmentIndex++;
        if (segmentIndex < segments.length) {
            audioPlayerWrapper.pla(segments[segmentIndex]);
            return;
        }
        showIcon(0);
        audioPlayerWrapper.pau();
        state = 0;
        instrument(3, "Norm", true); // EndCode: Norm = ended normally as playing to the end of the audio
    }
    AudPla.end = end;
    function monitorThread() {
        if (state == 1 || state == 2) {
            sb_st(monitorThread, 1000);
        }
        if (state == 1 && (sb_gt() >= loadExpirationTime) && buttonSelected) {
            showIcon(0);
            audioPlayerWrapper.pau();
            state = 0;
            instrument(2, "TimeOut", true); // LoadCode: TimeOut = Fail to load audio because of timeout
        }
        if (wrapperMode == 3) {
            if (AudPla.co.playState == 1) {
                end();
            }
            if (AudPla.co.playState == 3) {
                opl();
            }
        }
    }
    function locateElement(sourceElement, parentTag, childTag, childIndex) {
        var current = sourceElement;
        while (current && current.nodeName != parentTag) {
            current = current.parentNode;
        }
        if (!current) {
            return null;
        }
        var elements = current.getElementsByTagName(childTag);
        if (!elements) {
            return null;
        }
        return elements[childIndex];
    }
    function showIcon(icon, btnOptional) {
        var button = btnOptional ? btnOptional : buttonSelected;
        if (!button) {
            return;
        }
        var divs = button.getElementsByTagName("div");
        if (!divs) {
            return;
        }
        var div = divs[0];
        if (!div) {
            return;
        }
        // clear
        div.className = div.className.replace(/\bsw_play[p,d,a]?\b|\baud_spin\b/g, '');
        div.className = String.prototype.trim ? div.className.trim() : div.className.replace(/^\s+|\s+$/g, '');
        switch (icon) {
            case 0: {
                div.className += " sw_play";
                break;
            }
            case 1: {
                div.className += " aud_spin";
                break;
            }
            case 2: {
                div.className += " sw_playp";
                break;
            }
            case 3: {
                div.className += " sw_playd";
                break;
            }
            case 4: {
                div.className += " sw_playa";
                break;
            }
        }
    }
    function instrument(step, code, isOutput, btnOptional) {
        var button = btnOptional ? btnOptional : buttonSelected;
        if (step == 1 || button != instButton) {
            instStartCode = "";
            instStartTimeMs = 0;
            instLoadCode = "";
            instLoadTimeMs = 0;
            instEndCode = "";
            instEndTimeMs = 0;
            instButton = button;
        }
        switch (step) {
            case 0: {
                instInitCode = code;
                instInitTimeMs = sb_gt() - _G.ST;
                break;
            }
            case 1: {
                instStartCode = code;
                instStartTimeMs = sb_gt() - _G.ST;
                break;
            }
            case 2: {
                instLoadCode = code;
                instLoadTimeMs = sb_gt() - _G.ST;
                break;
            }
            case 3: {
                instEndCode = code;
                instEndTimeMs = sb_gt() - _G.ST;
                break;
            }
        }
        if (!isOutput) {
            return;
        }
        // Search the attribute for instrumentation in the order of: onmousedown, inst, h
        var attr = String(button.getAttribute("onmousedown") || button.getAttribute("inst") || button.getAttribute("h"));
        if (!attr) {
            return;
        }
        // Looking for: return 'ID=SERP,5332.1'
        var matches = attr.match(/ID=[\w]+(\.[\d]+_[\d]+)*,[\d]+\.[\d]+/);
        if (!matches) {
            return;
        }
        var pieces = matches[0].substr(3).split(',');
        // Store the namespace and K value.
        var namespace = pieces[0];
        var kValue = pieces[1];
        Log.Log("AudPla", "AudPla", "AudPla", true, "T", "AudPla", "K", kValue, "Name", "AudPla", "TS", "" + sb_gt(), "AppNS", namespace, "InitC", instInitCode, "InitT", "" + instInitTimeMs, "StartC", instStartCode, "StartT", "" + instStartTimeMs, "LoadC", instLoadCode, "LoadT", "" + instLoadTimeMs, "EndC", instEndCode, "EndT", "" + instEndTimeMs);
    }
})(AudPla || (AudPla = {}));
