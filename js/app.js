/*
My WebGL App
*/
let mainContainer = null;
let fpsContainer
let stats = null;
let camera = null;
let MeshBox = null;
//you don't have to set null, it's undefined by default.
let ground;

let renderer = null;
let scene = null;
let controls = null;
//moved this up here, you can do it with a single caster.
let raycaster = new THREE.Raycaster();
let objects = [];
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
// Global variables

function init() {
  if (THREE.WEBGL.isWebGLAvailable() === false) container.appendChild(WEBGL.getWebGLErrorMessage());
  fpsContainer = document.querySelector('#fps');
  mainContainer = document.querySelector('#webgl-secne');
  scene = new THREE.Scene();
  //add a down vector for easy access for ground raycasting
  scene.down = scene.up.clone().multiplyScalar(-1);
  scene.background = new THREE.Color(0xEEEEEE); // http://www.colorpicker.com/
  scene.fog = new THREE.Fog(0xffffff, 0, 750);



  createStats();
  createCamera();
  createControls();
  createLights();
  createMeshes();
  createRenderer();

  // I did not know about setAnimationLoop, it is nice. This function replaces the 
  // requestAnimationFrame api, it starts automatically, you shouldn't call that function in
  // the animate function again.
  renderer.setAnimationLoop(() => {
    
    animate(); //move the character
    
    update(); //move that MeshBox (what does it do!?) to the new camera position.

    render(); // you should only render the scene once, at the end.
  });
}

// Animations
function update() {

  MeshBox.position.x = camera.position.x;
  MeshBox.position.y = camera.position.y;
  MeshBox.position.z = camera.position.z;
}


function animate() {

  if (controls.isLocked === true) {
    
        

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
    
    direction.z = Number( moveBackward ) - Number( moveForward );
    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.normalize(); // this ensures consistent movements in all directions



    // Direction raycast
    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

    // if player is moving
    if (direction.length() > 0){
      
      // the vec3 direction is in local space (actual left-right front/backwrds of the camera), 
      // this rotates it to a global space direction vector, for raycasting.
      let rotatedDirection = direction.clone();
      rotatedDirection.applyEuler( controls.getObject().rotation );
      
      // set a ray from the camera position in the direction that you are walking
      raycaster.set( controls.getObject().position, rotatedDirection);      
      let directionCast = raycaster.intersectObjects( objects );
      
      // decide if you want to add the movement direction to the velocity
      if (directionCast.length > 0 && directionCast[0].distance < 10){
        direction.multiplyScalar(0);
        velocity.x *= 0;
        velocity.z *= 0;
      }
      
    }
    


    // add to the velocity
    velocity.z -= direction.z * 400.0 * delta;      
    velocity.x += direction.x * 400.0 * delta;

    // add to controller
    controls.moveRight( velocity.x * delta );
    controls.moveForward( velocity.z * delta );  

    controls.getObject().position.y += velocity.y * delta; 

    


    // Ground casting
    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv    
    raycaster.set( controls.getObject().position, scene.down);

    let intersects = raycaster.intersectObjects( objects.concat( [ground] ));
      
    if (intersects.length == 0 || intersects[0].distance < 10){
      velocity.y = Math.max(0, velocity.y);
      
      // in case of no intersection, the camera is under the ground, so set the y to 10;
      // if there is an intersection with the objects or the ground, set its height to that point + 10;
      // you can also write this as;
      // let y = (intersects.length > 0) ? intersects[0].point.y + 10 : 10;
      let y = 10;
      if (intersects.length > 0) y = intersects[0].point.y + 10;

      controls.getObject().position.y = y;
      canJump = true; 
    }
    
    prevTime = time;



    // You can do it like this too. Looping over all the objects, then raycasting all their vertices.
    // I'm still not sure why that meshBox is there ;p 

    // MeshBox.geometry.vertices doesn't exist anyway because it's a BufferGeometry. 
    // BufferGeometry hold their vertices in an 1d array in the MeshBox.geometry.attributes.position.array.
    // That is faster to render and a good use for the object boxes.
    
    // If you set the meshbox to be a normal geometry, you can then for example use it like this;
    // For every object copy the object position (and rotation) to the meshbox. Then raycast each vertex of the box.

    
    
    //let originPoint = MeshBox.position.clone();      
    //for (let vertexIndex = 0; vertexIndex < MeshBox.geometry.vertices.length; vertexIndex++)
    //{		
      //let localVertex = MeshBox.geometry.vertices[vertexIndex].clone();
      //let globalVertex = localVertex.applyMatrix4( MeshBox.matrix );
      //let directionVector = globalVertex.sub( MeshBox.position );
      
      //let ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
      //let collisionResults = ray.intersectObjects( objects );
      //if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
        //appendText(" Hit ");
    //}

  }  
}


// Statically rendered content
function render() {

  stats.begin();
  renderer.render(scene, camera);
  stats.end();

}

// FPS counter
function createStats() {
  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  fpsContainer.appendChild(stats.dom);
}

// Camera object
function createCamera() {
  const aspect = mainContainer.clientWidth / mainContainer.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1 , 500);
  camera.position.set(0, 10, 0);
}

// Interactive controls
function createControls() {
  controls = new THREE.PointerLockControls(camera, document.body);
  var blocker = document.getElementById('blocker');
  var instructions = document.getElementById('instructions');
  instructions.addEventListener('click', function() {
    controls.lock();
  }, false);
  controls.addEventListener('lock', function() {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
  });
  controls.addEventListener('unlock', function() {
    blocker.style.display = 'block';
    instructions.style.display = '';
  });
  scene.add(controls.getObject());
  var onKeyDown = function(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = true;
        break;
      case 37: // left
      case 65: // a
        moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        moveRight = true;
        break;
      case 32: // space
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };
  var onKeyUp = function(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = false;
        break;
      case 37: // left
      case 65: // a
        moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        moveRight = false;
        break;
    }
  };
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  
}

// Light objects
function createLights() {

}

// Meshes and other visible objects
function createMeshes() {

  const geo = new THREE.PlaneBufferGeometry(1000, 1000);
  const mat = new THREE.MeshBasicMaterial({color: 0x98FB98});
  ground = new THREE.Mesh(geo, mat);
  ground.rotateX(-Math.PI / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  const boxSize = 20;
  const geometry = new THREE.BoxBufferGeometry(boxSize, boxSize, boxSize, 1, 1, 1);
  geometry.computeBoundingBox();
  const material = new THREE.MeshBasicMaterial({color: 0xff0022});

  //more cubes
  for (let i = 0; i < 50; i++){
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set( 
      40 + (Math.random() * 100) * Math.sign( -1 + Math.random() * 2 ),
      (boxSize / 2) + Math.floor(Math.random() * 6) * boxSize,
      40 + (Math.random() * 100) * Math.sign( -1 + Math.random() * 2 )
    );
    scene.add(cube);
    objects.push(cube);
  }
  

  const MeshBoxGeo = new THREE.BoxBufferGeometry(1, 2.5, 1,1 ,1 ,1);
  const MeshBoXMat = new THREE.MeshBasicMaterial({color:0xFF0000});
  MeshBox = new THREE.Mesh(MeshBoxGeo, MeshBoXMat);
  //scene.add(MeshBox);
  //what is this?! lol.

}

// Renderer object and features
function createRenderer() {
  //added antialias
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(mainContainer.clientWidth, mainContainer.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  //renderer.setClearColor(0xEEEEEE);
  mainContainer.appendChild(renderer.domElement);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);
init();
