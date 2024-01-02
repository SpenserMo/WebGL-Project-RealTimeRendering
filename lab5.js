var gl;
var shaderProgram;

var light_ambient = [0, 0, 0, 1];
var light_diffuse = [0.6, 0.6, 0.6, 1];
var light_specular = [1, 1, 1, 1];
var light_pos = [2, 2, 0, 1];

var mat_ambient = [0, 0, 0, 1];
var mat_diffuse = [1, 1, 0, 1];
var mat_specular = [0.9, 0.9, 0.9, 1];
var mat_shine = [50];

var use_texture = 0;
var is_wall = 0;

function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {}
  if (!gl) {
    alert("Not compatible.");
  }
}

var cubemapTexture;

function initCubeMap() {
  cubemapTexture = gl.createTexture();
  cubemapTexture.image = new Image();
  cubemapTexture.image.onload = function () {
    handleCubemapTextureLoaded(cubemapTexture);
  };
  cubemapTexture.image.src = "brick.png";
}
function handleCubemapTextureLoaded(texture) {
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.REPEAT);
  // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    texture.image
  );
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    texture.image
  );
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    texture.image
  );
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    texture.image
  );
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    texture.image
  );
  gl.texImage2D(
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    texture.image
  );
}

var sampleTexture;
var wallTexture;

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function loadTexture(gl, url) {
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    // WebGL1 has different requirements for power of 2 images
    // vs. non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    // redraw();
  };
  image.src = url;

  return texture;
}

var squareVertexPositionBuffer;
var squareVertexNormalBuffer;
var squareVertexTextureCoordsBuffer;
var squareVertexColorBuffer;
var squareVertexIndexBuffer;

var sphereVertexPositionBuffer;
var sphereVertexNormalBuffer;
var sphereVertexColorBuffer;
var sphereVertexIndexBuffer;

var cylinderVertexPositionBuffer;
var cylinderVertexNormalBuffer;
var cylinderVertexColorBuffer;
var cylinderVertexIndexBuffer;

var cylinderLegVertexPositionBuffer;
var cylinderLegVertexNormalBuffer;
var cylinderLegVertexColorBuffer;
var cylinderLegVertexIndexBuffer;

var cylinderArm1VertexPositionBuffer;
var cylinderArm1VertexNormalBuffer;
var cylinderArm1VertexColorBuffer;
var cylinderArm1VertexIndexBuffer;

var cylinderArm2VertexPositionBuffer;
var cylinderArm2VertexNormalBuffer;
var cylinderArm2VertexColorBuffer;
var cylinderArm2VertexIndexBuffer;

var wall1VertexPositionBuffer;
var wall1VertexNormalBuffer;
var wall1VertexTextureCoordsBuffer;
var wall1VertexIndexBuffer;

var wall2VertexPositionBuffer;
var wall2VertexNormalBuffer;
var wall2VertexTextureCoordsBuffer;
var wall2VertexIndexBuffer;

var wall3VertexPositionBuffer;
var wall3VertexNormalBuffer;
var wall3VertexTextureCoordsBuffer;
var wall3VertexIndexBuffer;

var wall4VertexPositionBuffer;
var wall4VertexNormalBuffer;
var wall4VertexTextureCoordsBuffer;
var wall4VertexIndexBuffer;

var wall5VertexPositionBuffer;
var wall5VertexNormalBuffer;
var wall5VertexTextureCoordsBuffer;
var wall5VertexIndexBuffer;

var wall6VertexPositionBuffer;
var wall6VertexNormalBuffer;
var wall6VertexTextureCoordsBuffer;
var wall6VertexIndexBuffer;

function initBuffers() {
  // cube buffers init
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  var vertices = [
    // Front face
    -0.5,
    -0.5,
    0.5, // Bottom left
    0.5,
    -0.5,
    0.5, // Bottom right
    0.5,
    0.5,
    0.5, // Top right
    -0.5,
    0.5,
    0.5, // Top left

    // Back face
    -0.5,
    -0.5,
    -0.5, // Bottom left
    -0.5,
    0.5,
    -0.5, // Top left
    0.5,
    0.5,
    -0.5, // Top right
    0.5,
    -0.5,
    -0.5, // Bottom right

    // Top face
    -0.5,
    0.5,
    -0.5, // Top left
    -0.5,
    0.5,
    0.5, // Bottom left
    0.5,
    0.5,
    0.5, // Bottom right
    0.5,
    0.5,
    -0.5, // Top right

    // Bottom face
    -0.5,
    -0.5,
    -0.5, // Top left
    0.5,
    -0.5,
    -0.5, // Top right
    0.5,
    -0.5,
    0.5, // Bottom right
    -0.5,
    -0.5,
    0.5, // Bottom left

    // Right face
    0.5,
    -0.5,
    -0.5, // Top left
    0.5,
    0.5,
    -0.5, // Top right
    0.5,
    0.5,
    0.5, // Bottom right
    0.5,
    -0.5,
    0.5, // Bottom left

    // Left face
    -0.5,
    -0.5,
    -0.5, // Top left
    -0.5,
    -0.5,
    0.5, // Bottom left
    -0.5,
    0.5,
    0.5, // Bottom right
    -0.5,
    0.5,
    -0.5, // Top right
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 24;

  var indices = [
    // Front face
    0, 1, 2, 0, 2, 3,

    // Back face
    4, 5, 6, 4, 6, 7,

    // Top face
    8, 9, 10, 8, 10, 11,

    // Bottom face
    12, 13, 14, 12, 14, 15,

    // Right face
    16, 17, 18, 16, 18, 19,

    // Left face
    20, 21, 22, 20, 22, 23,
  ];
  squareVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  squareVertexIndexBuffer.itemSize = 1;
  squareVertexIndexBuffer.numItems = 36;

  var vertexNormals = [
    // Front face (z positive)
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

    // Back face (z negative)
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

    // Top face (y positive)
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // Bottom face (y negative)
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

    // Right face (x positive)
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

    // Left face (x negative)
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];
  // var faces = new Uint16Array(indices.length * 3);
  // for (var i = 0; i < indices.length; i++) {
  //   faces[i * 3] = indices[i + 1];
  //   faces[i * 3 + 1] = indices[i + 2];
  //   faces[i * 3 + 2] = indices[i + 3];
  // }
  // var surfaceNormals = computeSurfaceNormals(vertices, faces);
  // var vertexNormals = computeVertexNormals(vertices, faces, surfaceNormals);

  squareVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );
  squareVertexNormalBuffer.itemSize = 3;
  squareVertexNormalBuffer.numItems = 24;

  squareVertexTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordsBuffer);
  var textureCoords = [
    // Front face
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

    // Back face
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

    // Top face
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,

    // Bottom face
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // Right face
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

    // Left face
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ];
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  squareVertexTextureCoordsBuffer.itemSize = 2;
  squareVertexTextureCoordsBuffer.numItems = 24;

  squareVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  var colors = [
    // Front face (red)
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

    // Back face (green)
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // Top face (blue)
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

    // Bottom face (yellow)
    1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0,

    // Right face (purple)
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

    // Left face (cyan)
    0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  squareVertexColorBuffer.itemSize = 3;
  squareVertexColorBuffer.numItems = 24;

  // sphere buffers init
  var sphereData = createSphere(1.0, 30, 30, 1);
  sphereVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphereData.vertices, gl.STATIC_DRAW);
  sphereVertexPositionBuffer.itemSize = 3;
  sphereVertexPositionBuffer.numItems = sphereData.vertices.length / 3;

  var faces = new Uint16Array(sphereData.indices.length * 3);
  for (var i = 0; i < sphereData.indices.length; i++) {
    faces[i * 3] = sphereData.indices[i + 1];
    faces[i * 3 + 1] = sphereData.indices[i + 2];
    faces[i * 3 + 2] = sphereData.indices[i + 3];
  }

  var surfaceNormals = computeSurfaceNormals(sphereData.vertices, faces);
  var vertexNormals = computeVertexNormals(
    sphereData.vertices,
    faces,
    surfaceNormals
  );

  sphereVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );
  sphereVertexNormalBuffer.itemSize = 3;
  sphereVertexNormalBuffer.numItems = vertexNormals.length / 3;

  sphereVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphereData.colors, gl.STATIC_DRAW);
  sphereVertexColorBuffer.itemSize = 3;
  sphereVertexColorBuffer.numItems = sphereData.vertices.length / 3;

  sphereVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereData.indices, gl.STATIC_DRAW);
  sphereVertexIndexBuffer.itemSize = 1;
  sphereVertexIndexBuffer.numItems = sphereData.indices.length;

  // dress cylinder buffers init
  var cylinderData = createCylinder(3.0, 1.0, 0.6, 30);
  cylinderVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cylinderData.vertices, gl.STATIC_DRAW);
  cylinderVertexPositionBuffer.itemSize = 3;
  cylinderVertexPositionBuffer.numItems = cylinderData.vertices.length / 3;

  var faces = new Uint16Array(cylinderData.indices.length * 3);
  for (var i = 0; i < cylinderData.indices.length; i++) {
    faces[i * 3] = cylinderData.indices[i + 1];
    faces[i * 3 + 1] = cylinderData.indices[i + 2];
    faces[i * 3 + 2] = cylinderData.indices[i + 3];
  }

  var surfaceNormals = computeSurfaceNormals(cylinderData.vertices, faces);
  var vertexNormals = computeVertexNormals(
    cylinderData.vertices,
    faces,
    surfaceNormals
  );

  cylinderVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );
  cylinderVertexNormalBuffer.itemSize = 3;
  cylinderVertexNormalBuffer.numItems = vertexNormals.length / 3;

  cylinderVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cylinderData.colors, gl.STATIC_DRAW);
  cylinderVertexColorBuffer.itemSize = 3;
  cylinderVertexColorBuffer.numItems = cylinderData.vertices.length / 3;

  cylinderVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cylinderData.indices, gl.STATIC_DRAW);
  cylinderVertexIndexBuffer.itemSize = 1;
  cylinderVertexIndexBuffer.numItems = cylinderData.indices.length;

  // leg cylinder buffers init
  var cylinderDataLeg = createCylinder(0.0, 0.5, 1.8, 30);
  cylinderLegVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderLegVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cylinderDataLeg.vertices, gl.STATIC_DRAW);
  cylinderLegVertexPositionBuffer.itemSize = 3;
  cylinderLegVertexPositionBuffer.numItems =
    cylinderDataLeg.vertices.length / 3;

  var faces = new Uint16Array(cylinderDataLeg.indices.length * 3);
  for (var i = 0; i < cylinderDataLeg.indices.length; i++) {
    faces[i * 3] = cylinderDataLeg.indices[i + 1];
    faces[i * 3 + 1] = cylinderDataLeg.indices[i + 2];
    faces[i * 3 + 2] = cylinderDataLeg.indices[i + 3];
  }

  var surfaceNormals = computeSurfaceNormals(cylinderDataLeg.vertices, faces);
  var vertexNormals = computeVertexNormals(
    cylinderDataLeg.vertices,
    faces,
    surfaceNormals
  );

  cylinderLegVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderLegVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );
  cylinderLegVertexNormalBuffer.itemSize = 3;
  cylinderLegVertexNormalBuffer.numItems = vertexNormals.length / 3;

  cylinderLegVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderLegVertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cylinderDataLeg.colors, gl.STATIC_DRAW);
  cylinderLegVertexColorBuffer.itemSize = 3;
  cylinderLegVertexColorBuffer.numItems = cylinderDataLeg.vertices.length / 3;

  cylinderLegVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderLegVertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    cylinderDataLeg.indices,
    gl.STATIC_DRAW
  );
  cylinderLegVertexIndexBuffer.itemSize = 1;
  cylinderLegVertexIndexBuffer.numItems = cylinderDataLeg.indices.length;

  // arm1 cylinder buffers init
  var cylinderDataArm1 = createCylinder(0.08, 0.08, 0.8, 30);
  cylinderArm1VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm1VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cylinderDataArm1.vertices, gl.STATIC_DRAW);
  cylinderArm1VertexPositionBuffer.itemSize = 3;
  cylinderArm1VertexPositionBuffer.numItems =
    cylinderDataArm1.vertices.length / 3;

  var faces = new Uint16Array(cylinderDataArm1.indices.length * 3);
  for (var i = 0; i < cylinderDataArm1.indices.length; i++) {
    faces[i * 3] = cylinderDataArm1.indices[i + 1];
    faces[i * 3 + 1] = cylinderDataArm1.indices[i + 2];
    faces[i * 3 + 2] = cylinderDataArm1.indices[i + 3];
  }

  var surfaceNormals = computeSurfaceNormals(cylinderDataArm1.vertices, faces);
  var vertexNormals = computeVertexNormals(
    cylinderDataArm1.vertices,
    faces,
    surfaceNormals
  );

  cylinderArm1VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm1VertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );
  cylinderArm1VertexNormalBuffer.itemSize = 3;
  cylinderArm1VertexNormalBuffer.numItems = vertexNormals.length / 3;

  cylinderArm1VertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm1VertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cylinderDataArm1.colors, gl.STATIC_DRAW);
  cylinderArm1VertexColorBuffer.itemSize = 3;
  cylinderArm1VertexColorBuffer.numItems = cylinderDataArm1.vertices.length / 3;

  cylinderArm1VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderArm1VertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    cylinderDataArm1.indices,
    gl.STATIC_DRAW
  );
  cylinderArm1VertexIndexBuffer.itemSize = 1;
  cylinderArm1VertexIndexBuffer.numItems = cylinderDataArm1.indices.length;

  // arm2 cylinder buffers init
  var cylinderDataArm2 = createCylinder(0.08, 0.08, 0.8, 30);
  cylinderArm2VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm2VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cylinderDataArm2.vertices, gl.STATIC_DRAW);
  cylinderArm2VertexPositionBuffer.itemSize = 3;
  cylinderArm2VertexPositionBuffer.numItems =
    cylinderDataArm2.vertices.length / 3;

  var faces = new Uint16Array(cylinderDataArm2.indices.length * 3);
  for (var i = 0; i < cylinderDataArm2.indices.length; i++) {
    faces[i * 3] = cylinderDataArm2.indices[i + 1];
    faces[i * 3 + 1] = cylinderDataArm2.indices[i + 2];
    faces[i * 3 + 2] = cylinderDataArm2.indices[i + 3];
  }

  var surfaceNormals = computeSurfaceNormals(cylinderDataArm2.vertices, faces);
  var vertexNormals = computeVertexNormals(
    cylinderDataArm2.vertices,
    faces,
    surfaceNormals
  );

  cylinderArm2VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm2VertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );
  cylinderArm2VertexNormalBuffer.itemSize = 3;
  cylinderArm2VertexNormalBuffer.numItems = vertexNormals.length / 3;

  cylinderArm2VertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm2VertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cylinderDataArm2.colors, gl.STATIC_DRAW);
  cylinderArm2VertexColorBuffer.itemSize = 3;
  cylinderArm2VertexColorBuffer.numItems = cylinderDataArm2.vertices.length / 3;

  cylinderArm2VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderArm2VertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    cylinderDataArm2.indices,
    gl.STATIC_DRAW
  );
  cylinderArm2VertexIndexBuffer.itemSize = 1;
  cylinderArm2VertexIndexBuffer.numItems = cylinderDataArm2.indices.length;

  // 6 walls buffers init
  var vertices = [
    -10,
    -10,
    0, // bottom left
    10,
    -10,
    0, // bottom right
    10,
    10,
    0, // top right
    -10,
    10,
    0, // top left
  ];
  var normals = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0];
  var textureCoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
  var indices = [0, 1, 2, 0, 2, 3];
  wall1VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall1VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  wall1VertexPositionBuffer.itemSize = 3;
  wall1VertexPositionBuffer.numItems = vertices.length / 3;

  wall1VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall1VertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  wall1VertexNormalBuffer.itemSize = 3;
  wall1VertexNormalBuffer.numItems = normals.length / 3;

  wall1VertexTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall1VertexTextureCoordsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  wall1VertexTextureCoordsBuffer.itemSize = 2;
  wall1VertexTextureCoordsBuffer.numItems = textureCoords.length / 2;

  wall1VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall1VertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  wall1VertexIndexBuffer.itemSize = 1;
  wall1VertexIndexBuffer.numItems = indices.length;

  var vertices = [-10, -10, 0.0, -10, 10, 0.0, 10, 10, 0.0, 10, -10, 0.0];
  var normals = [
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
  ];
  var textureCoords = [1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0];
  var indices = [0, 1, 2, 0, 2, 3];
  wall2VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall2VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  wall2VertexPositionBuffer.itemSize = 3;
  wall2VertexPositionBuffer.numItems = vertices.length / 3;

  wall2VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall2VertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  wall2VertexNormalBuffer.itemSize = 3;
  wall2VertexNormalBuffer.numItems = normals.length / 3;

  wall2VertexTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall2VertexTextureCoordsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  wall2VertexTextureCoordsBuffer.itemSize = 2;
  wall2VertexTextureCoordsBuffer.numItems = textureCoords.length / 2;

  wall2VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall2VertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  wall2VertexIndexBuffer.itemSize = 1;
  wall2VertexIndexBuffer.numItems = indices.length;

  var vertices = [0.0, -10, -10, 0.0, -10, 10, 0.0, 10, 10, 0.0, 10, -10];
  var normals = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0];
  var textureCoords = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0];
  var indices = [0, 1, 2, 0, 2, 3];
  wall3VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall3VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  wall3VertexPositionBuffer.itemSize = 3;
  wall3VertexPositionBuffer.numItems = vertices.length / 3;

  wall3VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall3VertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  wall3VertexNormalBuffer.itemSize = 3;
  wall3VertexNormalBuffer.numItems = normals.length / 3;

  wall3VertexTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall3VertexTextureCoordsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  wall3VertexTextureCoordsBuffer.itemSize = 2;
  wall3VertexTextureCoordsBuffer.numItems = textureCoords.length / 2;

  wall3VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall3VertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  wall3VertexIndexBuffer.itemSize = 1;
  wall3VertexIndexBuffer.numItems = indices.length;

  var vertices = [0.0, 10, -10, 0.0, 10, 10, 0.0, -10, 10, 0.0, -10, -10];
  var normals = [
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];
  var textureCoords = [0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0];
  var indices = [0, 1, 2, 0, 2, 3];
  wall4VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall4VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  wall4VertexPositionBuffer.itemSize = 3;
  wall4VertexPositionBuffer.numItems = vertices.length / 3;

  wall4VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall4VertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  wall4VertexNormalBuffer.itemSize = 3;
  wall4VertexNormalBuffer.numItems = normals.length / 3;

  wall4VertexTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall4VertexTextureCoordsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  wall4VertexTextureCoordsBuffer.itemSize = 2;
  wall4VertexTextureCoordsBuffer.numItems = textureCoords.length / 2;

  wall4VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall4VertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  wall4VertexIndexBuffer.itemSize = 1;
  wall4VertexIndexBuffer.numItems = indices.length;

  var vertices = [-10, 0.0, -10, 10, 0.0, -10, 10, 0.0, 10, -10, 0.0, 10];
  var normals = [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0];
  var textureCoords = [0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0];
  var indices = [0, 1, 2, 0, 2, 3];
  wall5VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall5VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  wall5VertexPositionBuffer.itemSize = 3;
  wall5VertexPositionBuffer.numItems = vertices.length / 3;

  wall5VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall5VertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  wall5VertexNormalBuffer.itemSize = 3;
  wall5VertexNormalBuffer.numItems = normals.length / 3;

  wall5VertexTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall5VertexTextureCoordsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  wall5VertexTextureCoordsBuffer.itemSize = 2;
  wall5VertexTextureCoordsBuffer.numItems = textureCoords.length / 2;

  wall5VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall5VertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  wall5VertexIndexBuffer.itemSize = 1;
  wall5VertexIndexBuffer.numItems = indices.length;

  var vertices = [-10, 0.0, 10, 10, 0.0, 10, 10, 0.0, -10, -10, 0.0, -10];
  var normals = [
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
  ];
  var textureCoords = [1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0];
  var indices = [0, 1, 2, 0, 2, 3];
  wall6VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall6VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  wall6VertexPositionBuffer.itemSize = 3;
  wall6VertexPositionBuffer.numItems = vertices.length / 3;

  wall6VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall6VertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  wall6VertexNormalBuffer.itemSize = 3;
  wall6VertexNormalBuffer.numItems = normals.length / 3;

  wall6VertexTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wall6VertexTextureCoordsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  wall6VertexTextureCoordsBuffer.itemSize = 2;
  wall6VertexTextureCoordsBuffer.numItems = textureCoords.length / 2;

  wall6VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall6VertexIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  wall6VertexIndexBuffer.itemSize = 1;
  wall6VertexIndexBuffer.numItems = indices.length;
}

function initJSON() {
  let request = new XMLHttpRequest();
  request.open("GET", "mario.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedObject(JSON.parse(request.responseText));
    }
  };
  request.send();
}

function computeSurfaceNormals(verts, faces) {
  var surfaceNormals = new Float32Array(faces.length);
  const ntris = faces.length / 3;
  for (var i = 0; i < ntris; i++) {
    var tri = [faces[i * 3], faces[i * 3 + 1], faces[i * 3 + 2]];
    var p0 = [verts[tri[0] * 3], verts[tri[0] * 3 + 1], verts[tri[0] * 3 + 2]];
    var p1 = [verts[tri[1] * 3], verts[tri[1] * 3 + 1], verts[tri[1] * 3 + 2]];
    var p2 = [verts[tri[2] * 3], verts[tri[2] * 3 + 1], verts[tri[2] * 3 + 2]];

    var u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    var v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];

    surfaceNormals[i * 3] = u[1] * v[2] - u[2] * v[1];
    surfaceNormals[i * 3 + 1] = u[2] * v[0] - u[0] * v[2];
    surfaceNormals[i * 3 + 2] = u[0] * v[1] - u[1] * v[0];
  }
  return surfaceNormals;
}

function computeVertexNormals(verts, faces, surfaceNormals) {
  var vertexNormals = new Float32Array(verts.length);
  const npts = verts.length / 3;
  const ntris = faces.length / 3;
  for (var i = 0; i < ntris; i++) {
    var tri = [faces[i * 3], faces[i * 3 + 1], faces[i * 3 + 2]];

    for (var t = 0; t < 3; t++) {
      for (var j = 0; j < 3; j++) {
        vertexNormals[tri[t] * 3 + j] =
          vertexNormals[tri[t] * 3 + j] + surfaceNormals[i * 3 + j];
      }
    }
  }

  for (var i = 0; i < npts; i++) {
    var n = [
      vertexNormals[i * 3],
      vertexNormals[i * 3 + 1],
      vertexNormals[i * 3 + 2],
    ];
    var mag = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
    for (var j = 0; j < 3; j++)
      vertexNormals[i * 3 + j] = vertexNormals[i * 3 + j] / mag;
  }
  return vertexNormals;
}

var objectVertexPositionBuffer;
var objectVertexNormalBuffer;
var objectVertexTextureCoordsBuffer;
var objectVertexColorBuffer;
var objectVertexIndexBuffer;

function handleLoadedObject(objectData) {
  objectVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objectData.vertices),
    gl.STATIC_DRAW
  );
  objectVertexPositionBuffer.itemSize = 3;
  objectVertexPositionBuffer.numItems = objectData.vertices.length / 3;

  var faces = new Uint16Array((objectData.faces.length / 11) * 3);
  for (var i = 0; i < objectData.faces.length / 11; i++) {
    faces[i * 3] = objectData.faces[i * 11 + 1];
    faces[i * 3 + 1] = objectData.faces[i * 11 + 2];
    faces[i * 3 + 2] = objectData.faces[i * 11 + 3];
  }

  var surfaceNormals = computeSurfaceNormals(objectData.vertices, faces);
  var vertexNormals = computeVertexNormals(
    objectData.vertices,
    faces,
    surfaceNormals
  );

  objectVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );
  objectVertexNormalBuffer.itemSize = 3;
  objectVertexNormalBuffer.numItems = vertexNormals.length / 3;

  objectVertexTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexTextureCoordsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objectData.uvs[0]),
    gl.STATIC_DRAW
  );
  objectVertexTextureCoordsBuffer.itemSize = 2;
  objectVertexTextureCoordsBuffer.numItems = objectData.uvs[0].length / 2;

  var objectColors = new Float32Array(objectData.vertices.length);
  for (let i = 0; i < objectData.vertices.length / 3; i += 3) {
    objectColors[i] = 0;
    objectColors[i + 1] = 0;
    objectColors[i + 2] = 0;
  }
  objectVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexColorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(objectColors),
    gl.STATIC_DRAW
  );
  objectVertexColorBuffer.itemSize = 3;
  objectVertexColorBuffer.numItems = objectColors.length / 3;

  objectVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objectVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faces, gl.STATIC_DRAW);
  objectVertexIndexBuffer.itemSize = 1;
  objectVertexIndexBuffer.numItems = faces.length;

  drawScene();
  animate();
}

var lightVertexPositionBuffer;
var lightVertexNormalBuffer;
var lightVertexColorBuffer;
var lightVertexIndexBuffer;

function initLight() {
  // light buffers init
  var sphereData = createSphere(0.2, 30, 30, 2);
  lightVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lightVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphereData.vertices, gl.STATIC_DRAW);
  lightVertexPositionBuffer.itemSize = 3;
  lightVertexPositionBuffer.numItems = sphereData.vertices.length / 3;

  var lightNormals = new Float32Array(sphereData.vertices.length).fill(0);
  lightVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lightVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, lightNormals, gl.STATIC_DRAW);
  lightVertexNormalBuffer.itemSize = 3;
  lightVertexNormalBuffer.numItems = lightNormals.length / 3;

  lightVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lightVertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphereData.colors, gl.STATIC_DRAW);
  lightVertexColorBuffer.itemSize = 3;
  lightVertexColorBuffer.numItems = sphereData.vertices.length / 3;

  lightVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lightVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereData.indices, gl.STATIC_DRAW);
  lightVertexIndexBuffer.itemSize = 1;
  lightVertexIndexBuffer.numItems = sphereData.indices.length;
}

var mMatrix1 = mat4.create();
var mMatrix2 = mat4.create();
var mMatrix3 = mat4.create();
var mMatrix4 = mat4.create();
var mMatrix5 = mat4.create();
var mMatrix6 = mat4.create();

var mMatrix = mat4.create();
var vMatrix = mat4.create();
var pMatrix = mat4.create();
var nMatrix = mat4.create();
var v2wMatrix = mat4.create();

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
  gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
  gl.uniformMatrix4fv(shaderProgram.v2wMatrixUniform, false, v2wMatrix);
  gl.uniform1i(shaderProgram.use_textureUniform, use_texture);
  gl.uniform1i(shaderProgram.is_wallUniform, is_wall);
}

var Z_angle = 0.0;

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (
    objectVertexPositionBuffer == null ||
    objectVertexNormalBuffer == null ||
    objectVertexIndexBuffer == null
  ) {
    return;
  }
  // configure uniforms
  pMatrix = mat4.perspective(60, 1.0, 0.1, 100, pMatrix);

  vMatrix = mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0], vMatrix);

  vMatrix = mat4.rotate(vMatrix, degToRad(Z_angle), [0, 1, 0]);

  mat4.identity(mMatrix);

  mMatrix = mat4.rotate(mMatrix, degToRad(0), [0, 1, 0]);

  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);

  mat4.identity(v2wMatrix);
  v2wMatrix = mat4.multiply(v2wMatrix, vMatrix);
  v2wMatrix = mat4.transpose(v2wMatrix);

  gl.uniform4f(
    shaderProgram.light_posUniform,
    light_pos[0],
    light_pos[1],
    light_pos[2],
    light_pos[3]
  );
  gl.uniform4f(
    shaderProgram.ambient_coefUniform,
    mat_ambient[0],
    mat_ambient[1],
    mat_ambient[2],
    1.0
  );
  gl.uniform4f(
    shaderProgram.diffuse_coefUniform,
    mat_diffuse[0],
    mat_diffuse[1],
    mat_diffuse[2],
    1.0
  );
  gl.uniform4f(
    shaderProgram.specular_coefUniform,
    mat_specular[0],
    mat_specular[1],
    mat_specular[2],
    1.0
  );
  gl.uniform1f(shaderProgram.shininess_coefUniform, mat_shine[0]);

  gl.uniform4f(
    shaderProgram.light_ambientUniform,
    light_ambient[0],
    light_ambient[1],
    light_ambient[2],
    1.0
  );
  gl.uniform4f(
    shaderProgram.light_diffuseUniform,
    light_diffuse[0],
    light_diffuse[1],
    light_diffuse[2],
    1.0
  );
  gl.uniform4f(
    shaderProgram.light_specularUniform,
    light_specular[0],
    light_specular[1],
    light_specular[2],
    1.0
  );

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
  gl.uniform1i(shaderProgram.cube_map_textureUniform, 1);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sampleTexture);
  gl.uniform1i(shaderProgram.textureUniform, 0);

  // draw objects inheritated from lab3 (square, cylinder, cylinderLeg, cylinderArm1, cylinderArm2)
  var Mstack = [];
  var body = mat4.create();
  mat4.identity(body);

  // draw square
  mat4.identity(mMatrix1);
  mMatrix1 = mat4.scale(mMatrix1, [0.8, 0.8, 0.8]);
  mMatrix1 = mat4.translate(mMatrix1, [-2.0, 0, -1.5]);
  mMatrix1 = mat4.rotate(mMatrix1, degToRad(30), [0, 1, 0]);
  body = mat4.multiply(body, mMatrix1, body);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    squareVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    squareVertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    squareVertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    squareVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
  mMatrix = body;
  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);
  use_texture = 2;
  is_wall = 0;
  setMatrixUniforms();
  gl.drawElements(
    gl.TRIANGLES,
    squareVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
  PushMatrix(Mstack, body);

  // draw sphere
  var temp;
  var current;
  temp = PopMatrix(Mstack, temp);
  PushMatrix(Mstack, temp);
  mat4.identity(mMatrix2);
  mMatrix2 = mat4.scale(mMatrix2, [0.5, 0.5, 0.5]);
  mMatrix2 = mat4.translate(mMatrix2, [0, 2, 0]);
  current = mat4.multiply(temp, mMatrix2, current);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    sphereVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    objectVertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    sphereVertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    sphereVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
  mMatrix = current;
  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);
  use_texture = 1;
  setMatrixUniforms();
  gl.drawElements(
    gl.TRIANGLES,
    sphereVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
  PushMatrix(Mstack, current);

  // draw dress cylinder
  temp = PopMatrix(Mstack, temp);
  temp = PopMatrix(Mstack, temp);
  PushMatrix(Mstack, temp);
  mat4.identity(mMatrix3);
  mMatrix3 = mat4.scale(mMatrix3, [0.6, 0.6, 0.6]);
  mMatrix3 = mat4.translate(mMatrix3, [0, -1.4, 0]);
  current = mat4.multiply(temp, mMatrix3, current);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    cylinderVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    cylinderVertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    cylinderVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderVertexIndexBuffer);
  mMatrix = current;
  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);
  use_texture = 0;
  setMatrixUniforms();
  gl.drawElements(
    gl.LINES,
    cylinderVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
  PushMatrix(Mstack, current);

  // draw leg cylinder
  temp = PopMatrix(Mstack, temp);
  temp = PopMatrix(Mstack, temp);
  PushMatrix(Mstack, temp);
  mat4.identity(mMatrix4);
  mMatrix4 = mat4.translate(mMatrix4, [0, -2, 0]);
  current = mat4.multiply(temp, mMatrix4, current);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderLegVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    cylinderLegVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderLegVertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    cylinderLegVertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderLegVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    cylinderLegVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderLegVertexIndexBuffer);
  mMatrix = current;
  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);
  use_texture = 0;
  setMatrixUniforms();
  gl.drawElements(
    gl.LINES,
    cylinderLegVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
  PushMatrix(Mstack, current);

  // draw arm1 cylinder
  temp = PopMatrix(Mstack, temp);
  temp = PopMatrix(Mstack, temp);
  PushMatrix(Mstack, temp);
  mat4.identity(mMatrix5);
  mMatrix5 = mat4.translate(mMatrix5, [1.3, 0, 0]);
  mMatrix5 = mat4.rotate(mMatrix5, degToRad(90), [0, 0, 1]);
  current = mat4.multiply(temp, mMatrix5, current);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm1VertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    cylinderArm1VertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm1VertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    cylinderArm1VertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm1VertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    cylinderArm1VertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderArm1VertexIndexBuffer);
  mMatrix = current;
  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);
  use_texture = 0;
  setMatrixUniforms();
  gl.drawElements(
    gl.LINES,
    cylinderArm1VertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
  PushMatrix(Mstack, current);

  // draw arm2 cylinder
  temp = PopMatrix(Mstack, temp);
  PushMatrix(Mstack, temp);
  mat4.identity(mMatrix6);
  mMatrix6 = mat4.translate(mMatrix6, [0.1, -0.1, 0]);
  mMatrix6 = mat4.rotate(mMatrix6, degToRad(-100), [0, 0, 1]);
  current = mat4.multiply(temp, mMatrix6, current);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm2VertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    cylinderArm2VertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm2VertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    cylinderArm2VertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderArm2VertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    cylinderArm2VertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderArm2VertexIndexBuffer);
  mMatrix = current;
  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);
  use_texture = 0;
  setMatrixUniforms();
  gl.drawElements(
    gl.LINES,
    cylinderArm2VertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
  PushMatrix(Mstack, current);
  PopMatrix(Mstack, temp);
  PopMatrix(Mstack, temp);
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.5, 0, 0]);

  // draw imported JSON object
  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    objectVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    objectVertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    objectVertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, objectVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    objectVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objectVertexIndexBuffer);

  mat4.identity(nMatrix);
  nMatrix = mat4.multiply(nMatrix, vMatrix);
  nMatrix = mat4.multiply(nMatrix, mMatrix);
  nMatrix = mat4.inverse(nMatrix);
  nMatrix = mat4.transpose(nMatrix);
  use_texture = 2;
  is_wall = 0;
  setMatrixUniforms();

  gl.drawElements(
    gl.TRIANGLES,
    objectVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
  mat4.identity(mMatrix);

  // draw light
  gl.bindBuffer(gl.ARRAY_BUFFER, lightVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    lightVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, lightVertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    lightVertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, lightVertexColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexColorAttribute,
    lightVertexColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lightVertexIndexBuffer);

  mMatrix = mat4.translate(mMatrix, [light_pos[0], light_pos[1], light_pos[2]]);
  use_texture = 0;
  setMatrixUniforms();

  gl.drawElements(
    gl.TRIANGLES,
    lightVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );

  // bind wall texture and draw 6 walls
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  gl.uniform1i(shaderProgram.textureUniform, 0);

  // first wall
  gl.bindBuffer(gl.ARRAY_BUFFER, wall1VertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    wall1VertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall1VertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    wall1VertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall1VertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    wall1VertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall1VertexIndexBuffer);
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0, 0, -10]);
  use_texture = 2;
  is_wall = 1;
  setMatrixUniforms();

  gl.drawElements(
    gl.TRIANGLES,
    wall1VertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );

  // second wall
  gl.bindBuffer(gl.ARRAY_BUFFER, wall2VertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    wall2VertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall2VertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    wall2VertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall2VertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    wall2VertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall2VertexIndexBuffer);
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0, 0, 10]);
  use_texture = 2;
  is_wall = 1;
  setMatrixUniforms();

  gl.drawElements(
    gl.TRIANGLES,
    wall2VertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );

  // third wall
  gl.bindBuffer(gl.ARRAY_BUFFER, wall3VertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    wall3VertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall3VertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    wall3VertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall3VertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    wall3VertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall3VertexIndexBuffer);
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [-10, 0, 0]);
  use_texture = 2;
  is_wall = 1;
  setMatrixUniforms();

  gl.drawElements(
    gl.TRIANGLES,
    wall3VertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );

  // forth wall
  gl.bindBuffer(gl.ARRAY_BUFFER, wall4VertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    wall4VertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall4VertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    wall4VertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall4VertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    wall4VertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall4VertexIndexBuffer);
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [10, 0, 0]);
  use_texture = 2;
  is_wall = 1;
  setMatrixUniforms();

  gl.drawElements(
    gl.TRIANGLES,
    wall4VertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );

  // fifth wall
  gl.bindBuffer(gl.ARRAY_BUFFER, wall5VertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    wall5VertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall5VertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    wall5VertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall5VertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    wall5VertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall5VertexIndexBuffer);
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0, -10, 0]);
  use_texture = 2;
  is_wall = 1;
  setMatrixUniforms();

  gl.drawElements(
    gl.TRIANGLES,
    wall5VertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );

  // sixth wall
  gl.bindBuffer(gl.ARRAY_BUFFER, wall6VertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    wall6VertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall6VertexNormalBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexNormalAttribute,
    wall6VertexNormalBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, wall6VertexTextureCoordsBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexTexCoordsAttribute,
    wall6VertexTextureCoordsBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wall6VertexIndexBuffer);
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0, 10, 0]);
  use_texture = 2;
  is_wall = 1;
  setMatrixUniforms();

  gl.drawElements(
    gl.TRIANGLES,
    wall6VertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

document.onkeydown = function onKeyDown(event) {
  if (event.key == "d") {
    light_pos[0] += 1;
    drawScene();
  } else if (event.key == "a") {
    light_pos[0] -= 1;
    drawScene();
  } else if (event.key == "w") {
    light_pos[1] += 1;
    drawScene();
  } else if (event.key == "s") {
    light_pos[1] -= 1;
    drawScene();
  } else if (event.key == "q") {
    light_pos[2] += 1;
    drawScene();
  } else if (event.key == "e") {
    light_pos[2] -= 1;
    drawScene();
  }
};

var lastMouseX = 0,
  lastMouseY = 0;

function onDocumentMouseDown(event) {
  event.preventDefault();
  document.addEventListener("mousemove", onDocumentMouseMove, false);
  document.addEventListener("mouseup", onDocumentMouseUp, false);
  document.addEventListener("mouseout", onDocumentMouseOut, false);
  var mouseX = event.clientX;
  var mouseY = event.clientY;

  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function onDocumentMouseMove(event) {
  var mouseX = event.clientX;
  var mouseY = event.ClientY;

  var diffX = mouseX - lastMouseX;
  var diffY = mouseY - lastMouseY;

  Z_angle = Z_angle + diffX / 5;

  lastMouseX = mouseX;
  lastMouseY = mouseY;

  drawScene();
}

function onDocumentMouseUp(event) {
  document.removeEventListener("mousemove", onDocumentMouseMove, false);
  document.removeEventListener("mouseup", onDocumentMouseUp, false);
  document.removeEventListener("mouseout", onDocumentMouseOut, false);
}

function onDocumentMouseOut(event) {
  document.removeEventListener("mousemove", onDocumentMouseMove, false);
  document.removeEventListener("mouseup", onDocumentMouseUp, false);
  document.removeEventListener("mouseout", onDocumentMouseOut, false);
}

function webGLStart() {
  var canvas = document.getElementById("canvas");
  initGL(canvas);
  initShaders();

  gl.enable(gl.DEPTH_TEST);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "vertexPosition"
  );
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(
    shaderProgram,
    "vertexNormal"
  );
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.vertexTexCoordsAttribute = gl.getAttribLocation(
    shaderProgram,
    "vertexTexCoords"
  );
  gl.enableVertexAttribArray(shaderProgram.vertexTexCoordsAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(
    shaderProgram,
    "vertexColor"
  );
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "mMatrix"
  );
  shaderProgram.vMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "vMatrix"
  );
  shaderProgram.pMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "pMatrix"
  );
  shaderProgram.nMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "nMatrix"
  );
  shaderProgram.v2wMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "v2wMatrix"
  );

  shaderProgram.light_posUniform = gl.getUniformLocation(
    shaderProgram,
    "light_pos"
  );
  shaderProgram.ambient_coefUniform = gl.getUniformLocation(
    shaderProgram,
    "ambient_coef"
  );
  shaderProgram.diffuse_coefUniform = gl.getUniformLocation(
    shaderProgram,
    "diffuse_coef"
  );
  shaderProgram.specular_coefUniform = gl.getUniformLocation(
    shaderProgram,
    "specular_coef"
  );
  shaderProgram.shininess_coefUniform = gl.getUniformLocation(
    shaderProgram,
    "mat_shininess"
  );

  shaderProgram.light_ambientUniform = gl.getUniformLocation(
    shaderProgram,
    "light_ambient"
  );
  shaderProgram.light_diffuseUniform = gl.getUniformLocation(
    shaderProgram,
    "light_diffuse"
  );
  shaderProgram.light_specularUniform = gl.getUniformLocation(
    shaderProgram,
    "light_specular"
  );

  shaderProgram.textureUniform = gl.getUniformLocation(
    shaderProgram,
    "myTexture"
  );
  shaderProgram.cube_map_textureUniform = gl.getUniformLocation(
    shaderProgram,
    "cubeMap"
  );
  shaderProgram.use_textureUniform = gl.getUniformLocation(
    shaderProgram,
    "use_texture"
  );
  shaderProgram.is_wallUniform = gl.getUniformLocation(
    shaderProgram,
    "is_wall"
  );

  // init textures
  sampleTexture = loadTexture(gl, "mario.jpg");
  wallTexture = loadTexture(gl, "brick.png");
  initCubeMap();

  // init buffers for objects inheritated from lab3
  initBuffers();
  // init buffers for light
  initLight();
  // init buffers for imported JSON object and draw scene
  initJSON();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  document.addEventListener("mousedown", onDocumentMouseDown, false);
}

function animate() {
  drawScene();
  requestAnimationFrame(animate);
}

function createSphere(radius, latBands, longBands, color) {
  var vertices = [];
  var indices = [];
  var colors = [];

  // Generate vertices for UV sphere
  for (let latNumber = 0; latNumber <= latBands; latNumber++) {
    let theta = (latNumber * Math.PI) / latBands;
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);

    for (let longNumber = 0; longNumber <= longBands; longNumber++) {
      let phi = (longNumber * 2 * Math.PI) / longBands;
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);

      let x = cosPhi * sinTheta;
      let y = cosTheta;
      let z = sinPhi * sinTheta;

      vertices.push(radius * x);
      vertices.push(radius * -y);
      vertices.push(radius * z);

      if (color == 1) {
        colors.push(1.0);
        colors.push(0.0);
        colors.push(0.0);
      } else if (color == 2) {
        colors.push(1.0);
        colors.push(1.0);
        colors.push(1.0);
      }
    }
  }

  // Generate indices for the vertices
  for (let latNumber = 0; latNumber < latBands; latNumber++) {
    for (let longNumber = 0; longNumber < longBands; longNumber++) {
      let first = latNumber * (longBands + 1) + longNumber;
      let second = first + longBands + 1;

      indices.push(first);
      indices.push(second);
      indices.push(first + 1);

      indices.push(second);
      indices.push(second + 1);
      indices.push(first + 1);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    colors: new Float32Array(colors),
  };
}

function createCylinder(baseRadius, topRadius, height, segments) {
  var vertices = [];
  var indices = [];
  var colors = [];

  // Generate vertices
  for (let i = 0; i <= segments; i++) {
    let theta = (i * 2 * Math.PI) / segments;
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);

    // Bottom circle vertex
    vertices.push(baseRadius * cosTheta);
    vertices.push(0);
    vertices.push(baseRadius * sinTheta);

    // Top circle vertex
    vertices.push(topRadius * cosTheta);
    vertices.push(height);
    vertices.push(topRadius * sinTheta);

    colors.push(1.0);
    colors.push(0.0);
    colors.push(0.0);

    colors.push(0.0);
    colors.push(1.0);
    colors.push(0.0);
  }

  // Generate indices
  for (let i = 0; i < segments; i++) {
    let bottomLeft = 2 * i;
    let topLeft = 2 * i + 1;
    let bottomRight = 2 * i + 2;
    let topRight = 2 * i + 3;

    // First triangle (bottom-left, top-left, bottom-right)
    indices.push(bottomLeft);
    indices.push(topLeft);
    indices.push(bottomRight);

    // Second triangle (top-left, top-right, bottom-right)
    indices.push(topLeft);
    indices.push(topRight);
    indices.push(bottomRight);
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    colors: new Float32Array(colors),
  };
}

function PushMatrix(stack, matrix) {
  var copy = mat4.create();
  mat4.set(matrix, copy);
  stack.push(copy);
}

function PopMatrix(stack, copy) {
  if (stack.length == 0) {
    throw "Invalid popMatrix!";
  }
  copy = stack.pop();
  return copy;
}
