function callNativeAsync(apiName) {
    var defer = Promise.defer();
    if (!apiName || typeof cortanaObject[apiName] !== 'function') {
        completePromise(defer.reject);
        return defer.promise;
    }

    // Cal native projected API
    cortanaObject[apiName].apply(this, Array.prototype.slice.call(arguments, 1));

    var eventName = 'callNativeAsync_' + apiName;

    function eventHandler(jsonParams) {
        removeEventListener(eventName, eventHandler);
        if (!jsonParams) {
            return;
        }
        var result = jsonParams.result || null;
        if (jsonParams.status === 'resolved') {
            defer.resolve(result);
        } else {
            defer.reject(result);
        }
    }
    // Add event listener
    addEventListener(eventName, eventHandler);
    return defer.promise;
}

//-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -
function callNativeAsync(apiName) {
    return new Promise(function(resolve, reject) {
        if (!apiName || typeof cortanaObject[apiName] !== 'function') {
            completePromise(reject);
        }

        // Cal native projected API
        cortanaObject[apiName].apply(this, Array.prototype.slice.call(arguments, 1));

        var eventName = 'callNativeAsync_' + apiName;

        function eventHandler(jsonParams) {
            removeEventListener(eventName, eventHandler);
            if (!jsonParams) {
                return;
            }
            var result = jsonParams.result || null;
            if (jsonParams.status === 'resolved') {
                resolve(result);
            } else {
                reject(result);
            }
        }
        // Add event listener
        addEventListener(eventName, eventHandler);
    });
}