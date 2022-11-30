//EDIT : added moving camera
MovingCamera = function(){
  this.frame = glMatrix.mat4.fromValues( //initial frame for the moving camera
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, -12.0, 0.0, 1.0
  );
  this.lastFrame = -1.0;
  this.control_keys = {
    'a' : false,
    'd' : false,
    'w' : false,
    's' : false,
    ' ' : false
  };
  this.mouse_shift = {
    'x' : 0.0,
    'y' : 0.0,
    'prevX' : 0.0,
    'prevY' : 0.0
  }

  //vettore che punta sempre verso il basso
  this.downVec = glMatrix.vec3.fromValues(0, 1, 0);

  this.update = function(ignore){ //ignora l'argomento per compatibilità con le update(car_frame) delle altre telecamere
    this.update_step();
  }

  this.update_step = function(){
    var deltaV;
    var now = Date.now();
    if(this.lastFrame == -1.0){
      this.lastFrame = now;
      return;
    }
    else{
      deltaV = now - this.lastFrame;
      deltaV /= 100;
      this.lastFrame = now;
    }

		this.movingLeft  = this.control_keys['a'];
		this.movingRight = this.control_keys['d'];
		this.movingUp    = this.control_keys['w'];
		this.movingDown  = this.control_keys['s'];
    movingForward = this.control_keys[' '];
    
    //MOVIMENTO
    let moveVec = glMatrix.vec3.create();
    if(this.movingUp) glMatrix.vec3.add(moveVec, moveVec, glMatrix.vec3.fromValues(0.0, -deltaV, 0.0));
    else if(this.movingDown) glMatrix.vec3.add(moveVec, moveVec, glMatrix.vec3.fromValues(0.0, deltaV, 0.0));
    if(this.movingRight) glMatrix.vec3.add(moveVec, moveVec, glMatrix.vec3.fromValues(-deltaV, 0.0, 0.0));
    else if(this.movingLeft) glMatrix.vec3.add(moveVec, moveVec, glMatrix.vec3.fromValues(deltaV, 0.0, 0.0));
    if(movingForward) glMatrix.vec3.add(moveVec, moveVec, glMatrix.vec3.fromValues(0.0, 0.0, 2.5*deltaV));

    var transformMatrix = glMatrix.mat4.fromTranslation(
      glMatrix.mat4.create(),
      moveVec
    );
    glMatrix.mat4.mul(
      this.frame,
      transformMatrix,
      this.frame  
    );
    
    
    //ROTAZIONE
    var x_shift = this.mouse_shift['x'] - this.mouse_shift['prevX'];
    var y_shift = this.mouse_shift['y'] - this.mouse_shift['prevY'];
    this.mouse_shift['prevX'] = this.mouse_shift['x'];
    this.mouse_shift['prevY'] = this.mouse_shift['y'];
    //vertical (ruota il frame dall'alto verso il basso attorno al suo asse x)
    transformMatrix = glMatrix.mat4.fromRotation(
      glMatrix.mat4.create(),
      y_shift/100,
      [1, 0, 0]
    );
    glMatrix.mat4.mul(
      this.frame,
      transformMatrix,
      this.frame
    );
    //horizontal (ruota il frame intorno ad un asse che punta sempre verso il basso in spazio mondo)
    this.downVec = glMatrix.vec3.transformMat4(this.downVec, this.downVec, transformMatrix); 
    this.downVec = glMatrix.vec3.normalize(this.downVec, this.downVec);
    transformMatrix = glMatrix.mat4.fromRotation(
      transformMatrix,
      x_shift/150,
      this.downVec
    );
    glMatrix.mat4.mul(
      this.frame,
      transformMatrix,
      this.frame
    );
  }
  this.matrix = function(){
    return this.frame;
  };
}

//view matrix che rappresenta i fanali
HeadlightFrame = function(){
  //matrice del frame dei fanali
  this.frame = glMatrix.mat4.create();
  //aggiorna il frame in base al frame della macchina
  this.update = function(car_frame){
    this.frame = car_frame.slice();
  }
  //restituisce la matrice di questo frame
  this.matrix = function(){
    let eye = glMatrix.vec3.create();     //posizione del fanale
    let target = glMatrix.vec3.create();  //posizione guardata
    glMatrix.vec3.transformMat4(  
    eye,                                  
    [0.0, 2.0, -1.0 ,1.0],               
    this.frame                            
  );
  glMatrix.vec3.transformMat4(   
    target,                               
    [0.0, 0.0, -5.0, 1.0],                
    this.frame                            
  );
    return glMatrix.mat4.lookAt(  
      glMatrix.mat4.create(),     
      eye,                       
      target,                     
      [0, 1, 0]                           //up                 
    );	
  }
}

//follow up camera
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
    
    glMatrix.vec3.transformMat4(eye, [0, 50, 0], this.frame);
    glMatrix.vec3.transformMat4(target, [0.0, 0.0, 0.0, 1.0], this.frame);
    glMatrix.vec4.transformMat4(up, [0.0, 0.0, -1.0, 0.0], this.frame);
    
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
      [0.0, 3.0, 12.0 ,1.0],      //eye position
      this.frame                  //takes the 4-th column of this matrix
    );
    glMatrix.vec3.transformMat4(  //create the matrix rep. the frame with center in our car
      target,                     //output (point viewer is looking at)
      [0.0, 0.0, 0.0, 1.0],       //position
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
Renderer.cameras.push(new MovingCamera()); //EDIT : added moving camera
// set the camera currently in use
Renderer.currentCamera = 0;

//create the headlight "camera"
Renderer.headlight = new HeadlightFrame();

//EDIT : framebuffer for depth computation (on depth texture)
Renderer.depthFrameBuffer = null;

//creates a texture with mipmap
Renderer.createTexture = function(gl, textureData) {
  var texture = gl.createTexture();
  texture.image = new Image();
  texture.image.crossOrigin = "anonymous";
  texture.image.onload = function(){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  texture.image.src = textureData;
  return texture;
}

//creates the headlight texture
Renderer.createHeadlightTexture = function(gl, textureData) {
  var texture = gl.createTexture();
  texture.image = new Image();
  texture.image.crossOrigin = "anonymous";
  texture.image.onload = function(){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  texture.image.src = textureData;
  return texture;
}

//EDIT : creates the depth texture (for depth framebuffer)
Renderer.createDepthTexture = function(gl){
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,      // target
    0,                  // mip level
    gl.DEPTH_COMPONENT, // internal format
    512,                // width
    512,                // height
    0,                  // border
    gl.DEPTH_COMPONENT, // format
    gl.UNSIGNED_INT,    // type
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);  

  return texture;
}
//EDIT : creates the color texture (for depth framebuffer)
Renderer.createColorTexture = function(gl){
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    512,
    512,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
}

//EDIT : create framebuffer for depth texture (headlight's shadowmap)
Renderer.createDepthFrameBuffer = function(gl){
  Renderer.depthFrameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, Renderer.depthFrameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, Renderer.textures.colorTexture, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, Renderer.textures.depthTexture, 0);
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.log("The created frame buffer is invalid: " + status.toString());
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

//creates buffers for js geometric primitive objects
Renderer.createObjectBuffers = function (gl, obj) {

  //crea vertexbuffer
  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  //crea buffer per gli indici dei triangoli
  obj.indexBufferTriangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  //create edges
  var edges = new Uint16Array(obj.numTriangles * 3 * 2);
  for (var i = 0; i < obj.numTriangles; ++i) {
    edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
    edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
  }

  //crea buffer per indici degli edges
  obj.indexBufferEdges = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  //crea buffer per le normali in object space
  if(obj.hasOwnProperty('normals')){
    obj.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  //crea buffer per le coordinate texture
  if(obj.hasOwnProperty('texCoords')){
    obj.textureCoordinatesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordinatesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.texCoords, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

};

//draws objects with specific buffers
Renderer.drawObject = function (gl, obj, shader, fillColor) {
  //vertex position attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(shader.aPositionIndex);
  gl.vertexAttribPointer(shader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);
  //normals attribute
  if(shader.aNormalIndex && obj.normalBuffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.enableVertexAttribArray(shader.aNormalIndex);
    gl.vertexAttribPointer(shader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
  }
  //texture coords attribute
  if(shader.aTextureCoordinatesIndex && obj.textureCoordinatesBuffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordinatesBuffer);
    gl.enableVertexAttribArray(shader.aTextureCoordinatesIndex);
    gl.vertexAttribPointer(shader.aTextureCoordinatesIndex, 2, gl.FLOAT, false, 0, 0);
  }
  //fill color uniform
  if(shader.uColorLocation && fillColor){
    gl.uniform4fv(shader.uColorLocation, fillColor);
  }
  
  //draw
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  //draw edges
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.uniform4fv(shader.uColorLocation, new Float32Array([0.0, 0.0, 0.0, 1.0]));
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

  //resets buffer binding
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(shader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

//draws objects on depth framebuffer with a simple shader
Renderer.drawShadowObject = function(gl, obj, color = [1.0, 0.3, 0.0, 1.0]){
  //use simple shader
  gl.useProgram(Renderer.shadowMapShader);
  //vertex position attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(Renderer.shadowMapShader.aPositionIndex);
  gl.vertexAttribPointer(Renderer.shadowMapShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);
  //fill color (per debug)
  gl.uniform4fv(Renderer.shadowMapShader.uColorLocation, new Float32Array(color));
  //disegna
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
};

/*
initialize the object in the scene
*/
Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");
  Renderer.triangle = new Triangle();

  //macchina
  this.beatle = loadOnGPU_modified(gl, beatle);
  
  //cubo (per debug)
  this.cube = new Cylinder(10);
  ComputeNormals(this.cube);
  this.createObjectBuffers(gl, this.cube);

  //cilindro per le ruote
  this.cylinder = new Cylinder(10);
  ComputeNormals(this.cylinder);
  this.createObjectBuffers(gl,this.cylinder );

  Renderer.createObjectBuffers(gl, this.triangle);

  //strada
  Renderer.createObjectBuffers(gl,Game.scene.trackObj);
  //terreno
  Renderer.createObjectBuffers(gl,Game.scene.groundObj);
  //edifici
  for (var i = 0; i < Game.scene.buildings.length; ++i){ 
	  Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i]);
	  Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i].roof);
  }
  //lampioni
  for(var i = 0; i < Game.scene.lampsObj.length; i++){
    Renderer.createObjectBuffers(gl, Game.scene.lampsObj[i]);
  }
};



//angolo di rotazione corrente per le ruote
var wheelsRotationAngleFront = 0.0;
var wheelsRotationAngleBack = 0.0;
//proporzione della differenza delle dimensioni delle ruote
const wheelsScaleRatio = 1.5; //for back wheels

//draw the car
Renderer.drawCar = function (gl) {
    //inizializza matrici
    M                 = glMatrix.mat4.create();
    rotate_transform  = glMatrix.mat4.create();
    translate_matrix  = glMatrix.mat4.create();
    scale_matrix      = glMatrix.mat4.create();

    //CAR MODEL MATRIX
    //scalatura e centramento
    glMatrix.mat4.fromScaling(scale_matrix, [0.2, 0.2, 0.2]);
    glMatrix.mat4.fromTranslation(translate_matrix, [-0.32, 1.0, 0]);
    glMatrix.mat4.mul(M, scale_matrix, translate_matrix);
    //campovolgimento
    glMatrix.mat4.fromRotation(rotate_transform, Math.PI, [0, 1, 0]);
    glMatrix.mat4.mul(M, rotate_transform, M);

    Renderer.stack.push();
    Renderer.stack.multiply(M);

    //SETUP UNIFORMS
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix);
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

    //DRAW CAR BODY
    this.drawObject(gl,this.beatle,this.shader, [0.3,0.6,0.7,1.0], false);
    Renderer.stack.pop();

    //WHEELS MODEL MATRIX
    Mw = glMatrix.mat4.create(); //contiene le trasformazioni di base dei cilindri
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2.0,[0,0,1]);  //in orizzontale
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);        //elevati da terra
    glMatrix.mat4.fromScaling(scale_matrix,[0.1,0.2,0.2]);          //riduce la dimensione del tronco
    glMatrix.mat4.mul(Mw,translate_matrix,rotate_transform);        
    glMatrix.mat4.mul(Mw,scale_matrix,Mw);
    
    //ROTAZIONE RUOTE (speed based)
    //si resettano raggiunti 360°
    wheelsRotationAngleFront = (wheelsRotationAngleFront + this.car.speed) % (2*Math.PI); 
    wheelsRotationAngleBack = (wheelsRotationAngleBack + this.car.speed/wheelsScaleRatio) % (2*Math.PI);
    
    //rotazione ruote frontali
    MwF = glMatrix.mat4.create(); //contiene le trasformazioni per  ruotare i cilindri per il movimento (solo ruote davanti)
    //rotazione per velocità
    glMatrix.mat4.fromRotation(rotate_transform,  wheelsRotationAngleFront, [-1, 0, 0]);
    glMatrix.mat4.mul(MwF, rotate_transform, Mw);
    //rotazione per curvatura
    glMatrix.mat4.fromRotation(rotate_transform, this.car.wheelsAngle*Math.PI, [0, 1, 0]); 
    glMatrix.mat4.mul(MwF, rotate_transform, MwF);

    //DRAW FRONT-LEFT WHEEL
    glMatrix.mat4.identity(M);
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwF);
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    //uniforms
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix);
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);
    //disegno
    this.drawObject(gl, this.cylinder, this.shader, [1.0,0.6,0.5,1.0], true);
    Renderer.stack.pop();

    //DRAW FRONT-RIGHT WHEEL
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwF);
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    //uniforms
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix);     
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);
    //disegno
    this.drawObject(gl,this.cylinder, this.shader, [1.0,0.6,0.5,1.0], true);
    Renderer.stack.pop();

    //DRAW BACK WHEELS
    //ingrandimento ruote posteriori
    glMatrix.mat4.fromScaling(scale_matrix,[1,wheelsScaleRatio,wheelsScaleRatio]);;
    glMatrix.mat4.mul(Mw,scale_matrix,Mw); //scala la model delle ruote

    //rotazione ruote posteriori (solo speed based)
    MwB = glMatrix.mat4.create(); //contiene la trasformazione di rotazione per le ruote posteriori
    glMatrix.mat4.fromRotation(rotate_transform, wheelsRotationAngleBack, [-1, 0, 0]);
    glMatrix.mat4.mul(MwB, rotate_transform, Mw);
    
    //DRAW FRONT-LEFT WHEEL
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.25,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwB); //EDIT : replace MwB with Mw
    //uniform
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);
    //disegno
    this.drawObject(gl, this.cylinder, this.shader, [1.0,0.6,0.5,1.0], true);
    Renderer.stack.pop();

    //DRAW FRONT-RIGHT WHEEL
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.3,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwB);
    //uniform
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);
    //disegno
    this.drawObject(gl, this.cylinder, this.shader, [1.0,0.6,0.5,1.0], false);
    Renderer.stack.pop();
};


//draws all the scene (car and world)
Renderer.drawScene = function (gl) {
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  

  //setup viewport
  var width = this.canvas.width;
  var height = this.canvas.height
  var ratio = width / height;
  this.stack = new MatrixStack();

  gl.viewport(0, 0, width, height);

  // Clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup shader
  gl.useProgram(this.shader);

  //EDIT : depth texture uniform
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, this.textures.depthTexture);
  gl.uniform1i(this.shader.uDepthTextureLocation, 2);

  //setup uniform for perspective matrix
  gl.uniformMatrix4fv(
    this.shader.uProjectionMatrixLocation,
    false,
    glMatrix.mat4.perspective(glMatrix.mat4.create(), 3.14 / 4, ratio, 1, 500)
  );

  //updates camera position
  Renderer.cameras[Renderer.currentCamera].update(this.car.frame);
  //get inverse of view frame
  var invV = Renderer.cameras[Renderer.currentCamera].matrix();
  //initialize the stack with the identity
  this.stack.loadIdentity();
  //multiply by the view matrix
  this.stack.multiply(invV);

  //Renderer.headlight.update(this.car.frame); //done in drawShadowScene
  //view matrix dei fanali
  var headlightViewMatrix = Renderer.headlight.matrix(); 
  //scalebias dei fanali -> porta le coordinate della texture proiettata dei fanali in [0, 1], [0, 1]
  var scaleBias = glMatrix.mat4.mul(
    glMatrix.mat4.create(),
    glMatrix.mat4.fromTranslation(
      glMatrix.mat4.create(),
      glMatrix.vec3.fromValues(0.5, 0.5, 0.5)
    ),
    glMatrix.mat4.fromScaling(
      glMatrix.mat4.create(),
      glMatrix.vec3.fromValues(0.5, 0.5, 0.5)
    ),
  );
  //proiezione dei fanali
  var headlightProjectionMatrix = glMatrix.mat4.perspective(
    glMatrix.mat4.create(),
    1.4,
    0.8,
    1, 
    100
  );
  //scalebias * projection * view dei fanali
  var toHeadlightSpaceMatrix = glMatrix.mat4.mul(glMatrix.mat4.create(), scaleBias, headlightProjectionMatrix);
  toHeadlightSpaceMatrix = glMatrix.mat4.mul(glMatrix.mat4.create(), toHeadlightSpaceMatrix, headlightViewMatrix);
  
  
  //setup directional light direction uniform
  var lightDirection = glMatrix.vec4.fromValues(Game.scene.weather.sunLightDirection[0], Game.scene.weather.sunLightDirection[1], Game.scene.weather.sunLightDirection[2], 0.0);
  var lightDirectionViewSpace = glMatrix.vec4.create();
  glMatrix.vec4.transformMat4(lightDirectionViewSpace, lightDirection, invV); //light direction in view space
  glMatrix.vec4.normalize(lightDirectionViewSpace, lightDirectionViewSpace);
  gl.uniform4fv(
    this.shader.uLightDirectionLocation,
    lightDirectionViewSpace
  );
  //setup directional light color uniform
  gl.uniform3fv(
    this.shader.uLightColorLocation,
    new Float32Array([1.0, 1.0, 1.0])
  );

  //setup uniform posizioni lampioni in view space
  for(var i = 0; i < Game.scene.lamps.length; i++){
    var lampPosition = glMatrix.vec4.fromValues(Game.scene.lamps[i].position[0], Game.scene.lamps[i].height+1.0, Game.scene.lamps[i].position[2], 1.0);
    lampPosition = glMatrix.vec4.transformMat4(lampPosition, lampPosition, invV);
    gl.uniform4fv(
      this.shader.uSpotlightsPositionLocation[i],
      lampPosition
    );
  }
  //setup uniform direzione luce lampioni in view space
  var lampDirection = glMatrix.vec4.fromValues(0.0, -1.0, 0.0, 0.0);
  lampDirection = glMatrix.vec4.transformMat4(lampDirection, lampDirection, invV);
  lampDirection = glMatrix.vec4.normalize(lampDirection, lampDirection);
  gl.uniform4fv(this.shader.uSpotlightsDirectionLocation, lampDirection);    
  //setup uniform colore luce lampioni
  gl.uniform4fv(this.shader.uSpotlightsColorLocation, new Float32Array([0.7, 0.3, 0.7, 1.0]));

  //uniform : do not compute headlights on car (non serve perchè la macchina è sempre dietro i propri fari)
  gl.uniform1i(this.shader.uComputeHeadlightLocation, 0);
  //unfirom : untextured car and wheels (non hanno una texture :c )
  gl.uniform1i(this.shader.uUntexturedLocation, 1);  
  
  //drawing the car
  this.stack.push();
  this.stack.multiply(this.car.frame);
  this.drawCar(gl);
  this.stack.pop();

  //setup uniform : modelview del resto degli oggetti
  gl.uniformMatrix4fv(
    this.shader.uModelViewMatrixLocation, 
    false, 
    this.stack.matrix
  );
  
  //setup uniform : compute headlights on the rest of the scene
  gl.uniform1i(this.shader.uComputeHeadlightLocation, 1);
  gl.uniformMatrix4fv(this.shader.uToHeadlightSpaceLocation, false, toHeadlightSpaceMatrix);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, this.textures.headlight);
  gl.uniform1i(this.shader.uHeadlightTextureLocation, 1);

  //setup unifrom : normali degli oggetti in view space
  gl.uniformMatrix4fv(
    this.shader.uNormalMatrixLocation, 
    false, 
    this.stack.inverseTranspose
  ); 

  //draw lamps
  for(var i in Game.scene.lampsObj) this.drawObject(gl, Game.scene.lampsObj[i], this.shader, [0.2, 0.2, 0.4, 1.0], true);

  //draw grass with texture
  gl.uniform1i(this.shader.uUntexturedLocation, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.textures.grass);
  gl.uniform1i(this.shader.uTexture, 0);
	this.drawObject(gl, Game.scene.groundObj, this.shader, [0.3, 0.7, 0.2, 1.0], true);

  //draw street with texture
  gl.bindTexture(gl.TEXTURE_2D, this.textures.street);
  gl.uniform1i(this.shader.uTexture, 0);
  this.drawObject(gl, Game.scene.trackObj, this.shader, [0.9, 0.8, 0.7, 1.0], true);
	for (var i in Game.scene.buildingsObj) {
    //draw buildings with texture
    if(i%3 == 0) {
      gl.bindTexture(gl.TEXTURE_2D, this.textures.facade1);
    }
    else if (i%3 == 1){
      gl.bindTexture(gl.TEXTURE_2D, this.textures.facade2);
    }
    else {
      gl.bindTexture(gl.TEXTURE_2D, this.textures.facade3);
    }
    gl.uniform1i(this.shader.uTexture, 0);  
		this.drawObject(gl, Game.scene.buildingsObjTex[i], this.shader, [0.8, 0.8, 0.8, 1.0], true);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.roof);
    gl.uniform1i(this.shader.uTexture, 0); 
		this.drawObject(gl, Game.scene.buildingsObjTex[i].roof, this.shader, [0.8, 0.8, 0.8, 1.0], true);
  }
  
  gl.useProgram(null);
};

//EDIT : disegna tutta la scena nel depthFramebuffer e calcola la depth scrivendola in depthTexure 
Renderer.drawShadowScene = function (gl) {
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  //BIND FRAMEBUFFER FOR DEPTH
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
  gl.viewport(0, 0, 512, 512); //depth texture size
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //projection matrix
  var pm = glMatrix.mat4.perspective(
    glMatrix.mat4.create(),
    1.4, 
    0.8, 
    1, 
    100
  );

  //updates headlight frame
  this.headlight.update(this.car.frame);
  //view matrix (headlights pov)
  var vm = this.headlight.matrix();
  
  //use simple shader
  gl.useProgram(this.shadowMapShader);

  //setup uniform for view and projection matrix
  gl.uniformMatrix4fv(
    this.shadowMapShader.uProjectionMatrixLocation,
    false,
    pm
  );
  gl.uniformMatrix4fv(
    this.shadowMapShader.uModelViewMatrixLocation,
    false,
    vm
  );

  //non c'è bisogno di disegnare la macchina visto che non viene colpita dai propri fanali

  //draw lamps
  for(var i in Game.scene.lampsObj)
    this.drawShadowObject(gl, Game.scene.lampsObj[i], [0.2, 0.2, 0.4, 1.0], true);
  
  //draw ground
	this.drawShadowObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], true);

  //draw street with texture
  this.drawShadowObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], true);
	
  //draw buildings
  for (var i in Game.scene.buildingsObj) {
		this.drawShadowObject(gl, Game.scene.buildingsObjTex[i], [0.8, 0.8, 0.8, 1.0], true);
		this.drawShadowObject(gl, Game.scene.buildingsObjTex[i].roof, [0.8, 0.8, 0.8, 1.0], true);
  }
  //resets framebuffer and shader
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(null);
};


Renderer.Display = function () {
  Renderer.drawShadowScene(Renderer.gl);
  Renderer.drawScene(Renderer.gl);
  window.requestAnimationFrame(Renderer.Display);
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

  //checks if depth_texture extension is enabled
  var extension = Renderer.gl.getExtension('WEBGL_depth_texture');
  if (!extension) return alert('WEBGL_depth_texture extension is not supported on your browser');
  
  /* create the matrix stack */
	Renderer.stack = new MatrixStack();

  /* initialize objects to be rendered */
  Renderer.initializeObjects(Renderer.gl);

  /* create the shader */
  Renderer.shader = new projectiveShader3(Renderer.gl, Game.scene.lamps.length);
  Renderer.shadowMapShader = new uniformShader(Renderer.gl);

  //initialize textures
  Renderer.textures = {
    Dtex : Renderer.createTexture(Renderer.gl, "https://localhost:8080/Dtexture.png"),
    facade1 : Renderer.createTexture(Renderer.gl, "https://localhost:8080/facade1.jpg"),
    facade2 : Renderer.createTexture(Renderer.gl, "https://localhost:8080/facade2.jpg"),
    facade3 : Renderer.createTexture(Renderer.gl, "https://localhost:8080/facade3.jpg"),
    roof : Renderer.createTexture(Renderer.gl, "https://localhost:8080/roof.jpg"),
    grass : Renderer.createTexture(Renderer.gl, "https://localhost:8080/grass_tile.png"),
    street : Renderer.createTexture(Renderer.gl, "https://localhost:8080/street4.png"),
    car : Renderer.createTexture(Renderer.gl, "https://localhost:8080/car_texture.png"),
    lamp : Renderer.createTexture(Renderer.gl, "https://localhost:8080/lamp_texture.png"),
    headlight : Renderer.createHeadlightTexture(Renderer.gl, "https://localhost:8080/headlight.png"),
    depthTexture : Renderer.createDepthTexture(Renderer.gl), //EDIT : added depth texture
    colorTexture : Renderer.createColorTexture(Renderer.gl), //EDIT : added color texture
  };

  //EDIT : initialize framebuffers 
  depthFrameBuffer = Renderer.gl.createFramebuffer();
  Renderer.createDepthFrameBuffer(Renderer.gl);
  
  //add listeners for the mouse / keyboard events
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);   //EDIT : controls for moving camera
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);
  Renderer.canvas.addEventListener('mousedown', on_mouseDown, false); //EDIT : added controls for moving camera

  Renderer.Display();
}

on_mouseMove = function(e){ //EDIT : controls for moving camera
  if(Renderer.currentCamera != 2) return; 
  if(e.buttons != 1) return;
  Renderer.cameras[2].mouse_shift['x'] = e.clientX;
  Renderer.cameras[2].mouse_shift['y'] = e.clientY;

}

on_mouseDown = function(e){ //EDIT : controls for moving camera
  if(Renderer.currentCamera != 2) return;
  if(e.button == 0){ 
    Renderer.cameras[2].mouse_shift['x'] = e.clientX;
    Renderer.cameras[2].mouse_shift['y'] = e.clientY;
    Renderer.cameras[2].mouse_shift['prevX'] = e.clientX;
    Renderer.cameras[2].mouse_shift['prevY'] = e.clientY;
  }
}

on_keyup = function(e){
	Renderer.car.control_keys[e.key] = false;

  //EDIT : MOVING CAMERA
  Renderer.cameras[2].control_keys[e.key] = false;
}
on_keydown = function(e){
  if(Renderer.currentCamera != 2) //EDIT : Stop listening to car inputs
	  Renderer.car.control_keys[e.key] = true;

  //EDIT : MOVING CAMERA
  if(Renderer.currentCamera != 2) return;
  Renderer.cameras[2].control_keys[e.key] = true;
}

window.onload = Renderer.setupAndStart;


update_camera = function (value){
  Renderer.currentCamera = value;
}




