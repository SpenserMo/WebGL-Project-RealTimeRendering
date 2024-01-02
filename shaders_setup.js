// Code reference Han-Wei Shen (shen.94@osu.edu) https://github.com/hguo/WebGL-tutorial shader_setup.js

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else if (shaderScript.type == "fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else {
    return null;
  }
  gl.shaderSource(shader, str);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("Failed compiling shader.");
    return null;
  }
  return shader;
}

function initShaders() {
  shaderProgram = gl.createProgram();
  var verShader = getShader(gl, "vshader");
  var fragShader = getShader(gl, "fshader");
  gl.attachShader(shaderProgram, verShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed linking shader.");
  }
  gl.useProgram(shaderProgram);
  shaderProgram.vertexPotitionAttribute = gl.getAttribLocation(
    shaderProgram,
    "vertexPosition"
  );
  gl.enableVertexAttribArray(shaderProgram.vertexPotitionAttribute);
}
