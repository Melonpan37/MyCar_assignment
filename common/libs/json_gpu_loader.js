var loadOnGPU = function( jsonMesh ) {
   var gpuMesh = {
    vertBuffer: null,
    indexBuffer: null
   }
   
   gpuMesh.vertexBuffer = gl.createBuffer();
   gpuMesh.normalBuffer = gl.createBuffer();
   gpuMesh.indexBuffer = gl.createBuffer();
   
   gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.vertexBuffer );
   gl.bufferData( 
      gl.ARRAY_BUFFER, 
	  new Float32Array(jsonMesh.vertices[0].values), 
	  gl.STATIC_DRAW
   );

  gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.normalBuffer );
   gl.bufferData( 
      gl.ARRAY_BUFFER, 
	  new Float32Array(jsonMesh.vertices[1].values), 
	  gl.STATIC_DRAW
   );
  
   gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, gpuMesh.indexBuffer );
   gl.bufferData( 
      gl.ELEMENT_ARRAY_BUFFER, 
	  new Uint16Array(jsonMesh.connectivity[0].indices), 
	  gl.STATIC_DRAW
   );

  gpuMesh.triangleIndices  = jsonMesh.connectivity[0].indices ; 
 
   return gpuMesh;
}

var loadOnGPU_modified = function(gl, jsonMesh) {
   var gpuMesh = {
      vertexBuffer : null,
      normalBuffer : null,
      indexBufferTriangles : null,
      indexBufferEdges : null
   }
   
   gpuMesh.vertexBuffer = gl.createBuffer();
   gpuMesh.normalBuffer = gl.createBuffer();
   gpuMesh.indexBufferTriangles = gl.createBuffer();
   gpuMesh.indexBufferEdges = gl.createBuffer();
   
   gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.vertexBuffer );
   gl.bufferData( 
      gl.ARRAY_BUFFER, 
	  new Float32Array(jsonMesh.vertices[0].values), 
	  gl.STATIC_DRAW
   );
  gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.normalBuffer );
   gl.bufferData( 
      gl.ARRAY_BUFFER, 
	  new Float32Array(jsonMesh.vertices[1].values), 
	  gl.STATIC_DRAW
   );
  
   gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, gpuMesh.indexBufferTriangles );
   gl.bufferData( 
      gl.ELEMENT_ARRAY_BUFFER, 
	  new Uint16Array(jsonMesh.connectivity[0].indices), 
	  gl.STATIC_DRAW
   );

  gpuMesh.triangleIndices  = jsonMesh.connectivity[0].indices ; 
  gpuMesh.name = jsonMesh.name;

  //EDGES
  var edges = new Uint16Array(jsonMesh.numTriangles * 3 * 2);
  for (var i = 0; i < jsonMesh.numTriangles; ++i) {
    edges[i * 6 + 0] = jsonMesh.connectivity[0].indices[i * 3 + 0];
    edges[i * 6 + 1] = jsonMesh.connectivity[0].indices[i * 3 + 1];
    edges[i * 6 + 2] = jsonMesh.connectivity[0].indices[i * 3 + 0];
    edges[i * 6 + 3] = jsonMesh.connectivity[0].indices[i * 3 + 2];
    edges[i * 6 + 4] = jsonMesh.connectivity[0].indices[i * 3 + 1];
    edges[i * 6 + 5] = jsonMesh.connectivity[0].indices[i * 3 + 2];
  }
   gpuMesh.indexBufferEdges = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuMesh.indexBufferEdges);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
   
   
   gpuMesh.numVertices = jsonMesh.connectivity[0].indices.length/3;
	gpuMesh.numTriangles = gpuMesh.triangleIndices.length/3;
   
   return gpuMesh;
}


var loadOnGPU_withTextures = function(gl, jsonMesh) {
   var gpuMesh = {
      vertexBuffer : null,
      normalBuffer : null,
      indexBufferTriangles : null,
      indexBufferEdges : null
   }
   
   gpuMesh.vertexBuffer = gl.createBuffer();
   gpuMesh.normalBuffer = gl.createBuffer();
   gpuMesh.indexBufferTriangles = gl.createBuffer();
   gpuMesh.indexBufferEdges = gl.createBuffer();
   gpuMesh.textureCoordinatesBuffer = gl.createBuffer();
   
   gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.vertexBuffer );
   gl.bufferData( 
      gl.ARRAY_BUFFER, 
	  new Float32Array(jsonMesh.vertices[0].values), 
	  gl.STATIC_DRAW
   );
   
   gl.bindBuffer( gl.ARRAY_BUFFER, gpuMesh.normalBuffer );
   gl.bufferData( 
      gl.ARRAY_BUFFER, 
	  new Float32Array(jsonMesh.vertices[1].values), 
	  gl.STATIC_DRAW
   );
  
   gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, gpuMesh.indexBufferTriangles );
   gl.bufferData( 
      gl.ELEMENT_ARRAY_BUFFER, 
	  new Uint16Array(jsonMesh.connectivity[0].indices), 
	  gl.STATIC_DRAW
   );

   gl.bindBuffer(gl.ARRAY_BUFFER, gpuMesh.textureCoordinatesBuffer);
   gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(jsonMesh.vertices[2].values),
      gl.STATIC_DRAW
   );

  gpuMesh.triangleIndices  = jsonMesh.connectivity[0].indices ; 
  gpuMesh.name = jsonMesh.name;

  //EDGES
  var edges = new Uint16Array(jsonMesh.numTriangles * 3 * 2);
  for (var i = 0; i < jsonMesh.numTriangles; ++i) {
    edges[i * 6 + 0] = jsonMesh.connectivity[0].indices[i * 3 + 0];
    edges[i * 6 + 1] = jsonMesh.connectivity[0].indices[i * 3 + 1];
    edges[i * 6 + 2] = jsonMesh.connectivity[0].indices[i * 3 + 0];
    edges[i * 6 + 3] = jsonMesh.connectivity[0].indices[i * 3 + 2];
    edges[i * 6 + 4] = jsonMesh.connectivity[0].indices[i * 3 + 1];
    edges[i * 6 + 5] = jsonMesh.connectivity[0].indices[i * 3 + 2];
  }
   gpuMesh.indexBufferEdges = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuMesh.indexBufferEdges);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
   
   
   gpuMesh.numVertices = jsonMesh.connectivity[0].indices.length/3;
	gpuMesh.numTriangles = gpuMesh.triangleIndices.length/3;
   
   return gpuMesh;
}
