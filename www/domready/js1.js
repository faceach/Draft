console.log("js1:" + window.js1);
console.log("js2:" + window.js2);
console.log("js3:" + window.js3);

document.addEventListener("DOMContentLoaded", function(e){
	console.log("Dom ready - js1:" + window.js1);
	console.log("Dom ready - js2:" + window.js2);
	console.log("Dom ready - js3:" + window.js3);
});