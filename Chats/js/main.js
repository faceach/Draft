(function() {
	'use strict';

	var template = "<div class=\"chats-item {{users[u].self ? 'self' : ''}}\">" +
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
		"<img src=\"{{m || 'img/blank.png'}}\" alt=\"\" width=\"320\">" +
		"</template>" +
		"<template v-if=\"t\">" +
		"{{m || ''}}" +
		"</template>" +
		"</p>" +
		"</div>";

	//Vue.config.debug = true;

	function getViewportSize() {
		var viewportWidth;
		var viewportHeight;

		// the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
		if (typeof window.innerWidth != 'undefined') {
			viewportWidth = window.innerWidth;
			viewportHeight = window.innerHeight;
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

	console.log("itemHeightMin: " + itemHeightMin);
	console.log("viewportHeight: " + viewportHeight);
	console.log("screenItemMax: " + screenItemMax);
	console.log("singleFetchScreenLength: " + singleFetchScreenLength);
	console.log("singleFetchItemLength: " + singleFetchItemLength);

	function fetchChatsRecords(itemLength) {
		itemLength = itemLength || singleFetchItemLength;
		return getChatsRecords(itemLength);
	}

	Vue.directive('chats', {
		bind: function() {},
		update: function(value) {
			console.log("=========================");
			console.log(document.body.clientHeight);
		}
	});

	function prependChats(itemLength, count) {
		count = count || 0;
		console.log("Append child: " + count);

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
				if (count > 0) {
					return;
				}
				var elImgs = document.querySelectorAll(".chats-msg-picture-img");
				var imgLoad = imagesLoaded(elImgs);
				imgLoad.on('always', function() {
					console.log("=========================");
					console.log(document.body.clientHeight);

					// Scroll bottom for latest msg
					var scrollHeight = document.body.scrollTop = document.body.scrollHeight;

					window.addEventListener("scroll", function(e) {
						//console.log(e);
						console.log(document.body.scrollTop);

						var deltaScroll = scrollHeight - document.body.scrollTop;
						var scrollScreenLength = Math.ceil(deltaScroll / viewportHeight);

						console.log(deltaScroll);
						console.log(scrollScreenLength);

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

})();