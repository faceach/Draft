(function() {
  // create XMLHttpRequest proxy object
  var oldXMLHttpRequest = window.XMLHttpRequest;
  var originXMLHttpRequestOpen = window.XMLHttpRequest.prototype.open;
  var originXMLHttpRequestSend = window.XMLHttpRequest.prototype.send;

  window.XMLHttpRequest.prototype.open = function(method, url, async) {
    console.log("open");
    return originXMLHttpRequestOpen.apply(this, [].slice.call(arguments));
  };
  window.XMLHttpRequest.prototype.send = function() {
    console.log("send");
    return originXMLHttpRequestSend.apply(this, [].slice.call(arguments));
  };

  // define constructor for my proxy object
  window.XMLHttpRequest = function() {
    var actualXHR = new oldXMLHttpRequest();
    var self = this;

    this.onreadystatechange = null;

    // this is the actual handler on the real XMLHttpRequest object
    actualXHR.onreadystatechange = function() {
      self.readyState = 4;
      self.status = 200;
      //self.response = '{"myData": 2}';

      if (self.onreadystatechange) {
        return self.onreadystatechange();
      }
    };

    // add all proxy getters
    ["response", "statusText", "responseType", "responseText", "responseXML", "upload"].forEach(function(item) {
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

})();


setTimeout(function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "./data.json", true);
  xhr.onreadystatechange = function() {
    if (this.readyState == 4) {
      console.log("modified ajax response" + xhr.response);
    }
  }
  xhr.send();
}, 3000);