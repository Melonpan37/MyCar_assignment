uniformShader = function (gl) {
  var vertexShaderSource = `
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;              
    attribute vec3 aPosition;         
             
    void main(void)                                
    {                                              
      gl_Position = uProjectionMatrix *            
      uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;                           
    void main(void)                                
    {                                              
      gl_FragColor = vec4(uColor);                 
    }                                             
  `;

  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the shader program
  var aPositionIndex = 0;
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    var str = "Unable to initialize the shader program.n";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }

  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");

  return shaderProgram;
};



projectiveShader = function (gl, nlamps) {
  var vertexShaderSource = `
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;              
    uniform   mat4 uNormalMatrix;
    attribute vec3 aPosition;         
    attribute vec3 aNormal;
    varying   vec3 vViewSpaceNormal;
    varying   vec3 vViewSpaceFragmentPosition;
    
    //EDIT : coordinate texture
    attribute vec2 aTextureCoordinates;
    varying   vec2 vTextureCoordinates;

    //edit : matrice che porta le coordinate di un punto in headlight space (in [0, 1])
    uniform  mat4 uViewSpaceToHeadlightSpace;
    varying  vec4 vHeadlightSpaceTextureCoordinates;
    uniform  int uComputeHeadlight;

    //debug
    varying float bug;
    
    
    void main(void)                                
    { 
      //debugging            
      bug = 0.0;

      //normal in view space
      vViewSpaceNormal = normalize(mat3(uNormalMatrix) * aNormal);

      //interpolates fragment position in view space
      vViewSpaceFragmentPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0)); 
                                       
      //texture coordinates
      vTextureCoordinates = aTextureCoordinates;

      //calcola headlightSpace coordinates
      if(uComputeHeadlight == 1){
        vHeadlightSpaceTextureCoordinates = uViewSpaceToHeadlightSpace * vec4(aPosition, 1.0); //posizione del fragment in headlight space
      }
      else{
        vHeadlightSpaceTextureCoordinates = vec4(0.0, 0.0, 0.0, 0.0);
      }

      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;
    uniform vec4 uLightDirection; //direzione luce diffusa (sole)
    uniform vec3 uLightColor;  //colore luce diffusa
    uniform vec4 uSpotlightsPosition[12]; //posizione spotlights
    uniform vec4 uSpotlightsColor; //colore spotlights
    uniform vec4 uSpotlightsDirection; //normalized and in view space
    varying vec3 vViewSpaceNormal;
    varying vec3 vViewSpaceFragmentPosition;
    const int spotlightsNumber = 12; //numero di luci posizionali (lampioni)
    
    //edit
    uniform sampler2D uTexture; //sampler della texture dell'oggetto
    uniform int uUntextured; //se l'oggetto ha una texture
    varying vec2 vTextureCoordinates; //coordinate della texture interpolate
    varying vec4 vHeadlightSpaceTextureCoordinates; //coordinate fragment in headlightspace
    uniform sampler2D uHeadlightTexture; //texture dei fari
    

    //DEBUG -> rimuovi
    uniform int uDebug;
    varying float bug;

    void main(void)                                
    {               
      float bug_ = bug;   
      
      //colore del texel (inizialmente assegnato a uColor)
      vec3 texelColor = vec3(uColor);
      if(uUntextured == 0) texelColor = vec3(texture2D(uTexture, vTextureCoordinates)); //assegna il colore della texture come colore di base 
      if(vHeadlightSpaceTextureCoordinates.w <= 0.0){
        //se non si calcola la proiezione dei fanali allora non fa nulla (viene assegnata a 0 dal vertex shader)
      } 
      else{
        vec2 headlightTextureCoords = vec2(0.0, 0.0); //coordinate texture degli headlights
        headlightTextureCoords.x = vHeadlightSpaceTextureCoordinates.x/vHeadlightSpaceTextureCoordinates.w; //perspective divide
        headlightTextureCoords.y = vHeadlightSpaceTextureCoordinates.y/vHeadlightSpaceTextureCoordinates.w;
        if( //cut the texture otherwise it will repeat on all the scene
          headlightTextureCoords.x >= 0.0 && headlightTextureCoords.x <= 1.0
          &&
          headlightTextureCoords.y >= 0.0 && headlightTextureCoords.y <= 1.0
          ){ //attenua la luce dei fanali man mano che ci si allontana
            texelColor += 
              4.0/(vHeadlightSpaceTextureCoordinates.w + 0.1) 
              * 0.3 
              * vec3(texture2D(uHeadlightTexture, headlightTextureCoords));
        }

      }
      
      //directional light diffuse
      vec3 N = normalize(vViewSpaceNormal);
      vec3 L = normalize(-uLightDirection.xyz);
      
      float NdotL = max(0.2, dot(N, L));                       
      vec3 lambert = (texelColor * uLightColor) * NdotL;     
      
      //spotlight diffuse
      for(int i = 0; i < spotlightsNumber; i++){
        vec3 spotlightToSurface = normalize(vec3(uSpotlightsPosition[i]) - vViewSpaceFragmentPosition);
        float cosAngle = dot(spotlightToSurface, -uSpotlightsDirection.xyz);
        if(0.5 < cosAngle && cosAngle < 1.0){ //if we are on the spotlight cone
          L = spotlightToSurface;
          NdotL = max(0.0, dot(N, L));
          float cosFactor = 8.0*(cosAngle-0.5)*(cosAngle-0.5);
          lambert += vec3(texelColor)*NdotL*vec3(uSpotlightsColor)*cosFactor;
        }

      }
      
      gl_FragColor  = vec4(lambert, 1.0) ;  
  }

  `;

  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the shader program
  var aPositionIndex = 0;
  var aNormalIndex = 1;
  var aTextureCoordinatesIndex = 2;
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, aNormalIndex, "aNormal");
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    var str = "Unable to initialize the shader program.n";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }

  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.aNormalIndex = aNormalIndex;
  shaderProgram.aTextureCoordinatesIndex = aTextureCoordinatesIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram, "uLightDirection");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram, "uLightColor");
  shaderProgram.uNormalMatrixLocation = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  shaderProgram.uSpotlightsColorLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsColor");
  shaderProgram.uSpotlightsDirectionLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsDirection");
  shaderProgram.uSpotlightsPositionLocation = new Array();
  for(var i = 0; i < 12; i++)
    shaderProgram.uSpotlightsPositionLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotlightsPosition["+i+"]");
  shaderProgram.uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
  shaderProgram.uUntexturedLocation = gl.getUniformLocation(shaderProgram, "uUntextured");
  shaderProgram.uHeadlightTextureLocation = gl.getUniformLocation(shaderProgram, "uHeadlightTexture");
  shaderProgram.uViewSpaceToHeadlightSpaceLocation = gl.getUniformLocation(shaderProgram, "uViewSpaceToHeadlightSpace");
  shaderProgram.uComputeHeadlightLocation = gl.getUniformLocation(shaderProgram, "uComputeHeadlight");
  
  shaderProgram.uDebugLocation = gl.getUniformLocation(shaderProgram, "uDebug");
	
  return shaderProgram;
};

