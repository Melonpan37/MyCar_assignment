
//EDIT : frame dei fanali
HeadlightFrame = function(){
  this.frame = [0, 0, 0];
  this.update = function(car_frame){
    this.frame = car_frame.slice();
  }
  this.matrix = function(){
    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();
    glMatrix.vec3.transformMat4(  //create the matrix that represents the viewer frame
    eye,                         //output (viewer's position)
    [0.0, 2.0, -1.0 ,1.0],       //position vector
    this.frame                   //takes the 4-th column of this matrix
  );
  glMatrix.vec3.transformMat4(   //create the matrix rep. the frame with center in our car
    target,                      //output (point viewer is looking at)
    [0.0, 0.0, -5.0, 1.0],       //point [0, 0, 0] in normalized coordinates
    this.frame                   //takes the 4-th column of this matrix 
  );
    return glMatrix.mat4.lookAt(  //returns the lookAt matrix (frame)
      glMatrix.mat4.create(),     //output 
      eye,                        //viewer position
      target,                     //point viewer is looking at
      [0, 1, 0]                   //up direction
    );	
  }
}

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
    
    glMatrix.vec3.transformMat4(eye, [0  ,50,0], this.frame);
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

//EDIT : inizializzazione frame dei fanali
Renderer.headlight = new HeadlightFrame();

//EDIT : funzione di inizializzazione delle textures
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

//EDIT : funzione che crea la texture (da proiettare) dei fanali
Renderer.createHeadlightTexture = function(gl, textureData) {
  var texture = gl.createTexture();
  texture.image = new Image();
  texture.image.crossOrigin = "anonymous";
  texture.image.onload = function(){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  texture.image.src = textureData;
  return texture;
}

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

  if(obj.hasOwnProperty('normals')){
    obj.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  if(obj.hasOwnProperty('texCoords')){
    obj.textureCoordinatesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordinatesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.texCoords, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

};


Renderer.drawObject = function (gl, obj, shader, fillColor) {
  //vertex position
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(this.shader.aPositionIndex);
  gl.vertexAttribPointer(this.shader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);
  //normals
  if(shader.aNormalIndex && obj.normalBuffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.enableVertexAttribArray(this.shader.aNormalIndex);
    gl.vertexAttribPointer(this.shader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
  }
  //texture coords
  if(shader.aTextureCoordinatesIndex && obj.textureCoordinatesBuffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.textureCoordinatesBuffer);
    gl.enableVertexAttribArray(shader.aTextureCoordinatesIndex);
    gl.vertexAttribPointer(shader.aTextureCoordinatesIndex, 2, gl.FLOAT, false, 0, 0);
  }
  //fill color (uniform)
  if(shader.uColorLocation && fillColor){
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
    gl.uniform4fv(this.shader.uColorLocation, fillColor);
  }

  //draw
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  //draw edges
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.uniform4fv(this.shader.uColorLocation, new Float32Array([0.0, 0.0, 0.0, 1.0]));
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

  //resets buffer binding
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(this.shader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};


//initializes objects in the scene
Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");
  Renderer.triangle = new Triangle();

  //car object declaration
  this.beatle = loadOnGPU_modified(gl, beatle);

  this.cylinder = new Cylinder(10);
  ComputeNormals(this.cylinder);
  this.createObjectBuffers(gl,this.cylinder );

  Renderer.createObjectBuffers(gl, this.triangle);

  Renderer.createObjectBuffers(gl,Game.scene.trackObj);
  Renderer.createObjectBuffers(gl,Game.scene.groundObj);
  for (var i = 0; i < Game.scene.buildings.length; ++i){ 
	  Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i]);
	  Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i].roof);
  }

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
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

    //draw car body
    this.drawObject(gl,this.beatle,this.shader, [0.3,0.6,0.7,1.0], false); //with edges

    Renderer.stack.pop();

    //model matrix per le trasformazioni base delle ruote
    Mw = glMatrix.mat4.create();
    //setup wheels base position
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2.0,[0,0,1]);
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
    glMatrix.mat4.fromScaling(scale_matrix,[0.1,0.2,0.2]);
    glMatrix.mat4.mul(Mw,translate_matrix,rotate_transform);
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
    //DRAW WHEEL : FRONT-LEFT
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwF); //EDIT : replace MwF with Mw
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix);
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

    this.drawObject(gl, this.cylinder, this.shader, [1.0,0.6,0.5,1.0], true);
    Renderer.stack.pop();

    //DRAW WHEEL : FRONT-RIGHT
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwF); //EDIT : as up ^
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix);     
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

    this.drawObject(gl,this.cylinder, this.shader, [1.0,0.6,0.5,1.0], true);
    Renderer.stack.pop();

    //ingrandisci ruote posteriori
    glMatrix.mat4.fromScaling(scale_matrix,[1,wheelsScaleRatio,wheelsScaleRatio]);;
    glMatrix.mat4.mul(Mw,scale_matrix,Mw);

    //ROTATE WHEELS (posteriori -> solo speed based)
    MwB = glMatrix.mat4.create()
    glMatrix.mat4.fromRotation(rotate_transform, wheelsRotationAngleBack, [-1, 0, 0]);
    glMatrix.mat4.mul(MwB, rotate_transform, Mw);
    
    //DRAW WHEEL : BACK-LEFT
    //spostamento
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.25,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,MwB); //EDIT : replace MwB with Mw
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix); 
    gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);
    
    this.drawObject(gl, this.cylinder, this.shader, [1.0,0.6,0.5,1.0], true);
    Renderer.stack.pop();

    //DRAW WHEEL : BACK-RIGHT
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
  //setup viewport
  var width = this.canvas.width;
  var height = this.canvas.height
  var ratio = width / height;
  this.stack = new MatrixStack();


  gl.viewport(0, 0, width, height);
  
  gl.enable(gl.DEPTH_TEST);

  //Clear the framebuffer
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

  //updates camera position
  Renderer.cameras[Renderer.currentCamera].update(this.car.frame);
  //get inverse of view frame
  var invV = Renderer.cameras[Renderer.currentCamera].matrix();
  //initialize the stack with the identity
  this.stack.loadIdentity();
  //multiply by the view matrix
  this.stack.multiply(invV);


  //EDIT : calcolo uniform associati all'headlight frame
  Renderer.headlight.update(this.car.frame); //update dell'headlight frame
  var headlightViewMatrix = Renderer.headlight.matrix();  //viewmatrix dei fanali
  var scaleBias = glMatrix.mat4.mul(    //matrice che porta le coordinate proiettate dei fari in [0, 1]
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
  var headlightProjectionMatrix = glMatrix.mat4.perspective(  //projectionmatrix dei fanali
    glMatrix.mat4.create(),
    1.4,
    0.8,
    1, 
    100
  );
  //scalebias * projection * view dei fanali (soprannominato headlightspace)
  var toHeadlightSpaceMatrix = glMatrix.mat4.mul(glMatrix.mat4.create(), scaleBias, headlightProjectionMatrix);
  toHeadlightSpaceMatrix = glMatrix.mat4.mul(glMatrix.mat4.create(), toHeadlightSpaceMatrix, headlightViewMatrix);

  //setup directional light uniforms
  var lightDirectionViewSpace = glMatrix.vec4.create();
  var lightDirection = glMatrix.vec4.fromValues(Game.scene.weather.sunLightDirection[0], Game.scene.weather.sunLightDirection[1], Game.scene.weather.sunLightDirection[2], 0.0);
  glMatrix.vec4.transformMat4(lightDirectionViewSpace, lightDirection, invV);
  glMatrix.vec4.normalize(lightDirectionViewSpace, lightDirectionViewSpace);
  gl.uniform4fv(
    this.shader.uLightDirectionLocation,
    lightDirectionViewSpace
  );
  gl.uniform3fv(
    this.shader.uLightColorLocation,
    new Float32Array([1.0, 1.0, 1.0])
  );

  //lamp position uniform
  for(var i = 0; i < Game.scene.lamps.length; i++){
    var lampPosition = glMatrix.vec4.fromValues(Game.scene.lamps[i].position[0], Game.scene.lamps[i].height+1.0, Game.scene.lamps[i].position[2], 1.0);
    lampPosition = glMatrix.vec4.transformMat4(lampPosition, lampPosition, invV);
    gl.uniform4fv(
      this.shader.uSpotlightsPositionLocation[i],
      lampPosition
    );
  }
  //lamp spotlight light direction uniform
  var lampDirection = glMatrix.vec4.fromValues(0.0, -1.0, 0.0, 0.0);
  lampDirection = glMatrix.vec4.transformMat4(lampDirection, lampDirection, invV);
  lampDirection = glMatrix.vec4.normalize(lampDirection, lampDirection);
  gl.uniform4fv(this.shader.uSpotlightsDirectionLocation, lampDirection);    
  //lamps color uniform
  gl.uniform4fv(this.shader.uSpotlightsColorLocation, new Float32Array([0.7, 0.3, 0.7, 1.0]));

  //EDIT : do not compute headlights on car
  gl.uniform1i(this.shader.uComputeHeadlightLocation, 0);
  //EDIT : untextured car and wheels
  gl.uniform1i(this.shader.uUntexturedLocation, 1);  
  
  // drawing the car
  this.stack.push();
  this.stack.multiply(this.car.frame);

  this.drawCar(gl);
  this.stack.pop();

  //modelview to draw rest of the scene
  gl.uniformMatrix4fv(
    this.shader.uModelViewMatrixLocation, 
    false, 
    this.stack.matrix
  );
  
  //EDIT : compute headlights on the rest of the scene -> set headlight texture
  gl.uniform1i(this.shader.uComputeHeadlightLocation, 1);
  gl.uniformMatrix4fv(this.shader.uViewSpaceToHeadlightSpaceLocation, false, toHeadlightSpaceMatrix);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, this.textures.headlight);
  gl.uniform1i(this.shader.uHeadlightTextureLocation, 1);

  //uniform for normal in view space
  gl.uniformMatrix4fv(this.shader.uNormalMatrixLocation, false, this.stack.inverseTranspose);

  //draw lamps
  for(var i in Game.scene.lampsObj)
    this.drawObject(gl, Game.scene.lampsObj[i], this.shader, [0.2, 0.2, 0.4, 1.0], true);
  
  //EDIT : draw grass with texture
  gl.uniform1i(this.shader.uUntexturedLocation, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.textures.grass);
  gl.uniform1i(this.shader.uTexture, 0);
	this.drawObject(gl, Game.scene.groundObj, this.shader, [0.3, 0.7, 0.2, 1.0], true);

  //EDIT : draw street with texture
  gl.bindTexture(gl.TEXTURE_2D, this.textures.street);
  gl.uniform1i(this.shader.uTexture, 0);
  this.drawObject(gl, Game.scene.trackObj, this.shader, [0.9, 0.8, 0.7, 1.0], true);
	for (var i in Game.scene.buildingsObj) {
    //EDIT : draw buildings with texture
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
  Renderer.shader = new projectiveShader(Renderer.gl, Game.scene.lamps.length);
  Renderer.uniformShader = new uniformShader(Renderer.gl);

  
  //add listeners for the mouse / keyboard events
  
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);

  //EDIT : init textures
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
  };

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

