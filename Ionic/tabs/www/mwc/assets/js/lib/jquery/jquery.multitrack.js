; (function ($, window, document, undefined) {
  // Create the defaults once
  var pluginName = 'multitrack',
      defaults = {
        pageviewPrefix: '',
        debugMode: false,
        autoDelayLink: true,
        delayLinkTimeout: 300,
        autoEventTracking: true,
        autoEventTrackingAttrs: {
          category: 't-cat',
          action: 't-act',
          label: 't-label',
          value: 't-value',
          ignoreLink: 't-ignore-link'
        },
        trackers: []
      };

  // A reference to the plugin instance
  var plugin;
  var console = window.console || { log: function (s) { } };

  // The actual plugin constructor
  function Plugin(element, options) {
    this.element = element;
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this._trackers = [];
    this.init = function () {
      // Create trackers
      for (var i = 0; i < this.settings.trackers.length; i++) {
        var tracker = this.settings.trackers[i];
        if (typeof (tracker) != 'object') {
          continue;
        }
        if (!tracker.name || typeof (tracker.options) != 'object') {
          continue;
        }
        this.addTracker(tracker.name, tracker.options);
      }

      // Setup auto event tracking
      if (this.settings.autoEventTracking) {
        this._setupAutoEventTracking();
      }
    };

    /**
     * @access public
     */
    this.trackPageview = function (page, title) {
      if (this.settings.debugMode) {
        console.log('trackPageview() page=' + page + ', title=' + title);
        return;
      }
      try {
        for (var i in this._trackers) {
          if (typeof (this._trackers[i].trackPageview) == 'function') {
            this._trackers[i].trackPageview(page, title);
          }
        }
      }
      catch (e) { }
    }

    /**
     * @access public
     */
    this.trackEvent = function (category, action, label, value) {
      if (this.settings.debugMode) {
        console.log('trackEvent() category=' + category + ', action=' + action + ', label=' + label + ', value=' + value);
        return;
      }
      try {
        for (var i in this._trackers) {
          if(typeof(this._trackers[i].trackEvent) == 'function') {
            this._trackers[i].trackEvent(category, action, label, value);
          }
        }
      }
      catch (e) { }
    };

    /**
     * @access public
     */
    this.delayLink = function (href) {
      setTimeout(function () {
        window.location.href = href;
      }, this.settings.delayLinkTimeout);
    };

    /**
     * @access public
     */
    this.addTracker = function (tracker, options) {
      switch (typeof (tracker)) {
        // Built-in trackers
        case 'string':
          switch (tracker.toLowerCase()) {
            case 'ga':
              this.addTracker(new GATracker(options));
              break;
            case 'gau':
            case 'gauniversal':
              this.addTracker(new GAUTracker(options));
              break;
            case 'ha':
            case 'huawei':
              this.addTracker(new HuaweiTracker(options));
              break;
            default:
              console.log('Unsupported tracker: ' + tracker);
              break;
          }
          break;
        case 'object':
          this._trackers.push(tracker);
          break;
      }
    }

    /**
     * Setup auto event tracking.
     * @access private
     */
    this._setupAutoEventTracking = function () {
      var t = this;
      $('*[data-' + t.settings.autoEventTrackingAttrs.category + ']').click(function (e) {
        var href = $(this).attr('href');
        var category = $(this).data(t.settings.autoEventTrackingAttrs.category);
        var action = $(this).data(t.settings.autoEventTrackingAttrs.action);
        var label = $(this).data(t.settings.autoEventTrackingAttrs.label);
        var value = $(this).data(t.settings.autoEventTrackingAttrs.value);
        var ignoreLink = ($(this).data(t.settings.autoEventTrackingAttrs.ignoreLink) == true || href == undefined || href.indexOf('#') === 0) ? true : false;
        $[pluginName].trackEvent(category, action, label, value);
        // Auto delay link
        if (t.settings.autoDelayLink && !ignoreLink) {
          switch ($(this).attr('target')) {
            case undefined:
            case '':
            case '_self':
            case '_top':
            case '_parent':
              e.preventDefault();
              $[pluginName].delayLink(href);
          }
        }
      });
    };

    this.init();
  } // Plugin

  // Hook to jQuery plugin.
  $.fn[pluginName] = function (options) {
    plugin = new Plugin(this, options);
    this.each(function () {
      if (!$.data(this, pluginName)) {
        $.data(this, pluginName, plugin);
      }
    });

    // Add this plugin to $ namespace
    $.data($(document), pluginName, plugin);
    $[pluginName] = $(document).data(pluginName);

    // chain jQuery functions
    return this;
  };
  
  // {{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{
  // Built-in trackers
  function MtTracker(options) {
    this.trackPageview = function () {
      console.log('trackPageview() not implemented');
    };
    this.trackEvent = function () {
      console.log('trackEvent() not implemented');
    };
  }

  //
  // Built-in GA tracker
  //
  function GATracker(options) {
    if (!window['_gaq']) {
      window['_gaq'] = [];
    }
    (function () {
      var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
      ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
      var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();

    // Call init() in options
    if (typeof (options.init) == 'function') {
      options.init();
    }
    return $.extend({}, MtTracker.prototype, {
      trackPageview: function (page, title) {
        $.extend(plugin.settings, options);
        _gaq.push(['_trackPageview', plugin.settings.pageviewPrefix + page]);
      },
      trackEvent: function (category, action, label, value) {
        $.extend(plugin.settings, options);
        _gaq.push(['_trackEvent', category, action, label, value]);
      }
    });
  } // GATracker

  //
  // Built-in GA Universal tracker
  //
  function GAUTracker(options) {
    (function (i, s, o, g, r, a, m) {
      i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
      }, i[r].l = 1 * new Date(); a = s.createElement(o),
      m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    // Call init() in options
    if (typeof (options.init) == 'function') {
      options.init();
    }
    return $.extend({}, MtTracker.prototype, {
      trackPageview: function (page, title) {
        $.extend(plugin.settings, options);
        if (window.ga) {
          var data = {
            'hitType': 'pageview',
            'page': plugin.settings.pageviewPrefix + page
          };
          if (title != null && title != '') {
            data.title = title;
          }
          ga('send', data);
        }
      },
      trackEvent: function (category, action, label, value) {
        $.extend(plugin.settings, options);
        if (window.ga) {
          var data = {
            'hitType': 'event',          // Required.
            'eventCategory': category,   // Required.
            'eventAction': action        // Required.
          };
          if (label != null && label != '') {
            data.eventLabel = label;
          }
          if (!isNaN(value)) {
            data.eventValue = value;
          }
          ga('send', data);
        }
      }
    });
  } // GAUTracker

  //
  // Built-in Huawei tracker
  //
  function HuaweiTracker(options) {
    var siteid = options.siteId; // changeability
    var _host = window.location.host;
    var username = getQueryString("UserAccount")
    function getQueryString(name) {
      var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
      if (arr != null) return decodeURIComponent(unescape(arr[2]));
      return "anonymous";
    }
    // production
    if (typeof (options.domain) == 'string' && _host.indexOf(options.domain) < 0) {
      return;
    }
    (function (i, s, o, g, r, a, m) {
      i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
      }, i[r].l = 1 * new Date(); a = s.createElement(o), m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
    })(window, document, 'script', 'https://app.huawei.com/hwa-c/configresource/js/general/ha.js', 'ha');
    ha("setSiteId", siteid);
    if (username != "anonymous") {
      ha("set", "uid", username);
    }
    if (options.autoSendPV != true) {
      ha("setAutoSendPV", false);
    }

    // Call init() in options
    if (typeof (options.init) == 'function') {
      options.init();
    }
    // Return a merged object with MtTracker
    return $.extend({}, MtTracker.prototype, {
      trackPageview: function (page, title) {
        $.extend(plugin.settings, options);
        if (window.ha) {
          ha("setAutoSendPV", false);
          var _indexUrl = window.location.href;
          var _path = plugin.settings.pageviewPrefix + page;
          var _pageHierarchy = "c:{" + _indexUrl + "}f:{slide[" + _path + "]}";
          ha("trackPageView", { url: _path, page_hierarchy: _pageHierarchy });
        }
      },
      trackEvent: function (category, action, label, value) {
        $.extend(plugin.settings, options);
        if (window.ha) {
          var _indexUrl = window.location.href;
          var _path = category + "/" + action + "/" + label;
          var _pageHierarchy = "c:{" + plugin.settings.pageviewPrefix.substring(1) + "}f:{slide[" + _path + "]}";
          ha("trackEvent", "click", { url: _indexUrl, page_hierarchy: _pageHierarchy });
        }
      }
    });
  } // HuaweiTracker
  // }}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}

})(jQuery, window, document);