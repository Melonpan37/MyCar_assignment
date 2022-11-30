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

lightShader3 = function (gl, nlamps) {
  var vertexShaderSource = `
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;              
    attribute vec3 aPosition;         
   
    //edit : aggiunto attributo per le normali per vertice (obj space)
    attribute vec3 aNormal;
    
    //edit : aggiunta uniform per portare le normali in viewspace
    uniform mat4 uNormalMatrix;
    
    //edit : nromale in view space
    varying vec3 vViewSpaceNormal;
    //edit : posizione del fragmen in view space
    varying vec3 vViewSpaceFragPosition;

    varying float bug;
               
    void main(void)                                
    { 
      //debugging            
      bug = 0.0;

      //normal in view space
      vViewSpaceNormal = normalize(mat3(uNormalMatrix) * aNormal);

      //fragment position in view space
      vViewSpaceFragPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0)); 
                                       
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;   

    //edit : uniform per la luce
    uniform vec4 uLightDirection; //direzione luce direzionale (sole)
    uniform vec3 uLightColor;  //colore luce direzionale
    
    //edit : normali in viewspace
    varying vec3 vViewSpaceNormal;
    //edit : posizoine fragment in view space
    varying vec3 vViewSpaceFragPosition;

    const int spotlightsNumber = `+nlamps+`; //numero di luci posizionali (lampioni)
    uniform vec4 uSpotlightsPosition[spotlightsNumber]; //posizione spotlights
    uniform vec4 uSpotlightsColor; //colore spotlights
    uniform vec4 uSpotlightsDirection; //normalized and in view space

    //DEBUG
    uniform int uDebug;

    varying float bug;

    void main(void)                                
    {               
      float bug_ = bug;     

      //LAMBERTIAN LIGHTING MODEL (only diffuse term)
      //---------directional diffuse----------
      //normal vector
      vec3 N = normalize(vViewSpaceNormal);
      //directional light vector (sun)
      vec3 L = normalize(-uLightDirection.xyz);
      float NdotL = max(0.0, dot(N, L));
      vec3 diffuse = (uColor.xyz * uLightColor) * NdotL; //directional contribution
      
      //--------------ambient-----------------
      vec3 ambient = uColor.xyz * 0.2;

      //--------------specular----------------
      vec3 specular = vec3(0, 0, 0);
      if(NdotL > 0.0){
        vec3 R = reflect(-L, N);
        vec3 V = normalize(-vViewSpaceFragPosition); //vettore verso pov
        float specularAngle = max(0.0, dot(R, V));
        specular = uColor.xyz * pow(specularAngle, 4.0);
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
          lampContribution += vec3(uColor)*NdotL*vec3(uSpotlightsColor)*cosFactor;
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
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.uLightDirectionLocation = gl.getUniformLocation(shaderProgram, "uLightDirection");
  shaderProgram.uLightColorLocation = gl.getUniformLocation(shaderProgram, "uLightColor");
  shaderProgram.uNormalMatrixLocation = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  shaderProgram.uSpotlightsNumberLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsNumber");
  shaderProgram.uSpotlightsColorLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsColor");
  shaderProgram.uSpotlightsDirectionLocation = gl.getUniformLocation(shaderProgram, "uSpotlightsDirection");

  //EDIT : lamps position array uniform location
  shaderProgram.uSpotlightsPositionLocation = new Array();
  for(var i = 0; i < nlamps; i++){
    shaderProgram.uSpotlightsPositionLocation[i] = gl.getUniformLocation(shaderProgram, "uSpotlightsPosition["+i+"]");
  }

  shaderProgram.uDebugLocation = gl.getUniformLocation(shaderProgram, "uDebug");
	
  return shaderProgram;
};
