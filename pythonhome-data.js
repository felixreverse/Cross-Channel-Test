
var Module = typeof Module !== 'undefined' ? Module : {};

if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
  Module.finishedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {
 var loadPackage = function(metadata) {

    var PACKAGE_PATH;
    if (typeof window === 'object') {
      PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
    } else if (typeof location !== 'undefined') {
      // worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
    } else {
      throw 'using preloaded data can only be done on a web page or in a web worker';
    }
    var PACKAGE_NAME = '/home/me/workdir/emtests/renpyweb-asyncify/build/t/pythonhome.data';
    var REMOTE_PACKAGE_BASE = 'pythonhome.data';
    if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
      Module['locateFile'] = Module['locateFilePackage'];
      err('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
    }
    var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
  
    var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
    var PACKAGE_UUID = metadata.package_uuid;
  
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', packageName, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) size = event.total;
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
            Module.dataFileDownloads[url] = {
              loaded: event.loaded,
              total: size
            };
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads/num);
          if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        } else if (!Module.dataFileDownloads) {
          if (Module['setStatus']) Module['setStatus']('Downloading data...');
        }
      };
      xhr.onerror = function(event) {
        throw new Error("NetworkError for: " + packageName);
      }
      xhr.onload = function(event) {
        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
          var packageData = xhr.response;
          callback(packageData);
        } else {
          throw new Error(xhr.statusText + " : " + xhr.responseURL);
        }
      };
      xhr.send(null);
    };

    function handleError(error) {
      console.error('package error:', error);
    };
  
  function runWithFS() {

    function assert(check, msg) {
      if (!check) throw msg + new Error().stack;
    }
Module['FS_createPath']('/', 'lib', true, true);
Module['FS_createPath']('/lib', 'python2.7', true, true);
Module['FS_createPath']('/lib/python2.7', 'importlib', true, true);
Module['FS_createPath']('/lib/python2.7', 'json', true, true);
Module['FS_createPath']('/lib/python2.7', 'encodings', true, true);
Module['FS_createPath']('/lib/python2.7', 'xml', true, true);
Module['FS_createPath']('/lib/python2.7/xml', 'etree', true, true);

    function DataRequest(start, end, audio) {
      this.start = start;
      this.end = end;
      this.audio = audio;
    }
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module['addRunDependency']('fp ' + this.name);
      },
      send: function() {},
      onload: function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);
        this.finish(byteArray);
      },
      finish: function(byteArray) {
        var that = this;

        Module['FS_createDataFile'](this.name, null, byteArray, true, true, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
        Module['removeRunDependency']('fp ' + that.name);

        this.requests[this.name] = null;
      }
    };

        var files = metadata.files;
        for (var i = 0; i < files.length; ++i) {
          new DataRequest(files[i].start, files[i].end, files[i].audio).open('GET', files[i].filename);
        }

  
      var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      var IDB_RO = "readonly";
      var IDB_RW = "readwrite";
      var DB_NAME = "EM_PRELOAD_CACHE";
      var DB_VERSION = 1;
      var METADATA_STORE_NAME = 'METADATA';
      var PACKAGE_STORE_NAME = 'PACKAGES';
      function openDatabase(callback, errback) {
        try {
          var openRequest = indexedDB.open(DB_NAME, DB_VERSION);
        } catch (e) {
          return errback(e);
        }
        openRequest.onupgradeneeded = function(event) {
          var db = event.target.result;

          if(db.objectStoreNames.contains(PACKAGE_STORE_NAME)) {
            db.deleteObjectStore(PACKAGE_STORE_NAME);
          }
          var packages = db.createObjectStore(PACKAGE_STORE_NAME);

          if(db.objectStoreNames.contains(METADATA_STORE_NAME)) {
            db.deleteObjectStore(METADATA_STORE_NAME);
          }
          var metadata = db.createObjectStore(METADATA_STORE_NAME);
        };
        openRequest.onsuccess = function(event) {
          var db = event.target.result;
          callback(db);
        };
        openRequest.onerror = function(error) {
          errback(error);
        };
      };

      // This is needed as chromium has a limit on per-entry files in IndexedDB
      // https://cs.chromium.org/chromium/src/content/renderer/indexed_db/webidbdatabase_impl.cc?type=cs&sq=package:chromium&g=0&l=177
      // https://cs.chromium.org/chromium/src/out/Debug/gen/third_party/blink/public/mojom/indexeddb/indexeddb.mojom.h?type=cs&sq=package:chromium&g=0&l=60
      // We set the chunk size to 64MB to stay well-below the limit
      var CHUNK_SIZE = 64 * 1024 * 1024;

      function cacheRemotePackage(
        db,
        packageName,
        packageData,
        packageMeta,
        callback,
        errback
      ) {
        var transactionPackages = db.transaction([PACKAGE_STORE_NAME], IDB_RW);
        var packages = transactionPackages.objectStore(PACKAGE_STORE_NAME);
        var chunkSliceStart = 0;
        var nextChunkSliceStart = 0;
        var chunkCount = Math.ceil(packageData.byteLength / CHUNK_SIZE);
        var finishedChunks = 0;
        for (var chunkId = 0; chunkId < chunkCount; chunkId++) {
          nextChunkSliceStart += CHUNK_SIZE;
          var putPackageRequest = packages.put(
            packageData.slice(chunkSliceStart, nextChunkSliceStart),
            'package/' + packageName + '/' + chunkId
          );
          chunkSliceStart = nextChunkSliceStart;
          putPackageRequest.onsuccess = function(event) {
            finishedChunks++;
            if (finishedChunks == chunkCount) {
              var transaction_metadata = db.transaction(
                [METADATA_STORE_NAME],
                IDB_RW
              );
              var metadata = transaction_metadata.objectStore(METADATA_STORE_NAME);
              var putMetadataRequest = metadata.put(
                {
                  uuid: packageMeta.uuid,
                  chunkCount: chunkCount
                },
                'metadata/' + packageName
              );
              putMetadataRequest.onsuccess = function(event) {
                callback(packageData);
              };
              putMetadataRequest.onerror = function(error) {
                errback(error);
              };
            }
          };
          putPackageRequest.onerror = function(error) {
            errback(error);
          };
        }
      }

      /* Check if there's a cached package, and if so whether it's the latest available */
      function checkCachedPackage(db, packageName, callback, errback) {
        var transaction = db.transaction([METADATA_STORE_NAME], IDB_RO);
        var metadata = transaction.objectStore(METADATA_STORE_NAME);
        var getRequest = metadata.get('metadata/' + packageName);
        getRequest.onsuccess = function(event) {
          var result = event.target.result;
          if (!result) {
            return callback(false, null);
          } else {
            return callback(PACKAGE_UUID === result.uuid, result);
          }
        };
        getRequest.onerror = function(error) {
          errback(error);
        };
      }

      function fetchCachedPackage(db, packageName, metadata, callback, errback) {
        var transaction = db.transaction([PACKAGE_STORE_NAME], IDB_RO);
        var packages = transaction.objectStore(PACKAGE_STORE_NAME);

        var chunksDone = 0;
        var totalSize = 0;
        var chunks = new Array(metadata.chunkCount);

        for (var chunkId = 0; chunkId < metadata.chunkCount; chunkId++) {
          var getRequest = packages.get('package/' + packageName + '/' + chunkId);
          getRequest.onsuccess = function(event) {
            // If there's only 1 chunk, there's nothing to concatenate it with so we can just return it now
            if (metadata.chunkCount == 1) {
              callback(event.target.result);
            } else {
              chunksDone++;
              totalSize += event.target.result.byteLength;
              chunks.push(event.target.result);
              if (chunksDone == metadata.chunkCount) {
                if (chunksDone == 1) {
                  callback(event.target.result);
                } else {
                  var tempTyped = new Uint8Array(totalSize);
                  var byteOffset = 0;
                  for (var chunkId in chunks) {
                    var buffer = chunks[chunkId];
                    tempTyped.set(new Uint8Array(buffer), byteOffset);
                    byteOffset += buffer.byteLength;
                    buffer = undefined;
                  }
                  chunks = undefined;
                  callback(tempTyped.buffer);
                  tempTyped = undefined;
                }
              }
            }
          };
          getRequest.onerror = function(error) {
            errback(error);
          };
        }
      }
    
    function processPackageData(arrayBuffer) {
      Module.finishedDataFileDownloads++;
      assert(arrayBuffer, 'Loading data file failed.');
      assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
      
        // Reuse the bytearray from the XHR as the source for file reads.
        DataRequest.prototype.byteArray = byteArray;
  
          var files = metadata.files;
          for (var i = 0; i < files.length; ++i) {
            DataRequest.prototype.requests[files[i].filename].onload();
          }
              Module['removeRunDependency']('datafile_/home/me/workdir/emtests/renpyweb-asyncify/build/t/pythonhome.data');

    };
    Module['addRunDependency']('datafile_/home/me/workdir/emtests/renpyweb-asyncify/build/t/pythonhome.data');
  
    if (!Module.preloadResults) Module.preloadResults = {};
  
      function preloadFallback(error) {
        console.error(error);
        console.error('falling back to default preload behavior');
        fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, processPackageData, handleError);
      };

      openDatabase(
        function(db) {
          checkCachedPackage(db, PACKAGE_PATH + PACKAGE_NAME,
            function(useCached, metadata) {
              Module.preloadResults[PACKAGE_NAME] = {fromCache: useCached};
              if (useCached) {
                fetchCachedPackage(db, PACKAGE_PATH + PACKAGE_NAME, metadata, processPackageData, preloadFallback);
              } else {
                fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE,
                  function(packageData) {
                    cacheRemotePackage(db, PACKAGE_PATH + PACKAGE_NAME, packageData, {uuid:PACKAGE_UUID}, processPackageData,
                      function(error) {
                        console.error(error);
                        processPackageData(packageData);
                      });
                  }
                , preloadFallback);
              }
            }
          , preloadFallback);
        }
      , preloadFallback);

      if (Module['setStatus']) Module['setStatus']('Downloading...');
    
  }
  if (Module['calledRun']) {
    runWithFS();
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
  }

 }
 loadPackage({"files": [{"start": 0, "audio": 0, "end": 49878, "filename": "/lib/python2.7/urllib.pyo"}, {"start": 49878, "audio": 0, "end": 70082, "filename": "/lib/python2.7/string.pyo"}, {"start": 70082, "audio": 0, "end": 72772, "filename": "/lib/python2.7/types.pyo"}, {"start": 72772, "audio": 0, "end": 88689, "filename": "/lib/python2.7/socket.pyo"}, {"start": 88689, "audio": 0, "end": 92252, "filename": "/lib/python2.7/io.pyo"}, {"start": 92252, "audio": 0, "end": 103557, "filename": "/lib/python2.7/posixpath.pyo"}, {"start": 103557, "audio": 0, "end": 107019, "filename": "/lib/python2.7/genericpath.pyo"}, {"start": 107019, "audio": 0, "end": 143764, "filename": "/lib/python2.7/platform.pyo"}, {"start": 143764, "audio": 0, "end": 152359, "filename": "/lib/python2.7/UserDict.pyo"}, {"start": 152359, "audio": 0, "end": 158529, "filename": "/lib/python2.7/sre_constants.pyo"}, {"start": 158529, "audio": 0, "end": 170471, "filename": "/lib/python2.7/copy.pyo"}, {"start": 170471, "audio": 0, "end": 184946, "filename": "/lib/python2.7/heapq.pyo"}, {"start": 184946, "audio": 0, "end": 224592, "filename": "/lib/python2.7/inspect.pyo"}, {"start": 224592, "audio": 0, "end": 224826, "filename": "/lib/python2.7/struct.pyo"}, {"start": 224826, "audio": 0, "end": 226921, "filename": "/lib/python2.7/keyword.pyo"}, {"start": 226921, "audio": 0, "end": 239739, "filename": "/lib/python2.7/ast.pyo"}, {"start": 239739, "audio": 0, "end": 259576, "filename": "/lib/python2.7/sre_parse.pyo"}, {"start": 259576, "audio": 0, "end": 265502, "filename": "/lib/python2.7/functools.pyo"}, {"start": 265502, "audio": 0, "end": 271622, "filename": "/lib/python2.7/opcode.pyo"}, {"start": 271622, "audio": 0, "end": 275413, "filename": "/lib/python2.7/token.pyo"}, {"start": 275413, "audio": 0, "end": 289800, "filename": "/lib/python2.7/urlparse.pyo"}, {"start": 289800, "audio": 0, "end": 364402, "filename": "/lib/python2.7/tarfile.pyo"}, {"start": 364402, "audio": 0, "end": 367986, "filename": "/lib/python2.7/fnmatch.pyo"}, {"start": 367986, "audio": 0, "end": 387488, "filename": "/lib/python2.7/_sysconfigdata.pyo"}, {"start": 387488, "audio": 0, "end": 396926, "filename": "/lib/python2.7/_weakrefset.pyo"}, {"start": 396926, "audio": 0, "end": 434682, "filename": "/lib/python2.7/pickle.pyo"}, {"start": 434682, "audio": 0, "end": 441546, "filename": "/lib/python2.7/hashlib.pyo"}, {"start": 441546, "audio": 0, "end": 453874, "filename": "/lib/python2.7/sre_compile.pyo"}, {"start": 453874, "audio": 0, "end": 461352, "filename": "/lib/python2.7/shlex.pyo"}, {"start": 461352, "audio": 0, "end": 479570, "filename": "/lib/python2.7/shutil.pyo"}, {"start": 479570, "audio": 0, "end": 499279, "filename": "/lib/python2.7/tempfile.pyo"}, {"start": 499279, "audio": 0, "end": 524634, "filename": "/lib/python2.7/random.pyo"}, {"start": 524634, "audio": 0, "end": 544668, "filename": "/lib/python2.7/webbrowser.pyo"}, {"start": 544668, "audio": 0, "end": 559762, "filename": "/lib/python2.7/weakref.pyo"}, {"start": 559762, "audio": 0, "end": 570560, "filename": "/lib/python2.7/base64.pyo"}, {"start": 570560, "audio": 0, "end": 632133, "filename": "/lib/python2.7/difflib.pyo"}, {"start": 632133, "audio": 0, "end": 636326, "filename": "/lib/python2.7/__future__.pyo"}, {"start": 636326, "audio": 0, "end": 655363, "filename": "/lib/python2.7/site.pyo"}, {"start": 655363, "audio": 0, "end": 666942, "filename": "/lib/python2.7/traceback.pyo"}, {"start": 666942, "audio": 0, "end": 669845, "filename": "/lib/python2.7/glob.pyo"}, {"start": 669845, "audio": 0, "end": 675164, "filename": "/lib/python2.7/dummy_thread.pyo"}, {"start": 675164, "audio": 0, "end": 700588, "filename": "/lib/python2.7/os.pyo"}, {"start": 700588, "audio": 0, "end": 705583, "filename": "/lib/python2.7/copy_reg.pyo"}, {"start": 705583, "audio": 0, "end": 719670, "filename": "/lib/python2.7/tokenize.pyo"}, {"start": 719670, "audio": 0, "end": 783081, "filename": "/lib/python2.7/argparse.pyo"}, {"start": 783081, "audio": 0, "end": 808391, "filename": "/lib/python2.7/collections.pyo"}, {"start": 808391, "audio": 0, "end": 820133, "filename": "/lib/python2.7/textwrap.pyo"}, {"start": 820133, "audio": 0, "end": 826321, "filename": "/lib/python2.7/dis.pyo"}, {"start": 826321, "audio": 0, "end": 867521, "filename": "/lib/python2.7/zipfile.pyo"}, {"start": 867521, "audio": 0, "end": 873553, "filename": "/lib/python2.7/abc.pyo"}, {"start": 873553, "audio": 0, "end": 928455, "filename": "/lib/python2.7/locale.pyo"}, {"start": 928455, "audio": 0, "end": 931156, "filename": "/lib/python2.7/stat.pyo"}, {"start": 931156, "audio": 0, "end": 935550, "filename": "/lib/python2.7/contextlib.pyo"}, {"start": 935550, "audio": 0, "end": 940850, "filename": "/lib/python2.7/repr.pyo"}, {"start": 940850, "audio": 0, "end": 944092, "filename": "/lib/python2.7/linecache.pyo"}, {"start": 944092, "audio": 0, "end": 959435, "filename": "/lib/python2.7/gettext.pyo"}, {"start": 959435, "audio": 0, "end": 963386, "filename": "/lib/python2.7/colorsys.pyo"}, {"start": 963386, "audio": 0, "end": 975547, "filename": "/lib/python2.7/warnings.pyo"}, {"start": 975547, "audio": 0, "end": 1011786, "filename": "/lib/python2.7/codecs.pyo"}, {"start": 1011786, "audio": 0, "end": 1036816, "filename": "/lib/python2.7/_abcoll.pyo"}, {"start": 1036816, "audio": 0, "end": 1054180, "filename": "/lib/python2.7/sysconfig.pyo"}, {"start": 1054180, "audio": 0, "end": 1067488, "filename": "/lib/python2.7/re.pyo"}, {"start": 1067488, "audio": 0, "end": 1078873, "filename": "/lib/python2.7/StringIO.pyo"}, {"start": 1078873, "audio": 0, "end": 1080360, "filename": "/lib/python2.7/importlib/__init__.pyo"}, {"start": 1080360, "audio": 0, "end": 1082574, "filename": "/lib/python2.7/json/scanner.pyo"}, {"start": 1082574, "audio": 0, "end": 1094609, "filename": "/lib/python2.7/json/decoder.pyo"}, {"start": 1094609, "audio": 0, "end": 1108234, "filename": "/lib/python2.7/json/encoder.pyo"}, {"start": 1108234, "audio": 0, "end": 1122164, "filename": "/lib/python2.7/json/__init__.pyo"}, {"start": 1122164, "audio": 0, "end": 1124090, "filename": "/lib/python2.7/encodings/utf_8.pyo"}, {"start": 1124090, "audio": 0, "end": 1128519, "filename": "/lib/python2.7/encodings/zlib_codec.pyo"}, {"start": 1128519, "audio": 0, "end": 1130386, "filename": "/lib/python2.7/encodings/utf_32_be.pyo"}, {"start": 1130386, "audio": 0, "end": 1139151, "filename": "/lib/python2.7/encodings/aliases.pyo"}, {"start": 1139151, "audio": 0, "end": 1142716, "filename": "/lib/python2.7/encodings/hex_codec.pyo"}, {"start": 1142716, "audio": 0, "end": 1144947, "filename": "/lib/python2.7/encodings/ascii.pyo"}, {"start": 1144947, "audio": 0, "end": 1147130, "filename": "/lib/python2.7/encodings/raw_unicode_escape.pyo"}, {"start": 1147130, "audio": 0, "end": 1151488, "filename": "/lib/python2.7/encodings/__init__.pyo"}, {"start": 1151488, "audio": 0, "end": 1153749, "filename": "/lib/python2.7/encodings/latin_1.pyo"}, {"start": 1153749, "audio": 0, "end": 1154822, "filename": "/lib/python2.7/xml/__init__.pyo"}, {"start": 1154822, "audio": 0, "end": 1162315, "filename": "/lib/python2.7/xml/etree/ElementPath.pyo"}, {"start": 1162315, "audio": 0, "end": 1162439, "filename": "/lib/python2.7/xml/etree/__init__.pyo"}, {"start": 1162439, "audio": 0, "end": 1196419, "filename": "/lib/python2.7/xml/etree/ElementTree.pyo"}], "remote_package_size": 1196419, "package_uuid": "bf428702-b342-4b8d-b036-17531c35c82f"});

})();
