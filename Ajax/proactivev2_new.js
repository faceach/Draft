(function() {
  CortanaApp = {};
  CortanaApp.getAnswerAsync = function() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve('{"myData": 2}');
      }, 3000);
    });
  };

  function isProactiveV2() {
    var pathname = location.pathname.toLowerCase();
    return true; // pathname === '/proactive/v2' || pathname === '/proactive/v2/';
  }

  function isRequestAnswers(url) {
    url = url.toLowerCase();
    return url === "/answers";
  }

  var oldXMLHttpRequest = window.XMLHttpRequest;
  var originXMLHttpRequestOpen = window.XMLHttpRequest.prototype.open;
  var originXMLHttpRequestSend = window.XMLHttpRequest.prototype.send;

  var openurl = '';
  var isProactiveV2Send = false;

  window.XMLHttpRequest.prototype.open = function(method, url, async) {
    console.log("open");
    console.log(arguments);
    // save openurl
    openurl = url;
    return originXMLHttpRequestOpen.apply(this, [].slice.call(arguments));
  };
  window.XMLHttpRequest.prototype.send = function() {
    console.log("send");
    if (isProactiveV2() && isRequestAnswers(openurl)) {
      isProactiveV2Send = true;
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
      if (isProactiveV2Send && self.onreadystatechange) {
        CortanaApp.getAnswerAsync().then(function answersCallback(response) {
          console.log('hook response');
          console.log(response);
          self.readyState = 4;
          self.status = 200;
          self.response = response;
          self.onreadystatechange();
        });
        // reset to make sure get answer only run one time
        isProactiveV2Send = false;
        return;
      }
      self.readyState = actualXHR.readyState;
      self.status = actualXHR.status;
      self.response = actualXHR.response;
      if (self.onreadystatechange) {
        return self.onreadystatechange();
      }
    };

    // add all proxy getters - XMLHttpRequest.readyState properties
    ["UNSENT", "OPENED", "HEADERS_RECEIVED", "LOADING", "DONE"].forEach(function(item) {
      Object.defineProperty(self, item, {
        get: function() {
          return actualXHR[item];
        }
      });
    });

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
    ["addEventListener", "abort", "getAllResponseHeaders",
      "getResponseHeader", "overrideMimeType"
    ].forEach(function(item) {
      Object.defineProperty(self, item, {
        value: function() {
          return actualXHR[item].apply(actualXHR, arguments);
        }
      });
    });

    // add all pure proxy pass-through methods
    ["send", "open", "setRequestHeader"].forEach(function(item) {
      self[item] = function() {
        return actualXHR[item].apply(actualXHR, arguments);
      }
    });
  };

  setTimeout(function() {
    var xhr = new XMLHttpRequest,
      exp;
    //xhr.open("GET", "/answers", !0);
    xhr.open("GET", "./answers.json", !0);
    xhr.setRequestHeader("X-MSEdge-1", "1");
    xhr.setRequestHeader("X-MSEdge-2", "2");
    xhr.setRequestHeader("X-MSEdge-3", "3");
    xhr.onreadystatechange = function() {
      console.log('xhr.readyState: ' + xhr.readyState);
      console.log('xhr.status: ' + xhr.status);
      if (xhr.readyState === xhr.DONE) {
        var parsedResponse = null;
        if (xhr.status === 200) {
          try {
            parsedResponse = JSON.parse(xhr.response)
          } catch (exp) {
            console.log("Could not parse the DSS response as JSON: " + xhr.response, exp);
          }
        } else {
          console.log("DSS responded with status code: " + xhr.status + "; message: " + xhr.response);
        }
        console.log(parsedResponse);
      }
    };
    xhr.send();
  }, 5000);
})();