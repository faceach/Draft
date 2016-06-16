(function() {
  function isProactiveV2() {
    var pathname = location.pathname.toLowerCase();
    return pathname === '/proactive/v2' || pathname === '/proactive/v2/';
  }

  function isRequestAnswers(url) {
    url = url.toLowerCase();
    return url === "/answers";
  }

  var oldXMLHttpRequest = window.XMLHttpRequest;
  var originXMLHttpRequestOpen = window.XMLHttpRequest.prototype.open;
  var originXMLHttpRequestSend = window.XMLHttpRequest.prototype.send;

  var openurl = '';

  window.XMLHttpRequest.prototype.open = function(method, url, async) {
    console.log("open");
    console.log(arguments);
    openurl = url;
    if (isProactiveV2() && isRequestAnswers(openurl)) {
      return;
    }
    return originXMLHttpRequestOpen.apply(this, [].slice.call(arguments));
  };
  window.XMLHttpRequest.prototype.send = function() {
    console.log("send");
    if (isProactiveV2() && isRequestAnswers(openurl)) {
      this.onreadystatechange();
      return;
    }
    return originXMLHttpRequestSend.apply(this, [].slice.call(arguments));
  };

  // define constructor for my proxy object
  window.XMLHttpRequest = function() {
    var actualXHR = new oldXMLHttpRequest();
    var self = this;

    this.onreadystatechange = null;

    // this is the actual handler on the real XMLHttpRequest object
    actualXHR.onreadystatechange = function() {
      if (isProactiveV2() && isRequestAnswers(openurl)) {
        CortanaApp.getAnswerAsync().then(function answersCallback(response) {
          console.log('hook response');
          console.log(response);
          self.readyState = 4;
          self.status = 200;
          self.response = response;
          if (self.onreadystatechange) {
            return self.onreadystatechange();
          }
        });
        return;
      }
      if (self.onreadystatechange) {
        return self.onreadystatechange();
      }
    };

    // add all proxy getters
    ["statusText", "responseType", "responseText", "responseXML", "upload"].forEach(function(item) {
      Object.defineProperty(self, item, {
        get: function() {
          return actualXHR[item];
        }
      });
    });

    // add all proxy getters/setters
    ["ontimeout, timeout", "withCredentials", "onload", "onerror", "onprogress"].forEach(function(item) {
      Object.defineProperty(self, item, {
        get: function() {
          return actualXHR[item];
        },
        set: function(val) {
          actualXHR[item] = val;
        }
      });
    });

    // add all pure proxy pass-through methods
    ["addEventListener", "send", "open", "abort", "getAllResponseHeaders",
      "getResponseHeader", "overrideMimeType", "setRequestHeader"
    ].forEach(function(item) {
      Object.defineProperty(self, item, {
        value: function() {
          return actualXHR[item].apply(actualXHR, arguments);
        }
      });
    });
  };

  setTimeout(function() {
    var xhr = new XMLHttpRequest,
      exp;
    xhr.open("GET", "/answers", !0);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === xhr.DONE) {
        var parsedResponse = null;
        if (xhr.status === 200) {
          try {
            parsedResponse = JSON.parse(xhr.response)
          } catch (exp) {
            SharedLogHelper.LogError("DssError", "Could not parse the DSS response as JSON: " + xhr.response, exp);
          }
        } else {
          SharedLogHelper.LogError("DssError", "DSS responded with status code: " + xhr.status + "; message: " + xhr.response);
        }
        console.log(parsedResponse);
      }
    };
    xhr.send();
  }, 5000);
})();