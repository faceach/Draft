! function() {
	var elStyle = document.createElement('style');
	document.head.appendChild(elStyle);
	elStyle.innerText = '#b_results > li.b_ans { border-radius: 10px; overflow-y: hidden; }' +
		'#b_results > li.b_ans + .b_ans { margin-top: 24px; }' +
		'';
}();
/*
'#b_results > li.b_ans .b_ansSlice:last-child .miniExpanded .miniExpIcon { border-bottom-right-radius: 10px; border-bottom-left-radius: 10px; }' +
'#b_results > li.b_ans > .actDrawer .actContainer { border-top-left-radius: 10px; border-top-right-radius: 10px; }' +
'#b_results > li.b_ans .b_ansSlice .actDrawer .actContainer { border-top-left-radius: 10px; border-top-right-radius: 10px; }' +
'#b_results > li.b_ans .b_ansSlice ~ .b_ansSlice .actDrawer .actContainer { border-top-left-radius: 0; border-top-right-radius: 0; }' +
*/