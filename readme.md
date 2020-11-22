## Tensorflow JS deployment project 
### Handpose detection 

This project explores the handpose model from https://github.com/tensorflow/tfjs-models/tree/master/handpose.

The handpose JS model is a lightweight ML pipeline consisting of two models: A palm detector and a hand-skeleton finger tracking model. It predicts 21 3D hand keypoints per detected hand. 

In this project, the pretrained handpose model first detects 21 landmarks of the hand. Next, the euclidean distance between these landmarks and the landmarks of the pre-loaded gesture image labels are calculated. Finally, the model returns the label with the lowest euclidean distance.

The model is able to recognise hand gestures, and learn new gestures from just one training image. This software can be deployed in a camera or webserver, and integrated to areas with high contact points (for example in elevators). Users then can use hand gestures to indicate intent instead of physically pushing a button or touching high contact surfaces. 

