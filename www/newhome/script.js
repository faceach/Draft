document.getElementById('proactive_peek_main').style.height = 'auto';
document.getElementById('proactive_peek_main').style.transition = 'margin-top .4s ease-out';
document.getElementById('b_results').className = document.getElementById('b_results').className.replace(/\bproactive_peek_view\b/, '');
document.getElementById('action_container').style.position = 'static';
document.getElementById('proactive_peek_overlay').remove();
document.getElementById('chevron_bar').style.position = 'static';

(function() {
	var isScrollEnabled = false;
	var peekHeight = 0;
	var elPeekMain = document.getElementById('proactive_peek_main');

	function swipedetect(el, callback) {
		var touchsurface = el,
			swipedir,
			startX,
			startY,
			distX,
			distY,
			threshold = 5, //required min distance traveled to be considered swipe
			restraint = 100, // maximum distance allowed at the same time in perpendicular direction
			allowedTime = 800, // maximum time allowed to travel that distance
			elapsedTime,
			startTime,
			handleswipe = callback || function(swipedir) {};

		touchsurface.addEventListener('touchstart', function(e) {
			console.log('touch start.')
			var touchobj = e.changedTouches[0];
			swipedir = 'none';
			startX = touchobj.pageX;
			startY = touchobj.pageY;
			startTime = new Date().getTime(); // record time when finger first makes contact with surface
			if (!isScrollEnabled) {
				e.preventDefault()
			}
		}, false)

		touchsurface.addEventListener('touchmove', function(e) {
			console.log('touch move.')
			if (!isScrollEnabled) {
				e.preventDefault() // prevent scrolling when inside DIVP
			}
		}, false)

		touchsurface.addEventListener('touchend', function(e) {
			console.log('touch end.')
			var touchobj = e.changedTouches[0];
			distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
			distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
			elapsedTime = new Date().getTime() - startTime; // get time elapsed
			console.log('elapsedTime:' + elapsedTime);
			if (elapsedTime <= allowedTime) { // first condition for awipe met
				console.log('X:' + distX);
				console.log('Y:' + distY);
				if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) { // 2nd condition for vertical swipe met
					swipedir = (distY < 0) ? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
				} else if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) { // 2nd condition for horizontal swipe met
					swipedir = (distX < 0) ? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
				}
			}
			handleswipe(swipedir);
			//e.preventDefault()
		}, false);
	}

	function hidePeek() {
		if (!peekHeight) {
			peekHeight = elPeekMain.clientHeight;
		}
		elPeekMain.style.marginTop = (-1 * peekHeight) + 'px';

		setTimeout(function() {
			isScrollEnabled = true;
		}, 400);
	}

	function showPeek() {
		elPeekMain.style.marginTop = 0;
		isScrollEnabled = false;
	}

	swipedetect(document.documentElement, function(swipedir) {
		console.log('You just swiped: ' + swipedir);
		if (swipedir.toLowerCase() === 'up') {
			hidePeek();
		} else if (swipedir.toLowerCase() === 'down') {
			if (document.body.scrollTop < peekHeight) {
				showPeek();
			}
		}
	});

	document.getElementById('chevron_bar').addEventListener('click', function(e) {
		e.preventDefault();
		hidePeek();
	});

})();