var htmlLogNum = 1;

function htmlLog(s) {
    document.body.insertAdjacentHTML("beforeend", "<p style='background-color: #3f3; margin-bottom: 3px;'>" + htmlLogNum + ": " + s + "</p>");
    htmlLogNum++;
}

function processRequest(n, t, i, r, u) {
    htmlLog("processing...")
    window.location.hash = "results";
    deleteFaceRects();
    $("#jsonEventDiv").hide();
    var e = "Couldn’t detect any faces. Please verify that the image is valid and less than 3MB.",
        h = "Couldn’t detect any faces.";
    $("#analyzingLabel").css("visibility", "visible");
    $("#improvingLabel").css("visibility", "hidden");
    $("#analyzingLabel").html('分析中...<span><img id="loadingImage" src="http://how-old.net/Images/ajax-loader_1.gif" /><\/span>');
    var o = {},
        s = !1,
        f = "/proxy/analyze",
        c = $("#uploadBtn").get(0).files,
        l = $("#isTest").val();
    if (f += "?isTest=" + l, n) {
        if (r != null && r > 3145728) {
            $("#jsonEventDiv").hide();
            $("#analyzingLabel").html(e);
            $("#analyzingLabel").css("visibility", "visible");
            return
        }
        o = c[0];
        s = "application/octet-stream"
    } else f += "&faceUrl=" + encodeURIComponent(t) + "&faceName=" + i;
    $.ajax({
        type: "POST",
        url: f,
        contentType: s,
        crossDomain: true,
        processData: !1,
        data: o,
        success: function(n) {
            var t = JSON.parse(n);
            t == null || t.Faces == null || t.Faces.length === 0 ? ($("#analyzingLabel").html(h), $("#analyzingLabel").css("visibility", "visible")) : (renderImageFaces(t.Faces, u), $("#analyzingLabel").css("visibility", "hidden"));
            $("#improvingLabel").css("visibility", "visible");
            t != null && (showViewSourceLink(), $("#jsonEvent").text(t.AnalyticsEvent))
        },
        error: function() {
            $("#jsonEventDiv").hide();
            $("#analyzingLabel").html(e);
            $("#analyzingLabel").css("visibility", "visible")
        }
    })
}

function viewSource() {
    $("#jsonEventDiv").show()
}

function showResultView() {
    $("#selectImage").hide();
    $("#results").show()
}

function showSelectionView() {
    $("#selectImage").show();
    $("#results").hide();
    hideViewSourceLink();
    myScroll.refresh()
}

function showViewSourceLink() {
    $("#viewEvent").show();
    $("#linkSeparetor").show()
}

function hideViewSourceLink() {
    $("#viewEvent").hide();
    $("#linkSeparetor").hide()
}

function analyzeUrl() {
    var n = document.getElementById("SelectorBox").getBoundingClientRect(),
        i = document.elementFromPoint(n.left + n.width / 2, n.top + n.height / 2),
        r = $(i).attr("data-url"),
        t = $(i).attr("data-image-name");
    t == undefined && (t = null);
    updateThumbnail(r);
    processRequest(!1, r, t)
}

function handleFileSelect(n) {
    htmlLog("handle... file list length: " + n.target.files.length);
    htmlLog("handle... file name: " + n.target.files[0].name);
    htmlLog("handle... file type: " + n.target.files[0].type);
    for (var u = n.target.files, t, r, i = 0; t = u[i]; i++) {
        htmlLog("loop... file type: " + t.type);
        //if (t.type.match("image.*")) {
        //htmlLog("matched... 'image.*'");
        if (!FileReader) {
            htmlLog("FileReader does not exist.");
        }
        var r = new FileReader;
        r.onload = function(n) {
            htmlLog("onload... Image name: " + n.name);
            return function(t) {
                htmlLog("onload... Base64: " + t.target.result.substr(0, 50) + "...");
                updateThumbnail(t.target.result);
                if (!loadImage) {
                    htmlLog("loadImage does not exist.");
                }
                loadImage.parseMetaData(n, function(t) {
                    htmlLog("parsed... ExifMap: " + t.exif);
                    var i = 0,
                        r;
                    t && t.exif && (r = t.exif.get("Orientation"), r === 8 ? i = 90 : r === 3 ? i = 180 : r === 6 && (i = 270));
                    processRequest(!0, null, null, n.size, i)
                })
            }
        }(t);
        r.readAsDataURL(t);
        //}
    }
}

function updateThumbnail(n) {
    var t = document.getElementById("thumbnail");
    t.setAttribute("src", n)
}

function drawFaceRects() {
    var n, t;
    if ($("#faces").html("<div><\/div>"), n = $("#thumbnail"), t = $("#thumbContainer"), current_faces != null) {
        var i = n.height() / image_orig_height,
            r = n.width() / image_orig_width,
            u = n.offset().left - t.offset().left,
            f = current_faces.length;
        $.each(current_faces, function(t, e) {
            var s = e.faceRectangle,
                l = e.attributes.age,
                a = e.attributes.gender,
                o = {},
                h, c;
            o.top = Math.round(i * s.top);
            o.height = Math.round(i * s.height);
            o.left = Math.round(r * s.left) + u;
            o.width = Math.round(r * s.width);
            h = adjustRectOrientation(o, n.width(), n.height(), image_orig_rotation);
            c = $("#faces");
            add_rect(h, l, a, t, c, f)
        })
    }
}

function adjustRectOrientation(n, t, i, r) {
    var u = {};
    return iOS || r === 0 ? n : r === 270 ? (u.height = n.width, u.width = n.height, u.left = n.top, u.top = i - u.height - n.left, u) : r === 180 ? (u.height = n.height, u.width = n.width, u.left = t - u.width - n.left, u.top = i - u.height - n.top, u) : r === 90 ? (u.height = n.width, u.width = n.height, u.left = t - u.width - n.top, u.top = n.left, u) : n
}

function renderImageFaces(n, t) {
    current_faces = n;
    updateOrigImageDimensions(drawFaceRects, t)
}

function updateOrigImageDimensions(n, t) {
    var r = document.getElementById("thumbnail"),
        i = new Image;
    i.onload = function() {
        image_orig_width = iOS && (t === 270 || t === 90) ? i.height : i.width;
        image_orig_height = iOS && (t === 270 || t === 90) ? i.width : i.height;
        image_orig_rotation = t;
        n()
    };
    i.src = r.src
}

function deleteFaceRects() {
    current_faces = [];
    $("#faces").html("<div><\/div>")
}

function resize() {
    drawFaceRects()
}

function updateSelectedImage() {
    selectedImage = $(".ImageSelector .ScrollArea *")[myScroll.currentPage.pageX];
    selectedImage && (selectedImage.className = "selectedImage")
}

function refresh() {
    myScroll.options.snap = myScroll.scroller.querySelectorAll("*");
    $(".ImageSelector .ScrollArea *").on("tap", function() {
        myScroll.currentPage.pageX != $(this).index() && ($(".ImageSelector .ScrollArea .selectedImage").removeClass("selectedImage"), myScroll.goToPage($(this).index(), 0, 400))
    });
    var n = $(".ImageSelector .ScrollArea *"),
        t = parseInt(n.css("margin-left").replace("px", "")) || 0,
        i = parseInt(n.css("margin-right").replace("px", "")) || 0,
        r = n[0].offsetWidth,
        u = (r + t + i) * n.length;
    $(".ImageSelector .ScrollArea").css("width", u + "px");
    myScroll.refresh();
    myScroll.goToPage((n.length / 2).toFixed(0) - 1, 0, 0, !1);
    updateSelectedImage()
}

function loaded() {
    htmlLog("load images");
    var n = $(".ImageSelector .ScrollArea > img"),
        t = parseInt(n.css("margin-left").replace("px", "")) || 0,
        i = parseInt(n.css("margin-right").replace("px", "")) || 0,
        r = n[0].offsetWidth,
        u = (r + t + i) * n.length;
    $(".ImageSelector .ScrollArea").css("width", u + "px");
    if (!IScroll) {
        return;
    }
    htmlLog("prepare scroll");
    myScroll = new IScroll(".ImageSelector", {
        scrollX: !0,
        scrollY: !1,
        mouseWheel: !0,
        snap: "*",
        momentum: !0,
        tap: !0,
        scrollbars: !0,
        deceleration: .002,
        bounce: !1
    });
    htmlLog("myScroll created.");
    myScroll.goToPage((n.length / 2).toFixed(0) - 1, 0, 0, !1);
    $(".ImageSelector .ScrollArea > img").on("tap", function() {
        myScroll.currentPage.pageX != $(this).index() && ($(".ImageSelector .ScrollArea .selectedImage").removeClass("selectedImage"), myScroll.goToPage($(this).index(), 0, 400))
    });
    myScroll.on("flick", function() {
        this.x == this.startX && updateSelectedImage()
    });
    myScroll.on("scrollEnd", updateSelectedImage);
    myScroll.on("scrollStart", function() {
        $(".ImageSelector .ScrollArea .selectedImage").removeClass("selectedImage")
    });
    htmlLog("myScroll visible.");
    $(".ImageSelector").css("visibility", "visible");
    updateSelectedImage()
}

function searchImages() {
    var n = $("#searchText").val(),
        t;
    if (n != null && n.length !== 0) return $("#searchError").css("visibility", "hidden"), t = "/proxy/ImageSearch", $.ajax({
        type: "POST",
        url: t,
        data: n,
        contentType: !1,
        processData: !1,
        success: function(n) {
            var t = JSON.parse(n),
                i = $("#imageList");
            t != null && t.length > 0 && (i.html(""), $.each(t, function(n, t) {
                var r = '<img src="' + t.scroll_image_url + '" data-url="' + t.main_image_url + '">';
                $(r).appendTo(i)
            }), refresh())
        },
        error: function(t) {
            t.status === 404 ? $("#searchError").html("We did not find any results for " + n + ".") : $("#searchError").html("Oops, something went wrong. Please try searching again.");
            $("#searchError").css("visibility", "visible")
        }
    }), !1
}

var iOS = !1,
    current_faces, image_orig_width, image_orig_height, image_orig_rotation, add_rect, selectedImage, myScroll;

$(window).load(function() {
    document.getElementById("uploadBtn").addEventListener("change", handleFileSelect, !1);
    document.getElementById("uploadBtn").addEventListener("click", function() {
        this.value = null
    }, !1);
    window.location.hash = "";
    iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? !0 : !1
});
$(window).on("hashchange", function() {
    window.location.hash === "#results" ? showResultView() : showSelectionView()
});
$("#viewEvent").click(function() {
    return viewSource(), !1
});
current_faces = [];
add_rect = function(n, t, i, r, u, f) {
    var o = "rect" + Math.round(Math.random() * 1e4),
        e = null,
        c = "n/a",
        s, h, l, a;
    t != null && (c = Math.round(Number(t)));
    s = "http://how-old.net/Images/icon-gender-male.png";
    i != null && i.toLowerCase() === "female" && (s = "http://how-old.net/Images/icon-gender-female.png");
    h = f <= 2 ? "big-face-tooltip" : "small-face-tooltip";
    e = '<div><span><img src="' + s + '" class=' + h + "><\/span>" + c + "<\/div>";
    $(e).css("background-color", "#F1D100");
    l = '<div data-html="true" class="child face-tooltip ' + h + ' " id="' + o + '"/>';
    $(l).appendTo(u).css("left", n.left + "px").css("top", n.top + "px").css("width", n.width + "px").css("height", n.height + "px").css("border", "1px solid white").css("position", "absolute");
    e != null && (a = "top", $("#" + o).tooltip({
        trigger: "manual",
        show: !0,
        placement: a,
        title: e,
        html: !0
    }), $("#" + o).tooltip("show"))
};
window.onresize = resize;
document.getElementById("SelectorTag").addEventListener("mousedown", function(n) {
    n.cancelBubble = !0
}, !1);
loaded();
searchImages();

// ---------------- Wechat ----------------
/**
 * 检测微信JsAPI
 * @param callback
 */
(function() {
    return;
    var _count = 0;

    function detectWeixinApi(callback) {
        if (_count > 9) {
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
    }

    detectWeixinApi(function() {
        // Do something for Wechat
        // ...
    });

    detectWeixinApi(function() {
        for (var key in window.WeixinJSBridge) {
            var js = 'WeixinJSBridge.' + key + ' = ' + window.WeixinJSBridge[key].toString();
            htmlLog('<pre class="brush:js; toolbar:false;">' + js + '</pre>');
        }
    });

    detectWeixinApi(function() {
        htmlLog("Success Wechat Detection.");

        function attachWeixinJSBridgeReady(imgUrl, lineLink, shareTitle, descContent, appid) {

            imgUrl = imgUrl || "http://binghub.trafficmanager.cn/Images/Game/howold.jpg";
            lineLink = lineLink || "http://cn.how-old.net";
            descContent = descContent || "亲，请放心使用，我们不会保存您的美照:)";
            shareTitle = shareTitle || "你的颜龄是多少? #颜龄机器人";
            appid = appid || "wxcf1b742a641680e0";

            function shareFriend() {
                WeixinJSBridge.invoke("sendAppMessage", {
                    "appid": appid,
                    "img_url": imgUrl,
                    "img_width": "640",
                    "img_height": "640",
                    "link": lineLink,
                    "desc": descContent,
                    "title": shareTitle
                }, function(res) {
                    _report("send_msg", res.err_msg);
                });
            }

            function shareTimeline() {
                WeixinJSBridge.invoke("shareTimeline", {
                    "img_url": imgUrl,
                    "img_width": "640",
                    "img_height": "640",
                    "link": lineLink,
                    "desc": descContent,
                    "title": shareTitle
                }, function(res) {
                    _report("timeline", res.err_msg);
                });
            }

            function shareWeibo() {
                WeixinJSBridge.invoke("shareWeibo", {
                    "content": descContent,
                    "url": lineLink
                }, function(res) {
                    _report("weibo", res.err_msg);
                });
            }

            // Assume in Wechat Browser
            (function onBridgeReady() {
                // 发送给好友  
                WeixinJSBridge.on("menu:share:appmessage", function(argv) {
                    shareFriend();
                });
                // 分享到朋友圈  
                WeixinJSBridge.on("menu:share:timeline", function(argv) {
                    shareTimeline();
                });
                // 分享到微博  
                WeixinJSBridge.on("menu:share:weibo", function(argv) {
                    shareWeibo();
                });
            })();
        }

        var elImg = document.getElementById("thumbnail");
        var shareImgSrc = elImg ? elImg.src : "http://binghub.trafficmanager.cn/Images/Game/howold.jpg";

        var ua = navigator.userAgent.toLowerCase();
        var isAndroid = ua.indexOf("android") > -1 ? true : false;
        var shareLinkUrl = isAndroid ? "http://binghub.trafficmanager.cn/usercard/share?cid=d6bb219e1580f84ab51865d8eb22cd66&h=425" : "http://cn.how-old.net";

        htmlLog("shareImgSrc: " + shareImgSrc);
        htmlLog("shareLinkUrl: " + shareLinkUrl);

        // Attach Wechat Event
        attachWeixinJSBridgeReady(shareImgSrc, shareLinkUrl);

        // Do something for Wechat
        // ...
    });

})();