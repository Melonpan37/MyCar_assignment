function Lamp(offset, height) {
    this.name = "lamp";
	
    offsetx = offset[0];
    offsetz = offset[2];
    
    // vertices definition
	////////////////////////////////////////////////////////////
	this.vertices = new Float32Array([
		-0.15+offsetx,  0.0,     0.15+offsetz,
		 0.15+offsetx,  0.0,     0.15+offsetz,
		-0.15+offsetx,  height,  0.15+offsetz,
		 0.15+offsetx,  height,  0.15+offsetz,
		-0.15+offsetx,  0.0,    -0.15+offsetz,
		 0.15+offsetx,  0.0,    -0.15+offsetz,
		-0.15+offsetx,  height, -0.15+offsetz,
		 0.15+offsetx,  height, -0.15+offsetz,
        //
        -0.8+offsetx,  height,      0.8+offsetz,
		 0.8+offsetx,  height,      0.8+offsetz,
		-0.8+offsetx,  height+1.0,  0.8+offsetz,
		 0.8+offsetx,  height+1.0,  0.8+offsetz,
		-0.8+offsetx,  height,     -0.8+offsetz,
		 0.8+offsetx,  height,     -0.8+offsetz,
		-0.8+offsetx,  height+1.0, -0.8+offsetz,
		 0.8+offsetx,  height+1.0, -0.8+offsetz,
    ]);

	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array([
		0, 1, 2,  2, 1, 3,  // front
		5, 4, 7,  7, 4, 6,  // back
		4, 0, 6,  6, 0, 2,  // left
		1, 5, 3,  3, 5, 7,  // right
		2, 3, 6,  6, 3, 7,  // top
		4, 5, 0,  0, 5, 1,   // bottom
        //
        8+0, 8+1, 8+2,  8+2, 8+1, 8+3,  // front
		8+5, 8+4, 8+7,  8+7, 8+4, 8+6,  // back
		8+4, 8+0, 8+6,  8+6, 8+0, 8+2,  // left
		8+1, 8+5, 8+3,  8+3, 8+5, 8+7,  // right
		8+2, 8+3, 8+6,  8+6, 8+3, 8+7,  // top
		8+4, 8+5, 8+0,  8+0, 8+5, 8+1,   // bottom
        
	]);
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}

function NonStaticLamp() {
    this.name = "lamp";

    this.vertices = [
        //asta
       -1.0,  0.0,  1.0,
        1.0,  0.0,  1.0,
       -1.0,  4.0,  1.0,
        1.0,  4.0,  1.0,
       -1.0,  0.0, -1.0,
        1.0,  0.0, -1.0,
       -1.0,  4.0, -1.0,
        1.0,  4.0, -1.0,
        //testa
        -2.0, 4.0+0.0,  2.0,
        2.0,  4.0+0.0,  2.0,
       -2.0,  4.0+2.0,  2.0,
        2.0,  4.0+2.0,  2.0,
       -2.0,  4.0+0.0, -2.0,
        2.0,  4.0+0.0, -2.0,
       -2.0,  4.0+2.0, -2.0,
        2.0,  4.0+2.0, -2.0,
    ];
    this.triangleIndices = [
        //asta
        0, 1, 2,  2, 1, 3,  // front
		5, 4, 7,  7, 4, 6,  // back
		4, 0, 6,  6, 0, 2,  // left
		1, 5, 3,  3, 5, 7,  // right
		2, 3, 6,  6, 3, 7,  // top
		4, 5, 0,  0, 5, 1,   // bottom
        //testa
        0+8, 1+8, 2+8,  2+8, 1+8, 3+8,  // front
		5+8, 4+8, 7+8,  7+8, 4+8, 6+8,  // back
		4+8, 0+8, 6+8,  6+8, 0+8, 2+8,  // left
		1+8, 5+8, 3+8,  3+8, 5+8, 7+8,  // right
		2+8, 3+8, 6+8,  6+8, 3+8, 7+8,  // top
		4+8, 5+8, 0+8,  0+8, 5+8, 1+8 , // bottom
    ];

    this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
}


function CLamp () {

	this.name = "cube";
	
    var hg = 10.0;
    var offset = 2.0; 
	// vertices definition
	////////////////////////////////////////////////////////////
	this.vertices = new Float32Array([
		-0.5+offset, 0.0,  0.5+offset,
		 0.5+offset, 0.0,  0.5+offset,
		-0.5+offset,  hg,  0.5+offset,
		 0.5+offset,  hg,  0.5+offset,
		-0.5+offset, 0.0, -0.5+offset,
		 0.5+offset, 0.0, -0.5+offset,
		-0.5+offset,  hg, -0.5+offset,
		 0.5+offset,  hg, -0.5+offset,
        //
        -2.0+offset,  hg,      2.0+offset,
		 2.0+offset,  hg,      2.0+offset,
		-2.0+offset,  hg+4.0,  2.0+offset,
		 2.0+offset,  hg+4.0,  2.0+offset,
		-2.0+offset,  hg,     -2.0+offset,
		 2.0+offset,  hg,     -2.0+offset,
		-2.0+offset,  hg+4.0, -2.0+offset,
		 2.0+offset,  hg+4.0, -2.0+offset,
    ]);

	// triangles definition
	////////////////////////////////////////////////////////////
	
	this.triangleIndices = new Uint16Array([
		0, 1, 2,  2, 1, 3,  // front
		5, 4, 7,  7, 4, 6,  // back
		4, 0, 6,  6, 0, 2,  // left
		1, 5, 3,  3, 5, 7,  // right
		2, 3, 6,  6, 3, 7,  // top
		4, 5, 0,  0, 5, 1,   // bottom
        //
        8+0, 8+1, 8+2,  8+2, 8+1, 8+3,  // front
		8+5, 8+4, 8+7,  8+7, 8+4, 8+6,  // back
		8+4, 8+0, 8+6,  8+6, 8+0, 8+2,  // left
		8+1, 8+5, 8+3,  8+3, 8+5, 8+7,  // right
		8+2, 8+3, 8+6,  8+6, 8+3, 8+7,  // top
		8+4, 8+5, 8+0,  8+0, 8+5, 8+1,   // bottom
        
	]);
	
	this.numVertices = this.vertices.length/3;
	this.numTriangles = this.triangleIndices.length/3;
	
}