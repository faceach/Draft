// ---------------- Wechat ----------------
(function() {
    var _count = 0;

    var $bingAppLink = $("#bingapplink");

    if ($bingAppLink.length <= 0) {
        return;
    }

    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ((ua.indexOf("android") > -1) && (ua.indexOf("mobile") > -1)) ? true : false;
    if (isAndroid) {
        $bingAppLink
            .attr("href", "http://binghub.trafficmanager.cn/usercard/share?cid=d6bb219e1580f84ab51865d8eb22cd66&h=425")
            .show();
    }

    /**
     * Detect JsAPI
     * @param callback
     */
    (function detectWeixinApi(callback) {
        if (_count > 5) {
            return;
        }
        _count++;
        if (typeof window.WeixinJSBridge === 'undefined') {
            htmlLog("Wait 400ms: Wechat Detection.");
            setTimeout(function() {
                detectWeixinApi(callback);
            }, 400);
        } else {
            callback();
        }
    })(function() {
        // Do something for Wechat
        // ...
        $bingAppLink.hide();
    });

})();