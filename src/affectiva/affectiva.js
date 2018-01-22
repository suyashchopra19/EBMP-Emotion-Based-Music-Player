import $ from "jquery";
import {
  getSearchedPlaylists,
  gettrackLookup
} from "../actions/search_actions";
import { getSearchedPlaylistsCall } from "../actions/spotifyApi_actions";
// import trackLookup from '../components/Home'

// import { trackLookup } from '../components/Login'

// import { trackLookup } from './tracks'
var width = 200;
var height = 150;
var detector;
var maxEmotion;

//////// affectiva downloaded
//Global namespace
var affdex = affdex || {};
affdex.version = "3.2.583-b86b1d2";
affdex.getAffdexDotJsLocation = function() {
  var scripts = document.getElementsByTagName("script");
  var affdexJS = null;
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src.match(/\/affdex\.js$/)) {
      affdexJS = scripts[i].src.replace(/\/affdex\.js$/, "/");
    }
  }
  return affdexJS;
};

affdex.FaceDetectorMode = {
  LARGE_FACES: 0,
  SMALL_FACES: 1
};

// Load worker from XHR url : src=https://gist.github.com/willywongi/5780151
function XHRWorker(url, ready, scope) {
  /* This loads the source of the worker through a XHR call. This is possible since the server
	   from which we pull the worker source serves files with CORS (Access-Control-Allow-Origin: *).
	   From the source (responseText) we build an inline worker.
	   This works but we need to delegate using the worker when the resource is loaded (XHR call finishes)
	*/
  var oReq = new XMLHttpRequest();
  oReq.addEventListener(
    "load",
    function() {
      var worker = new Worker(
        window.URL.createObjectURL(new Blob([this.responseText]))
      );
      if (ready) {
        ready.call(scope, worker);
      }
    },
    oReq
  );
  oReq.open("get", url, true);
  oReq.setRequestHeader("Access-Control-Allow-Origin", "*");
  oReq.setRequestHeader("Access-Control-Allow-Headers", "*");
  oReq.send();
}

affdex.Detector = function() {
  var self = this;

  //Public variables
  self.processFPS = 30;
  self.worker = null;
  self.staticMode = false;
  self.detectEmojis = false;
  self.faceDetectorMode = affdex.FaceDetectorMode.LARGE_FACES;
  self.isWorkerInitialized = false;
  self.isRunning = false;
  self.callbacks = {};

  self.detectExpressions = {
    smile: false,
    innerBrowRaise: false,
    browRaise: false,
    browFurrow: false,
    noseWrinkle: false,
    upperLipRaise: false,
    lipCornerDepressor: false,
    chinRaise: false,
    lipPucker: false,
    lipPress: false,
    lipSuck: false,
    mouthOpen: false,
    smirk: false,
    eyeClosure: false,
    attention: false,
    lidTighten: false,
    jawDrop: false,
    dimpler: false,
    eyeWiden: false,
    cheekRaise: false,
    lipStretch: false
  };

  self.detectAllExpressions = function() {
    setValueForAllKeys(self.detectExpressions, true);
  };

  self.detectAppearance = {
    gender: false,
    glasses: false,
    age: false,
    ethnicity: false
  };

  self.detectAllAppearance = function() {
    setValueForAllKeys(self.detectAppearance, true);
  };

  self.detectEmotions = {
    joy: false,
    sadness: false,
    disgust: false,
    contempt: false,
    anger: false,
    fear: false,
    surprise: false,
    valence: false,
    engagement: false
  };

  self.detectAllEmotions = function() {
    setValueForAllKeys(self.detectEmotions, true);
  };

  self.detectAllEmojis = function() {
    self.detectEmojis = true;
  };

  self.getCallback = function(event, status) {
    var state = event + "Failure";
    if (status) {
      state = event + "Success";
    }
    if (self.callbacks[state]) {
      return self.callbacks[state];
    } else {
      return function() {};
    }
  };

  var getActiveKeys = function(dictionary) {
    var retArray = [];
    for (var key in dictionary) {
      if (dictionary[key]) {
        retArray.push(key);
      }
    }
    return retArray;
  };

  var setValueForAllKeys = function(dictionary, value) {
    for (var key in dictionary) {
      dictionary[key] = value;
    }
  };

  var onWorkerReady = function(status) {
    if (status) {
      self.worker.postMessage({
        message: "start",
        metrics: {
          expressions: getActiveKeys(self.detectExpressions),
          emotions: getActiveKeys(self.detectEmotions),
          appearance: getActiveKeys(self.detectAppearance)
        },
        detectEmojis: self.detectEmojis,
        faceMode: self.faceDetectorMode,
        staticMode: self.staticMode,
        processFPS: self.processFPS
      });
    } else {
      var msg = "Failed to Initialize the worker";
      self.getCallback("onInitialize", status)(msg);
    }
  };

  self.onWorkerMessage = function(evt) {
    if (evt.data && evt.data.message) {
      var message = evt.data.message;
      var status = evt.data.status;
      switch (message) {
        case "ready":
          onWorkerReady(status);
          break;
        case "started":
          self.onInitialize(status);
          break;
        case "stopped":
          self.onStopped(status);
          break;
        case "reset":
          self.getCallback("onReset", status)();
          break;
        case "results":
          self.onImageResults(status, evt.data);
          break;
      }
    }
  };

  self.reset = function() {
    if (self.isWorkerInitialized) {
      self.worker.postMessage({ message: "reset" });
    } else {
      self.getCallback("onReset", false)("Failed to reset the detector");
    }
  };

  //Callback functions
  self.addEventListener = function(event, fn) {
    self.callbacks[event] = fn;
    return self;
  };

  self.removeEventListener = function(event) {
    delete self.callbacks[event];
    return self;
  };

  self.onStopped = function(status) {
    if (status) {
      self.worker.terminate();
      self.worker = null;
      self.isWorkerInitialized = false;
      self.isRunning = false;
    }
    self.getCallback("onStop", status)();
  };
};

//Define the prototypes for the functions that are going to be overrridden
//By children classes
affdex.Detector.prototype.start = function() {
  if (!this.isRunning) {
    var url = affdex.getAffdexDotJsLocation();
    XHRWorker(
      url + "affdex-worker.js",
      function(worker) {
        this.worker = worker;
        this.worker.onmessage = this.onWorkerMessage;
        this.worker.postMessage({ message: "ctor", url: url });
        this.isRunning = true;
      },
      this
    );
  } else {
    this.getCallback("onInitialize", false)(
      "Failed to start the detector, it is already running"
    );
  }
};

affdex.Detector.prototype.onImageResults = function(status, data) {
  if (status) {
    this.getCallback("onImageResults", status)(data.faces, data.img, data.time);
  } else {
    this.getCallback("onImageResults", status)(
      data.img,
      data.time,
      data.detail
    );
  }
};

affdex.Detector.prototype.onInitialize = function(status) {
  if (status) {
    this.isWorkerInitialized = true;
  }
  this.getCallback("onInitialize", status)(
    "Failed to Initialize the detectors"
  );
};

affdex.Detector.prototype.stop = function() {
  if (this.isWorkerInitialized) {
    this.worker.postMessage({ message: "stop" });
  } else {
    this.getCallback("onStop", false)(
      "Failed to stop the detector, it is not running"
    );
  }
};

affdex.CameraDetector = function(element, imgW, imgH, faceMode) {
  var self = this;
  affdex.Detector.call(self);
  var cameraStream = null;
  var width = imgW || 640;
  var height = imgH || 480;
  var startTimeStamp = new Date().getTime() / 1000;
  var docElement = element || document.createElement("div");
  var canvasElement = null;
  var canvasContext = null;
  var adapterJSVersion = "adapter-1.4.0.js";

  self.faceDetectorMode =
    typeof faceMode == "undefined"
      ? affdex.FaceDetectorMode.LARGE_FACES
      : faceMode;

  var ctor = function() {
    self.videoElement = document.createElement("video");
    self.videoElement.id = "face_video";
    self.videoElement.autoplay = true;
    docElement.appendChild(self.videoElement);
    startTimeStamp = new Date().getTime() / 1000;
    canvasElement = document.createElement("canvas");
    canvasElement.id = "face_video_canvas";
    canvasElement.width = width;
    canvasElement.height = height;
    canvasElement.style.display = "none";
    docElement.appendChild(canvasElement);
    canvasContext = canvasElement.getContext("2d");
  };

  var dtor = function() {
    if (self.videoElement) {
      self.videoElement.remove();
    }
    if (canvasElement) {
      canvasElement.remove();
    }
    self.videoElement = null;
    canvasElement = null;
  };

  var captureImage = function() {
    if (self.isWorkerInitialized && canvasElement) {
      canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasContext.drawImage(self.videoElement, 0, 0, width, height);
      var imgData = canvasContext.getImageData(
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      var currentTimeStamp = new Date().getTime() / 1000;
      process(imgData, currentTimeStamp - startTimeStamp);
    }
  };

  self.onWebcamReady = function(stream) {
    cameraStream = stream;
    self.videoElement.addEventListener("canplay", function() {
      self.videoElement.play();
    });

    var playingFn = function() {
      self.videoElement.removeEventListener("playing", self);
      //Call parent function
      affdex.Detector.prototype.start.apply(self);
    };

    self.videoElement.addEventListener("playing", playingFn);
    self.videoElement.src = window.URL.createObjectURL(stream);

    self.getCallback("onWebcamConnect", true)();
  };

  var require = function(rootDiv, file, success_callback, failure_callback) {
    var node = document.createElement("script");
    node.type = "text/javascript";
    node.src = file;
    node.onload = success_callback;
    node.onerror = function(err) {
      failure_callback("Error loading js file: " + file);
    };
    rootDiv.appendChild(node);
  };

  var process = function(img, timeStamp) {
    if (self.isWorkerInitialized) {
      self.worker.postMessage({
        message: "process",
        img: img,
        time: timeStamp
      });
    }
  };

  self._startCamera = function() {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false
      })
      .then(self.onWebcamReady)
      .catch(self.getCallback("onWebcamConnect", false));
  };

  self.start = function() {
    if (!self.isRunning) {
      ctor();
      var url = affdex.getAffdexDotJsLocation() + adapterJSVersion;
      require(docElement, url, function() {
        self._startCamera();
      }, function() {
        self.getCallback("onInitialize", false)(
          "Unable to load adaptor.js to load the camera"
        );
      });
    }
  };

  self.onInitialize = function(status) {
    //Call parent function
    affdex.Detector.prototype.onInitialize.call(self, status);
    if (status) {
      captureImage();
    }
  };

  self.onImageResults = function(status, data) {
    captureImage();
    affdex.Detector.prototype.onImageResults.call(self, status, data);
  };

  self.stop = function() {
    if (cameraStream && typeof cameraStream.getTracks != "undefined") {
      var tracks = cameraStream.getTracks();
      tracks.forEach(function(track, idx, arr) {
        track.stop();
      });
    }
    dtor();

    //Call parent function
    affdex.Detector.prototype.stop.call(self);
  };
};

affdex.FrameDetector = function(faceMode) {
  var self = this;
  affdex.Detector.call(self);

  self.faceDetectorMode =
    typeof faceMode == "undefined"
      ? affdex.FaceDetectorMode.LARGE_FACES
      : faceMode;

  self.start = function() {
    affdex.Detector.prototype.start.call(self);
  };

  self.onInitialize = function(status) {
    //Call parent function
    affdex.Detector.prototype.onInitialize.call(self, status);
  };

  self.onImageResults = function(status, data) {
    affdex.Detector.prototype.onImageResults.call(self, status, data);
  };
  self.stop = function() {
    affdex.Detector.prototype.stop.call(self);
  };
};

affdex.FrameDetector.prototype.process = function(img, timeStamp) {
  if (this.isWorkerInitialized) {
    this.worker.postMessage({
      message: "process",
      img: img,
      time: timeStamp
    });
  } else {
    this.getCallback("onImageResults", false)(
      img,
      timeStamp,
      "the detector is not initialized"
    );
  }
};

affdex.PhotoDetector = function(faceMode) {
  var self = this;
  affdex.FrameDetector.call(self);
  self.staticMode = true;
  self.faceDetectorMode =
    typeof faceMode == "undefined"
      ? affdex.FaceDetectorMode.SMALL_FACES
      : faceMode;

  self.process = function(img, timeStamp) {
    affdex.FrameDetector.prototype.process.call(self, img, timeStamp);
  };
};

////////////////////////////////

export function setupAffectiva() {
  var divRoot = $("#affdex_elements")[0];
  console.log("in SetupAffectiva");

  //Construct a CameraDetector and specify the image width / height and face detector mode.
  detector = new affdex.CameraDetector(
    divRoot,
    width,
    height,
    affdex.FaceDetectorMode.LARGE_FACES
  );

  detector.detectAllEmotions();

  //Add a callback to notify when the detector is initialized and ready for runing.
  detector.addEventListener("onInitializeSuccess", function() {
    log("logs", "The detector reports initialized");
    //Display canvas instead of video feed because we want to draw the feature points on it
    document.getElementById("face_video_canvas").style.display = "block";
    document.getElementById("face_video").style.display = "none";
  });

  //Add a callback to notify when camera access is allowed
  detector.addEventListener("onWebcamConnectSuccess", function() {
    log("logs", "Webcam access allowed");
  });

  //Add a callback to notify when camera access is denied
  detector.addEventListener("onWebcamConnectFailure", function() {
    log("logs", "Webcam denied");
    console.log("Webcam access denied");
    document.getElementById("songs").innerHTML =
      "<h3>Unable to access webcam.</h3><br/>";
    document.getElementById("active").disabled = true;
    alert(
      "Due to Affectiva’s limitations, please use Chrome, Firefox, or Opera. Sorry Safari/IE users :("
    );
  });

  //Add a callback to notify when detector is stopped
  detector.addEventListener("onStopSuccess", function() {
    log("logs", "The detector reports stopped");
    document.getElementById("results").innerHTML = "";
  });

  //Add a callback to receive the results from processing an image.
  //The faces object contains the list of the faces detected in an image.
  //Faces object contains probabilities for all the different expressions, emotions and appearance metrics
  detector.addEventListener("onImageResultsSuccess", function(
    faces,
    image,
    timestamp
  ) {
    document.getElementById("results").innerHTML = "";
    if (faces.length > 0) {
      drawFeaturePoints(image, faces[0].featurePoints);
      getEmotion(faces);
    }
  });
}

function log(node_name, msg) {
  document.getElementById(node_name).innerHTML +=
    "<span>" + msg + "</span><br/>";
}

export function startAffectiva() {
  console.log("Start Affectiva");
  if (detector && !detector.isRunning) {
    document.getElementById("logs").innerHTML = "";
    detector.start();
    log("logs", "Clicked the start button");
    // $("#start").addClass("disabled");
    $("#active").removeClass("disabled");
  }
}

export function stopAffectiva() {
  console.log("Stop Affectiva");
  if (detector && detector.isRunning) {
    detector.stop();
    // $("#start").addClass("disabled");
    // $("#active").removeClass("disabled");
  }
}

//Draw the detected facial feature points on the image
function drawFeaturePoints(img, featurePoints) {
  var c = document.getElementById("face_video_canvas");
  if (c == null) return;
  var contxt = c.getContext("2d");

  var hRatio = contxt.canvas.width / img.width;
  var vRatio = contxt.canvas.height / img.height;
  var ratio = Math.min(hRatio, vRatio);

  contxt.strokeStyle = "#FFFFFF";
  for (var id in featurePoints) {
    contxt.beginPath();
    contxt.arc(featurePoints[id].x, featurePoints[id].y, 2, 0, 2 * Math.PI);
    contxt.stroke();
  }
}

function getEmotion(faces) {
  var allEmotions = [
    "anger",
    "contempt",
    "disgust",
    "fear",
    "joy",
    "sadness",
    "surprise"
  ];
  var max = 0;
  if (faces[0].emotions["engagement"] > 25) {
    allEmotions.forEach(function(emotion) {
      if (faces[0].emotions[emotion] > max) {
        max = faces[0].emotions[emotion];
        maxEmotion = emotion;
      }
    });
    log("results", "Emotion: " + maxEmotion);
  }
}

/* takes the greatest emotion shown on the user's face and finds a genre */
export function processEmotion() {
  console.log("!!processEmotion(maxEmotion)!!", (maxEmotion = "joy"));
  if (maxEmotion) {
    var genre;

    log("results", "Processing emotion: " + maxEmotion);
    switch (maxEmotion) {
      case "anger":
        genre = "grindcore";
        break;
      case "contempt":
        genre = "hip-hop";
        break;
      case "disgust":
        genre = "punk";
        break;
      case "fear":
        genre = "witch-house";
        break;
      case "joy":
        genre = "pop";
        break;
      case "sadness":
        genre = "downtempo";
        break;
      case "surprise":
        genre = "house";
        break;
    }
    // trackLookup(genre, maxEmotion); // need to add the functionality to add song
    // getSearchedPlaylistsCall(genre);
    trackLookup(genre);
  } else {
    // document.getElementById("songs").innerHTML =
    //   "<span> Please show an emotion to the webcam. </span><br/>";
  }
}

const trackLookup = async genre => {
  console.log("HOme here");
  if (localStorage.getItem("token")) {
    $.ajax({
      url: "https://api.spotify.com/v1/search",
      data: {
        q: "genre:" + genre + " year:2017",
        type: "track",
        market: "US",
        limit: "50"
      },
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      success: function(response) {
        console.log("success song recieved");
        console.log(response)// this has all the tracks !! pull info from here!!
        if (genre) {
          if (response.tracks.items.length != 0) {
            var randomIndex = Math.round(
              Math.random() * (response.tracks.items.length - 1)
            );
            var track = response.tracks.items[randomIndex];
            $("#songs").html(
              "<span> Based on your emotion of , we recommend: <br/><h3>" +
                track.name +
                " by " +
                track.artists[0].name +
                "</h3></span><br/>"
            );
            displaySong(track.uri);
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(
          "Unable to authorize through Spotify Web API (Error " +
            jqXHR.status +
            ")"
        );
      }
    });
  }
};

function displaySong(uri) {
  $("#song-display").html(
    '<iframe src="https://open.spotify.com/embed?uri=' +
      uri +
      '" frameborder="0" allowtransparency="true"></iframe>'
  );
}
