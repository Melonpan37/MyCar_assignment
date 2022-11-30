// Global NVMC Client
// ID 6.1
/***********************************************************************/
var NVMCClient = NVMCClient || {};
/***********************************************************************/

function Light(geometry, color) {//line 7, Listing6.8{
	if (!geometry) this.geometry = [0.0, -1.0, 0.0, 0.0];
	else this.geometry = geometry;
	if (!color) this.color = [1.0, 1.0, 1.0, 1.0];
	else this.color = color;
}//line 12}

function Lamp(position, light) {
	this.position = position;
	this.light = light;
}

NVMCClient.lightsGeometryViewSpace = [];
NVMCClient.lightsColor = [];
NVMCClient.streetLamps = [];

NVMCClient.initializeLights = function () {
	var lamps = this.game.race.lamps;
	for (var i = 0; i < 6; ++i) {// take only the first 6 lights for memory constraints
		var g = lamps[i].position;
		var lightPos = [lamps[i].position[0], lamps[i].position[1], lamps[i].position[2], 1.0];
		lightPos[1] = lightPos[1] + 2.0;
		this.streetLamps[i] = new Lamp(g, new Light(lightPos, [0.3, 0.3, 0.2, 1]));
	}
}

NVMCClient.drawLamp = function (gl, shader) {
	var stack = this.stack;
	var shaderToUseForTheStick = null;
	if (!shader)
		shaderToUseForTheStick = gl.getParameter(gl.CURRENT_PROGRAM);
	else
		shaderToUseForTheStick = shader;

	gl.useProgram(this.uniformShader);
	stack.push();
	var M = SglMat4.translation([0, 2, 0]);
	stack.multiply(M);

	var M1 = SglMat4.scaling([0.2, 0.1, 0.2]);
	stack.multiply(M1);

	gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	this.drawObject(gl, this.cube, this.uniformShader, [1, 1, 1, 1.0]);
	stack.pop();

	gl.useProgram(shaderToUseForTheStick);
	stack.push();
	var M_1_sca = SglMat4.scaling([0.05, 1, 0.05]);
	stack.multiply(M_1_sca);

	gl.uniformMatrix4fv(shaderToUseForTheStick.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix4fv(shaderToUseForTheStick.uProjectionMatrixLocation, false, this.projectionMatrix);
	this.drawObject(gl, this.cylinder10, shaderToUseForTheStick, [0.6, 0.23, 0.12, 1.0]);
	stack.pop();

};

NVMCClient.drawTree = function (gl) {
	var stack = this.stack;

	stack.push();
	var M_0_tra1 = SglMat4.translation([0, 0.8, 0]);
	stack.multiply(M_0_tra1);

	var M_0_sca = SglMat4.scaling([0.6, 1.65, 0.6]);
	stack.multiply(M_0_sca);

	gl.uniformMatrix4fv(this.lambertianSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
	var InvT = SglMat4.inverse(this.stack.matrix)
	InvT = SglMat4.transpose(InvT);
	gl.uniformMatrix3fv(this.lambertianSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(InvT));
	this.drawObject(gl, this.cone, this.lambertianSingleColorMultiLightShader, [0.2, 0.8, 0.1, 1.0], [0, 0, 0, 1]);
	stack.pop();

	stack.push();
	var M_1_sca = SglMat4.scaling([0.25, 0.4, 0.25]);
	stack.multiply(M_1_sca);

	gl.uniformMatrix4fv(this.lambertianSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix3fv(this.lambertianSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix));
	this.drawObject(gl, this.cylinder, this.lambertianSingleColorMultiLightShader, [0.6, 0.23, 0.12, 1.0], [0, 0, 0, 1]);
	stack.pop();
};

NVMCClient.drawCar = function (gl) {
	this.sgl_renderer.begin();
	this.sgl_renderer.setTechnique(this.sgl_technique);

	this.sgl_renderer.setGlobals({
		"PROJECTION_MATRIX": this.projectionMatrix,
		"WORLD_VIEW_MATRIX": this.stack.matrix,
		"VIEW_SPACE_NORMAL_MATRIX": SglMat4.to33(this.stack.matrix),
		"LIGHTS_GEOMETRY": this.lightsGeometryViewSpace,
		"LIGHTS_COLOR": this.lightsColor
	});

	this.sgl_renderer.setPrimitiveMode("FILL");

	this.sgl_renderer.setModel(this.sgl_car_model);
	this.sgl_renderer.renderModel();
	this.sgl_renderer.end();
};

NVMCClient.createCarTechnique = function (gl) {
	this.sgl_renderer = new SglModelRenderer(gl);
	this.sgl_technique = new SglTechnique(gl, {
		vertexShader: this.lambertianMultiLightShader.PerPixelLambertian_vs,
		fragmentShader: this.lambertianMultiLightShader.PerPixelLambertian_fs,
		vertexStreams: {
			"aPosition": [0.0, 0.0, 0.0, 1.0],
			"aNormal": [0.0, 0.0, 1.0, 0.0],
			"aDiffuse": [0.0, 0.0, 0.8, 0.0],
		},
		globals: {
			"uProjectionMatrix": {
				semantic: "PROJECTION_MATRIX",
				value: this.projectionMatrix
			},
			"uModelViewMatrix": {
				semantic: "WORLD_VIEW_MATRIX",
				value: this.stack.matrix
			},
			"uViewSpaceNormalMatrix": {
				semantic: "VIEW_SPACE_NORMAL_MATRIX",
				value: SglMat4.to33(this.stack.matrix)
			},
			"uLightsColor": {
				semantic: "LIGHTS_COLOR",
				value: this.lightsColor
			},
			"uLightsGeometry": {
				semantic: "LIGHTS_GEOMETRY",
				value: this.lightsGeometryViewSpace
			}
		}
	});
};

NVMCClient.drawScene = function (gl) {
	var width = this.ui.width;
	var height = this.ui.height;
	var ratio = width / height;
	var stack = this.stack;

	gl.viewport(0, 0, width, height);

	// Clear the framebuffer
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);

	stack.loadIdentity();

	if (this.currentCamera == 3) {
		gl.enable(gl.STENCIL_TEST);
		gl.clearStencil(0);
		gl.stencilMask(~0);
		gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
		gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

		gl.useProgram(this.lambertianSingleColorMultiLightShader);
		gl.uniformMatrix4fv(this.lambertianSingleColorMultiLightShader.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.lambertianSingleColorMultiLightShader.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject(gl, this.cabin, this.lambertianSingleColorMultiLightShader);

		gl.stencilFunc(gl.EQUAL, 0, 0xFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		gl.stencilMask(0);

	} else
		gl.disable(gl.STENCIL_TEST);

	this.projectionMatrix = SglMat4.perspective(3.14 / 4, ratio, 1, 1000);

	var orientation = this.game.state.players.me.dynamicState.orientation;
	var pos = this.game.state.players.me.dynamicState.position;
	this.cameras[this.currentCamera].setView(this.stack, this.myFrame());

	this.lightsGeometryViewSpace[0] = SglMat4.mul4(this.stack.matrix, this.sunLightDirection);
	this.lightsColor[0] = [0.6, 0.6, 0.4, 1.0];
	for (var i = 0; i < this.streetLamps.length; ++i) {
		this.lightsGeometryViewSpace[i + 1] = SglMat4.mul4(this.stack.matrix, this.streetLamps[i].light.geometry);
		this.lightsColor[i + 1] = this.streetLamps[i].light.color;
	}

	gl.useProgram(this.lambertianSingleColorMultiLightShader);
	for (var i = 0; i < this.streetLamps.length + 1; ++i) {
		gl.uniform4fv(this.lambertianSingleColorMultiLightShader.uLightsGeometryLocation[i],
			this.lightsGeometryViewSpace[i]);
		gl.uniform4fv(this.lambertianSingleColorMultiLightShader.uLightsColorLocation[i],
			this.lightsColor[i]);
	}

	gl.uniform3fv(this.lambertianSingleColorMultiLightShader.uLightColorLocation, [0.9, 0.9, 0.9]);
	gl.uniformMatrix4fv(this.lambertianSingleColorMultiLightShader.uProjectionMatrixLocation, false, this.projectionMatrix);
	gl.uniformMatrix4fv(this.lambertianSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
	gl.uniformMatrix3fv(this.lambertianSingleColorMultiLightShader.uViewSpaceNormalMatrixLocation, false, SglMat4.to33(this.stack.matrix));

	this.drawObject(gl, this.track, this.lambertianSingleColorMultiLightShader, [0.9, 0.8, 0.7, 1.0]);
	this.drawObject(gl, this.ground, this.lambertianSingleColorMultiLightShader, [0.3, 0.7, 0.2, 1.0]);

	var trees = this.game.race.trees;
	for (var t in trees) {
		stack.push();
		var M_8 = SglMat4.translation(trees[t].position);
		stack.multiply(M_8);
		this.drawTree(gl);
		stack.pop();
	}

	var streetLamps = this.streetLamps;
	for (var t in streetLamps) {
		stack.push();
		var M_8 = SglMat4.translation(streetLamps[t].position);
		stack.multiply(M_8);
		this.drawLamp(gl);
		stack.pop();
	}

	gl.useProgram(this.lambertianSingleColorMultiLightShader);
	gl.uniformMatrix4fv(this.lambertianSingleColorMultiLightShader.uModelViewMatrixLocation, false, stack.matrix);
	for (var i in this.buildings) {
		this.drawObject(gl, this.buildings[i], this.lambertianSingleColorMultiLightShader, [0.7, 0.8, 0.9, 1.0], [1, 1, 1, 1]);
	}

	if (this.currentCamera != 3) {
		stack.push();
		var M_9 = SglMat4.translation(pos);
		stack.multiply(M_9);

		var M_9bis = SglMat4.rotationAngleAxis(this.game.state.players.me.dynamicState.orientation, [0, 1, 0]);
		stack.multiply(M_9bis);

		this.drawCar(gl);
		stack.pop();
	} else {
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(this.lambertianSingleColorMultiLightShader);
		gl.uniformMatrix4fv(this.uModelViewMatrixLocation, false, SglMat4.identity());
		gl.uniformMatrix4fv(this.uProjectionMatrixLocation, false, SglMat4.identity());
		this.drawObject(gl, this.windshield, this.lambertianSingleColorMultiLightShader);
		gl.disable(gl.BLEND);

	}

	gl.useProgram(null);
};
/***********************************************************************/
NVMCClient.createObjects = function () {
	this.cube = new Cube(10);
	this.cylinder = new Cylinder(10);
	this.cylinder10 = new Cylinder(10,10);
	this.cone = new Cone(10);

	this.track = new Track(this.game.race.track);

	var bbox = this.game.race.bbox;
	var quad = [bbox[0], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[2],
		bbox[3], bbox[1] - 0.01, bbox[5],
		bbox[0], bbox[1] - 0.01, bbox[5]
	];
	this.ground = new Quadrilateral(quad);
	this.cabin = new Cabin();
	this.windshield = new Windshield();
	this.rearmirror = new RearMirror();

	var gameBuildings = this.game.race.buildings;
	this.buildings = new Array(gameBuildings.length);
	for (var i = 0; i < gameBuildings.length; ++i) {
		this.buildings[i] = new Building(gameBuildings[i]);
	}
};

 NVMCClient.createBuffers = function (gl) {
	this.createObjectBuffers(gl, this.cube, false, false);

	ComputeNormals(this.cylinder);
	this.createObjectBuffers(gl, this.cylinder, false, true);

	ComputeNormals(this.cylinder10);
	this.createObjectBuffers(gl, this.cylinder10, false, true);

	ComputeNormals(this.cone);
	this.createObjectBuffers(gl, this.cone, false, true);

	ComputeNormals(this.track);
	this.createObjectBuffers(gl, this.track, false, true);

	ComputeNormals(this.ground);
	this.createObjectBuffers(gl, this.ground, false, true);

	this.createObjectBuffers(gl, this.cabin, true, false);
	this.createObjectBuffers(gl, this.windshield, true, false);

	for (var i = 0; i < this.buildings.length; ++i) {
		this.buildings[i] = ComputeNormals(this.buildings[i]);
		this.createObjectBuffers(gl, this.buildings[i], false, true);
	}
};

// NVMC Client Events
/***********************************************************************/
NVMCClient.onInitialize = function () {

	var gl = this.ui.gl;
	this.cameras[2].width = this.ui.width;
	this.cameras[2].height = this.ui.height;

	/*************************************************************/
	NVMC.log("SpiderGL Version : " + SGL_VERSION_STRING + "\n");
	/*************************************************************/

	/*************************************************************/
	this.game.player.color = [1.0, 0.0, 0.0, 1.0];
	/*************************************************************/

	/*************************************************************/
	this.initMotionKeyHandlers();
	/*************************************************************/
	this.stack = new SglMatrixStack();
	this.projection_matrix = SglMat4.identity();

	/*************************************************************/
	this.initializeLights();
	this.initializeObjects(gl);
	this.initializeCameras();

	this.uniformShader = new uniformShader(gl);
	this.lambertianMultiLightShader = new lambertianMultiLightShader(gl,this.streetLamps.length + 1);
	this.lambertianSingleColorMultiLightShader = new lambertianSingleColorMultiLightShader(gl, this.streetLamps.length + 1);
	/*************************************************************/

	this.loadCarModel(gl);
	this.createCarTechnique(gl);
};
