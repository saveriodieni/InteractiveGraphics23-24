var objVS0 = `
	attribute vec3 pos;
	attribute vec3 norm;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 NormalMatrix;

	varying vec3 vertPos;
	varying vec3 normalInterp;
	void main()
	{
		gl_Position = mvp * vec4(pos,1);

		vertPos = vec3(mv * vec4(pos,1));
		normalInterp = normalize(NormalMatrix * norm);
	}
`;

var objFS0 = `
	precision mediump float;

	uniform vec3 Ka; 
	uniform vec3 Kd; 
	uniform vec3 Ks; 
	uniform float shininessVal; 
	uniform vec3 Ia; 
	uniform vec3 Id; 
	uniform vec3 lightPos; 

	varying vec3 normalInterp; 
	varying vec3 vertPos; 

	void main() {
		
		vec3 N = normalize(normalInterp);
		vec3 L = normalize(lightPos - vertPos);

		float lambertian = max(dot(N, L), 0.0);

		float specular = 0.0;

		if (lambertian > 0.0) {
			vec3 R = reflect(-L, N);

			vec3 V = normalize(-vertPos);

			float specAngle = max(dot(R, V), 0.0);

			specular = pow(specAngle, shininessVal);
		}

		vec3 finalColor = Ka * Ia + Kd * lambertian * Id + Ks * specular * Id;

		gl_FragColor = vec4(finalColor, 1.0);
	}
	`;

	var objVS1 = `
	attribute vec3 pos;
	attribute vec3 norm;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 NormalMatrix;

	varying vec3 vertPos;
	varying vec3 normalInterp;

	attribute vec2 txc;
	varying vec2 texCoord;
	void main()
	{
		gl_Position = mvp * vec4(pos,1);

		vertPos = vec3(mv * vec4(pos,1));
		normalInterp = normalize(NormalMatrix * norm);
		texCoord = txc;
	}
`;

var objFS1 = `
	precision mediump float;

	uniform sampler2D tex;
	varying vec2 texCoord;

	uniform vec3 Ka; 
	uniform vec3 Kd; 
	uniform vec3 Ks; 
	uniform float shininessVal; 
	uniform vec3 Ia; 
	uniform vec3 Id; 
	uniform vec3 lightPos;
	uniform vec3 campos;

	varying vec3 normalInterp; 
	varying vec3 vertPos; 

	void main() {
		vec3 N = normalize(normalInterp);
		vec3 L = normalize(lightPos - vertPos);
		vec3 V = normalize(campos - vertPos);

		// Lambertian shading (diffuse)
		float lambertian = max(dot(N, L), 0.0);

		// Blinn-Phong shading (specular)
		float specular = 0.0;
		if (lambertian > 0.0) {
			vec3 H = normalize(L + V);  // Halfway vector
			float specAngle = max(dot(N, H), 0.0);
			specular = pow(specAngle, shininessVal);
		}

		// Combining the final color
		vec3 ambient = Ka * Ia;
		vec3 diffuse = Kd * lambertian * Id;
		vec3 spec = Ks * specular * Id;
		vec4 texColor = texture2D(tex, texCoord);
		vec3 finalColor = ambient + (diffuse + spec) * texColor.rgb;

		gl_FragColor = vec4(finalColor, 1.0);
	}
`;


// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	
	var rotatX=[
		1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];
	var rotatY=[
		Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
		0, 1 , 0, 0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];

	var mv=MatrixMult(rotatX,rotatY);
	mv=MatrixMult(trans,mv);
	
	return mv;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.useTexture=false;
		this.texture=true;
		this.model=false;

		this.lightPos = [0,0,10];//,5.0, 5.0, 10,-5.0, -5.0, 10,-5.0, 5.0, 10,5.0, -5.0, 10];

		// Compile the shader program
		this.prog0 = InitShaderProgram( objVS0, objFS0 );

		this.prog1 = InitShaderProgram( objVS1, objFS1 );

		this.lighting;
		this.shininess=1;
		
		this.numTriangles;
		this.position_buffer;
		this.vertPos;
		this.color_buffer;
		this.normal_buffer;
		this.texCoords;
		this.normals;

		this.Ka = [0,0,0];
		this.Kd = [165/255, 42/255, 42/255];
		this.Ks = [1.0, 1.0, 1.0];
		this.Ia = [0,0,0];
		this.Id = [1.0,1.0,1.0];
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.model=true;
		this.numTriangles = vertPos.length / 3;

		this.position_buffer=gl.createBuffer();
		this.vertPos=vertPos;

		gl.bindBuffer(gl.ARRAY_BUFFER,this.position_buffer);
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.vertPos),gl.STATIC_DRAW);

		this.color_buffer=gl.createBuffer();
		this.texCoords=texCoords;

		gl.bindBuffer(gl.ARRAY_BUFFER,this.color_buffer);
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.texCoords),gl.STATIC_DRAW);

		this.normal_buffer = gl.createBuffer();
		this.normals = normals;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		var vertPos=this.vertPos;
		
		for(var i=0; i<this.numTriangles*3; i=i+3){
			var aux=vertPos[i+2];
			vertPos[i+2]=vertPos[i+1];
			vertPos[i+1]=aux;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER,this.position_buffer);
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertPos),gl.STATIC_DRAW);
	}

	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal , campos)
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		if(this.model){
			var program;
			if(this.useTexture && this.texture) {
				program=this.prog1;
				this.programInUse="prog1";
			}
			else{
				program=this.prog0;
				this.programInUse="prog0";
			}

			var normalAttribute;
			var posAttrib;
		
			gl.useProgram( program );
			gl.uniformMatrix4fv(gl.getUniformLocation( program, 'mvp' ), false, matrixMVP );
			gl.uniformMatrix4fv(gl.getUniformLocation( program, 'mv' ), false, matrixMV);
			gl.uniformMatrix3fv(gl.getUniformLocation( program, 'NormalMatrix' ), false, matrixNormal);
			posAttrib=gl.getAttribLocation(program, 'pos');
			normalAttribute=gl.getAttribLocation(program,"norm");
			gl.uniform3fv(gl.getUniformLocation(program, 'lightPos'), this.lightPos);
			gl.uniform3fv(gl.getUniformLocation(program, 'Ka'), this.Ka); 
			gl.uniform3fv(gl.getUniformLocation(program, 'Kd'), this.Kd); 
			gl.uniform3fv(gl.getUniformLocation(program, 'Ks'), this.Ks); 
			gl.uniform1f(gl.getUniformLocation(program, 'shininessVal'), this.shininess); 
			gl.uniform3fv(gl.getUniformLocation(program, 'Ia'), this.Ia);
			gl.uniform3fv(gl.getUniformLocation(program, 'Id'), this.Id);
			gl.uniform3fv(gl.getUniformLocation(program, 'campos'), campos);
			
			posAttrib=gl.getAttribLocation(program, 'pos');
			gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
			gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(posAttrib);

			if(this.useTexture && this.texture){
				gl.uniformMatrix4fv(gl.getUniformLocation( program, 'mvp' ), false, matrixMVP);
				
				var texCoordAttrib = gl.getAttribLocation(program, 'txc');
				gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
				gl.vertexAttribPointer(texCoordAttrib, 2, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(texCoordAttrib);
			}
		
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
			gl.vertexAttribPointer(normalAttribute,3,gl.FLOAT,false,0,0);
			gl.enableVertexAttribArray(normalAttribute);
			
			gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	
		}
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture

		this.useTexture=true;
		var tex=gl.createTexture();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D,tex);
		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		this.texture = show;
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		this.lightPos = [x,y,z];
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		this.shininess=shininess;
	}

	setSpecularity(specularity){
		this.Ks=[specularity,specularity,specularity];
	}

}
var meshDrawerLower,meshDrawerUpper;