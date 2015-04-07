
(function(){
	var blink = document.querySelector('.blink');

	setInterval(function () {
	  blink.style.visibility = getComputedStyle(blink).visibility === 'hidden'
	    ? 'visible'
	    : 'hidden';
	}, 300);

	//----------------------------------------------
	var Vue = require("vue");

	var demo = new Vue({
	    el: '#demo',
	    data: {
	        message: 'Hello Vue.js!'
	    }
	});

	var todos = new Vue({
	    el: '#todos',
	    data: {
	        title: 'todos',
	        todos: [
	            {
	                done: true,
	                content: 'Learn JavaScript'
	            },
	            {
	                done: false,
	                content: 'Learn Vue.js'
	            }
	        ]
	    }
	});
})();
