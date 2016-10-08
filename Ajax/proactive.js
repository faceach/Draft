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
   var isProactiveV2Send = false;

   window.XMLHttpRequest.prototype.open = function(method, url, async) {
     console.log("XHR open");
     console.log(arguments);
     openurl = url;
     return originXMLHttpRequestOpen.apply(this, [].slice.call(arguments));
   };
   window.XMLHttpRequest.prototype.send = function() {
     console.log("XHR send");
     if (isProactiveV2() && isRequestAnswers(openurl)) {
       console.log("ProactiveV2 request answers.");
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
       console.log('XHR readyState: ' + actualXHR.readyState);
       console.log('XHR status: ' + actualXHR.status);
       if (isProactiveV2Send && self.onreadystatechange) {
         CortanaApp.getAnswerAsync().done(function answersCallback(response) {
           console.log('CortanaApp.getAnswerAsync() response:');
           console.log(response);
           self.readyState = 4;
           self.status = 200;
           try {
             self.response = JSON.stringify(response);
           } catch (exp) {
             console.error('json response parse error');
           }
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

     // add all proxy getters - for readyonly properties
     ["statusText", "responseText", "responseXML", "upload"].forEach(function(item) {
       Object.defineProperty(self, item, {
         get: function() {
           return actualXHR[item];
         }
       });
     });

     // add all proxy getters/setters
     // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
     ["ontimeout, timeout", "withCredentials", "onload", "onerror", "onprogress", "responseType"].forEach(function(item) {
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

    /*
     * XHR is wrapped in SnR side (SnR provide an object called “window.sj_gx”), following methods are re-defined in this wrapper:
     * - send
     * - open
     * - setRequestHeader
     */
    ["send", "open", "setRequestHeader"].forEach(function(item) {
      self[item] = function() {
        return actualXHR[item].apply(actualXHR, arguments);
      }
    });
   };

 })();