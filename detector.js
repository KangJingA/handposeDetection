// gesture detection script 

// getting DOM
const enableWebcamButton = document.getElementById('webcamButton');

function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia);
  }
  
  // If webcam supported, add event listener to button for when user
  // wants to activate it to call enableCam function which we will 
  // define in the next step.
  
  if (getUserMediaSupported()) {
    enableWebcamButton.addEventListener('click', main);

  } else {
    console.warn('getUserMedia() is not supported by your browser');
  }

// loading vector function
// enter the filename of your vector json file
var json_filename = 'vectors_test.json';

var actual_JSON;

function loadJSON(callback) {   

  var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
  xobj.open('GET', json_filename, true); // Replace 'appDataServices' with the path to your file
  xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
          callback(xobj.responseText);
        }
  };  
  xobj.send(null);  
}

function init() {
  //var actual_JSON; //this makes it a local variable again
  loadJSON(function(response) {
   // Parsing JSON string into object
      actual_JSON = JSON.parse(response);
      // console.log(actual_JSON)
  });
 }

// get JSON 
init();

// l2 norm
function dotproduct(a,b) {
  var n = 0, lim = Math.min(a.length,b.length);
  for (var i = 0; i < lim; i++) n += a[i] * b[i];
  return n;
}

function norm2(a) {var sumsqr = 0; for (var i = 0; i < a.length; i++) sumsqr += a[i]*a[i]; return Math.sqrt(sumsqr);}

function similarity(a, b) {return dotproduct(a,b)/norm2(a)/norm2(b);}

// get distance between 2 vectors
function cosineDistanceMatching(poseVector1, poseVector2) {
  // normalize first 

  let cosineSimilarity = similarity(poseVector1, poseVector2);
  let distance = 2 * (1 - cosineSimilarity);
  return Math.sqrt(distance);
}

// function that computes cosine similiarity with the recorded vector 
// returns object

function get_allCosSim (label_Json, seenVector){
  var final = label_Json.map(function(element){
      return {
          label: element.label,
          cos_sim: cosineDistanceMatching(element.vector_value,seenVector) 
      }
  })
  return final
}

// this checks for lowest value based on the specified key
Array.prototype.hasMin = function(attrib) {
  const checker = (o, i) => typeof(o) === 'object' && o[i]
  return (this.length && this.reduce(function(prev, curr){
      const prevOk = checker(prev, attrib);
      const currOk = checker(curr, attrib);
      if (!prevOk && !currOk) return {};
      if (!prevOk) return curr;
      if (!currOk) return prev;
      return prev[attrib] < curr[attrib] ? prev : curr; 
  })) || null;
}

fingerLookupIndices = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20]
  };

function drawPoint(ctx, y, x, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  

  
function drawPath(ctx, points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    }
  
    if (closePath) {
      region.closePath();
    }
    ctx.stroke(region);
  }


function drawKeypoints(ctx, keypoints) {
    const keypointsArray = keypoints;
    
    // draw individual keypoints
    for (let i = 0; i < keypointsArray.length; i++) {
      const y = keypointsArray[i][0];
      const x = keypointsArray[i][1];
      drawPoint(ctx, x - 2, y - 2, 3);
    }

    // draw center of palm
    // const y = (keypointsArray[0][0] + keypointsArray[9][0])/2;
    // const x = (keypointsArray[0][1] + keypointsArray[9][1])/2;
    // drawPoint(ctx,x-2,y,3);

    // drawing path
    const fingers = Object.keys(fingerLookupIndices);
    for (let i = 0; i < fingers.length; i++) {
      
      const finger = fingers[i];
      const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
      drawPath(ctx, points, false);
    }

    // const points = fingerLookupIndices.middleFinger.map(idx => keypoints[idx]);
    //drawPath(ctx,points,false);
}

async function setupCamera() {
    console.log('setting up camera')
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
          'Browser API navigator.mediaDevices.getUserMedia not available');
    }
  
    const video = document.getElementById('webcam');
    const stream = await navigator.mediaDevices.getUserMedia({
      'audio': false,
      'video': true
    });
    video.srcObject = stream;
  
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }


async function loadVideo() {
    const video = await setupCamera();
    video.play();
    return video;
  }


// load model
async function load_handpose() {
    model = await handpose.load();
    console.log('model loaded');
    return model;
}  



async function landmarksRealTime (video,model) {
    
  
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;
  
    const canvas = document.getElementById('c');
  
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  
    const ctx = canvas.getContext('2d');
  
    video.width = videoWidth;
    video.height = videoHeight;
  
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
  
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // scales in the x axis
  
    async function frameLandmarks() { 
      
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width,canvas.height);

      const predictions = await model.estimateHands(video);
      
      if (predictions.length > 0) {
        
        // do the bounding box thingy? 

        // flatten vector
        var vectorDetected = predictions[0].landmarks.flat();

        // normalize the vector 
        var predictionCosine = get_allCosSim(actual_JSON, vectorDetected);

        // grab label with lowest eu distance 
        var finalPredict =  predictionCosine.hasMin('cos_sim');

        var text;
        switch(finalPredict.label) {

          case 0:
            text = "no";
            break;

          case 1:
            text = "hand open";
            break;

          case 2:
            text = "yes"
            break;
        }

        document.getElementById('predictiontext').innerHTML = text;
        //console.log('Predicted value is ' + finalPredict.label);
        
        // draw keypoints
        const result = predictions[0].landmarks;
        drawKeypoints(ctx, result); //, predictions[0].annotations
       

    } else {

      document.getElementById('predictiontext').innerHTML = "hand is not detected"
       
    }
    requestAnimationFrame(frameLandmarks);
  }
    frameLandmarks();

}


function main() { 
  load_handpose().then(async function (model) {
      
      let video;
      video = await loadVideo();
      landmarksRealTime(video,model);

  })
}

