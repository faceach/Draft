! function() {
	var elStyle = document.createElement('style');
	document.head.appendChild(elStyle);
	elStyle.innerText = '#b_results > li.b_ans { border-radius: 10px; }' +
		'#b_results > li.b_ans + .b_ans { margin-top: 24px; }' +
		'#b_results > li.b_ans .b_ansSlice:last-child .miniExpanded .miniExpIcon { border-bottom-right-radius: 10px; border-bottom-left-radius: 10px; }' +
		'#b_results > li.b_ans > .actDrawer .actContainer, #b_results > li.b_ans .b_ansSlice:first-child .actDrawer .actContainer { border-top-left-radius: 10px; border-top-right-radius: 10px; }' +
		'#b_results > li.b_ans .b_ansSlice:first-child { background-color: red; }' +
		'';
}();