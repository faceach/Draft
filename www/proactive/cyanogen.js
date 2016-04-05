! function() {
	var elStyle = document.createElement('style');
	document.head.appendChild(elStyle);
	elStyle.innerText = '#b_results > li.b_ans { border-radius: 10px; overflow-y: hidden; }' +
		'#b_results > li.b_ans + .b_ans { margin-top: 24px; }' +
		'';
}();