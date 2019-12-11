/*
My WebGL App
*/
let mainContainer = null;
let fpsContainer
let stats = null;
let camera = null;
let renderer = null;
let scene = null;
let controls = null;
let raycaster = null;
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

function init(){
	if ( THREE.WEBGL.isWebGLAvailable() === false ) container.appendChild( WEBGL.getWebGLErrorMessage() );
	fpsContainer = document.querySelector( '#fps' );
	mainContainer = document.querySelector( '#webgl-secne' );
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xEEEEEE );	// http://www.colorpicker.com/
	scene.fog = new THREE.Fog( 0xffffff, 0, 750 );



	createStats();
	createCamera();
	createControls();
	createLights();
	createMeshes();
	createRenderer();
	renderer.setAnimationLoop( () => {
    update();
	render();
	animate();
  } );
}

// Animations
function update(){

}

function animate() {

	requestAnimationFrame( animate );
	if ( controls.isLocked === true ) {
		raycaster.ray.origin.copy( controls.getObject().position );
		raycaster.ray.origin.y -= 10;
		var intersections = raycaster.intersectObjects( objects );
		var onObject = intersections.length > 0;
		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;
		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;
		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
		direction.z = Number( moveForward ) - Number( moveBackward );
		direction.x = Number( moveRight ) - Number( moveLeft );
		direction.normalize(); // this ensures consistent movements in all directions
		if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
		if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;
		if ( onObject === true ) {
			velocity.y = Math.max( 0, velocity.y );
			canJump = true;
		}

let collisionRange = 10; //if the mesh gets too close, the camera clips though the object...

    let tempVelocity = velocity.clone().multiplyScalar(delta) //get the delta velocity
    let nextPosition = controls.getObject().position.clone().add(tempVelocity);
    let tooClose = false;
    let playerPosition = controls.getObject().position;

    for (let i = 0; i < objects.length; i++) {
      let object = objects[i];
      let objectDirection = object.position.clone().sub(playerPosition).normalize();
      raycaster.set(nextPosition, objectDirection) //set the position and direction
      let directionIntersects = raycaster.intersectObject(object);
      if (directionIntersects.length > 0 && directionIntersects[0].distance < collisionRange) {
        //too close, stop player from moving in that direction...
        tooClose = true;
        break;
      }
    }




    if (tooClose == false) {
      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);
      controls.getObject().position.y += (velocity.y * delta); // new behavior
    }
		
		
		if ( controls.getObject().position.y < 10 ) {
			velocity.y = 0;
			controls.getObject().position.y = 10;
			canJump = true;
		}
		prevTime = time;
	}
	renderer.render( scene, camera );
}


// Statically rendered content
function render(){
	stats.begin();

	renderer.render( scene, camera );
	stats.end();
}

// FPS counter
function createStats(){
	stats = new Stats();
	stats.showPanel( 0 );	// 0: fps, 1: ms, 2: mb, 3+: custom
	fpsContainer.appendChild( stats.dom );
}

// Camera object
function createCamera(){
	const fov = 75;
	const aspect =  mainContainer.clientWidth / mainContainer.clientHeight;
	const near = 0.1;
	const far = 500;	// meters
	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set( 0, 10, 0 );
}

// Interactive controls
function createControls(){
	controls = new THREE.PointerLockControls( camera, document.body );
	var blocker = document.getElementById( 'blocker' );
				var instructions = document.getElementById( 'instructions' );
				instructions.addEventListener( 'click', function () {
					controls.lock();
				}, false );
				controls.addEventListener( 'lock', function () {
					instructions.style.display = 'none';
					blocker.style.display = 'none';
				} );
				controls.addEventListener( 'unlock', function () {
					blocker.style.display = 'block';
					instructions.style.display = '';
				} );
				scene.add( controls.getObject() );
				var onKeyDown = function ( event ) {
					switch ( event.keyCode ) {
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
							if ( canJump === true ) velocity.y += 350;
							canJump = false;
							break;
					}
				};
				var onKeyUp = function ( event ) {
					switch ( event.keyCode ) {
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
				document.addEventListener( 'keydown', onKeyDown, false );
				document.addEventListener( 'keyup', onKeyUp, false );

				raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, -1, 0 ),0,5);
				//raycaster2 = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 0 , -1 ),0,2);
				//raycaster2 = new THREE.Raycaster( new THREE.Vector2(), camera ); 	
}

// Light objects
function createLights(){

}

// Meshes and other visible objects
function createMeshes(){
	const geo = new THREE.PlaneBufferGeometry(1000, 1000);
	const mat = new THREE.MeshBasicMaterial({ color: 0x98FB98});
	const plane = new THREE.Mesh(geo, mat);
	plane.rotateX( - Math.PI / 2 );
	plane.receiveShadow = true;
	scene.add(plane);

	const geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
	const material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
	const cube = new THREE.Mesh( geometry, material );
	cube.position.x = 15;
	cube.position.z = 10;
	cube.position.y = 15;
	cube.receiveShadow = true;
	cube.castShadow = true;
	scene.add( cube );
	objects.push( cube );

}

// Renderer object and features
function createRenderer(){
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(mainContainer.clientWidth, mainContainer.clientHeight);
	renderer.setPixelRatio( window.devicePixelRatio );
	//renderer.setClearColor(0xEEEEEE);
	mainContainer.appendChild( renderer.domElement );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

window.addEventListener( 'resize', onWindowResize, false );
init();
