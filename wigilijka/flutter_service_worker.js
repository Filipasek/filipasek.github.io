'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "2efbb41d7877d10aac9d091f58ccd7b9",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/NOTICES": "6c31bc73cc75810e1e01c4443d9bc53c",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "b14fcf3ee94e3ace300b192e9e7c8c5d",
"favicon.png": "ac2cf953df505a63105ba45f42202808",
"icons/android-icon-144x144.png": "4ef4b83defb4f120c016d1e1a21d0ce1",
"icons/android-icon-192x192.png": "a747614d99ad1ea13fc811eb9f788690",
"icons/android-icon-36x36.png": "6ef03e62a0693cba44d7fa2cb4424ede",
"icons/android-icon-48x48.png": "f92fe1a8918d507d5fd93ec4254882a1",
"icons/android-icon-72x72.png": "1e7c48c91cc18fab62102ac89ea9cbf3",
"icons/android-icon-96x96.png": "837a8973cce247d0728bd2f2178c6ddc",
"icons/apple-icon-114x114.png": "52349f64d72bff9d83f132434dd42d7d",
"icons/apple-icon-120x120.png": "8f4a877d5a056c88c47f1a382efd2578",
"icons/apple-icon-144x144.png": "4ef4b83defb4f120c016d1e1a21d0ce1",
"icons/apple-icon-152x152.png": "6565a1f6b9ece37e8c55ff447bd3d53e",
"icons/apple-icon-180x180.png": "81f68469a9889deca2cef28da0eb4bc7",
"icons/apple-icon-57x57.png": "d1162ed07526ab7ecfef80a2a97578bb",
"icons/apple-icon-60x60.png": "89ccf252f41aad1269c7ff94f64e97e9",
"icons/apple-icon-72x72.png": "1e7c48c91cc18fab62102ac89ea9cbf3",
"icons/apple-icon-76x76.png": "afb6ca9896fa942b305db2c59dce2c47",
"icons/apple-icon-precomposed.png": "6967f0a9d7af60451a12a43d0c5dbc03",
"icons/apple-icon.png": "6967f0a9d7af60451a12a43d0c5dbc03",
"icons/favicon-16x16.png": "60c6c857f12fa7e1a3d6a335a5759e26",
"icons/favicon-32x32.png": "ac2cf953df505a63105ba45f42202808",
"icons/favicon-96x96.png": "837a8973cce247d0728bd2f2178c6ddc",
"icons/ms-icon-144x144.png": "4ef4b83defb4f120c016d1e1a21d0ce1",
"icons/ms-icon-150x150.png": "199c9785806000c4785973d82e8cfb05",
"icons/ms-icon-310x310.png": "484b2e9c2e8efd988f56d2525714ed12",
"icons/ms-icon-70x70.png": "4ec6aadc27fee39d82feebcd3fc9ef02",
"index.html": "9c1d134697e6908f6d2cc58eecfaa06f",
"/": "9c1d134697e6908f6d2cc58eecfaa06f",
"loading_style.css": "d2aa780253615d8fe273f75ae3f6a02e",
"main.dart.js": "04aa5c8baa6fae5408960fd1a7cc0fb0",
"manifest.json": "95da073d161a215cee7e085f95908153",
"version.json": "280322a42af401c46661650c1142cd64"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
