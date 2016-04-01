function(u) {
    var e, f;
    if (u) {
        e = t[n.headersLocation];
        for (f in u) {
            u.hasOwnProperty(f) &&
                (f.substring(0, 2) === "X-" || n.copyableHeaders.indexOf(f) >= 0) &&
                (e[f] || t.setRequestHeader(f, u[f]))
        }
    }
    n.setFlightHeaders(t);
    n.applyMethodThatRequiresOpened(t, i, r)
}


{"Meta":"https://www.bing.com/search/?q=%E7%94%B5%E5%BD%B1%E9%A3%9E%E9%B9%B0%E8%89%BE%E8%BF%AA&mkt=zh-CN&setlang=zh-CN",
"Line":6,"Char":1100,
"Name":"JSError","Text":"","Stack":"\nInvalidStateError: DOM Exception 11: An attempt was made to use an object that is not, or is no longer, usable."}


InvalidStateError: DOM Exception 11: An attempt was made to use an object that is not, or is no longer, usable.


applyMethodThatRequiresOpened


var amd, define, require;
(function(n) {
    function e(n, i, u) {
        t[n] || (t[n] = {
            dependencies: i,
            callback: u
        }, r(n))
    }

    function r(n) {
        if (n) {
            if (n) return u(n)
        } else {
            if (!f) {
                for (var r in t) u(r);
                f = !0
            }
            return i
        }
    }

    function u(n) {
        var s, e;
        if (i[n]) return i[n];
        if (t.hasOwnProperty(n)) {
            var h = t[n],
                f = h.dependencies,
                l = h.callback,
                a = r,
                o = {},
                c = [a, o];
            if (f.length < 2) throw "invalid usage";
            else if (f.length > 2)
                for (s = f.slice(2, f.length), e = 0; e < s.length; e++) c.push(u(s[e]));
            return l.apply(this, c), i[n] = o, o
        }
    }
    var t = {},
        i = {},
        f = !1;
    n.define = e;
    n.require = r
})(amd || (amd = {}));
define = amd.define;
require = amd.require;
var _w = window,
    _d = document,
    sb_ie = window.ActiveXObject !== undefined,
    sb_i6 = sb_ie && !_w.XMLHttpRequest,
    _ge = function(n) {
        return _d.getElementById(n)
    },
    sb_st = function(n, t) {
        return setTimeout(n, t)
    },
    sb_rst = sb_st,
    sb_ct = function(n) {
        clearTimeout(n)
    },
    sb_gt = function() {
        return (new Date).getTime()
    },
    sj_gx, AjaxWrapperThreshold;
_w.sj_ce = function(n) {
    return _d.createElement(n)
};
_w.sk_merge || (_w.sk_merge = function(n) {
    _d.cookie = n
});
AjaxWrapperThreshold = function() {
    function n() {}
    return n.applyMethodThatRequiresOpened = function(n, t, i) {
        return n.readyState == n.OPENED ? (t.apply(n, i), !0) : !1
    }, n.wrapSend = function(t, i) {
        return function() {
            var r = arguments;
            n.isRequestBlocked(t) || t.readyState != t.OPENED ? (Object.defineProperties(t, {
                readyState: {
                    get: function() {
                        return 4
                    }
                },
                status: {
                    get: function() {
                        return 200
                    }
                },
                responseText: {
                    get: function() {
                        return ""
                    }
                },
                responseBody: {
                    get: function() {
                        return ""
                    }
                }
            }), t.onreadystatechange && t.onreadystatechange.apply(t, null)) : typeof ThresholdUtilities != "undefined" && SearchAppWrapper && SearchAppWrapper.CortanaApp && n.hostIsBing(t.url) ? ThresholdUtilities.getCortanaHeaders(function(u) {
                var e, f;
                if (u) {
                    e = t[n.headersLocation];
                    for (f in u) u.hasOwnProperty(f) && (f.substring(0, 2) === "X-" || n.copyableHeaders.indexOf(f) >= 0) && (e[f] || t.setRequestHeader(f, u[f]))
                }
                n.setFlightHeaders(t);
                n.applyMethodThatRequiresOpened(t, i, r)
            }) : (n.hostIsBing(t.url) && n.setFlightHeaders(t), n.applyMethodThatRequiresOpened(t, i, r))
        }
    }, n.wrapOpen = function(n, t) {
        return function() {
            n.url = arguments[1];
            t.apply(n, arguments)
        }
    }, n.wrapSetRequestHeader = function(t, i) {
        return function(r, u) {
            var e = n.applyMethodThatRequiresOpened(t, i, arguments),
                f;
            return e && _w.finheader && (f = t[n.headersLocation], f[r] ? f[r].push(u) : f[r] = [u]), e
        }
    }, n.hostIsBing = function(t) {
        var u = !0,
            i, r, f;
        if (n.testAnchor.href = t, i = n.testAnchor.hostname, i && i.indexOf(".") > 0) {
            r = !1;
            for (f in this.bingHosts)
                if (i.indexOf(this.bingHosts[f]) > 0) {
                    r = !0;
                    break
                }
            r || (u = !1)
        }
        return u
    }, n.blockRequestWrapper = function(n) {
        var t = this;
        return function() {
            return t.isRequestBlocked(n)
        }
    }, n.isRequestBlocked = function(t) {
        return typeof SearchAppWrapper != "undefined" && SearchAppWrapper && SearchAppWrapper.CortanaApp && !SearchAppWrapper.CortanaApp.isBingEnabled && n.hostIsBing(t.url)
    }, n.createAjaxWrapper = function() {
        var n = new XMLHttpRequest;
        return n[this.headersLocation] = {}, n.send = this.wrapSend(n, n.send), n.open = this.wrapOpen(n, n.open), n.setRequestHeader = this.wrapSetRequestHeader(n, n.setRequestHeader), n.isRequestBlocked = this.blockRequestWrapper(n), n
    }, n.setFlightHeaders = function(t) {
        if (typeof _CachedFlights != "undefined" && _CachedFlights.sort) {
            var i = t[n.headersLocation];
            i[n.externalExpType] || t.setRequestHeader(n.externalExpType, "JointCoord");
            i[n.externalExp] || t.setRequestHeader(n.externalExp, _CachedFlights.sort().join(","))
        }
    }, n.bingHosts = [".bing.com", ".staging-bing-int.com", ".working-bing-int.com", ".bing-int.com", ".bing-exp.com"], n.testAnchor = document.createElement("a"), n.externalExpType = "X-MSEdge-ExternalExpType", n.externalExp = "X-MSEdge-ExternalExp", n.headersLocation = "headers", n.copyableHeaders = ["Authorization"], n
}();
sj_gx = function() {
    return AjaxWrapperThreshold.createAjaxWrapper()
};

function lb() {
    _w.si_sendCReq && sb_st(_w.si_sendCReq, 800);
    _w.lbc && _w.lbc()
};
