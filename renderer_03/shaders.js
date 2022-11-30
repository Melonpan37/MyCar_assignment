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

projectiveShader2 = function (gl, nlamps) {
  var vertexShaderSource = `
    //--------------------------ATTRIBUTES------------------------
    attribute vec3 aPosition;                         //vertex position in object space
    attribute vec3 aNormal;                           //defined in object space
    attribute vec2 aTextureCoordinates;               //texture coords for default object texture

    //--------------------------UNIFORMS---------------------------
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;              
    uniform   mat4 uNormalMatrix;                     //transforms normals to view space
    uniform   mat4 uToHeadlightSpace;        //matrix obj space -> headlight space (clip space con coordinate a partire dal view frame dell'headlight)
    uniform   int  uComputeHeadlight;

    //--------------------------VARYINGS---------------------------
    varying   vec3 vViewSpaceNormal;                  //normals in view space
    varying   vec3 vViewSpaceFragPosition;            //position of the fragment in view space
    varying   vec2 vTextureCoordinates;               //default object texture coordinates interpolated
    varying   vec4 vHeadlightSpaceTextureCoordinates; //texture coordinates in headlight space
    
    //debug
    varying float bug;
    
    
    void main(void)                                
    { 
      //debugging            
      bug = 0.0;

      //normal in view space
      vViewSpaceNormal = normalize(mat3(uNormalMatrix) * aNormal);

      //fragment position in view space
      vViewSpaceFragPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0)); 
                                       
      //texture coordinates
      vTextureCoordinates = aTextureCoordinates;

      if(uComputeHeadlight == 1)
        //
        vHeadlightSpaceTextureCoordinates = uToHeadlightSpace * vec4(aPosition, 1.0);
      else
        //excludes objects from headligh computation
        vHeadlightSpaceTextureCoordinates = vec4(0.0, 0.0, 0.0, 0.0);

      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;

    const int spotlightsNumber = `+nlamps+`;       //numero di spotlight (lampioni)

    //light
    uniform vec4 uLightDirection;                       //directional light IN VIEW SPACE (computed on cpu)
    uniform vec3 uLightColor;                           //colore luce direzionale
    uniform vec4 uSpotlightsPosition[spotlightsNumber]; //posizione spotlights IN VIEW SPACE (computed on cpu)
    uniform vec4 uSpotlightsColor;                      //colore spotlights
    uniform vec4 uSpotlightsDirection;                  //NORMALIZED and IN VIEW SPACE
    
    //textures
    uniform int uUntextured;                            //se il modello ha una texture
    uniform sampler2D uTexture;                         //texutre base del modello
    uniform sampler2D uHeadlightTexture;                //texture dei fanali
    uniform sampler2D uDepthTexture;                    //EDIT : depth texture
    
    //varying
    varying vec3 vViewSpaceNormal;                      //normale (per vertice e interpolata) in vs
    varying vec3 vViewSpaceFragPosition;                //posizione del fragment in vs
    varying vec2 vTextureCoordinates;                   //coordinate texture 
    varying vec4 vHeadlightSpaceTextureCoordinates;     //coordinate 

    //DEBUG
    uniform int uDebug;

    varying float bug;

    void main(void)                                
    {               
      float bug_ = bug;     

        

      //base texel color
      vec3 texelColor;
      //if has texture
      if(uUntextured == 0) texelColor = vec3(texture2D(uTexture, vTextureCoordinates)); 
      //if doesn't have texture
      else texelColor = vec3(uColor); 

      //if in front of view frustum of headlight
      if(vHeadlightSpaceTextureCoordinates.w > 0.0){
        //perspective divide
        vec2 headlightTextureCoords = vHeadlightSpaceTextureCoordinates.xy/vHeadlightSpaceTextureCoordinates.w;
        if( //cut the texture otherwise it will repeat on all the scene
          headlightTextureCoords.x >= 0.0 && headlightTextureCoords.x <= 1.0
          &&
          headlightTextureCoords.y >= 0.0 && headlightTextureCoords.y <= 1.0
        ){
          //compute first object's depth (from headlight's pov)
          float headlightDepth = texture2D(uDepthTexture, headlightTextureCoords).r;
          //compute this frag's depth
          float depth = vHeadlightSpaceTextureCoordinates.z/vHeadlightSpaceTextureCoordinates.w;
          //if this frag is before the first object
          if(depth <= headlightDepth){
            //headlight color contribution
            texelColor += 
              4.0 / (vHeadlightSpaceTextureCoordinates.w + 0.1) * //makes the light smooth over distance
              0.3 * //takes only 0.3 color contribution from headlight texture
              vec3(texture2D(uHeadlightTexture, headlightTextureCoords)); //headlight texture color
          }        
        }
      }
      
      //LAMBERTIAN LIGHTING MODEL (only diffuse term)
      //---------directional diffuse----------
      //normal vector
      vec3 N = normalize(vViewSpaceNormal);
      //directional light vector (sun)
      vec3 L = normalize(-uLightDirection.xyz);
      float NdotL = max(0.0, dot(N, L));                  
      vec3 lambert = (texelColor * uLightColor) * NdotL; //directional contribution
      
      //--------------ambient-----------------
      lambert += texelColor*0.2;

      //----------spotlight diffuse-----------
      for(int i = 0; i < spotlightsNumber; i++){
        //distance vector from spotlight position to this frag position
        vec3 spotlightToSurface = normalize(vec3(uSpotlightsPosition[i]) - vViewSpaceFragPosition);
        //cosine of the angle of the distance vector
        float cosAngle = dot(spotlightToSurface, -uSpotlightsDirection.xyz);
        //if we are on the spotlight cone
        if(0.5 < cosAngle && cosAngle < 1.0){ //cutoff range 
          L = spotlightToSurface;
          NdotL = max(0.0, dot(N, L));
          float cosFactor = 8.0*(cosAngle-0.5)*(cosAngle-0.5); //makes light cone smooth near borders
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

  //attribute locations
  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.aNormalIndex = aNormalIndex;
  shaderProgram.aTextureCoordinatesIndex = aTextureCoordinatesIndex;

  //uniform locations
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram, "uLightDirection");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram, "uLightColor");
  shaderProgram.uNormalMatrixLocation = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  shaderProgram.uSpotlightsColorLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsColor");
  shaderProgram.uSpotlightsDirectionLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsDirection");
  shaderProgram.uSpotlightsPositionLocation = new Array();
  for(var i = 0; i < 12; i++) shaderProgram.uSpotlightsPositionLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotlightsPosition["+i+"]");
  shaderProgram.uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
  shaderProgram.uUntexturedLocation = gl.getUniformLocation(shaderProgram, "uUntextured");
  shaderProgram.uHeadlightTextureLocation = gl.getUniformLocation(shaderProgram, "uHeadlightTexture");
  shaderProgram.uToHeadlightSpaceLocation = gl.getUniformLocation(shaderProgram, "uToHeadlightSpace");
  shaderProgram.uComputeHeadlightLocation = gl.getUniformLocation(shaderProgram, "uComputeHeadlight");
  shaderProgram.uDepthTextureLocation = gl.getUniformLocation(shaderProgram, "uDepthTexture");
  
  shaderProgram.uDebugLocation = gl.getUniformLocation(shaderProgram, "uDebug");
	
  return shaderProgram;
};


projectiveShader3 = function (gl, nlamps) {
  var vertexShaderSource = `
    //--------------------------ATTRIBUTES------------------------
    attribute vec3 aPosition;                         //vertex position in object space
    attribute vec3 aNormal;                           //defined in object space
    attribute vec2 aTextureCoordinates;               //texture coords for default object texture

    //--------------------------UNIFORMS---------------------------
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;              
    uniform   mat4 uNormalMatrix;                     //transforms normals to view space
    uniform   mat4 uToHeadlightSpace;                 //matrix obj space -> headlight space (clip space con coordinate a partire dal view frame dell'headlight)
    uniform   int  uComputeHeadlight;

    //--------------------------VARYINGS---------------------------
    varying   vec3 vViewSpaceNormal;                  //normals in view space
    varying   vec3 vViewSpaceFragPosition;            //position of the fragment in view space
    varying   vec2 vTextureCoordinates;               //default object texture coordinates interpolated
    varying   vec4 vHeadlightSpaceTextureCoordinates; //texture coordinates in headlight space
    
    //debug
    varying float bug;
    
    
    void main(void)                                
    { 
      //debugging            
      bug = 0.0;

      //normal in view space
      vViewSpaceNormal = normalize(mat3(uNormalMatrix) * aNormal);

      //fragment position in view space
      vViewSpaceFragPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0)); 
                                       
      //texture coordinates
      vTextureCoordinates = aTextureCoordinates;

      if(uComputeHeadlight == 1)
        //
        vHeadlightSpaceTextureCoordinates = uToHeadlightSpace * vec4(aPosition, 1.0);
      else
        //excludes objects from headligh computation
        vHeadlightSpaceTextureCoordinates = vec4(0.0, 0.0, 0.0, 0.0);

      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;

    const int spotlightsNumber = `+nlamps+`;            //numero di spotlight (lampioni)

    //light
    uniform vec4 uLightDirection;                       //directional light IN VIEW SPACE (computed on cpu)
    uniform vec3 uLightColor;                           //colore luce direzionale
    uniform vec4 uSpotlightsPosition[spotlightsNumber]; //posizione spotlights IN VIEW SPACE (computed on cpu)
    uniform vec4 uSpotlightsColor;                      //colore spotlights
    uniform vec4 uSpotlightsDirection;                  //NORMALIZED and IN VIEW SPACE
    
    //textures
    uniform int uUntextured;                            //se il modello ha una texture
    uniform sampler2D uTexture;                         //texutre base del modello
    uniform sampler2D uHeadlightTexture;                //texture dei fanali
    uniform sampler2D uDepthTexture;                    //EDIT : depth texture
    
    //varying
    varying vec3 vViewSpaceNormal;                      //normale (per vertice e interpolata) in vs
    varying vec3 vViewSpaceFragPosition;                //posizione del fragment in vs
    varying vec2 vTextureCoordinates;                   //coordinate texture 
    varying vec4 vHeadlightSpaceTextureCoordinates;     //coordinate 

    //DEBUG
    uniform int uDebug;

    varying float bug;

    void main(void)                                
    {               
      float bug_ = bug;     

        

      //base texel color
      vec3 texelColor;
      //if has texture
      if(uUntextured == 0) texelColor = vec3(texture2D(uTexture, vTextureCoordinates)); 
      //if doesn't have texture
      else texelColor = vec3(uColor); 

      //if in front of view frustum of headlight
      if(vHeadlightSpaceTextureCoordinates.w > 0.0){
        //perspective divide
        vec2 headlightTextureCoords = vHeadlightSpaceTextureCoordinates.xy/vHeadlightSpaceTextureCoordinates.w;
        if( //cut the texture otherwise it will repeat on all the scene
          headlightTextureCoords.x >= 0.0 && headlightTextureCoords.x <= 1.0
          &&
          headlightTextureCoords.y >= 0.0 && headlightTextureCoords.y <= 1.0
        ){
          //compute first object's depth (from headlight's pov)
          float headlightDepth = texture2D(uDepthTexture, headlightTextureCoords).r;
          //compute this frag's depth
          float depth = vHeadlightSpaceTextureCoordinates.z/vHeadlightSpaceTextureCoordinates.w;
          //if this frag is before the first object
          if(depth <= headlightDepth){
            //headlight color contribution
            texelColor += 
              4.0 / (vHeadlightSpaceTextureCoordinates.w + 0.1) * //makes the light smooth over distance
              0.5 * //takes only 0.3 color contribution from headlight texture
              vec3(texture2D(uHeadlightTexture, headlightTextureCoords)); //headlight texture color
          }        
        }
      }
      
      //LAMBERTIAN LIGHTING MODEL (only diffuse term)
      //---------directional diffuse----------
      //normal vector
      vec3 N = normalize(vViewSpaceNormal);
      //directional light vector (sun)
      vec3 L = normalize(-uLightDirection.xyz);
      float NdotL = max(0.0, dot(N, L));
      vec3 diffuse = (texelColor * uLightColor) * NdotL; //directional contribution
      
      //--------------ambient-----------------
      vec3 ambient = texelColor*0.2;

      //--------------specular----------------
      vec3 specular = vec3(0, 0, 0);
      if(NdotL > 0.0){
        vec3 R = reflect(-L, N);
        vec3 V = normalize(-vViewSpaceFragPosition); //vettore verso pov
        float specularAngle = max(0.0, dot(R, V));
        specular = texelColor*pow(specularAngle, 4.0);
      }

      //----------spotlight diffuse-----------
      vec3 lampContribution = vec3(0, 0, 0); 
      for(int i = 0; i < spotlightsNumber; i++){
        //distance vector from spotlight position to this frag position
        vec3 spotlightToSurface = normalize(vec3(uSpotlightsPosition[i]) - vViewSpaceFragPosition);
        //cosine of the angle of the distance vector
        float cosAngle = dot(spotlightToSurface, -uSpotlightsDirection.xyz);
        //if we are on the spotlight cone
        if(0.5 < cosAngle && cosAngle < 1.0){ //cutoff range 
          L = spotlightToSurface;
          NdotL = max(0.0, dot(N, L));
          float cosFactor = 8.0*(cosAngle-0.5)*(cosAngle-0.5); //makes light cone smooth near borders
          lampContribution += vec3(texelColor)*NdotL*vec3(uSpotlightsColor)*cosFactor;
        }
      }
      diffuse += lampContribution;
      
      gl_FragColor  = vec4((diffuse + ambient + specular), 1.0) ;  
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

  //attribute locations
  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.aNormalIndex = aNormalIndex;
  shaderProgram.aTextureCoordinatesIndex = aTextureCoordinatesIndex;

  //uniform locations
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram, "uLightDirection");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram, "uLightColor");
  shaderProgram.uNormalMatrixLocation = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  shaderProgram.uSpotlightsColorLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsColor");
  shaderProgram.uSpotlightsDirectionLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsDirection");
  shaderProgram.uSpotlightsPositionLocation = new Array();
  for(var i = 0; i < 12; i++) shaderProgram.uSpotlightsPositionLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotlightsPosition["+i+"]");
  shaderProgram.uTextureLocation = gl.getUniformLocation(shaderProgram, "uTexture");
  shaderProgram.uUntexturedLocation = gl.getUniformLocation(shaderProgram, "uUntextured");
  shaderProgram.uHeadlightTextureLocation = gl.getUniformLocation(shaderProgram, "uHeadlightTexture");
  shaderProgram.uToHeadlightSpaceLocation = gl.getUniformLocation(shaderProgram, "uToHeadlightSpace");
  shaderProgram.uComputeHeadlightLocation = gl.getUniformLocation(shaderProgram, "uComputeHeadlight");
  shaderProgram.uDepthTextureLocation = gl.getUniformLocation(shaderProgram, "uDepthTexture");
  
  shaderProgram.uDebugLocation = gl.getUniformLocation(shaderProgram, "uDebug");
	
  return shaderProgram;
};