(function() {
    function isProactive() {
        return location.pathname === '/proactive/' || location.pathname === '/proactive';
    }
    if (!isProactive) {
        return;
    }
    var originXMLHttpRequestOpen = window.XMLHttpRequest.prototype.open;
    var originXMLHttpRequestSend = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.open = function() {
        console.log(arguments);
        return originXMLHttpRequestOpen.apply(this, [].slice.call(arguments));
    };
    window.XMLHttpRequest.prototype.send = function() {
        console.log(arguments);
        return originXMLHttpRequestSend.apply(this, [].slice.call(arguments));
    };
})();