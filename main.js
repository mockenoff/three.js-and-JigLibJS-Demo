// JigLib vars

var system = jigLib.PhysicsSystem.getInstance();
var obj = [], pin = [], con = [], panel = null;
var now, then = new Date().getTime();

// THREE vars

var container, stats;
var grid = true, paused = false, worldPoint = true;

var camera, scene, renderer, projector, paused = false;

var cube, flap = [], offset = [-382.5,-191.25,0,191.25,382.5];
var ctimer = 0, timer = [];

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0, moveX = 0, moveY = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var PI2 = Math.PI / 2;

init();
animate();

function init() {

	// JigLib setup

	system.setGravity([0,-9.8,0,0]);//-120
	system.setSolverType('ACCUMULATED');//FAST, NORMAL, ACCUMULATED

	var ground = new jigLib.JPlane(null,[0, 1, 0, 0]);
	ground.set_friction(10);
	system.addBody(ground);
	ground.moveTo([0,-650,0,0]);

	panel = new jigLib.JBox(null, 925, 10, 460);
	panel.set_mass(50);
	panel.moveTo([0, 150, 0, 0]);
	panel.set_movable(false);
	system.addBody(panel);

	for(var i = 0; i < offset.length; i++) {

		obj[i] = new jigLib.JBox(null, 160, 10, 160);
		obj[i].set_mass(50);//100
		obj[i].set_friction(10);
		obj[i].moveTo([offset[i], (i % 2 == 1 ? -210 : -250), 0, 0]);
		system.addBody(obj[i]);

		if(worldPoint) {

			con[i] = new jigLib.JConstraintWorldPoint(obj[i], [0,80,0,0], [offset[i], (i % 2 == 1 ? -130 : -170), 0, 0]);
			system.addConstraint(con[i]);
		}
		else {

			pin[i] = new jigLib.JBox(null, 1, 1, 1);
			pin[i].moveTo([offset[i], 0, 0, 0]);
			pin[i].set_movable(false);
			system.addBody(pin[i]);

	//		con[i] = new jigLib.JConstraintMaxDistance(obj[i], jigLib.Vector3DUtil.Y_AXIS.slice(), pin[i], jigLib.Vector3DUtil.Y_AXIS.slice(), (i % 2 == 1 ? 130 : 170));
	//		con[i] = new jigLib.JConstraintMaxDistance(obj[i], [0,80,0,0], pin[i], jigLib.Vector3DUtil.Y_AXIS.slice(), (i % 2 == 1 ? 130 : 170));
			con[i] = new jigLib.JConstraintPoint(obj[i], [0,80,0,0], pin[i], jigLib.Vector3DUtil.Y_AXIS.slice(), (i % 2 == 1 ? 30 : 70));
			system.addConstraint(con[i]);
		}
	}

	// THREE setup

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.Camera( 45, window.innerWidth / window.innerHeight, 1, 3800 );
	camera.position.y = 50;
	camera.position.z = 2500;
	camera.target.position.y = 50;

	scene = new THREE.Scene();

	// Grid

	if(grid) {
		var geometry = new THREE.Geometry();
		geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( -1000, 0, 0 ) ) );
		geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( 1000, 0, 0 ) ) );

		for ( var i = 0; i <= 40; i ++ ) {

			var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } ) );
			line.position.z = ( i * 50 ) - 1000;
			line.position.y = -650;
			scene.addObject( line );

			var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } ) );
			line.position.x = ( i * 50 ) - 1000;
			line.position.y = -650;
			line.rotation.y = 90 * Math.PI / 180;
			scene.addObject( line );

		}
	}

	// Cube

	var materials = [];
	materials.push( [ new THREE.MeshBasicMaterial( { color: 0x0000ff } ) ] );		// Left side
	materials.push( [ new THREE.MeshBasicMaterial( { color: 0x666666 } ) ] );		// Right side
	materials.push( [ new THREE.MeshBasicMaterial( { color: 0xff0000 } ) ] );		// Top side
	materials.push( [ new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) ] );		// Bottom side
	materials.push( [ new THREE.MeshBasicMaterial( { color: 0xcccccc } ) ] );		// Front side
	materials.push( [ new THREE.MeshBasicMaterial( { color: 0x000000 } ) ] );		// Back side

	cube = new THREE.Mesh( new Cube( 925, 460, 10, 1, 1, 1, materials ), new THREE.MeshFaceMaterial() );
	cube.position.y = 150;
	cube.overdraw = true;
	scene.addObject( cube );

	// Flap
	for(var i = 0; i < offset.length; i++) {
		flap[i] = new THREE.Mesh( new Cube( 160, 160, 10, 1, 1, 1, materials ), new THREE.MeshFaceMaterial() );
		flap[i].identifier = i;
		flap[i].matrixAutoUpdate = false;
		flap[i].overdraw = true;
		flap[i].position.y = flap[i].originalY = (i % 2 == 1 ? -210 : -250);
		flap[i].position.x = offset[i];
		scene.addObject(flap[i]);
timer[i] = 0;
	}

	projector = new THREE.Projector();

	renderer = new THREE.CanvasRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'keydown', onDocumentKeydown, false );
}

// DOM Events

function onDocumentMouseDown( event ) {

	event.preventDefault();

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'mouseout', onDocumentMouseOut, false );

	mouseXOnMouseDown = event.clientX - windowHalfX;
	targetRotationOnMouseDown = targetRotation;

	// Click event

	var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
	projector.unprojectVector( vector, camera );

	var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );

	var intersects = ray.intersectScene( scene );

	if ( intersects.length > 0 && intersects[0].object != cube ) {

		var clicked = intersects[0].object.identifier;
		if(hasConstraint(system, con[clicked])) {

			console.log('remove '+clicked);
			system._constraints.splice(system._constraints.indexOf(con[clicked]),1);
		}
		else {

			console.log('add '+clicked);
			system.addConstraint(con[clicked]);
		}
		obj[clicked].setActive();
	}
}

function onDocumentMouseMove( event ) {

	mouseX = event.clientX - windowHalfX;
	targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
	moveX = event.clientX - windowHalfX;
	moveY = event.clientY - windowHalfY;
}

function onDocumentMouseUp( event ) {

	document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
	document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
	document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {

	document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
	document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
	document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentKeydown( event ) {

	switch(event.keyCode) {
		case 32: paused = paused ? false : true; break;
		case 38: camera.position.z -= 10; break;
		case 40: camera.position.z += 10; break;
	}
}

// Animation Loop

function animate() {

	requestAnimationFrame( animate );

//	camera.position.x += ( moveX - camera.position.x ) * 0.8;
//	camera.position.y += ( - moveY - camera.position.y ) * 0.8;

	if(paused) {
		then = new Date().getTime();
		return;
	}

	cube.rotation.y += ( targetRotation - cube.rotation.y ) * 0.05;
	panel.set_rotationY( cube.rotation.y * (180/Math.PI) );
	var cval = Math.cos(cube.rotation.y);
	var sval = Math.sin(cube.rotation.y);

	now = new Date().getTime();
	system.integrate((now - then) / 75);//400
	then = now;

	for(var i = 0; i < offset.length; i++) {

		if(worldPoint) {

			con[i].set_worldPosition([offset[i]*cval, flap[i].originalY+80, -offset[i]*sval, 0]);
		}
		else {

			pin[i].moveTo([(offset[i]) * cval, flap[i].originalY+80, -offset[i] * sval, 0]);
		}

		JL2THREE(flap[i], obj[i].get_currentState().position, obj[i].get_currentState().get_orientation().glmatrix);
	}

	if(isBetween(cube.rotation.y, (targetRotation - 0.0174532925), (targetRotation + 0.0174532925)) && isBetween((Math.abs(targetRotation) % Math.PI), 0.0174532925, 3.29867229)) {
		if(ctimer >= 300) {
			var lo = cube.rotation.y % Math.PI;
			if(lo < 0) targetRotation -= (Math.abs(lo) < PI2 ? lo : Math.PI + lo);
			else targetRotation += (Math.abs(lo) < PI2 ? -lo : Math.PI - lo);
			ctimer = 0;
		}
		else ctimer++;
	}
	else ctimer = 0;

	renderer.render( scene, camera );
	stats.update();

}

function alignCube(target, dir, rot) {
	var up = new THREE.Vector3(1, 0, 0);
	var angle = Math.acos(up.dot(dir));
	var axis = new THREE.Vector3();
	axis.cross(up, dir);
	axis.normalize();
	var position = THREE.Matrix4.translationMatrix( target.position.x, target.position.y, target.position.z );
	var rotate = THREE.Matrix4.rotationAxisAngleMatrix(axis, angle);
	var revolve = THREE.Matrix4.rotationAxisAngleMatrix(dir, rot);
	var scale = THREE.Matrix4.scaleMatrix( 1, 1, 1 );
	revolve.multiplySelf(rotate);
	position.multiplySelf(revolve);
	target.matrix = position;
}

function JL2THREE(target, pos, dir) {
	var position = THREE.Matrix4.translationMatrix( pos[0], pos[1], pos[2] );
	var rotate = new THREE.Matrix4(dir[0], dir[1], dir[2], dir[3], dir[4], dir[5], dir[6], dir[7], dir[8], dir[9], dir[10], dir[11], dir[12], dir[13], dir[14], dir[15]);
	position.multiplySelf(rotate);
	target.matrix = position;
	target.update(false, true, camera);
}

function MATRIX2ANGLE(mat) {
/*var theta = Math.acos((mat[0] + mat[5] + mat[10] - 1) / 2);
var e1 = (mat[9] - mat[6]) / (2 * Math.sin(theta));
var e2 = (mat[2] - mat[8]) / (2 * Math.sin(theta));
var e3 = (mat[4] - mat[1]) / (2 * Math.sin(theta));
console.log([e1,e2,e3]);*/
	return Math.acos((mat[0] + mat[5] + mat[10] - 1) / 2);
}

function hasConstraint(sys, con) {
	return (sys && con && sys._constraints.indexOf(con) >= 0 ? true : false);
}

function isBetween(val, min, max) {
	return (val >= min && val <= max ? true : false);
}