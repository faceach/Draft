(function(_root) {
	'use strict';

	var svgLoading = "<svg viewBox=\"0 0 64 64\">" +
		"<g>" +
		"<circle cx=\"16\" cy=\"32\" stroke-width=\"0\" r=\"5.41547\">" +
		"<animate attributeName=\"fill-opacity\" dur=\"750ms\" values=\".5;.6;.8;1;.8;.6;.5;.5\" repeatCount=\"indefinite\"></animate>" +
		"<animate attributeName=\"r\" dur=\"750ms\" values=\"3;3;4;5;6;5;4;3\" repeatCount=\"indefinite\"></animate>" +
		"</circle>" +
		"<circle cx=\"32\" cy=\"32\" stroke-width=\"0\" r=\"4.41547\">" +
		"<animate attributeName=\"fill-opacity\" dur=\"750ms\" values=\".5;.5;.6;.8;1;.8;.6;.5\" repeatCount=\"indefinite\">" +
		"</animate><animate attributeName=\"r\" dur=\"750ms\" values=\"4;3;3;4;5;6;5;4\" repeatCount=\"indefinite\"></animate>" +
		"</circle>" +
		"<circle cx=\"48\" cy=\"32\" stroke-width=\"0\" r=\"3.41547\">" +
		"<animate attributeName=\"fill-opacity\" dur=\"750ms\" values=\".6;.5;.5;.6;.8;1;.8;.6\" repeatCount=\"indefinite\"></animate>" +
		"<animate attributeName=\"r\" dur=\"750ms\" values=\"5;4;3;3;4;5;6;5\" repeatCount=\"indefinite\"></animate>" +
		"</circle>" +
		"</g>" +
		"</svg>";

	var template = "<div data-sr=\"enter {{users[u].self ? 'right' : 'left'}}\" class=\"chats-item {{users[u].self ? 'self' : ''}}\">" +
		"<div class=\"chats-avator clearfix\">" +
		"<template v-if=\"users[u].avator\">" +
		"<img src=\"{{users[u].avator || 'img/blank.png'}}\" alt=\"{{users[u].name || ''}}\" width=\"40\" height=\"40\">" +
		"</template>" +
		"<div class=\"chats-avator-text\">" +
		"<strong>{{users[u].name || ''}}</strong>" +
		"<span>{{e || ''}}</span>" +
		"</div>" +
		"</div>" +
		"<p class=\"chats-msg {{p ? 'chats-msg-picture' : ''}}\">" +
		"<template v-if=\"p\">" +
		"<img src=\"{{m || 'img/blank.png'}}\" alt=\"\" height=\"400\">" +
		"</template>" +
		"<template v-if=\"t\">" +
		"{{m || ''}}" +
		"</template>" +
		"</p>" +
		"</div>";

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
	var singleFetchScreenLength = 5;
	var singleFetchItemLength = screenItemMax * singleFetchScreenLength;

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
					template: template //"{{m}}"
				}
			},
			attached: function() {

				// Computed after images loaded
				var elImgs = document.querySelectorAll(".chats-msg-picture-img");
				var imgLoad = imagesLoaded(elImgs);
				imgLoad.on('always', function() {

					// Remove SVG loading
					var elSvgLoading = document.querySelector(".svg-loading");
					//elSvgLoading.parentNode.removeChild(elSvgLoading);


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
						var isFetchRequired = (document.body.scrollHeight - (viewportHeight + scrollDeltaTemp)) <= 0;// viewportHeight;

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
		var elChatsItemHTML = "<div v-component=\"child\" v-repeat=\"chats\" v-with=\"users: users, chats: chats\"></div>" +
			"<div class=\"svg-loading\">" + svgLoading + "</div>";
		//elChats.insertBefore(elChatsItem, elChats.childNodes[0]);
		elChats.insertAdjacentHTML("afterbegin", elChatsItemHTML);
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