(function() {
	function t(n, t, u, f) {
		var e, o;
		n && (e = r(n, f), _w.Log2 && (Log2.LogEvent(e.eventType, e.data, null, null, null, null, null, null), _w.ThresholdUtilities && (o = _w.ThresholdUtilities, o.uploadApiTimes("PCE")), f === 0 && i() && (sj_evt.fire("visibility", document.hidden), _w.ClickConfig && ClickConfig.FlushSkipAbort ? Log2.FlushMainQueueDontForce() : Log2.ForceFlush(), _w.clickFlushedTime = sb_gt())))
	}

	function i() {
		if (_w.event && _w.event.srcElement) {
			for (var n = _w.event.srcElement; !n.href;)
				if (n.parentElement) n = n.parentElement;
				else return !1;
			if (n.href.split("#")[0] !== _d.URL.split("#")[0]) return !0
		}
		return !1
	}

	function r(t, i) {
		var r = t.match(n),
			u;
		if (r) return u = {
			eventType: "Click",
			data: {
				AppNS: r[1],
				K: r[2],
				Case: i
			}
		}, r[4] && (u.data.Properties = JSON.parse(r[4])), u;
		throw new Error("hValue passed to click tracking was unable to be parsed: " + t);
	}
	var n = /ID=(\w+),(\d+(?:\.\d+)*)(&PR=(.*))?/i;
	_w.si_T = t
})();
_w.finheader = !1;
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
	function c(n, t) {
		var i = k();
		return n = l(n), t && t.substring && (t = t.substring(1)), !a(i.Blocked, n, t) && a(i.Supported, n, t)
	}

	function b() {
		o = null
	}

	function l(n) {
		var t = n,
			r, i;
		if (t) {
			for (t = t.toLowerCase(), r = -1, i = 0; i < t.length && t[i] === "/"; i++) r = i;
			r >= 0 && (t = t.substring(r + 1))
		}
		return t
	}

	function k() {
		var n, t, i;
		return o || (n = _TC, n && (t = null, i = null, n.SP && (t = v(n.SP)), n.BP && (i = v(n.BP)), o = {
			Supported: t,
			Blocked: i
		})), o
	}

	function a(n, t, i) {
		var f, u, r, e, o;
		for (f in n)
			if (t.indexOf(f) >= 0) {
				if (u = n[f], r = !0, u.length > 0 && (r = !1, i && (e = s(i.split("&")), r = e.length >= u.length, r)))
					for (o in u)
						if (e.indexOf(u[o]) < 0) {
							r = !1;
							break
						}
				if (r) return !0
			}
		return !1
	}

	function v(n) {
		var u = {},
			i, f, e, t, r;
		n = n.toLowerCase();
		i = n.split(",");
		f = [];
		for (e in i) t = s(i[e].split("?")), r = f, t.length > 1 && (r = s(t[1].split("&"))), u[l(t[0])] = r;
		return u
	}

	function s(n) {
		var r = n,
			i, u, t;
		if (n)
			for (i = 0, u = !1, t = i; t < n.length; t++) n[t] || (u || (r = [], u = !0), t > i && r.push.apply(r, n.slice(i, t)), i = t + 1);
		return r
	}

	function f() {
		sj_evt.fire("NavigationComplete")
	}

	function d(n, o) {
		var ht = !0,
			s, k, a, ft, d, vt, v, yt, et, ot, tt, st, b, c;
		if (n) {
			var p = ThresholdUtilities,
				ct = n.pathname,
				w = h(n),
				it = n.protocol,
				lt = n.search,
				pt = n.hash;
			if (t && u || rt(), s = n.href, it.toLowerCase() === "javascript:") return;
			if (ct.toLowerCase() === _w.location.pathname.toLowerCase() && lt.toLowerCase() === _w.location.search.toLowerCase() && pt.toLowerCase() === _w.location.hash.toLowerCase()) SharedLogHelper.LogWarning("SelfNavigate");
			else if (s) {
				w || (w = t);
				var ut = (!it || it.indexOf("http") === 0) && (w === t || w === h(location)),
					at = nt(ct, lt, w, ut),
					l = e.launcher;
				switch (at) {
					case 5:
					case 3:
						ut && (y(n), s = n.href);
						at === 5 && (b = s.indexOf("?") === -1 ? "?" : "&", s += b + "persona=0");
						k = "navigateWebViewAsync";
						e[k] ? p.wrapApiCallWithTimeout(e, k, r(k), s, i, null, s).done(f) : ht = !1;
						break;
					case 0:
						a = null;
						ft = n.getAttribute("data-appcontext");
						ft && (a = l.createAppLaunchOptions(), a.appContext = ft);
						d = n.getAttribute("data-appid");
						d && (vt = n.getAttribute("data-source"), v = CachedDeviceItems[d + ":" + vt], v ? (c = "launchSearchItemAsync", yt = a ? p.wrapApiCallWithTimeout(l, c, r(c), v.id, i, null, v, a) : p.wrapApiCallWithTimeout(l, c, r(c), v.id, i, null, v), yt.done(f)) : (et = n.getAttribute("data-itemtype"), c = et && et === "settings" ? "findSettingsAsync" : "findAppsAsync", p.wrapApiCallWithTimeout(e.searchResultsView.deviceSearch, c, r(c), "Navigation", i, null, [d]).then(sj_df(g, a))));
						break;
					case 4:
						ot = n.getAttribute("data-experiencename");
						ot && SearchAppWrapper.CortanaApp.launchExperienceByName(ot, null);
						break;
					case 2:
						tt = n.getAttribute("data-dest");
						tt && (st = n.getAttribute("data-provider"), st ? l.launchSearchInApp(tt, ThresholdUtilities.getDecodedQuery(_w.location.toString()), st) : l.launchSearchInApp(tt, ThresholdUtilities.getDecodedQuery(_w.location.toString())), f());
						break;
					case 1:
						ut && (y(n), s = n.href, b = s.indexOf("?") === -1 ? "?" : "&", s += b + "ts=" + sb_gt(), _G.nclid && (s += "&nclid=" + _G.nclid));
						c = "launchUriAsync";
						p.wrapApiCallWithTimeout(l, c, r(c), "Navigation", i, null, s).then(f)
				}
			}
		}
		o && ht && o.preventDefault()
	}

	function r(n) {
		return n.match(w).join("").toUpperCase()
	}

	function g(n, t) {
		var o, u, e;
		if (n != null)
			for (o in n)
				if (u = n[o], u && u.id) {
					e = "launchSearchItemAsync";
					ThresholdUtilities.wrapApiCallWithTimeout(SearchAppWrapper.CortanaApp.launcher, e, r(e), null, i, null, u, t).then(f);
					break
				}
	}

	function nt(n, t, i, r) {
		if (r && c(n, t)) return n === "search" || n === "/search" ? 5 : 3;
		if (i === "ms-smartsearch") {
			if (n === "app" || n === "/app") return 0;
			if (n === "searchInApp" || n === "/searchInApp") return 2;
			if (n === "experience" || n === "/experience") return 4
		}
		return 1
	}

	function tt(n) {
		if (!n.defaultPrevented) {
			var i = n.target,
				t = it(i, "A");
			t && d(t, n)
		}
	}

	function it(n, t) {
		for (; n && n !== document; n = n.parentNode)
			if (n.tagName === t) return n
	}

	function rt() {
		if (_w._TH_BU) {
			var n = _TH_BU.split("//", 2);
			if (n.length === 2) {
				u = n[0];
				t = n[1];
				return
			}
		}
		u = location.protocol;
		t = h(location)
	}

	function y(n) {
		n.protocol = u;
		n.hostname = t;
		n.port = u === "https:" ? "443" : "80"
	}

	function h(n) {
		if (!n) return null;
		var t = n.hostname;
		return t ? (t.indexOf(":") >= 0 && t.indexOf("[") < 0 && (t = "[" + t + "]"), t) : null
	}
	var e = SearchAppWrapper.CortanaApp,
		o = null,
		u = null,
		t = null,
		i = 100,
		w = /(^.)|([A-Z])/g,
		p;
	n.isSupportedPath = c;
	n.reset = b;
	sj_be(_w, "click", tt),
		function(n) {
			n[n.App = 0] = "App";
			n[n.Web = 1] = "Web";
			n[n.Explore = 2] = "Explore";
			n[n.Navigation = 3] = "Navigation";
			n[n.Experience = 4] = "Experience";
			n[n.Search = 5] = "Search"
		}(p || (p = {}))
})(SmartSearch || (SmartSearch = {}));
(function() {
	var u = "data-appid",
		n, i, t, r, f;
	if (typeof AppApi != "undefined" && typeof AppApi.UpdateAppInfo != "undefined") {
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
(function() {
	function n() {
		var n = "SRCHHPGUSR",
			r = sj_cook.get(n, "CW"),
			t, i;
		(!r || window.sj_b && r != sj_b.clientWidth) && sj_cook.set(n, "CW", sb_de.clientWidth || sj_b.clientWidth, 1, "/");
		t = sj_cook.get(n, "CH");
		t && t == sb_de.clientHeight || sj_cook.set(n, "CH", sb_de.clientHeight, 1, "/");
		i = sj_cook.get(n, "DPR");
		typeof _w.devicePixelRatio == "undefined" || i && i == _w.devicePixelRatio || sj_cook.set(n, "DPR", _w.devicePixelRatio, 1, "/")
	}
	sj_be(_w, "load", n);
	sj_be(_w, "resize", n)
})();
var SelectorHelper;
(function(n) {
	function t(n, t) {
		var i, r;
		if (n.matches) return n.matches(t);
		if (n.webkitMatchesSelector) return n.webkitMatchesSelector(t);
		if (n.mozMatchesSelector) return n.mozMatchesSelector(t);
		if (n.msMatchesSelector) return n.msMatchesSelector(t);
		if (i = _d.querySelectorAll(t), i)
			for (r = 0; r < i.length; r++)
				if (i[r] === n) return !0;
		return !1
	}

	function i(n, i) {
		var r = n;
		do r = r.parentElement; while (r != null && !t(r, i));
		return r
	}
	n.selectorMatches = t;
	n.findFirstAncestorWithSelector = i
})(SelectorHelper || (SelectorHelper = {}));
var AnswerActionsHelper;
(function(n) {
	function p(n, t) {
		var i, u, r;
		return n == null || t == null ? null : (i = sj_ce("div", null, "b_undoContainer b_hide"), u = sj_ce("div", null, "confirmMsg"), u.innerHTML = t, r = sj_ce("a"), r.setAttribute("href", "javascript:void(0);"), r.innerText = n, i.appendChild(u), i.appendChild(r), i)
	}

	function w(n, t, i) {
		return function() {
			n.isHandling = !1;
			n.innerText = t;
			n.classList.remove("b_demoteText");
			i || n.classList.add("b_accentColor")
		}
	}

	function u(n) {
		return SelectorHelper.findFirstAncestorWithSelector(n, "#b_pole,.b_ans,.b_ansSlice,.answer,.b_skSlice")
	}

	function h(n) {
		return n.getAttribute("data-type") === "wrapper"
	}

	function i(n) {
		n != null && (n.classList.add("b_anim"), n.style.height = _w.getComputedStyle(n).height, sb_st(function() {
			n.classList.add("b_hide");
			sj_evt.fire("elementgone", n)
		}, 1))
	}

	function c(n, t) {
		if (!t) return null;
		var i = sj_ce(t.tagName, "", t.className);
		return i.innerHTML = n, i
	}

	function t(n, t, r) {
		if (n == null || t == null) {
			t != null && r && i(t);
			return
		}
		var f = t.parentElement,
			u;
		h(f) ? u = f : (u = sj_ce("div"), u.setAttribute("data-type", "wrapper"), u.classList.add("b_anim"), f.insertBefore(u, t), u.appendChild(t));
		u.appendChild(n);
		u.style.height = l(t) + "px";
		sb_st(function() {
			u.style.height = l(n) + "px";
			sb_st(function() {
				return u.style.height = ""
			}, 0)
		}, 0);
		i(t)
	}

	function f(n, t) {
		while (t && t.parentElement !== n) t = t.parentElement;
		return t
	}

	function b(n, t) {
		for (var u = sj_ce("div"), i = 0, r; i < n.length;) r = n[i], t == null || t.indexOf(r) < 0 ? u.appendChild(r) : i++;
		return u
	}

	function l(n) {
		return a(_w.getComputedStyle(n).height) + a(_w.getComputedStyle(n).paddingBottom)
	}

	function a(n) {
		return parseInt(n.substring(0, n.length - 2))
	}

	function k(n) {
		var t = sj_ce("script", "");
		t.type = "text/javascript";
		n.src ? t.src = n.src : t.innerHTML = n.innerHTML;
		v(t)
	}

	function d(n, r) {
		var f = u(n),
			l = c(r, f),
			w, a, h;
		if (f == null || l == null) {
			f != null && i(f);
			return
		}
		if (w = g(n), w) t(l, f, !0);
		else {
			if (a = l.querySelectorAll("style, link"), a)
				for (h = 0; h < a.length; h++) v(a[h]);
			var b = s(l),
				d = s(f),
				nt = e(l),
				tt = e(f),
				it = o(l),
				rt = o(f),
				ut = y(nt, it, b),
				ft = y(tt, rt, d),
				p = l.querySelectorAll("script");
			if (t(nt, tt, !1), t(ut, ft, !1), t(it, rt, !0), t(b, d, !0), p)
				for (h = 0; h < p.length; h++) k(p[h])
		}
		sj_evt.fire("replaceCard")
	}

	function g(n) {
		while (n != null) {
			var t = n.parentElement;
			if (t && t.getAttribute && t.getAttribute("data-type") === "infoldAction") return n;
			n = t
		}
		return null
	}

	function v(n) {
		_d.head.appendChild(n)
	}

	function e(n) {
		return r(n, ".b_anno,[data-anno]")
	}

	function o(n) {
		var t = r(n, '[data-type="expandableActions"]');
		return t ? t : r(n, '[data-type="actions"]')
	}

	function s(n) {
		return r(n, ".actExpl")
	}

	function r(n, t) {
		var u, r, i;
		if (n)
			for (u = n.querySelectorAll(t), r = 0; r < u.length; r++)
				if (i = u[r], i.classList.contains("b_hide")) i.parentNode.removeChild(i);
				else return i;
		return null
	}

	function y(n, t, i) {
		if (!n) return null;
		var r = u(n),
			e = f(r, n),
			o = b(r.childNodes, [e, f(r, t), f(r, i)]);
		return r.insertBefore(o, e.nextSibling)
	}
	n.createUndoContainer = p;
	n.createErrorHandler = w;
	n.findContainingCard = u;
	n.isSwapWrapper = h;
	n.fade = i;
	n.createResponseCard = c;
	n.swapElements = t;
	n.replaceCard = d;
	n.findAnnotation = e;
	n.findActions = o;
	n.findExplanation = s
})(AnswerActionsHelper || (AnswerActionsHelper = {}));
var SearchPeek;
(function() {
	function g() {
		var h, y;
		if (!b) {
			for (b = !0, _d.documentElement.classList.remove(t), sj_b.classList.remove(t), _d.documentElement.classList.add(r), sj_b.classList.add(r), v.getAttribute("data-mainContent") === "1" ? Animation.toggleSlide(s) : (u && u.classList.remove(n), v.classList.add(n)), l.classList.add(n), Animation.toggleSlideTranslate(f), a.classList.add(r), i.classList.add("b_slideListHide"), h = 0; h < o.length; h++) y = o[h], y.classList.remove(n);
			c != null && c.classList.remove(n);
			e.classList.remove(n);
			Animation.cascadeList(i);
			SearchAppWrapper.CortanaApp.setChromeState(0);
			sj_evt.fire("peekexpand", !0)
		}
	}

	function k() {
		var b, s, w;
		if (h) {
			for (u != null && (u.classList.add(n), u.classList.add(t)), v.classList.remove("b_anim"), f.classList.add(n), f.classList.add(t), i.classList.add(t), s = 0; s < o.length; s++) b = o[s], b.classList.add(n);
			for (s = 0; s < p.length; s++) w = p[s], w !== l && w !== d && w.classList.add(n);
			c != null && c.classList.add(n);
			e.classList.add(n);
			e.classList.add(t);
			sj_evt.bind("peekactivate", g, !0)
		} else l.classList.add(n), f.classList.add(t), a.classList.add(r), i.classList.add(r), i.classList.add(t), e.classList.add(t);
		sj_ue(_w, y, k)
	}
	var y = "load",
		t = "peek",
		r = "peekExpand",
		n = "b_hide",
		a = _ge("b_content"),
		i = _ge("b_results"),
		o = i.querySelectorAll(".b_ans,.b_algo,.b_ad"),
		s = _ge("b_pole"),
		h = s != null,
		v = h ? s.querySelector(".b_anno") : null,
		u = h ? s.querySelector(".b_anno~h2,.b_anno~.b_focusLabel") : null,
		f = _ge("b_header"),
		c = i.querySelector(".b_pag"),
		e = _d.querySelector(".b_footer"),
		p = i.querySelectorAll(".b_msg"),
		l = i.querySelector(".recourseLink").parentNode,
		w = _ge("sb_feedback"),
		d = w ? w.parentNode : null,
		b = !1;
	a != null && i != null && f != null && l != null && e != null && sj_be(_w, y, k);
	h && (_d.documentElement.classList.add(t), sj_b.classList.add(t))
})(SearchPeek || (SearchPeek = {}));
var Feedback;
(function(n) {
	var t;
	(function(n) {
		"use strict";

		function t() {
			return _w.PageDebug = typeof _w.PageDebug != "undefined" ? _w.PageDebug : {}, _w.PageDebug
		}

		function i(n) {
			n.length < 1 || (t().FederationDebugInfo = n)
		}
		n.SetFederationDebugInfo = i
	})(t = n.DebugCollector || (n.DebugCollector = {}))
})(Feedback || (Feedback = {}));
Feedback.DebugCollector.SetFederationDebugInfo('QueryID : f6853eb8c8974de5a1da49e9b34aba6a');;
CUDialog.sendAction({
	"PoleAnswerValue": "{\"Uri\":\"action://CuOutput\",\"SystemAction\":{\"Reminder\":{\"Condition\":\"None\",\"Uri\":\"entity://Reminder\",\"Version\":\"2.0\"},\"Uri\":\"action://Reminder/Create\",\"Version\":\"2.0\"},\"ConversationId\":\"00000000-0000-0000-0000-000000000001\",\"TraceId\":\"7BC213D678B94F488C57CDF747F79787\",\"ImpressionId\":\"00000000-0000-0000-0000-000000000001\",\"LgObject\":null}",
	"Value": "{\"Uri\":\"action://CuOutput\",\"SystemAction\":{\"Reminder\":{\"Condition\":\"None\",\"Uri\":\"entity://Reminder\",\"Version\":\"2.0\"},\"Uri\":\"action://Reminder/Create\",\"Version\":\"2.0\"},\"ConversationId\":\"00000000-0000-0000-0000-000000000001\",\"TraceId\":\"7BC213D678B94F488C57CDF747F79787\",\"ImpressionId\":\"00000000-0000-0000-0000-000000000001\",\"LgObject\":null}"
});