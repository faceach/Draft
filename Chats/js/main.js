(function(_root) {
	'use strict';

	var svgLoadingHTML = document.getElementById("svgloading-template").innerHTML;
	var chatsContainerHTML = document.getElementById("chats-template").innerHTML;

	//Vue.config.debug = true;

	function clog(s) {
		//console.log(s);
	}

	function getViewportSize() {
		var viewportWidth;
		var viewportHeight;

		// the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
		if (typeof _root.innerWidth != 'undefined') {
			viewportWidth = _root.innerWidth;
			viewportHeight = _root.innerHeight;
		}
		// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
		else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth !=
			'undefined' && document.documentElement.clientWidth != 0) {
			viewportWidth = document.documentElement.clientWidth;
			viewportHeight = document.documentElement.clientHeigh;
		}
		// older versions of IE
		else {
			viewportWidth = document.getElementsByTagName('body')[0].clientWidth;
			viewportHeight = document.getElementsByTagName('body')[0].clientHeight;
		}

		return {
			viewportWidth: viewportWidth,
			viewportHeight: viewportHeight
		};
	}

	var itemHeightMin = 125;
	var viewportHeight = getViewportSize().viewportHeight;
	var screenItemMax = Math.floor(viewportHeight / itemHeightMin);
	var singleFetchScreenLength = 12;
	var singleFetchItemLength = screenItemMax * singleFetchScreenLength;
	var svgHeight = 100;

	clog("itemHeightMin: " + itemHeightMin);
	clog("viewportHeight: " + viewportHeight);
	clog("screenItemMax: " + screenItemMax);
	clog("singleFetchScreenLength: " + singleFetchScreenLength);
	clog("singleFetchItemLength: " + singleFetchItemLength);
	clog("-----------------------------------------------");

	function fetchChatsRecords(itemLength) {
		itemLength = itemLength || singleFetchItemLength;
		return getChatsRecords(itemLength);
	}

	var scrollDeltaTemp = 0;
	var scrollReference = 0;

	function render(itemLength, count) {
		// the `user` object will be passed to the child
		// component as its $data
		new Vue({
			el: '#chats',
			data: fetchChatsRecords(itemLength),
			components: {
				child: {
					template: "#chat-template" //"{{m}}"
				}
			},
			attached: function() {

				// Computed after images loaded
				var elImgs = document.querySelectorAll(".chats-msg-picture-img");
				var imgLoad = imagesLoaded(elImgs);
				imgLoad.on('always', function() {

					// Remove SVG loading
					var elSvgLoading = document.querySelectorAll(".svg-loading")[1];
					//document.body.scrollTop -= svgHeight;
					if (elSvgLoading && elSvgLoading.parentNode) {
						elSvgLoading.parentNode.removeChild(elSvgLoading);
					}

					clog("document.body.scrollTop: " + document.body.scrollTop);
					clog("document.body.scrollHeight: " + document.body.scrollHeight);

					// Scroll bottom for latest msg
					document.body.scrollTop = document.body.scrollHeight - (viewportHeight + scrollDeltaTemp);

					// No events register again
					if (count > 0) {
						scrollReference = document.body.scrollHeight - viewportHeight;
						return;
					}
					scrollReference = document.body.scrollTop;

					_root.addEventListener("scroll", function(e) {
						//clog(e);
						clog("document.body.scrollTop: " + document.body.scrollTop);
						clog("document.body.scrollHeight: " + document.body.scrollHeight);
						clog("scrollReference: " + scrollReference);

						scrollDeltaTemp = scrollReference - document.body.scrollTop;
						var isFetchRequired = (document.body.scrollHeight - (viewportHeight + scrollDeltaTemp)) <= (singleFetchScreenLength - 2) * viewportHeight;

						clog("scrollDeltaTemp: " + scrollDeltaTemp);
						clog("isFetchRequired: " + isFetchRequired);

						// Less then one screen, query & prepend
						if (isFetchRequired) {
							count++;
							prependChats(singleFetchItemLength, count);
							//document.body.scrollTop = document.body.scrollHeight - scrollDeltaTemp;
						}

						clog("-----------------------------------------------");
					});

				});
			}
		});
	}

	function prependChats(itemLength, count) {
		count = count || 0;
		clog("Append child: " + count);
		clog("-----------------------------------------------");

		var elChats = document.getElementById("chats");
		var elChatsItemHTML = svgLoadingHTML + chatsContainerHTML;

		// Insert to top
		elChats.insertAdjacentHTML("afterbegin", elChatsItemHTML);
		//document.body.scrollTop += svgHeight;
		// Rendering
		render(itemLength, count);
	}

	// Initialize
	prependChats(singleFetchItemLength);

	/*var chats = new Vue({
		el: '#chats',
		data: fetchChatsRecords(),
		computed: {

		},
	});*/

})(window);