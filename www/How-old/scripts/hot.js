function getTrans(n) {
    return {
        loadingHtml: {
            en: "Analyzing...",
            cn: "努力消化中..."
        },
        errorHtml: {
            en: "Couldn’t detect any faces. Please verify that the image is valid and less than 3MB.",
            cn: "亲，我们识别不出脸部. 3MB的图片对于苗条的我真的吃不消."
        },
        noFaceHtml: {
            en: "Couldn’t detect any faces.",
            cn: "亲，我们识别不出脸部."
        }
    }[n]["cn"]
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
        data = files[0];
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

function rotateImg(img, rotation) {

    var width = img.width;
    var height = img.height;

    console.log(width);
    console.log(height);

    var canvasWidth;
    var canvasHeight;
    var translateX;
    var translateY;

    switch (rotation) {
        case 90:
            canvasWidth = height;
            canvasHeight = width;
            translateX = -width;
            translateY = 0;
            break;
        case 180:
            break;
        case 270:
            break;
    }

    // Create an empty canvas element
    var canvas = document.createElement("canvas");


    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.rotate(-rotation * Math.PI / 180);
    ctx.translate(translateX, translateY);
    ctx.drawImage(img, 0, 0, canvasHeight, canvasWidth);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpg" will re-encode the image.
    return canvas.toDataURL("image/jpg");
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (f.type && !f.type.match('image.*')) {
            continue;
        }

        console.log(f);

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                var iFile = e.target.result;
                // Render thumbnail.
                loadImage.parseMetaData(theFile, function(data) {
                    var rotation = 0;
                    if (data && data.exif) {
                        var orientation = data.exif.get('Orientation');
                        console.log("orientation: " + orientation);
                        if (orientation === 8) {
                            rotation = 90;
                        } else if (orientation === 3) {
                            rotation = 180;
                        } else if (orientation === 6) {
                            rotation = 270;
                        }
                    }

                    console.log("rotation: " + rotation);

                    if (rotation) {
                        var image = new Image();
                        image.src = window.URL.createObjectURL(theFile);
                        image.onload = function() {
                            iFile = rotateImg(image, rotation);
                            updateThumbnail(iFile);
                            processRequest(true, null, null, iFile.size, rotation);
                        }
                    } else {
                        updateThumbnail(iFile);
                        processRequest(true, null, null, iFile.size, rotation);
                    }

                });

            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);


    }
}

function updateThumbnail(n) {
    var t = document.getElementById("thumbnail");
    t.setAttribute("src", n)
}

function drawFaceRects() {
    $("#faces").html("<div></div>");
    var image = $("#thumbnail");
    var imageContainer = $("#thumbContainer");
    if (current_faces != null) {

        var heightRatio = image.height() / image_orig_height;
        var widthRatio = image.width() / image_orig_width;
        var offset = image.offset().left - imageContainer.offset().left;
        var faceCount = current_faces.length;
        $.each(current_faces, function(index, element) {
            var rectangle = element.faceRectangle;
            var age = element.attributes.age;
            var gender = element.attributes.gender;
            var rect = {};
            rect.top = Math.round(heightRatio * rectangle.top);
            rect.height = Math.round(heightRatio * rectangle.height);
            rect.left = Math.round(widthRatio * rectangle.left) + offset;
            rect.width = Math.round(widthRatio * rectangle.width);
            var newRect = adjustRectOrientation(rect, image.width(), image.height(), image_orig_rotation);
            var $container = $("#faces");
            add_rect(newRect, age, gender, index, $container, faceCount);

        });
    }
}


function adjustRectOrientation(origRect, imageWidth, imageHeight, rotation) {
    var newRect = {};
    if (iOS || rotation === 0) {
        return origRect;
    }
    if (rotation === 270) {
        newRect.height = origRect.width;
        newRect.width = origRect.height;
        newRect.left = origRect.top;
        newRect.top = imageHeight - newRect.height - origRect.left;
        return newRect;
    }
    if (rotation === 180) {
        newRect.height = origRect.height;
        newRect.width = origRect.width;
        newRect.left = imageWidth - newRect.width - origRect.left;
        newRect.top = imageHeight - newRect.height - origRect.top;
        return newRect;
    }
    if (rotation === 90) {
        newRect.height = origRect.width;
        newRect.width = origRect.height;
        newRect.left = imageWidth - newRect.width - origRect.top;
        newRect.top = origRect.left;
        return newRect;
    }
    return origRect;
}

function renderImageFaces(faces, imageRotation) {
    current_faces = faces;
    //current_faces = JSON.parse(facesStr);
    updateOrigImageDimensions(drawFaceRects, imageRotation);
};

function updateOrigImageDimensions(whenReady, imageOrigRotation) {
    var i = document.getElementById('thumbnail');
    var i2 = new Image();
    i2.onload = function() {
        image_orig_width = (iOS && (imageOrigRotation === 270 || imageOrigRotation === 90)) ? i2.height : i2.width;
        image_orig_height = (iOS && (imageOrigRotation === 270 || imageOrigRotation === 90)) ? i2.width : i2.height;
        image_orig_rotation = imageOrigRotation;
        whenReady();
    };
    i2.src = i.src;
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
    var n = $(".ImageSelector .ScrollArea *"),
        t = parseInt(n.css("margin-left").replace("px", "")) || 0,
        i = parseInt(n.css("margin-right").replace("px", "")) || 0,
        r = n[0].offsetWidth,
        u = (r + t + i) * n.length;
    $(".ImageSelector .ScrollArea").css("width", u + "px");
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
    myScroll.goToPage((n.length / 2).toFixed(0) - 1, 0, 0, !1);
    $(".ImageSelector .ScrollArea *").on("tap", function() {
        myScroll.currentPage.pageX != $(this).index() && ($(".ImageSelector .ScrollArea .selectedImage").removeClass("selectedImage"), myScroll.goToPage($(this).index(), 0, 400))
    });
    myScroll.on("flick", function() {
        this.x == this.startX && updateSelectedImage()
    });
    myScroll.on("scrollEnd", updateSelectedImage);
    myScroll.on("scrollStart", function() {
        $(".ImageSelector .ScrollArea .selectedImage").removeClass("selectedImage")
    });
    $(".ImageSelector").css("opacity", 1);
    updateSelectedImage()
}

function searchImages() {
    var n = $("#searchText").val(),
        t;
    if (n != null && n.length !== 0) return $("#searchError").css("visibility", "hidden"), t = "/Home/BingImageSearch?query=" + encodeURIComponent(n), $.ajax({
        type: "POST",
        url: t,
        data: {},
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
    s = "/Images/icon-gender-male.png";
    i != null && i.toLowerCase() === "female" && (s = "/Images/icon-gender-female.png");
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
searchImages()
