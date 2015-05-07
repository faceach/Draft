  var htmlLogNum = 1;

  function htmlLog(s) {
    document.body.insertAdjacentHTML("beforeend", "<p style='background-color: #3f3; margin-bottom: 3px;'>" + htmlLogNum + ": " + s + "</p>");
    htmlLogNum++;
  }

  function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    htmlLog("handle... file list length: " + files.length);
    htmlLog("handle... file name: " + files[0].name);
    htmlLog("handle... file type: " + files[0].type);

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

      htmlLog("loop... file type: " + f.type);
      htmlLog("loop... match: " + f.type.match("image.*"));

      // Only process image files.
      if (!f.type.match('image.*')) {
        continue;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
          var div = document.createElement('div');
          div.innerHTML = ['<img class="thumb" src="', e.target.result,
            '" title="', escape(theFile.name), '"/>'
          ].join('');
          document.getElementById('list').insertBefore(div, null);
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);