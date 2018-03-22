var CACHE_CUR = 'scratchpad-markdown-v0.5.0';
var assetList = [
			'.',
			'./index.html',
			'./simplemde/simplemde.min.css',
			'./simplemde/simplemde.min.js',
			'./styles/styles.css',
		    './styles/print.css',
		    './images/tile-abstract-pattern-vector.png',
		    './scripts/jquery-3.1.1.min.js',
		    './scripts/tabs.js'
		];

self.addEventListener('install',function(evt) {
	console.log('installing serviceWorker "' + CACHE_CUR + '"');
	evt.waitUntil(precache());
});

self.addEventListener('fetch', function(evt) {
	// console.log('serving '+ evt.request.url);
	evt.respondWith(fromCacheElseFetch(evt.request));
	evt.waitUntil(update(evt.request));
});

self.addEventListener('activate', function(evt) {
	evt.waitUntil(caches.keys().then(function(keyList) {
		return Promise.all(keyList.map(function(key) {
			if (key != CACHE_CUR) {
				console.log('deleting obsolete cache "' + key + '"');
				return caches.delete(key);
			}
		}));
	}));
});

// Add files to the cache first time, during installation
function precache() {
	return caches.open(CACHE_CUR).then(function(cache) {
		return cache.addAll(assetList);
	});
}

// Return from cache or reject request
function fromCacheElseFetch(request) {
	return caches.open(CACHE_CUR).then(function(cache) {
		return cache.match(request).then(function(matching) {
			if (!matching) {
				console.log('cache miss: ' +  request.url);
			}
			return matching || fetch(request);
		});
	});
}

// Update cache
function update(request) {
	return caches.open(CACHE_CUR).then(function(cache) {
		return fetch(request).then(function(response) {
			// console.log('Updating ' + request.url);
			return cache.put(request, response);
		});
	});
}