<!--//<![CDATA[
(function() {
    function i(n, t, i, e) {
        var o, s, h;
        n && (o = f(n, e), s = _w.ClickConfig || {}, _w.Log2 ? (Log2.LogEvent(o.eventType, o.data, null, null, null, null, null, null), _w.ThresholdUtilities && (h = _w.ThresholdUtilities, h.uploadApiTimes("PCE")), (s.ForceFlushOnClick || e === 0 && u()) && (sj_evt.fire("visibility", document.hidden), s.FlushSkipAbort ? Log2.FlushMainQueueDontForce() : Log2.ForceFlush(), _w.clickFlushedTime = sb_gt())) : r(n))
    }

    function r(t) {
        n ? n(t) : document.images && (_G.GPImg = new Image, _G.GPImg.src = _G.gpUrl + "IG=" + _G.IG + (_G.CID ? "&CID=" + _G.CID : "") + "&TS=" + (new Date).getTime() + t)
    }

    function u() {
        if (_w.event && _w.event.srcElement) {
            for (var n = _w.event.srcElement; !n.href;)
                if (n.parentElement) n = n.parentElement;
                else return !1;
            if (n.href.split("#")[0] !== _d.URL.split("#")[0]) return !0
        }
        return !1
    }

    function f(n, i) {
        var r = n.match(t),
            u;
        if (r) return u = {
            eventType: "Click",
            data: {
                AppNS: r[1],
                K: r[2],
                Case: i
            }
        }, r[4] && (u.data.Properties = JSON.parse(r[4])), u;
        throw new Error("hValue passed to click tracking was unable to be parsed: " + n);
    }
    var t = /ID=(\w+),(\d+(?:\.\d+)*)(&PR=(.*))?/i,
        n = _w.si_T;
    _w.si_T = i
})();
define("onHTML", ["require", "exports", "event.custom"], function(n, t, i) {
    i.fire("onHTML")
});
sj_be(_d, "mousewheel", function(n) {
    n.ctrlKey == !0 && sj_pd(n)
});
sj_be(_d, "keydown", function(n) {
    n.ctrlKey == !0 && (n.keyCode == 107 || n.keyCode == 109 || n.keyCode == 187 || n.keyCode == 189) && sj_pd(n)
});
var AppInst;
(function(n) {
    function f(r, u, f, o, s) {
        var c, h, l;
        s === void 0 && (s = !0);
        c = "";
        r && (h = r.match(i), h && h.length >= 3 && (c = h[1], l = h[2], f === 1 && o || n.layoutJson.push({
            T: "L.MI",
            Action: "Update",
            AppNS: c,
            K: l,
            V: "1"
        })));
        u && n.datasourceJson.push({
            T: "D.MI",
            Action: "Update",
            AppNS: c,
            K: u,
            InstallState: e(f)
        });
        s && t()
    }

    function e(n) {
        switch (n) {
            case 0:
                return "Installed";
            case 1:
                return "NotInstalled";
            default:
                return "Unknown"
        }
    }

    function o() {
        return r++
    }

    function t() {
        var t = [];
        n.layoutJson.length > 0 && (t.push({
            Page: n.layoutJson
        }), n.layoutJson = []);
        n.datasourceJson.length > 0 && (t.push(n.datasourceJson), n.datasourceJson = []);
        t.length > 0 && s(JSON.stringify(t))
    }

    function s(n) {
        if (n)
            if (_w.Log2) Log2.LogEvent("ClientInst", JSON.parse(n), null, null, null, null, null, null);
            else {
                var i = sb_gt(),
                    r = "<E><T>Event.ClientInst<\/T><IG>" + _G.IG + "<\/IG><TS>" + i + "<\/TS><D>" + n + "<\/D><\/E>",
                    u = "<ClientInstRequest><Events>" + r + "<\/Events><STS>" + i + "<\/STS><\/ClientInstRequest>",
                    t = sj_gx();
                t.open("POST", "/fd/ls/lsp.aspx", !0);
                t.setRequestHeader("Content-Type", "text/xml");
                t.send(u)
            }
    }
    var i = /ID=([\w]+),([\d]+\.[\d]+)/i,
        r = 1,
        u;
    n.layoutJson = [];
    n.datasourceJson = [],
        function(n) {
            n[n.Installed = 0] = "Installed";
            n[n.NotInstalled = 1] = "NotInstalled"
        }(n.InstallState || (n.InstallState = {}));
    u = n.InstallState;
    n.queueServerAppLog = f;
    n.getUniqueId = o;
    n.submitLog = t
})(AppInst || (AppInst = {}));
var AppApi;
(function(n) {
    function e(n, t) {
        i[n] || (i[n] = t)
    }

    function o(n) {
        var i, r;
        if (t && n && (i = t[n.id], i))
            for (r = 0; r < i.length; ++r) s(i[r], n)
    }

    function s(n, t) {
        var e = Boolean(n.getAttribute("data-hideIfNotInstalled")),
            c, l, f, o;
        if (r && (c = !1, l = t.installed ? 0 : 1, AppInst.queueServerAppLog(n.getAttribute("h"), n.getAttribute("data-appInfoDsK"), l, e, c)), f = n.getAttribute("data-controlName"), f && (o = i[f], o)) {
            var a = n.getAttribute("data-minVersion"),
                y = n.getAttribute("data-additionalProps"),
                s = t.installedAppVersion ? u(t.installedAppVersion) : null,
                h = a ? u(a) : null,
                p = {
                    appElement: n,
                    appInfo: t,
                    installedVersion: s,
                    requiredMinVersion: h,
                    updateRequired: h && s ? v(s, h) < 0 : !1,
                    updateAvailable: t.updateAvailable,
                    hideIfNotInstalled: e,
                    additionalProps: null
                };
            try {
                p.additionalProps = y ? JSON.parse(y) : null;
                o(p)
            } catch (w) {
                Log.Log("Error", "AppApi", "Handler_" + f, !1, "Tx", w.message)
            }
            t.installed && e && n.classList.remove("b_hide")
        }
    }

    function h() {
        var u, f, i, n, r, e;
        if (!t)
            for (t = {}, u = "data-appid", f = _d.querySelectorAll("[" + u + "]"), i = 0; i < f.length; i++) n = f[i], n && (r = n.getAttribute(u), r && (e = t[r], e ? e.push(n) : t[r] = [n]))
    }

    function c(n, t, i, r) {
        var e, o, u;
        n.setAttribute("href", r);
        e = f(t.parentElement, "[data-launchappid='" + i + "']");
        e && (o = "h", u = e.getAttribute(o), u && u.length > 0 && n.setAttribute(o, u))
    }

    function l(n) {
        var i = f(n.parentElement, "[data-linkRole='Upgrade']"),
            t;
        i && (t = i.getAttribute("h"), t && n.setAttribute("h", t))
    }

    function a(n) {
        if (n) {
            h();
            for (var t = 0; t < n.length; ++t) o(n[t])
        }
        r && AppInst.submitLog()
    }

    function u(n) {
        return n.split(".").map(function(n) {
            return Number(n)
        })
    }

    function v(n, t) {
        for (var r, u = Math.min(n.length, t.length), i = 0; i < u; i++)
            if (r = n[i] - t[i], r != 0) return r;
        return n.length - t.length
    }

    function f(n, t) {
        return n.querySelector(t)
    }
    n.AddControlHandler = e;
    var i = {},
        t = null,
        r = typeof AppInst != "undefined";
    n.setLaunchLink = c;
    n.instrumentUpgradeLink = l;
    n.UpdateAppInfo = a
})(AppApi || (AppApi = {}));
var CachedDeviceItems = {},
    SmartSearch;
(function(n) {
    function l(n, t) {
        var i = d();
        return n = a(n), t && t.substring && (t = t.substring(1)), !v(i.Blocked, n, t) && v(i.Supported, n, t)
    }

    function k() {
        o = null
    }

    function a(n) {
        var t = n,
            r, i;
        if (t) {
            for (t = t.toLowerCase(), r = -1, i = 0; i < t.length && t[i] === "/"; i++) r = i;
            r >= 0 && (t = t.substring(r + 1))
        }
        return t
    }

    function d() {
        var n, t, i;
        return o || (n = _TC, n && (t = null, i = null, n.SP && (t = y(n.SP)), n.BP && (i = y(n.BP)), o = {
            Supported: t,
            Blocked: i
        })), o
    }

    function v(n, t, i) {
        var f, u, r, e, o;
        for (f in n)
            if (t.indexOf(f) >= 0) {
                if (u = n[f], r = !0, u.length > 0 && (r = !1, i && (e = h(i.split("&")), r = e.length >= u.length, r)))
                    for (o in u)
                        if (e.indexOf(u[o]) < 0) {
                            r = !1;
                            break
                        }
                if (r) return !0
            }
        return !1
    }

    function y(n) {
        var u = {},
            i, f, e, t, r;
        n = n.toLowerCase();
        i = n.split(",");
        f = [];
        for (e in i) t = h(i[e].split("?")), r = f, t.length > 1 && (r = h(t[1].split("&"))), u[a(t[0])] = r;
        return u
    }

    function h(n) {
        var r = n,
            i, u, t;
        if (n)
            for (i = 0, u = !1, t = i; t < n.length; t++) n[t] || (u || (r = [], u = !0), t > i && r.push.apply(r, n.slice(i, t)), i = t + 1);
        return r
    }

    function u() {
        sj_evt.fire("NavigationComplete")
    }

    function g(n, o) {
        var at = !0,
            h, ot, w, st, g, kt, b, dt, ht, ct, it, lt, d, l;
        if (n) {
            var y = ThresholdUtilities,
                vt = n.pathname,
                v = s(n),
                k = n.protocol,
                yt = n.search,
                gt = n.hash;
            if (i && f || ut(), h = n.href, k.toLowerCase() === "javascript:") return;
            v || (v = i);
            var ni = v && v.toLowerCase().indexOf(c) >= 0,
                pt = s(_w.location),
                ti = pt && pt.toLowerCase().indexOf(c) >= 0;
            if (ni === ti && k.toLowerCase() === _w.location.protocol.toLowerCase() && vt.toLowerCase() === _w.location.pathname.toLowerCase() && yt.toLowerCase() === _w.location.search.toLowerCase() && gt.toLowerCase() === _w.location.hash.toLowerCase()) SharedLogHelper.LogWarning("SelfNavigate");
            else if (h) {
                var rt = (!k || k.indexOf("http") === 0) && (v === i || v === s(location)),
                    wt = tt(vt, yt, v, rt),
                    a = e.launcher;
                switch (wt) {
                    case 5:
                    case 3:
                        rt && (p(n), h = n.href);
                        wt === 5 && (d = h.indexOf("?") === -1 ? "?" : "&", h += d + "persona=0");
                        var ft = "navigateWebViewAsync",
                            et = "launchWebContent",
                            bt = _TC;
                        bt && bt.NW && a[et] ? (ot = a.createWebContentLaunchOptions(), ot.uri = h, y.wrapSynchronousApiCall(a, et, t(et), null, ot), u()) : e[ft] ? y.wrapApiCallWithTimeout(e, ft, t(ft), h, r, null, h).done(u) : at = !1;
                        break;
                    case 0:
                        w = null;
                        st = n.getAttribute("data-appcontext");
                        st && (w = a.createAppLaunchOptions(), w.appContext = st);
                        g = n.getAttribute("data-appid");
                        g && (kt = n.getAttribute("data-source"), b = CachedDeviceItems[g + ":" + kt], b ? (l = "launchSearchItemAsync", dt = w ? y.wrapApiCallWithTimeout(a, l, t(l), b.id, r, null, b, w) : y.wrapApiCallWithTimeout(a, l, t(l), b.id, r, null, b), dt.done(u)) : (ht = n.getAttribute("data-itemtype"), l = ht && ht === "settings" ? "findSettingsAsync" : "findAppsAsync", y.wrapApiCallWithTimeout(e.searchResultsView.deviceSearch, l, t(l), "Navigation", r, null, [g]).then(sj_df(nt, w))));
                        break;
                    case 4:
                        ct = n.getAttribute("data-experiencename");
                        ct && SearchAppWrapper.CortanaApp.launchExperienceByName(ct, null);
                        break;
                    case 2:
                        it = n.getAttribute("data-dest");
                        it && (lt = n.getAttribute("data-provider"), lt ? a.launchSearchInApp(it, ThresholdUtilities.getDecodedQuery(_w.location.toString()), lt) : a.launchSearchInApp(it, ThresholdUtilities.getDecodedQuery(_w.location.toString())), u());
                        break;
                    case 1:
                        rt && (p(n), h = n.href, d = h.indexOf("?") === -1 ? "?" : "&", h += d + "ts=" + sb_gt(), _G.nclid && (h += "&nclid=" + _G.nclid));
                        l = "launchUriAsync";
                        y.wrapApiCallWithTimeout(a, l, t(l), "Navigation", r, null, h).then(u)
                }
            }
        }
        o && at && o.preventDefault()
    }

    function t(n) {
        return n.match(b).join("").toUpperCase()
    }

    function nt(n, i) {
        var o, f, e;
        if (n != null)
            for (o in n)
                if (f = n[o], f && f.id) {
                    e = "launchSearchItemAsync";
                    ThresholdUtilities.wrapApiCallWithTimeout(SearchAppWrapper.CortanaApp.launcher, e, t(e), null, r, null, f, i).then(u);
                    break
                }
    }

    function tt(n, t, i, r) {
        if (r && l(n, t)) return n === "search" || n === "/search" ? 5 : 3;
        if (i === "ms-smartsearch") {
            if (n === "app" || n === "/app") return 0;
            if (n === "searchInApp" || n === "/searchInApp") return 2;
            if (n === "experience" || n === "/experience") return 4
        }
        return 1
    }

    function it(n) {
        if (!n.defaultPrevented) {
            var i = n.target,
                t = rt(i, "A");
            t && g(t, n)
        }
    }

    function rt(n, t) {
        for (; n && n !== document; n = n.parentNode)
            if (n.tagName === t) return n
    }

    function ut() {
        if (_w._TH_BU) {
            var n = _TH_BU.split("//", 2);
            if (n.length === 2) {
                f = n[0];
                i = n[1];
                return
            }
        }
        f = location.protocol;
        i = s(location)
    }

    function p(n) {
        n.protocol = f;
        n.hostname = i;
        n.port = f === "https:" ? "443" : "80"
    }

    function s(n) {
        if (!n) return null;
        var t = n.hostname;
        return t ? (t.indexOf(":") >= 0 && t.indexOf("[") < 0 && (t = "[" + t + "]"), t) : null
    }
    var e = SearchAppWrapper.CortanaApp,
        o = null,
        f = null,
        i = null,
        r = 100,
        c = "bing",
        b = /(^.)|([A-Z])/g,
        w;
    n.isSupportedPath = l;
    n.reset = k;
    sj_be(_w, "click", it),
        function(n) {
            n[n.App = 0] = "App";
            n[n.Web = 1] = "Web";
            n[n.Explore = 2] = "Explore";
            n[n.Navigation = 3] = "Navigation";
            n[n.Experience = 4] = "Experience";
            n[n.Search = 5] = "Search"
        }(w || (w = {}))
})(SmartSearch || (SmartSearch = {}));
(function() {
    var u = "data-appid",
        n, i, t, r, f;
    if (typeof AppApi != "undefined" && AppApi.UpdateAppInfo && SearchAppWrapper.CortanaApp.searchResultsView) {
        for (n = [], i = document.querySelectorAll("[" + u + "]"), t = 0; t < i.length; t++) r = i[t].getAttribute(u), n.indexOf(r) < 0 && n.push(r);
        f = function(t) {
            var u = [],
                f, i, r, e;
            for (f in n) i = n[f], t.hasKey(i) && (r = t[i], r && (e = {
                id: i,
                installedAppVersion: r.version,
                installed: !0
            }, u.push(e), CachedDeviceItems && !CachedDeviceItems[i] && (CachedDeviceItems[i] = r)));
            AppApi.UpdateAppInfo(u);
            ThresholdUtilities.uploadApiTimes("ALR")
        };
        n.length > 0 && ThresholdUtilities.wrapApiCall(SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch, "findAppsAsync", "AL", "AppLinking", n).then(f)
    }
})();
var DesktopSafeSearchBlocked;
(function() {
    function n() {
        _w.open("ms-cortana://StartMode=Settings&QuerySource=BingSafeSearch", "_parent")
    }
    sj_be(_ge("chngAdultSet"), "click", n)
})(DesktopSafeSearchBlocked || (DesktopSafeSearchBlocked = {}));
CUDialog.sendAction({
    "Cat3AAction": "{\"Uri\":\"action://CuOutput\",\"SystemAction\":{\"QueryUri\":\"https://www.bing.com/search?q=Porngraphic\u0026input=1\u0026nclid=071BF10830A486AD8579D52B580CBD0D\u0026FORM=\",\"Uri\":\"action://Conversation/ShowUrlContent\",\"Version\":\"1.0\"},\"ConversationId\":null,\"TraceId\":\"72303C5C79924DE68A2AD22C815D516F\",\"ImpressionId\":\"3c4de2a2b216f236c154c2390002275a\",\"LgObject\":null}",
    "Cat3BAction": "{\"Uri\":\"action://CuOutput\",\"SystemAction\":{\"QueryUri\":\"https://www.bing.com/search?q=Porngraphic\u0026input=1\u0026nclid=071BF10830A486AD8579D52B580CBD0D\u0026FORM=\",\"Uri\":\"action://Conversation/ShowUrlContent\",\"Version\":\"1.0\"},\"ConversationId\":null,\"TraceId\":\"72303C5C79924DE68A2AD22C815D516F\",\"ImpressionId\":\"3c4de2a2b216f236c154c2390002275a\",\"LgObject\":null}"
});;
sj_evt.bind("ajax.feedback.initialized", function(args) {
    args[1].debugCollector.setContextValue("FederationDebugInfo", "QueryID : ec06138e98ca49b6ac1f6153a1aedf0f");
});;
//]]>-->