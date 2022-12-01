
//followup camera
FollowFromUpCamera = function(){

  /* the only data it needs is the position of the camera */
  this.frame = glMatrix.mat4.create();
  
  /* update the camera with the current car position */
  this.update = function(car_position){
    this.frame = car_position;
  }

  /* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();
    let up = glMatrix.vec4.create();
    
    glMatrix.vec3.transformMat4(eye, [0  ,10,0], this.frame);
    glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
    glMatrix.vec4.transformMat4(up, [0.0,0.0,-1,0.0], this.frame);
    
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye,target,up.slice(0,3));	
  }
}

//chase camera
ChaseCamera = function(){
  /* the only data it needs is the frame of the camera */
  this.frame = [0,0,0];
  
  /* update the camera with the current car position */
  //declaration of ChaseCamera.update method
  //this updates the camera frame with the car frame
  this.update = function(car_frame){
    this.frame = car_frame.slice();
  }

  /* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();
    glMatrix.vec3.transformMat4(  //create the matrix that represents the viewer frame
      eye,                        //output (viewer's position)
      [0.0, 3.0, 12.0 ,1.0],       //position vector
      this.frame                  //takes the 4-th column of this matrix
    );
    glMatrix.vec3.transformMat4(  //create the matrix rep. the frame with center in our car
      target,                     //output (point viewer is looking at)
      [0.0, 0.0, 0.0, 1.0],       //point [0, 0, 0] in normalized coordinates
      this.frame                  //takes the 4-th column of this matrix 
    );
    return glMatrix.mat4.lookAt(  //returns the lookAt matrix (frame)
      glMatrix.mat4.create(),     //output 
      eye,                        //viewer position
      target,                     //point viewer is looking at
      [0, 1, 0]                   //up direction
    );	
  }
}


/* the main object to be implementd */
var Renderer = new Object();

/* array of cameras that will be used */
Renderer.cameras = [];
// add a FollowFromUpCamera
Renderer.cameras.push(new FollowFromUpCamera());
Renderer.cameras.push(new ChaseCamera());

// set the camera currently in use
Renderer.currentCamera = 0;

/*
create the buffers for an object as specified in common/shapes/triangle.js
*/
Renderer.createObjectBuffers = function (gl, obj) {

  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  obj.indexBufferTriangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // create edges
  var edges = new Uint16Array(obj.numTriangles * 3 * 2);
  for (var i = 0; i < obj.numTriangles; ++i) {
    edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
    edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
  }

  obj.indexBufferEdges = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  //EDIT : added normal buffer initialization
  if(obj.hasOwnProperty('normals')){
    obj.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
};


Renderer.drawObject = function (gl, obj, fillColor, lineColor) {
  //setup vertex position attribute for the shader
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(this.shader.aPositionIndex);
  gl.vertexAttribPointer(this.shader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

  //EDIT : adding per vertex normal attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
  gl.enableVertexAttribArray(this.shader.aNormalIndex);
  gl.vertexAttribPointer(this.shader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);

  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  //setup color uniform for shader
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.uniform4fv(this.shader.uColorLocation, fillColor);

  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  //to draw edges
  gl.disable(gl.POLYGON_OFFSET_FILL);
  
  if(!obj.hasOwnProperty("indexBufferEdges")) return;
	
  //setup color uniform for edges 
  gl.uniform4fv(this.shader.uColorLocation, lineColor);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);


  //resets buffer binding
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(this.shader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};



/*
initialize the object in the scene
*/
Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");
  Renderer.triangle = new Triangle();

  //card body decalration
  this.beatle = loadOnGPU_modified(gl, beatle);

  this.cylinder = new Cylinder(10);
  ComputeNormals(this.cylinder);
  this.createObjectBuffers(gl,this.cylinder );

  Renderer.createObjectBuffers(gl, this.triangle);

  //EDIT : TUTTE LE NORMALI DEGLI OGGETTI DEL TRACCIATO VENGONO ORA CALCOLATE IN GAME.JS
  Renderer.createObjectBuffers(gl,Game.scene.trackObj);
  Renderer.createObjectBuffers(gl,Game.scene.groundObj);
  for (var i = 0; i < Game.scene.buildings.length; ++i){ 
	  Renderer.createObjectBuffers(gl,Game.scene.buildingsObj[i]);
  }

  //EDIT : ADD LAMP OBJ BUFFERS
  for(var i = 0; i < Game.scene.lampsObj.length; i++){
    Renderer.createObjectBuffers(gl, Game.scene.lampsObj[i]);
  }
};



var wheelsRotationAngleFront = 0.0;
var wheelsRotationAngleBack = 0.0;
const wheelsScaleRatio = 1.5; //for back wheels

//draw the car
Renderer.drawCar = function (gl) {

    M                 = glMatrix.mat4.create();
    rotate_transform  = glMatrix.mat4.create();
    translate_matrix  = glMatrix.mat4.create();
    scale_matrix      = glMatrix.mat4.create();


    //scalatura e centramento
    glMatrix.mat4.fromScaling(scale_matrix, [0.2, 0.2, 0.2]);
    glMatrix.mat4.fromTranslation(translate_matrix, [-0.32, 1.0, 0]);
    glMatrix.mat4.mul(M, scale_matrix, translate_matrix);
    //campovolgimento
    glMatrix.mat4.fromRotation(rotate_transform, Math.PI, [0, 1, 0]);
    glMatrix.mat4.mul(M, rotate_transform, M);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix);
    //EDIT : matrice per le normali in viewspace
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

    //draw car body
    this.drawObject(gl,this.beatle,[0.3,0.6,0.7,1.0],[0.0, 0.0, 0.0, 1.0]); //with edges
    Renderer.stack.pop();

    //DRAW WHEELS
    Mw = glMatrix.mat4.create(); //model matrix per le trasformazioni di base per le ruote
    //setup wheels base position
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2.0,[0,0,1]);
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
    glMatrix.mat4.mul(Mw,translate_matrix,rotate_transform);
    //setup wheels base size
    glMatrix.mat4.fromScaling(scale_matrix,[0.1,0.2,0.2]);
    glMatrix.mat4.mul(Mw,scale_matrix,Mw);
    
    //update wheels rotation (by speed)
    wheelsRotationAngleFront = (wheelsRotationAngleFront + this.car.speed) % (2*Math.PI);
    wheelsRotationAngleBack = (wheelsRotationAngleBack + this.car.speed/wheelsScaleRatio) % (2*Math.PI);
    

    //ROTATE WHEELS (FRONTALI -> rotazione per velocità e per curva)
    MwF = glMatrix.mat4.create(); 
    //rotazione per velocità
    glMatrix.mat4.fromRotation(rotate_transform,  wheelsRotationAngleFront, [-1, 0, 0]);
    glMatrix.mat4.mul(MwF, rotate_transform, Mw);
    //rotazione per curvatura
    glMatrix.mat4.fromRotation(rotate_transform, this.car.wheelsAngle*Math.PI, [0, 1, 0]); 
    glMatrix.mat4.mul(MwF, rotate_transform, MwF);


    glMatrix.mat4.identity(M);
    
    //DRAW FRONT-LEFT WHEEL
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwF); //EDIT : replace MwF with Mw
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix);
    //EDIT : normalMatrix
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

    this.drawObject(gl,this.cylinder,[1.0,0.6,0.5,1.0],[0.0,0.0,0.0,1.0]);
    Renderer.stack.pop();

    //DRAW FRONT-RIGHT WHEEL
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwF);
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix); 
    //EDIT : normalMatrix
    var invT = glMatrix.mat4.create();
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

    this.drawObject(gl,this.cylinder,[1.0,0.6,0.5,1.0],[0.0,0.0,0.0,1.0]);
    Renderer.stack.pop();

    /* this will increase the size of the wheel to 0.4*1,5=0.6 */
    //ingrandisci ruote posteriori
    glMatrix.mat4.fromScaling(scale_matrix,[1,wheelsScaleRatio,wheelsScaleRatio]);;
    glMatrix.mat4.mul(Mw,scale_matrix,Mw);

    //ROTATE WHEELS (posteriori -> solo speed based)
    MwB = glMatrix.mat4.create()
    glMatrix.mat4.fromRotation(rotate_transform, wheelsRotationAngleBack, [-1, 0, 0]);
    glMatrix.mat4.mul(MwB, rotate_transform, Mw);
    
    //DRAW BACK-LEFT WHEEL
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.25,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwB); //EDIT : replace MwB with Mw
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix); 
    //EDIT : normalMatrix
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);
    
    //disegno
    this.drawObject(gl,this.cylinder,[1.0,0.6,0.5,1.0],[0.0,0.0,0.0,1.0]);
    Renderer.stack.pop();

    //DRAW BACK-RIGHT WHEEL
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.3,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwB);
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix); 
    //EDIT : normalMatrix
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);
    
    //disegno
    this.drawObject(gl,this.cylinder,[1.0,0.6,0.5,1.0],[0.0,0.0,0.0,1.0]);
    Renderer.stack.pop();
};


//draws all the scene (car and world)
Renderer.drawScene = function (gl) {
  //setup viewport
  var width = this.canvas.width;
  var height = this.canvas.height
  var ratio = width / height;
  this.stack = new MatrixStack();

  gl.viewport(0, 0, width, height);
  
  gl.enable(gl.DEPTH_TEST);

  // Clear the framebuffer
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup shader
  gl.useProgram(this.shader);
  //setup uniform for perspective matrix
  gl.uniformMatrix4fv(
    this.shader.uProjectionMatrixLocation,
    false,
    glMatrix.mat4.perspective(glMatrix.mat4.create(), 3.14 / 4, ratio, 1, 500)
  );

  //DEBUG
  gl.uniform1i(this.shader.uDebugLocation, 0);

  //updates camera position...
  Renderer.cameras[Renderer.currentCamera].update(this.car.frame);
  //get inverse of view frame
  var invV = Renderer.cameras[Renderer.currentCamera].matrix();
  
  //initialize the stack with the identity
  this.stack.loadIdentity();
  //multiply by the view matrix
  this.stack.multiply(invV);

  //EDIT : setup directional light direction uniform (in view space)
  var lightDirectionViewSpace = glMatrix.vec4.create();
  var lightDirection = glMatrix.vec4.fromValues(Game.scene.weather.sunLightDirection[0], Game.scene.weather.sunLightDirection[1], Game.scene.weather.sunLightDirection[2], 0.0);
  glMatrix.vec4.transformMat4(lightDirectionViewSpace, lightDirection, invV);
  glMatrix.vec4.normalize(lightDirectionViewSpace, lightDirectionViewSpace);
  gl.uniform4fv(
    this.shader.uLightDirectionLocation,
    lightDirectionViewSpace
  );
  //color
  gl.uniform3fv(
    this.shader.uLightColorLocation,
    new Float32Array([1.0, 1.0, 1.0])
  );

  //EDIT: setup spotlights position uniform
  for(var i = 0; i < Game.scene.lamps.length; i++){
    var lampPosition = glMatrix.vec4.fromValues(Game.scene.lamps[i].position[0], Game.scene.lamps[i].height+1.0, Game.scene.lamps[i].position[2], 1.0);
    lampPosition = glMatrix.vec4.transformMat4(lampPosition, lampPosition, invV);
    gl.uniform4fv(
      this.shader.uSpotlightsPositionLocation[i],
      lampPosition
    );
  }
  var lampDirection = glMatrix.vec4.fromValues(0.0, -1.0, 0.0, 0.0);
  lampDirection = glMatrix.vec4.transformMat4(lampDirection, lampDirection, invV);
  lampDirection = glMatrix.vec4.normalize(lampDirection, lampDirection);
  gl.uniform4fv(this.shader.uSpotlightsDirectionLocation, lampDirection);    

  //spotlight color
  gl.uniform4fv(this.shader.uSpotlightsColorLocation, new Float32Array([0.7, 0.3, 0.7, 1.0]));


  // drawing the car
  this.stack.push();
  this.stack.multiply(this.car.frame);
  this.drawCar(gl);
  this.stack.pop();

  gl.uniformMatrix4fv(
    this.shader.uModelViewMatrixLocation, 
    false, 
    this.stack.matrix
  );
  
  //EDIT : normal matrix
  gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

  // drawing the static elements (ground, track and buldings)
	this.drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);
 	this.drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);
	for (var i in Game.scene.buildingsObj) 
		this.drawObject(gl, Game.scene.buildingsObj[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0]);

  //EDIT : DRAW LAMPS
  for(var i in Game.scene.lampsObj)
    this.drawObject(gl, Game.scene.lampsObj[i], [0.2, 0.2, 0.4, 1.0], [0.2, 0.2, 0.2, 1.0]);
  
  gl.useProgram(null);
};



Renderer.Display = function () {
  Renderer.drawScene(Renderer.gl);
  window.requestAnimationFrame(Renderer.Display) ;
};


Renderer.setupAndStart = function () {
 /* create the canvas */
	Renderer.canvas = document.getElementById("OUTPUT-CANVAS");
  
 /* get the webgl context */
	Renderer.gl = Renderer.canvas.getContext("webgl");

  /* read the webgl version and log */
	var gl_version = Renderer.gl.getParameter(Renderer.gl.VERSION); 
	log("glversion: " + gl_version);
	var GLSL_version = Renderer.gl.getParameter(Renderer.gl.SHADING_LANGUAGE_VERSION)
	log("glsl  version: "+GLSL_version);

  /* create the matrix stack */
	Renderer.stack = new MatrixStack();

  /* initialize objects to be rendered */
  Renderer.initializeObjects(Renderer.gl);

  /* create the shader */
  Renderer.shader = new lightShader3(Renderer.gl, Game.scene.lamps.length);

  /*
  add listeners for the mouse / keyboard events
  */
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);

  Renderer.Display();
}

on_mouseMove = function(e){}

on_keyup = function(e){
	Renderer.car.control_keys[e.key] = false;
}
on_keydown = function(e){
	Renderer.car.control_keys[e.key] = true;
}

window.onload = Renderer.setupAndStart;


update_camera = function (value){
  Renderer.currentCamera = value;
}

function mat4ToMat3(out, input){
  out = glMatrix.mat3.create();
  out[0] = input[0];
  out[1] = input[1];
  out[2] = input[2];
  out[3] = input[4];
  out[4] = input[5];
  out[5] = input[6];
  out[6] = input[8];
  out[7] = input[9];
  out[8] = input[10];

}

