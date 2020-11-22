// script to obtain landmark vectors of customized gesture images

// 1. load images in the extract.html script
// 2. run the script
// 3. download JSON file containing the landmark vectors

// load model
async function load_handpose() {
    const model = await handpose.load();
    console.log("model loaded!")
    return model;
}

// prediction
async function capture_hands(image,model) {
    const predictions = await model.estimateHands(image)

    if (predictions.length > 0) {
      // console.log(predictions) 
            
      return predictions

    } else{      
      console.log('hands not detected')

      return predictions
      
    }   
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }
  

const saveData = function (data) {
    const dataJSON = JSON.stringify(data)
    download("vectors_pose.json",dataJSON);

}

// create empty list 
vectors = []; 

function main() {

    load_handpose().then(async function (model) {

        const total_imgs = 4;
    
        var i;
        for (i = 0; i < total_imgs ; i++){
            
            // draw up image before passing into model
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            var img = document.getElementById('pic' + i);
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0 );
            var myData = context.getImageData(0, 0, img.width, img.height);
    
            console.log(myData);
    
            var predictions = await capture_hands(myData,model);
            console.log('Predicting image ' + i);
            
            if (predictions.length > 0 ) {
                
                // parse predictions object to grab landmarks data in a single vector 
                var parse1 = predictions[0].landmarks.flat();
                var parse2 = Object.values(parse1);
    
                vectors.push({
                    label:i,
                    vector_value:parse2
                });
                console.log('vector data captured for image ' +i);
                console.log(parse2)
            } else {
                console.log('image ' + i + ' cannot be detected by the model');
            }
            
        }
    
        saveData(vectors);
        alert("data is saved");

        
            
    })

}

main()