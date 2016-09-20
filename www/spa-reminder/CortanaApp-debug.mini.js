//# sourceURL=BingDynamicScript4.js
var WrapApi, SearchAppWrapper;
(function(n) {
	function t(t) {
		n.AndroidReturnAsync ? sb_st(function() {
			return t()
		}, 0) : t()
	}

	function i(n) {
		function c() {
			return u++
		}

		function f(i) {
			console.log('--------------------------------');
			var r = Array.prototype.slice.call(arguments, 1);
			return new Promise(function(u, f) {
				function h(n) {
					console.log('--------------------------------');
					debugger;
					if (o(s, h), n) {
						var t = n.result || null;
						n.status === "resolved" ? u(t) : f(t)
					}
				}
				i && typeof n[i] == "function" || t(f);
				var l = c(),
					s = "callNativeAsync_" + i + "_" + l;
				e(s, h);
				r.push(s);
				n[i].apply(n, r)
			})
		}

		function e(t, r) {
			console.log('--------------------------------');
			debugger;
			if (t) {
				if (i[t] !== undefined) {
					SharedLogHelper.LogWarning("addCortanaEventListener", "CoA projected API", "eventName exists");
					return
				}
				i[t] = r;
				n.registerEventListener(t, "CortanaApp.triggerCortanaEventListenerFromNative")
			}
		}

		function o(t) {
			if (t) {
				if (i[t] === undefined) {
					SharedLogHelper.LogWarning("removeCortanaEventListener", "CoA projected API", "eventName not exists");
					return
				}
				delete i[t];
				n.removeEventListener(t)
			}
		}

		function l(n) {
			n()
		}

		function s(n) {
			var t = new Promise(n);
			return typeof Promise.prototype.done != "function" && (t.done = function(n, i) {
				t.then(n, i)
			}), t
		}
		var u, i, r, h;
		if (n) return u = 1, i = {}, n.triggerCortanaEventListenerFromNative = function(n, t) {
			debugger;
			console.log('--------------------------------');
			var r, u;
			if (n && (r = i[n], r)) {
				u = {};
				try {
					u = JSON.parse(t)
				} catch (f) {
					SharedLogHelper.LogError("triggerCortanaEventListenerFromNative", "CoA projected API", f)
				}
				typeof r == "function" && r.call(null, u)
			}
		}, n.isCortanaEnabled = n.getIsCortanaEnabled(), n.isBingEnabled = n.getIsBingEnabled(), n.isMobile = n.getIsMobile(), n.region = n.getRegion(), n.uiLanguage = n.getUiLanguage(), n.sessionId = n.getSessionId(), n.impressionId = n.getImpressionId(), typeof n.getCurrentState == "function" && (n.currentState = n.getCurrentState()), n.launcher = n.launcher || {
			launchUriAsync: function(n, t) {
				return f.call(null, "launchUriSync", n, t)
			},
			launchRAFAsync: function(t, i) {
				n.launchRAFSync(t, i)
			},
			startPhoneCallAsync: function(i, r) {
				return new Promise(function(u) {
					n.startPhoneCallSync(i, r);
					t(function() {
						return u(!0)
					})
				})
			},
			navigateReactiveViewAsync: function(i, r) {
				return new Promise(function(u) {
					var f = !1;
					n.navigateReactiveViewSync && (f = n.navigateReactiveViewSync(i, r));
					t(function() {
						return u(f)
					})
				})
			}
		}, n.proactiveView = n.proactiveView || {
			invalidateCacheAsync: function() {
				return new Promise(function(i) {
					var r = !1;
					n.invalidateCacheSync && (r = n.invalidateCacheSync());
					t(function() {
						return i(r)
					})
				})
			},
			perfMetrics: {
				lookup: function(t) {
					var i = 0;
					return n.perfMetricLookup && (i = n.perfMetricLookup(t)), new Date(i)
				}
			}
		}, n.getQueryHeadersAsync = function() {
			return new Promise(function(i) {
				var r = n.getQueryHeadersSync(),
					u = JSON.parse(r);
				t(function() {
					return i(u)
				})
			})
		}, typeof n.navigateWebViewSync == "function" && (n.navigateWebViewAsync = function(i) {
			return new Promise(function(r) {
				n.navigateWebViewSync(i);
				t(function() {
					return r(!0)
				})
			})
		}), n.navigateWebViewWithPostAsync = function(i, r) {
			return new Promise(function(u) {
				var f = JSON.stringify(r);
				n.navigateWebViewWithPostSync(i, f);
				t(function() {
					return u(!0)
				})
			})
		}, n.navigateWebViewBackAsync = function(i) {
			return new Promise(function(r) {
				n.navigateWebViewBackSync(i);
				t(function() {
					return r(!0)
				})
			})
		}, n.showWebViewAsync = function() {
			return new Promise(function(i) {
				n.showWebViewSync();
				t(function() {
					return i(!0)
				})
			})
		}, n.launchExperienceByName = function(t, i) {
			var r = JSON.stringify(i);
			n.launchExperienceByNameSync(t, r)
		}, r = {}, n.addEventListener = function(n, t) {
			r[n] === undefined && (r[n] = []);
			r[n].push(t)
		}, n.triggerEventListener = function(n) {
			r[n] !== undefined && r[n].forEach(l)
		}, h = function(n, i, r) {
			this.fileName = n;
			this.contentType = r;
			var u = i;
			this.getBase64ContentAsync = function() {
				return s(function(n) {
					t(function() {
						return n(u)
					})
				})
			}
		}, n.getFeedbackFilesAsync = function() {
			return s(function(i, r) {
				var s = JSON.parse(n.getFeedbackFilesSync());
				if (!s) {
					t(function() {
						return r("Get feedback files failed.")
					});
					return
				}
				var f = s.screenshots,
					e = {},
					u = 0,
					o = 0;
				if (f && f.length > 0)
					for (u = 0, o = f.length; u < o; u++) e[u] = new h(f[u].fileName, f[u].content, f[u].type);
				e.size = o;
				t(function() {
					return i(e)
				})
			})
		}, n.logMeasure = function() {}, n.setNonAnimatingCortanaText = function() {}, n.processNLCommandAsync = function(i, r) {
			return new Promise(function(u) {
				var f = n.processNLCommandSync(i, r);
				t(function() {
					return u(f)
				})
			})
		}, n.searchResultsView = {}, n.searchResultsView.executeSearchAsync = function(i) {
			return new Promise(function(r) {
				var u = n.executeSearchSync(i);
				t(function() {
					return r(u)
				})
			})
		}, n.searchResultsView.deviceSearch = {}, n.searchResultsView.deviceSearch.findAppsAsync = function(i, r) {
			return new Promise(function(u) {
				var f = n.findAppsSync(i, r),
					e;
				if (f) try {
					e = JSON.parse(f)
				} catch (o) {
					alert(o)
				}
				t(function() {
					return u(e)
				})
			})
		}, n.spaDialogRuntime = {
			startLanguageUnderstandingFromVoiceAsync: function(i) {
				return new Promise(function(r) {
					var u = n.startLanguageUnderstandingFromVoiceSync(i);
					t(function() {
						return r(u)
					})
				})
			},
			startDictationAsync: function(i) {
				return new Promise(function(r) {
					n.startDictationSync(i);
					t(function() {
						return r(!0)
					})
				})
			},
			endpointAudio: function(t) {
				n.endpointAudio(t)
			},
			dialogComplete: function(t, i) {
				n.dialogComplete(t, i)
			},
			playEarconAsync: function(i) {
				return new Promise(function(r) {
					n.playEarconSync(i);
					t(function() {
						return r(!0)
					})
				})
			},
			speakAsync: function(n) {
				debugger;
				return f.call(null, "speakSync", n)
			},
			stopSpeakingAsync: function() {
				return new Promise(function(i) {
					n.stopSpeakingSync();
					t(function() {
						return i(!0)
					})
				})
			},
			updateTrex: function(t) {
				n.updateTrex(t)
			},
			updateGui: function(t) {
				n.updateGui(t)
			},
			changeSticMode: function(t) {
				n.changeSticMode(t)
			},
			changeSticStateAndInputMode: function(t, i) {
				n.changeSticStateAndInputMode(t, i)
			},
			addEventListener: function(n, t) {
				n && e(n, t)
			},
			removeEventListener: function(n, t) {
				n && o(n, t)
			}
		}, n
	}
	n.wrapAndroidApiAsynchronousable = i
})(WrapApi || (WrapApi = {}));
SearchAppWrapper = {
	CortanaApp: _w.CortanaApp ? WrapApi.wrapAndroidApiAsynchronousable(_w.CortanaApp) : _w.MockCortanaAppInstance
};
var CUDialog;
(function(n) {
	function t(n) {
		var t;
		t = _d.querySelectorAll(".b_cat3a").length > 0 ? n.Cat3AAction : n.Cat3BAction;
		SearchAppWrapper.CortanaApp.sendAction(t)
	}
	n.sendAction = t
})(CUDialog || (CUDialog = {}));
var cuRequestHeaders = [
	["X-BM-Theme", "000000;1ba0e1"],
];
DialogSPALib.executeFinalAction("\u003cspeak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xmlns:mstts=\"http://www.w3.org/2001/mstts\" xmlns:emo=\"http://www.w3.org/2009/10/emotionml\" xml:lang=\"zh-CN\"\u003e\u003cmstts:prompt domain=\"VoiceAssistant\"/\u003e\u003cemo:emotion\u003e\u003cemo:category name=\"Calm\" value=\"1.0\"/\u003e即将播放刘德华\u003c/emo:emotion\u003e\u003c/speak\u003e", "Calm", "", "", "", "{\"Uri\":\"action://LaunchTaskCompletionUri\",\"AllowLaunchOverLock\":true,\"LaunchUri\":\"orpheus-cortana://voice?action=play\u0026type=general\u0026params=%7B%22q%22%3Anull%2C%22entities%22%3A%5B%7B%22type%22%3A%22artist%22%2C%22value%22%3A%22%E5%88%98%E5%BE%B7%E5%8D%8E%22%7D%5D%7D\",\"PackageFamilyName\":\"com.netease.cloudmusic\",\"CorrelationVector\":\"MjQ1NTBlODktMjM5.3.0\",\"DismissOnComplete\":false}", "ProcessNLCommandAsync", 3000, "SpeechQuery");
if (SearchAppWrapper.CortanaApp.isAmbientMode) {
	sb_de.classList.add("CortanaSPA_ambient");
};