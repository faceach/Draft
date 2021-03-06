var htmlLogNum = 1;

function htmlLog(s) {
    document.body.insertAdjacentHTML("beforeend", "<p style='background-color: #3f3; margin-bottom: 3px;'>" + htmlLogNum + ": " + s + "</p>");
    htmlLogNum++;
}

htmlLog("Hello, I'm from client.")

// ----------------------------------------------------------------------------------------

function getTrans(key) {
    var lang = {
        "loadingHtml": {
            "en": "Analyzing...",
            "cn": "努力消化中..."
        },
        "errorHtml": {
            "en": "Couldn’t detect any faces. Please verify that the image is valid and less than 3MB.",
            "cn": "亲，我们识别不出脸部. 3MB的图片对于苗条的我真的吃不消."
        },
        "noFaceHtml": {
            "en": "Couldn’t detect any faces.",
            "cn": "亲，我们识别不出脸部."
        }
    };

    // http://cn.how-old.net is us site for ZH-CN
    // http://howold.chinacloudsites.cn/ is China testing site
    var cp = "cn"; //(location.host.indexOf("cn.") === 0 || location.host === "howold.chinacloudsites.cn") ? "cn" : "en";

    return lang[key][cp];
}


function processRequest(isFile, imageUrl, imageName, fileSize, imageRotation) {

    window.location.hash = "results";
    deleteFaceRects();
    $("#jsonEventDiv").hide();
    var servicePath = "/Home/Analyze";
    var loadingHtml = getTrans("loadingHtml") + '<span><img id="loadingImage" src="/Images/ajax-loader_1.gif" /></span>';
    var errorHtml = getTrans("errorHtml");
    var noFaceHtml = getTrans("noFaceHtml");
    $("#analyzingLabel").css("visibility", "visible");
    $("#improvingLabel").css("visibility", "hidden");
    $("#analyzingLabel").html(loadingHtml);

    var data = {};
    var contentType = false;
    var requestUrl = servicePath;

    //data = new FormData();
    var files = $("#uploadBtn").get(0).files;
    // Add the uploaded image content to the form data collection
    var isTest = $("#isTest").val();
    requestUrl += "?isTest=" + isTest;
    if (isFile) {
        //Verify that the file is smaller then 3MB
        if (fileSize != null && fileSize > 3145728) {
            $("#jsonEventDiv").hide();
            $("#analyzingLabel").html(errorHtml);
            $("#analyzingLabel").css("visibility", "visible");
            return;
        }
        data = imageUrl;//files[0];
        contentType = "application/octet-stream";
    } else {
        requestUrl += "&faceUrl=" + encodeURIComponent(imageUrl) + "&faceName=" + imageName;
    }
    $.ajax({
        type: "POST",
        url: requestUrl,

        contentType: contentType,
        processData: false,
        data: data,
        success: function(response) {
            var jresponse = JSON.parse(response);
            if (jresponse == null || jresponse.Faces == null || jresponse.Faces.length === 0) {
                $("#analyzingLabel").html(noFaceHtml);
                $("#analyzingLabel").css("visibility", "visible");
            } else {
                renderImageFaces(jresponse.Faces, imageRotation);
                $("#analyzingLabel").css("visibility", "hidden");
            }
            $("#improvingLabel").css("visibility", "visible");
            if (jresponse != null) {
                showViewSourceLink();
                $("#jsonEvent").text(jresponse.AnalyticsEvent);
            }
        },

        error: function(xhr, status, error) {
            $("#jsonEventDiv").hide();
            $("#analyzingLabel").html(errorHtml);
            $("#analyzingLabel").css("visibility", "visible");

        }
    });
};

function viewSource() {
    $("#jsonEventDiv").show();

}

function showResultView() {

    $("#selectImage").hide();
    $("#results").show();
}

function showSelectionView() {
    $("#selectImage").show();
    $("#results").hide();
    hideViewSourceLink();
    //deleteFaceRects();
    //updateThumbnail('/Images/placeholder.png');
    myScroll.refresh();
}


function showViewSourceLink() {
    $("#viewEvent").show();
    $("#linkSeparetor").show();
    // $("#footerId").css("width", "253px");
}


function hideViewSourceLink() {
    $("#viewEvent").hide();
    $("#linkSeparetor").hide();
    //  $("#footerId").css("width", "180px");

}

function analyzeUrl() {
    var selector = document.getElementById("SelectorBox").getBoundingClientRect();
    var img = document.elementFromPoint(selector.left + selector.width / 2, selector.top + selector.height / 2);
    var src = $(img).attr("data-url");
    var faceName = $(img).attr("data-image-name");
    if (faceName == undefined) {
        faceName = null;
    }
    updateThumbnail(src);
    processRequest(false, src, faceName);
}

function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {
        type: contentType
    });
    return blob;
}

// Code taken from MatthewCrumley (http://stackoverflow.com/a/934925/298479)
function getBase64DataURL(img, width, height) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpg" will re-encode the image.
    var dataURL = canvas.toDataURL("image/jpg");

    return dataURL;
}

function getBase64ImageCode(base64DataURL) {
    //base64DataURL.split(",")[1];
    return base64DataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function resizeImg(img, maxWidth) {

    maxWidth = maxWidth || 400;
    var width = img.width;
    var height = img.height;
    var ratio = 1;
    var toWidth = width;
    var toHeight = height;
    if (width > maxWidth) {
        ratio = maxWidth / width;
        toWidth = width * ratio;
        toHeight = height * ratio;
    }

    return getBase64DataURL(img, toWidth, toHeight);
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object


    // Loop through the FileList and render image files as thumbnails.
    var f = files[0];

    // Only process image files.
    // f.type === "" under Wechat (device: Samsung Android v4.4.x)
    if (f.type && !f.type.match('image.*')) {
        return;
    }

    var image = new Image();
    image.src = window.URL.createObjectURL(f);

    image.onload = function() {

        var src = resizeImg(image);

        var blob = b64toBlob(dataURL.split(',')[1], 'image/jpg');
        //var blobUrl = URL.createObjectURL(blob);

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                updateThumbnail(e.target.result);
                // Render thumbnail.
                loadImage.parseMetaData(theFile, function(data) {
                    var rotation = 0;
                    if (data && data.exif) {
                        var orientation = data.exif.get('Orientation');
                        if (orientation === 8) {
                            rotation = 90;
                        } else if (orientation === 3) {
                            rotation = 180;
                        } else if (orientation === 6) {
                            rotation = 270;
                        }
                    }
                    processRequest(true, theFile, null, theFile.size, rotation);
                });

            };
        })(blob);

        // Read in the image file as a data URL.
        reader.readAsDataURL(blob);
    };

}


function updateThumbnail(src) {
    var thumbnail = document.getElementById('thumbnail');

    thumbnail.setAttribute('src', src);
}


var iOS = false;
$(window).load(function() {
    document.getElementById('uploadBtn').addEventListener('change', handleFileSelect, false);
    document.getElementById('uploadBtn').addEventListener('click', function() {
        this.value = null
    }, false);
    window.location.hash = '';
    iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
});

$(window).on('hashchange', function() {
    if (window.location.hash === '#results') {
        showResultView();
    } else {
        showSelectionView();
    }
});

$('#viewEvent').click(function() {
    viewSource();
    return false;
});


function resize() {
    drawFaceRects()
}

// ----------------------------------------------------------------------------------------

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
// Dom ready.
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

})();
