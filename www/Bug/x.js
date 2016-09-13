//<![CDATA[
var Instrumentation;
(function(n) {
	function f(n) {
		t = n;
		sj_evt.fire("ClientInst.PageInstInfo", y)
	}

	function e(n, t, i) {
		if (_w.Log2) {
			if (t) {
				var r = DsLManager.CreateLayoutNode(t, "SERP", !1, !1);
				r && (n.layoutNodes = r)
			}
			v(n, i);
			Log2.LogMasterPageImpression(n)
		}
	}

	function o(n, t) {
		var i = _w.location.href,
			r = DsLManager.GetNewDataSources(t ? t : _G.IG);
		return {
			dataSources: r,
			layoutNodes: [],
			pageName: n,
			rawQuery: ThresholdUtilities.getDecodedQuery(),
			isQuery: !0,
			form: ThresholdUtilities.getUrlParameter(i, "form"),
			impressionUrl: i,
			appName: u
		}
	}

	function s(n, t) {
		return DsLManager.LogUpdatedLayoutCentralizedDataSources(n, "SERP", t, !1)
	}

	function h(n, t, i, r) {
		return DsLManager.CreateDataSourceItem("SERP", n, t, i, r)
	}

	function c(n, t, i, r) {
		return DsLManager.CreateDataSourcesRoot("SERP", "D.MyStuff", n, t, i, r)
	}

	function l(n, t, i) {
		return DsLManager.CreateInstrumentedItem("SERP", n, t, i)
	}

	function a(n) {
		return DsLManager.CreateInstrumentedItemFromDs(n)
	}

	function v(n, t) {
		var r = {
				MUID: sj_cook.get("MUID", "MUID")
			},
			i, u;
		if (typeof AppCacheState != "undefined" && AppCacheState.GetRunningAppCacheVersion && (r.ACVer = AppCacheState.GetRunningAppCacheVersion()), t)
			for (i in t) t.hasOwnProperty(i) && (r[i] = t[i]);
		n.enrichedClientInfo = r;
		u = GetUxClassificationSection();
		u && (n.uxClassification = u)
	}

	function y(n) {
		var f, o, u, e;
		if (t) {
			f = n.enrichedClientInfo;
			f || (f = {}, n.enrichedClientInfo = f);
			for (u in r) r.hasOwnProperty(u) && !f[u] && (e = t[r[u]], e && (f[u] = e));
			o = {};
			for (u in i) i.hasOwnProperty(u) && (e = t[i[u]], e && (o[u] = e));
			n.userInfoOverrides = o
		}
	}
	var t = null,
		u = "SmartSearch",
		i, r;
	ThresholdUtilities.getCortanaHeaders(f);
	i = {
		Make: "X-Device-Manufacturer",
		Model: "X-Device-Product",
		"Loc/RT": "X-Search-Location"
	};
	r = {
		DeviceID: "X-Device-MachineId",
		IsTouch: "X-Device-Touch",
		DeviceSKU: "X-Device-SKU",
		OSSKU: "X-Device-OSSKU",
		ConnectionType: "X-Device-NetworkType",
		ClientMarket: "X-BM-RegionalSettings",
		AppLifetimeID: "X-Device-ClientSession",
		CortanaOptIn: "X-Device-IsOptIn",
		CortanaCapabilities: "X-Search-CortanaAvailableCapabilities"
	};
	ClientInstConfig.waitForPageInfo = !0;
	ClientInstConfig.isInstrumentationEnabled = SearchAppWrapper.CortanaApp.isBingEnabled;
	sj_evt.bind("ajax.threshold.pageStart", function() {
		ClientInstConfig.isInstrumentationEnabled = SearchAppWrapper.CortanaApp.isBingEnabled
	});
	n.LogPageImpression = e;
	n.CreatePageImpression = o;
	n.LogUpdatedLayoutCentralizedDataSources = s;
	n.CreateDataSourceItem = h;
	n.CreateDataSourcesRoot = c;
	n.CreateInstrumentedItem = l;
	n.CreateInstrumentedItemFromDs = a
})(Instrumentation || (Instrumentation = {}));
_w.ThresholdInst = Instrumentation;
_w.addEventListener("unload", function() {
	sj_evt.fire("BMU");
	typeof Log2 != "undefined" && Log2.SaveLogsToLocalStorage && Log2.SaveLogsToLocalStorage()
});
var CachedInstrumentation;
(function() {
	function t() {
		var t = "Page.Home",
			n;
		_G.IsCached && (t = "Page.Home:Cached");
		n = _w.location.href;
		Log2.LogMasterPageImpression({
			dataSources: [],
			layoutNodes: [],
			pageName: t,
			rawQuery: "",
			isQuery: !1,
			form: ThresholdUtilities.getUrlParameter(n, "form"),
			impressionUrl: n,
			appName: "SmartSearch",
			impressionGuid: _G.IG
		});
		Log2.LogEvent("ClientInst", null, null, null, null, _G.IG, _G.RefIG, _G.RefIG)
	}
	sj_evt.bind("onP1", t, 1);
	var n = SearchAppWrapper.CortanaApp;
	n && n.addEventListener && n.addEventListener("statechanged", function(n) {
		n.oldState == 2 && n.newState == 1 && sj_evt.fire("unload")
	})
})(CachedInstrumentation || (CachedInstrumentation = {}));
var Feedback;
(function(n) {
	var t;
	(function() {
		"use strict";

		function u(t, i) {
			var u = t.getAttribute("id"),
				f;
			u || (u = "genId" + n.length, t.setAttribute("id", u));
			f = new r(u, i, t.getAttribute(i));
			n.push(f)
		}

		function i(n, t, i) {
			i === null ? n.removeAttribute(t) : n.setAttribute(t, i)
		}

		function t(n, t, r, f) {
			for (var e, s = _d.querySelectorAll(r), o = 0; o < s.length; o++)(e = s[o], f && e.id && f[e.id]) || (u(e, n), i(e, n, t))
		}

		function f(n) {
			for (var u = _d.querySelectorAll(n), e = 1, f = {}, t, i, r = 0; r < u.length; ++r) {
				if (t = u[r], !t.id) {
					for (;;)
						if (i = "fbpgdgelem" + e++, !_ge(i)) break;
					t.id = i
				}
				f[t.id] = t
			}
			return f
		}

		function e() {
			var i = "tabindex",
				r = "-1",
				n = f("#fbpgdg, #fbpgdg *");
			t(i, r, "div", n);
			t(i, r, "svg", n);
			t(i, r, "a", n);
			t(i, r, "li", n);
			t(i, r, "input", n);
			t(i, r, "select", n);
			t("aria-hidden", "true", "body :not(script):not(style)", n)
		}

		function o() {
			for (var r, t = 0; t < n.length; t++) r = _d.getElementById(n[t].id), r && i(r, n[t].attributeName, n[t].originalAttributeValue);
			n.length = 0
		}

		function s() {
			typeof sj_evt != "undefined" && (sj_evt.bind("onFeedbackStarting", function() {
				e()
			}), sj_evt.bind("onFeedbackClosing", function() {
				o()
			}))
		}
		var n = [],
			r = function() {
				function n(n, t, i) {
					this.id = n;
					this.attributeName = t;
					this.originalAttributeValue = i
				}
				return n
			}();
		s()
	})(t = n.Accessibility || (n.Accessibility = {}))
})(Feedback || (Feedback = {}));
RMS2 = new function() {
	function s(n, t) {
		for (var f = 6, r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", i = n ? n.split("") : [], e, u = ~~(t / f); i.length <= u;) i.push(r.charAt(0));
		return e = r.indexOf(i[u]) | 1 << t % f, i[u] = r.charAt(e), i.join("")
	}

	function h(n) {
		var t = sj_cook.get("RMS", n.n);
		sj_cook.set("RMS", n.n, s(t, n.c), 0, "/", 0)
	}

	function c() {
		_d.domain == r && (n.P && n.P(), o = new Date, i(0))
	}

	function i(r) {
		var s = t[r],
			e, c;
		if (s) {
			if (e = sj_gx(), !e) return;
			e.open("get", s.u, !0);
			c = sb_st(function() {
				e[u] != 4 && (e[f] = function() {}, e.abort(), i(r + 1))
			}, 5e3);
			e[f] = function() {
				e[u] == 4 && (sb_ct(c), h(t[r]), i(r + 1))
			};
			e.send(null)
		} else n.I && n.I(o)
	}
	var t = [],
		r = "",
		u = "readyState",
		f = "onreadystatechange",
		e, o, n = _w.RmsConfig || {};
	this.RegisterResources = function(n, i, u, f) {
		r = _d.domain;
		for (var o = 0; o < n.length; o++) t.push({
			n: u,
			u: n[o],
			c: f[o]
		});
		e || (e = !0, sj_evt.bind("onP1", c, 1, 1e3))
	}
};
var Feedback;
(function(n) {
	var t;
	(function() {
		function i(t, i, r, u, f) {
			sj_evt.fire("onFeedbackStarting");
			t = typeof t == "undefined" ? !1 : t;
			t && scrollTo(0, 0);
			r = typeof r == "undefined" ? !0 : r;
			n.PackageLoad.Load(i, r, u, f)
		}

		function o(n, t) {
			for (var r = 0, i = null; n && n.getAttribute && (!(t >= 1) || r < t);) {
				if (i = n.getAttribute("data-fbhlsel"), i != null) break;
				r++;
				n = n.parentNode
			}
			return i
		}
		var r = "feedbackformrequested",
			t, u = "",
			f = "feedback-binded",
			e = "clicked";
		n.Bootstrap.InitializeFeedback = function(n, s, h, c, l, a, v) {
			var y = _ge(s),
				p;
			y && y.classList && y.classList.contains(f) || (l = typeof l == "undefined" ? !1 : l, p = o(y, 3), u !== "sb_feedback" && (u = s, typeof sj_evt != "undefined" && (t && sj_evt.unbind(r, t), t = function(t) {
				var r = o(t[1], 3);
				i(c, n, h, s, r)
			}, sj_evt.bind(r, t, 1)), typeof SearchAppWrapper != "undefined" && SearchAppWrapper.CortanaApp && SearchAppWrapper.CortanaApp.addEventListener && SearchAppWrapper.CortanaApp.addEventListener(r, function(t) {
				(typeof t != "undefined" && t !== null && (t.isHandled = !0), s === u) && i(c, n, h, s)
			})), y !== null ? (sj_be(y, "click", function(t) {
				if (l && y.classList) {
					if (y.classList.contains(e)) return !1;
					y.classList.add(e)
				}
				sj_pd(t);
				sj_sp(t);
				i(c, n, h, s, p)
			}), y.classList && y.classList.add(f)) : (v = typeof v == "undefined" ? !1 : v, v && i(c, n, h, s, p)))
		}
	})(t = n.Bootstrap || (n.Bootstrap = {}))
})(Feedback || (Feedback = {})),
function(n) {
	var t;
	(function() {
		"use strict";

		function r(r, u, f) {
			var s = _G.IG,
				h = typeof _G.V == "undefined" ? _G.P : _G.V,
				o, e;
			o = "/feedback/" + n.RouteProvider.Provide(r) + "?ig=" + s + "&p=" + h;
			typeof fbsrc != "undefined" && (o += "&src=" + encodeURIComponent(fbsrc));
			typeof fbpkgiid != "undefined" && typeof fbpkgiid[r] != "undefined" && (o += "&iid=" + fbpkgiid[r]);
			(e = location.href.match(/[?&]testhooks=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			(e = location.href.match(/[?&]uncrunched=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			(e = location.href.match(/[?&]logjserror=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			(e = location.href.match(/[?&]addloginsource=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			(e = location.href.match(/[?&]hoseassistant=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			(e = location.href.match(/[?&]hose=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			(e = location.href.match(/[?&]theme=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			(e = location.href.match(/[?&]client=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			(e = location.href.match(/[?&]clientversion=[^?&#]*/i)) && e[0] && (o += "&" + e[0].substring(1));
			typeof u != "undefined" && u !== "" && (o += "&fid=" + encodeURIComponent(u));
			sj_ajax(o, {
				callback: function(i, r) {
					i && r && (t && t.removeAttribute("clicked"), r.appendTo(_d.body), n.Highlight && n.Highlight.HighlightElements && n.Highlight.HighlightElements(f))
				}
			});
			i[r] = !0
		}
		var i = {},
			t;
		n.PackageLoad.GetHTML = function() {
			return _d.documentElement.outerHTML
		};
		n.PackageLoad.originalHTML = n.PackageLoad.GetHTML();
		n.PackageLoad.Load = function(n, u, f, e) {
			var o;
			u = typeof u == "undefined" ? !0 : u;
			f = typeof f == "undefined" ? "" : f;
			t = _ge(f);
			for (o in n) n.hasOwnProperty(o) && (u && typeof i[o] != "undefined" || r(o, f, e))
		}
	})(t = n.PackageLoad || (n.PackageLoad = {}))
}(Feedback || (Feedback = {})),
function(n) {
	var t;
	(function() {
		"use strict";
		n.RouteProvider.Provide = function(n) {
			return n
		}
	})(t = n.RouteProvider || (n.RouteProvider = {}))
}(Feedback || (Feedback = {}));
var MoveOnlineThresholdFeedbackBadge;
(function() {
	"use strict";
	var n = _ge("fdbkbadge");
	n != null && _w.document.documentElement.scrollHeight >= _w.document.documentElement.clientHeight && (n.style.marginRight = "17px")
})(MoveOnlineThresholdFeedbackBadge || (MoveOnlineThresholdFeedbackBadge = {}));
sj_evt.bind("ajax.feedback.initialized", function(args) {
	var debugValues = {
		"client": "android",
		"clientVersion": "UnknownAndroidVersion",
		"canvas": "Proactive"
	};
	args[1].debugCollector.setContextValues(debugValues);
}, true);
_G.PN = "Proactive";
var fbpkgiid = fbpkgiid || {};
fbpkgiid.page = 'proactive.5029';;
_w.rms.js({
	'A:0': 0
}, {
	'A:rms:answers:Shared:Orientation': '\/rms\/rms%20answers%20Shared%20Orientation\/jc,nj\/a39998e4\/6798a322.js'
}, {
	'A:1': 1
}, {
	'A:rms:answers:Shared:BackButtonHelper': '\/rms\/rms%20answers%20Shared%20BackButtonHelper\/jc,nj\/bcbac236\/76431af7.js'
}, {
	'A:rms:answers:Shared:Utils': '\/rms\/rms%20answers%20Shared%20Utils\/jc,nj\/89d3b4f5\/a2f17337.js'
}, {
	'A:2': 2
});;
//]]>