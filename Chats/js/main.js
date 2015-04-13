(function() {

	//Vue.config.debug = true;

	var todos = new Vue({
		el: '#chats',
		data: getChatsRecords()
	});

})();