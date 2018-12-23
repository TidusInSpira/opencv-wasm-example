let videoWidth = 640;
let videoHeight = 480;
let outputCanvas = document.createElement('canvas');

let cap = null;
let faceCascade = null;
let src = null;
let gray = null;

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMeida;

function run() {
  faceCascade = new cv.CascadeClassifier();
  faceCascade.load('face.xml');

  cap = new cv.VideoCapture(video);
  src = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
  gray = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1);

  startCamera();
  requestAnimationFrame(detectFace);
}

function startCamera() {
  navigator.getUserMedia(
    {
      video: true
    },
    function(stream) {
      video.srcObject = stream;
      video.play();
    },
    function(error) {
      console.error(error.name || error);
    }
  );
}

function saveImage(canvas, filename) {
  var image = canvas
    .toDataURL('image/png')
    .replace('image/png', 'image/octet-stream');
  let imgList = document.querySelector('#imgList');
  appendImage(image, imgList);
}

function appendImage(url, node) {
  var image = document.createElement('img');
  image.src = url;
  image.style.width = '100px';
  node.appendChild(image);
}

function detectFace() {
  // Capture a frame
  cap.read(src);

  // Convert to greyscale
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Downsample
  let downSampled = new cv.Mat();
  cv.pyrDown(gray, downSampled);
  cv.pyrDown(downSampled, downSampled);

  // Detect faces
  let faces = new cv.RectVector();
  faceCascade.detectMultiScale(downSampled, faces);

  // Draw boxes
  let size = downSampled.size();
  let xRatio = videoWidth / size.width;
  let yRatio = videoHeight / size.height;
  for (let i = 0; i < faces.size(); ++i) {
    let face = faces.get(i);
    let point1 = new cv.Point(face.x * xRatio, face.y * yRatio);
    let point2 = new cv.Point(
      (face.x + face.width) * xRatio,
      (face.y + face.height) * xRatio
    );
    cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
    saveImage(outputCanvas);
  }
  // Free memory
  downSampled.delete();
  faces.delete();

  // Show image
  cv.imshow(outputCanvas, src);

  requestAnimationFrame(detectFace);
}

// Config OpenCV
var Module = {
  locateFile: function(name) {
    let files = {
      'opencv_js.wasm': 'opencv_js.wasm'
    };
    return files[name];
  },
  preRun: [
    () => {
      Module.FS_createPreloadedFile(
        '/',
        'face.xml',
        'model/haarcascade_frontalface_default.xml',
        true,
        false
      );
    }
  ],
  postRun: [run]
};
