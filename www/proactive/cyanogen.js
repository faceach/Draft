! function() {
	var elStyle = document.createElement('style');
	document.head.appendChild(elStyle);
	elStyle.innerText = '#b_results>li.b_ans { border-radius: 10px; margin-left: 12px; margin-right: 12px; }' +
		'#b_results .b_ans+.b_ans { margin-top: 24px; }' +
		'' +
		'' +
		'';
}();