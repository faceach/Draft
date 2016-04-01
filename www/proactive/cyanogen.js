! function() {
	var elStyle = document.createElement('style');
	document.head.appendChild(elStyle);
	elStyle.innerText = '#b_results>li.b_ans { border-radius: 10px; }' +
		'#b_results .b_ans+.b_ans { margin-top: 20px; }' +
		'' +
		'' +
		'';
}();