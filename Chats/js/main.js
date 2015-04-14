(function(_root) {
	'use strict';

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

	function fetchChatsRecords(itemLength) {
		itemLength = itemLength || singleFetchItemLength;
		return getChatsRecords(itemLength);
	}

	Vue.directive('chats', {
		bind: function() {},
		update: function(value) {
			clog("=========================");
			clog(document.body.clientHeight);
		}
	});

	function prependChats(itemLength, count) {
		count = count || 0;
		clog("Append child: " + count);

		var elChats = document.getElementById("chats");
		var elChatsItemHTML = "<div v-component=\"child\" v-repeat=\"chats\" v-with=\"users: users, chats: chats\"></div>";
		//elChats.insertBefore(elChatsItem, elChats.childNodes[0]);
		elChats.insertAdjacentHTML("afterbegin", elChatsItemHTML);

		// the `user` object will be passed to the child
		// component as its $data
		var parent = new Vue({
			el: '#chats',
			data: fetchChatsRecords(itemLength),
			components: {
				child: {
					template: template //"{{m}}"
				}
			},
			attached: function() {
				// Scroll Reveal
				_root.sr = new scrollReveal({
			        "reset":  false,
			        "mobile": true,
			        "complete": function(){
			        	//
			        }
				});

				// No events register again
				if (count > 0) {
					return;
				}
				var elImgs = document.querySelectorAll(".chats-msg-picture-img");
				var imgLoad = imagesLoaded(elImgs);
				imgLoad.on('always', function() {
					if (count > 0) {
						return;
					}
					clog("=========================");
					clog(document.body.clientHeight);

					// Scroll bottom for latest msg
					var scrollHeight = document.body.scrollTop = document.body.scrollHeight;

					_root.addEventListener("scroll", function(e) {
						//clog(e);
						clog(document.body.scrollTop);

						var deltaScroll = scrollHeight - document.body.scrollTop;
						var scrollScreenLength = Math.ceil(deltaScroll / viewportHeight);

						clog(deltaScroll);
						clog(scrollScreenLength);

						if (scrollScreenLength > singleFetchScreenLength - 1) {
							count++;
							prependChats(singleFetchItemLength, count);
							document.body.scrollTop = document.body.scrollHeight - deltaScroll;
						}
					});

				});
			}
		});
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