var pageTransparentForLockscreen = (function() {
	function getRGBA(rgb, alpha) {
		alpha = alpha > 1 ? (alpha / 100) : alpha;
		match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(rgb)
		return "rgba(" + [match[1], match[2], match[3], alpha].join(',') + ")";
	}
	var styleBody = window.getComputedStyle(document.body);

	var bgHtml = window.getComputedStyle(document.documentElement).getPropertyValue('background-color');
	var bgBody = styleBody.getPropertyValue('background-color');
	var opacityBody = styleBody.getPropertyValue('opacity');

	return {
		transparent: function(alpha) {
			alpha = alpha > 1 ? (alpha / 100) : alpha;
			document.documentElement.style.backgroundColor = getRGBA(bgHtml, alpha);
			document.body.style.backgroundColor = getRGBA(bgBody, alpha);
			document.body.style.opacity = alpha;
		},
		recover: function() {
			document.documentElement.style.backgroundColor = bgHtml;
			document.body.style.backgroundColor = bgBody;
			document.body.style.opacity = opacityBody;
		}
	};
})();
pageTransparentForLockscreen.transparent(.3);
pageTransparentForLockscreen.recover();