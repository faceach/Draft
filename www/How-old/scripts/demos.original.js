


function processRequest(isFile, imageUrl, imageName, fileSize, imageRotation) {
    
    window.location.hash = "results";
    deleteFaceRects();
    $("#jsonEventDiv").hide();
    var servicePath = "/Home/Analyze";
    var loadingHtml = 'Analyzing...<span><img id="loadingImage" src="/Images/ajax-loader_1.gif" /></span>';
    var errorHtml = "Couldn’t detect any faces. Please verify that the image is valid and less than 3MB.";
    var noFaceHtml = "Couldn’t detect any faces.";
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
    }
    else {
        requestUrl += "&faceUrl=" + encodeURIComponent(imageUrl) + "&faceName=" + imageName;
    }
    $.ajax({
        type: "POST",
        url: requestUrl,
        
        contentType: contentType,
        processData: false,
        data: data,
        success: function (response) {
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

        error: function (xhr, status, error) {
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


function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
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
                    processRequest(true, null, null, theFile.size, rotation);
                });
                
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
        
    }
}


function updateThumbnail(src) {
    var thumbnail = document.getElementById('thumbnail');
    
    thumbnail.setAttribute('src', src);
}


var iOS = false;
$(window).load(function() {
    document.getElementById('uploadBtn').addEventListener('change', handleFileSelect, false);
    document.getElementById('uploadBtn').addEventListener('click', function () { this.value = null}, false);
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

$('#viewEvent').click(function () { viewSource(); return false; });

