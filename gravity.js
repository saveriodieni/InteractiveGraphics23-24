class Vec3 {
	constructor( x, y, z ) { this.init(x,y,z); }
	init( x, y, z ) { this.x=x; this.y=y; this.z=z; }
	copy ( ) { return new Vec3( this.x, this.y, this.z ); }
	set  (v) { this.x =v.x; this.y =v.y; this.z =v.z; }
	inc  (v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; }
	dec  (v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; }
	scale(f) { this.x*=f; this.y*=f; this.z*=f; }
	add  (v) { return new Vec3( this.x+v.x, this.y+v.y, this.z+v.z ); }
	sub  (v) { return new Vec3( this.x-v.x, this.y-v.y, this.z-v.z ); }
	dot  (v) { return this.x*v.x + this.y*v.y + this.z*v.z; }
	cross(v) { return new Vec3( this.y*v.z-this.z*v.y, this.z*v.x-this.x*v.z, this.x*v.y-this.y*v.x ); }
	mul  (f) { return new Vec3( this.x*f, this.y*f, this.z*f ); }
	div  (f) { return new Vec3( this.x/f, this.y/f, this.z/f ); }
	len2 ( ) { return this.dot(this); }
	len  ( ) { return Math.sqrt(this.len2()); }
	unit ( ) { return this.div(this.len()); }
	normalize() {
		var l = this.len();
		this.x /= l;
		this.y /= l;
		this.z /= l;
	}
	trans(m) {
		return {
			x: m[0]*this.x + m[4]*this.y + m[ 8]*this.z + m[12],
			y: m[1]*this.x + m[5]*this.y + m[ 9]*this.z + m[13],
			z: m[2]*this.x + m[6]*this.y + m[10]*this.z + m[14],
			w: m[3]*this.x + m[7]*this.y + m[11]*this.z + m[15]
		};
	}
}

function ToVec3(a) { return new Vec3(a[0],a[1],a[2]); }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var iteration;
var holesQueue;
var whiteBallInHole = false;
var ballInHole=new Array(15).fill(false);
var previousPositions = undefined;

// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep(dt, positions, radii, velocities, muS, muD, particleMass, gravity, restitution, holes, omega , momentOfInertia) {

    for(var i=0;i<ballInHole.length;i++){
        if(!ballInHole[i]) break;
        else if(i==ballInHole.length-1){
            return;
        }
    }

    function nearToHole(index){
        for(var i=0;i<holes.length;i++){
            if((positions[index].sub(holes[i])).len()<0.3) return true;
        }
        return false;
    }
    var forces = Array(positions.length); // The total force per particle
    if (iteration === undefined){
        iteration = 0;
        holesQueue = Array(6).fill().map(() => []);
        previousPositions = new Array(positions.length).fill(new Vec3(0,0,0));
    }
    else iteration++;
    
    var sendImpule=true;
    for(var i=0;i<positions.length;i++){
        if(Math.sqrt(velocities[i].x*velocities[i].x + velocities[i].y * velocities[i].y)>0.01 && !ballInHole[i]){
            sendImpule=false;
            break;
        }
    }

    if(sendImpule && whiteBallInHole){
        if(velocities[15].z!=0.0){
            velocities[15]=new Vec3(0,0,0);
        }
        for(var i=0; i<holes.length;i++){
            sleep(2000);
            var collision=true;
            var aux;
            while(collision){
                collision=false;
                var x=Math.random()*4;
                if(x>2) x=x-2;
                else x=-x;
                aux=new Vec3(x,4,0);
                for(var i=0;i<positions.length-1;i++){
                    if((positions[i].sub(aux)).len()<2*radii[i]) collision=true;
                    continue;
                }
            }
            positions[15]=aux;
            velocities[15]=new Vec3(0,0,0);
            whiteBallInHole = false;
            break;
        }
    }
    
    // Compute the total force for each particle
    for (var i = 0; i < positions.length; i++) {
        forces[i] = new Vec3(0, 0, 0);
        if (positions[i].z > 0.01) forces[i] = gravity.mul(particleMass);

        // Apply an initial impulse to the last particle
        if (i == positions.length - 1 && iteration == 0) {
            var impulse = new Vec3(0, -5000.0, 0);
            forces[i] = forces[i].add(impulse);
        }
        else if(sendImpule && i == positions.length - 1 && !whiteBallInHole && iteration%10==0){
            var x = Math.random()*10000;
            var y = Math.random()*10000;
            if(x>5000) x=x-5000;
            else x=-x;
            if(y>5000) y=y-5000;
            else y=-y;
            var impulse = new Vec3(x, y, 0);
            forces[i] = forces[i].add(impulse);
        }
    }

    for (var i = 0; i < positions.length; i++) {
        if (velocities[i].len() < 0.01) {
            // Static friction
            var maxStaticFriction = particleMass * gravity.len() * muS;
            if (forces[i].len() < maxStaticFriction) {
                forces[i] = new Vec3(0, 0, 0);
            }
        } else {
            // Dynamic friction
			var aux=new Vec3(0,0,0);
			aux.x=velocities[i].x; aux.y=velocities[i].y; aux.z=velocities[i].z;
			aux.normalize();
            var frictionDirection = aux.mul(-1);
            var dynamicFrictionMagnitude = particleMass * gravity.len() * muD;
            var dynamicFriction = frictionDirection.mul(dynamicFrictionMagnitude);
            forces[i] = forces[i].add(dynamicFriction);
        }

        if (velocities[i].len() > 0.01) {
			let frictionForce = gravity.len() * muD * particleMass;
			let frictionTorque = velocities[i].mul(frictionForce * radii[i]);
			let angularAcceleration = frictionTorque.div(momentOfInertia);
			omega[i] = omega[i].add(angularAcceleration.mul(dt));
		}
    }

    // Update positions, velocities, and angular velocities
	for (var i = 0; i < positions.length; i++) {
		var a = forces[i].div(particleMass);
		velocities[i] = velocities[i].add(a.mul(dt));
		positions[i] = positions[i].add(velocities[i].mul(dt));

		// Apply rolling resistance to slow down spin
		let rollingResistance = muD * gravity.len() * radii[i] / momentOfInertia;
		omega[i] = omega[i].mul(1 - rollingResistance * dt);

		// Apply linear motion due to spin (gyroscopic effect)
		velocities[i] = velocities[i].add(omega[i].mul(dt*radii[i]));
	}

    // Handle collisions between spheres
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            let diff = positions[j].sub(positions[i]);
            let dist = diff.len();
            let overlap = radii[i] + radii[j] - dist;

            if (overlap > 0) {
                let normal = diff.unit();
                let relativeVelocity = velocities[j].sub(velocities[i]);
                let velocityAlongNormal = relativeVelocity.dot(normal);

                let impulseMagnitude = -(1 + restitution) * velocityAlongNormal / (2 / particleMass);
                let impulse = normal.mul(impulseMagnitude);

                velocities[i].dec(impulse.div(particleMass));
                velocities[j].inc(impulse.div(particleMass));

                // Positional correction to avoid sinking into each other
                let correction = normal.mul(overlap / 2);
                positions[i].dec(correction);
                positions[j].inc(correction);
            }
        }
    }

    // Handle collisions with ground and walls
    for (var i = 0; i < positions.length; i++) {
        if((Math.abs(positions[i].x)+radii[i])>2.7 && (Math.abs(positions[i].y)+radii[i])>5.25){ // {up-left,up-right,bottom-left,bottom-right} hole
            if(nearToHole(i)){
                positions[i].x=3.0*Math.sign(positions[i].x);
                if(positions[i].z>=0.0) positions[i].z=-0.2;
                positions[i].y=5.55*Math.sign(positions[i].y);
                if(positions[i].z>-1.0){velocities[i]=new Vec3(0,0,gravity.z*particleMass);}
                else velocities[i]=new Vec3(0,0,0);
                if(i==15) whiteBallInHole=true;
            }
            else if((Math.abs(positions[i].x)+radii[i])>=2.8 && (Math.abs(positions[i].y)+radii[i])>=5.35){ // avoiding errors between subsequent events
                positions[i].x=3.0*Math.sign(positions[i].x);
                if(positions[i].z>=0.0) positions[i].z=-0.2;
                positions[i].y=5.55*Math.sign(positions[i].y);
                if(positions[i].z>-1.0){velocities[i]=new Vec3(0,0,gravity.z*particleMass);}
                else velocities[i]=new Vec3(0,0,0);
                if(i==15) whiteBallInHole=true;
            }
            else{
                if((Math.abs(positions[i].x)+radii[i])>=2.85){//{left,right} wall
                    var lengthPos=velocities[i].len();
                    var holeCoordinates=new Vec3(3.0*Math.sign(positions[i].x),5.55*Math.sign(positions[i].y),0);
                    var lengthHole=holeCoordinates.len();
                    cosTheta=(positions[i].dot(holeCoordinates))/(lengthHole*lengthPos);
                    if(Math.abs(cosTheta)<=1.0){
                        sinTheta=Math.sqrt(1-cosTheta*cosTheta);
                        velocities[i].x = lengthPos*cosTheta*restitution*Math.sign(velocities[i].x);
                        velocities[i].y = lengthPos*sinTheta*restitution*Math.sign(velocities[i].y);
                    }
                }
                
                else if((Math.abs(positions[i].y)+radii[i])>=5.4){//{bottom,up} wall
                    var lengthPos=velocities[i].len();
                    var holeCoordinates=new Vec3(3.0*Math.sign(positions[i].x),5.55*Math.sign(positions[i].y),0);
                    var lengthHole=holeCoordinates.len();
                    cosTheta=(positions[i].dot(holeCoordinates))/(lengthHole*lengthPos);
                    if(Math.abs(cosTheta)<=1.0){
                        sinTheta=Math.sqrt(1-cosTheta*cosTheta);
                        velocities[i].x = lengthPos*cosTheta*restitution*Math.sign(velocities[i].x);
                        velocities[i].y = lengthPos*sinTheta*restitution*Math.sign(velocities[i].y);
                    }
                }
            }
        }

        else if((Math.abs(positions[i].y)+radii[i])<0.3 && (Math.abs(positions[i].x)+radii[i])>2.85){ // {left,right} hole
            if(nearToHole(i)){
                positions[i].x=3.0*Math.sign(positions[i].x);
                if(positions[i].z>=0.0) positions[i].z=-0.2;
                positions[i].y=0.0;
                if(positions[i].z>-1.0){velocities[i]=new Vec3(0,0,gravity.z*particleMass);}
                else {
                    positions[i].z=-1.0;
                    velocities[i]=new Vec3(0,0,0);
                }
                if(i==15) whiteBallInHole=true;
            }
            else{
                if((Math.abs(positions[i].x)+radii[i])>=2.85){//{left,right} wall
                    var lengthPos=velocities[i].len();
                    var holeCoordinates=new Vec3(3.0*Math.sign(positions[i].x),5.55*Math.sign(positions[i].y),0);
                    var lengthHole=holeCoordinates.len();
                    cosTheta=(positions[i].dot(holeCoordinates))/(lengthHole*lengthPos);
                    if(Math.abs(cosTheta)<=1.0){
                        sinTheta=Math.sqrt(1-cosTheta*cosTheta);
                        velocities[i].x = lengthPos*cosTheta*restitution*Math.sign(velocities[i].x);
                        velocities[i].y = lengthPos*sinTheta*restitution*Math.sign(velocities[i].y);
                    }
                }
                
                else if((Math.abs(positions[i].y)+radii[i])>=5.4){//{bottom,up} wall
                    var lengthPos=velocities[i].len();
                    var holeCoordinates=new Vec3(3.0*Math.sign(positions[i].x),5.55*Math.sign(positions[i].y),0);
                    var lengthHole=holeCoordinates.len();
                    cosTheta=(positions[i].dot(holeCoordinates))/(lengthHole*lengthPos);
                    if(Math.abs(cosTheta)<=1.0){
                        sinTheta=Math.sqrt(1-cosTheta*cosTheta);
                        velocities[i].x = lengthPos*cosTheta*restitution*Math.sign(velocities[i].x);
                        velocities[i].y = lengthPos*sinTheta*restitution*Math.sign(velocities[i].y);
                    }
                }
            }
        }

        else if((Math.abs(positions[i].x)+radii[i])>=2.85){//{left,right} wall
            positions[i].x=2.85*Math.sign(positions[i].x)-radii[i]*Math.sign(positions[i].x);
            velocities[i].x = -velocities[i].x * restitution;
        }
        
        else if((Math.abs(positions[i].y)+radii[i])>=5.4){//{bottom,up} wall
            positions[i].y=5.4*Math.sign(positions[i].y)-radii[i]*Math.sign(positions[i].y);
            velocities[i].y = -velocities[i].y * restitution;
        }
    }

    // Apply small velocity threshold to stop the particle
    for (var i = 0; i < positions.length; i++) {
		if (Math.abs(velocities[i].x) < 0.01) velocities[i].x = 0;
		if (Math.abs(velocities[i].y) < 0.01) velocities[i].y = 0;
		if (Math.abs(velocities[i].z) < 0.01) velocities[i].z = 0;
		if (Math.abs(omega[i].x) < 0.01) omega[i].x = 0;
		if (Math.abs(omega[i].y) < 0.01) omega[i].y = 0;
		if (Math.abs(omega[i].z) < 0.01) omega[i].z = 0;
		if(positions[i].z < -1.0) {
			positions[i].z = -1.0;
            velocities[i].z = 0.0;
		}
	}

    // Reset particles that fall into holes and add to the queue
	for (var i = 0; i < positions.length; i++) {
        if((i!=15 && !ballInHole[i]) || i==15){
            if(positions[i].x==-3.0 && positions[i].y==5.55){
                if(!holesQueue[0].includes(i)){
                    if(holesQueue[0].length<3){
                        holesQueue[0].push(i);
                        if(i!=15) ballInHole[i]=true;
                    }
                    else{
                        var ballIndex=holesQueue[0].shift();
                        holesQueue[0].push(i);
                        if(i!=15) ballInHole[i]=true;
                        if(ballIndex!=15){
                            positions[ballIndex]=new Vec3(Math.random(),Math.random(),-1);
                            velocities[ballIndex]=new Vec3(0,0,0);
                        }
                    }
                }
            }
            else if(positions[i].x==3.0 && positions[i].y==5.55){
                if(!holesQueue[1].includes(i)){
                    if(holesQueue[1].length<3){
                        holesQueue[1].push(i);
                        if(i!=15) ballInHole[i]=true;
                    }
                    else{
                        var ballIndex=holesQueue[1].shift();
                        holesQueue[1].push(i);
                        if(i!=15) ballInHole[i]=true;
                        if(ballIndex!=15){
                            positions[ballIndex]=new Vec3(Math.random(),Math.random(),-1);
                            velocities[ballIndex]=new Vec3(0,0,0);
                        }
                    }
                }
            }
            else if(positions[i].x==-3.0 && positions[i].y==0.0){
                if(!holesQueue[2].includes(i)){
                    if(holesQueue[2].length<3){
                        holesQueue[2].push(i);
                        if(i!=15) ballInHole[i]=true;
                    }
                    else{
                        var ballIndex=holesQueue[2].shift();
                        holesQueue[2].push(i);
                        if(i!=15) ballInHole[i]=true;
                        if(ballIndex!=15){
                            positions[ballIndex]=new Vec3(Math.random(),Math.random(),-1);
                            velocities[ballIndex]=new Vec3(0,0,0);
                        }
                    }
                }
            }
            else if(positions[i].x==3.0 && positions[i].y==0.0){
                if(!holesQueue[3].includes(i)){
                    if(holesQueue[3].length<3){
                        holesQueue[3].push(i);
                        if(i!=15) ballInHole[i]=true;
                    }
                    else{
                        var ballIndex=holesQueue[3].shift();
                        holesQueue[3].push(i);
                        if(i!=15) ballInHole[i]=true;
                        if(ballIndex!=15){
                            positions[ballIndex]=new Vec3(Math.random(),Math.random(),-1);
                            velocities[ballIndex]=new Vec3(0,0,0);
                        }
                    }
                }
            }
            else if(positions[i].x==-3.0 && positions[i].y==-5.55){
                if(!holesQueue[4].includes(i)){
                    if(holesQueue[4].length<3){
                        holesQueue[4].push(i);
                        if(i!=15) ballInHole[i]=true;
                    }
                    else{
                        var ballIndex=holesQueue[4].shift();
                        holesQueue[4].push(i);
                        if(i!=15) ballInHole[i]=true;
                        if(ballIndex!=15){
                            positions[ballIndex]=new Vec3(Math.random(),Math.random(),-1);
                            velocities[ballIndex]=new Vec3(0,0,0);
                        }
                    }
                }
            }
            else if(positions[i].x==3.0 && positions[i].y==-5.55){
                if(!holesQueue[5].includes(i)){
                    if(holesQueue[5].length<3){
                        holesQueue[5].push(i);
                        if(i!=15) ballInHole[i]=true;
                    }
                    else{
                        var ballIndex=holesQueue[5].shift();
                        holesQueue[5].push(i);
                        if(i!=15) ballInHole[i]=true;
                        if(ballIndex!=15){
                            positions[ballIndex]=new Vec3(Math.random(),Math.random(),-1);
                            velocities[ballIndex]=new Vec3(0,0,0);
                        }
                    }
                }
            }	
        }	
	}

    for(var i=0;i<positions.length;i++){
        if(positions[i].x==previousPositions[i].x){
            velocities[i].x=0.0;
        }
        if(positions[i].y==previousPositions[i].y){
            velocities[i].y=0.0;
        }
        if(positions[i].z==previousPositions[i].z){
            velocities[i].z=0.0;
        }
        previousPositions[i]=positions[i];
    }

    for(var i=0;i<positions.length-1;i++){
        if(!ballInHole[i]){
            positions[i].z=0.0;
        }
    }

    if(positions[15].z<0.0 && !whiteBallInHole){
        positions[15].z=0.0;
    }
}