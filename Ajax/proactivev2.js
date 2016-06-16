(function() {
  function isProactiveV2() {
    var pathname = location.pathname.toLowerCase();
    return pathname === '/proactive/v2' || pathname === '/proactive/v2/';
  }

  function isRequestAnswers(url) {
    url = url.toLowerCase();
    return url === "/answers";
  }

  var originXMLHttpRequestOpen = window.XMLHttpRequest.prototype.open;
  var originXMLHttpRequestSend = window.XMLHttpRequest.prototype.send;
  var openurl;
  window.XMLHttpRequest.prototype.open = function(method, url, async) {
    console.log(arguments);
    openurl = url;
    if (isProactiveV2() && isRequestAnswers(openurl)) {
      return;
    }
    return originXMLHttpRequestOpen.apply(this, [].slice.call(arguments));
  };
  window.XMLHttpRequest.prototype.send = function() {
    console.log(arguments);
    var that = this;
    if (isProactiveV2() && isRequestAnswers(openurl)) {
      CortanaApp.getAnswerAsync().then(function answersCallback(response) {
        console.log('hook response');
        console.log(response);
        //----------------------------------------------------------
        var oldReady = that.onreadystatechange;
        // override onReadyStateChange
        that.onreadystatechange = function() {
            // create a hack XHR object so we can modify response
            var self = this;
            var hackXHR = {};
            ["readyState", "status", "response"].forEach(function(item) {
              hackXHR[item] = self[item];
            });
            hackXHR.readyState = 4;
            hackXHR.status = 200;
            hackXHR.response = response;
            return oldReady.call(hackXHR);
          }
          //----------------------------------------------------------
      });
      return;
    }
    return originXMLHttpRequestSend.apply(this, [].slice.call(arguments));
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