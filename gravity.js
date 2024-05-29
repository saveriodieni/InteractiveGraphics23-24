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

var iteration;

// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, radii ,velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	/*if(forces === undefined){
		forces = Array( positions.length ); // The total for per particle
		iteration=0;
		// [TO-DO] Compute the total force of each particle
		for(var i=0;i<positions.length;i++){
			forces[i]=gravity.mul(particleMass);
			if(i==positions.length-1){
				var x = Math.random()*200;
				var y = Math.random()*200;
				if(x>=100) x=x-100;
				else x=-x;
				if(y>=100) y=y-100;
				else y=-y;
				var impulse=new Vec3(x,y,0);
				var impulse=new Vec3(0,-100,0);
				forces[i]=forces[i].add(impulse);
			}
		}
	}*/

	var forces = Array( positions.length ); // The total for per particle
	if (iteration === undefined) iteration=0;
	else iteration++;
	// [TO-DO] Compute the total force of each particle
	for(var i=0;i<positions.length;i++){
		forces[i]=new Vec3(0,0,0);
		if (positions[i].z>0.01) forces[i]=gravity.mul(particleMass);
		if(i==positions.length-1 && iteration==0){
			/*var x = Math.random()*200;
			var y = Math.random()*200;
			if(x>=100) x=x-100;
			else x=-x;
			if(y>=100) y=y-100;
			else y=-y;
			var impulse=new Vec3(x,y,0);*/
			var impulse=new Vec3(0,-1000.0,0);
			forces[i]=forces[i].add(impulse);
		}
	}

	/*if(Math.sqrt(forces[positions.length-1].x*forces[positions.length-1].x + forces[positions.length-1].y*forces[positions.length-1].y)<0.01){
		var x = Math.random()*100;
		var y = Math.random()*100;
		forces[positions.length-1].x=x;
		forces[positions.length-1].y=y;
	}*/
	
	//console.log("iteration "+iteration,forces,positions,velocities);
	for(var i=0; i<springs.length;i++){
		var k=springs[i].p0;
		var j=springs[i].p1;
		var p0=positions[k];
		var p1=positions[j];
		var v0=velocities[k];
		var v1=velocities[j];
		var diffp0_p1=p1.sub(p0);
		var l=(diffp0_p1.len());
		
		var d=diffp0_p1.div(l);
		var aux=stiffness*(l-springs[i].rest);
		var fs=d.mul(aux);
		
		var ldot=(v1.sub(v0)).dot(d);
		var fd=d.mul(damping*ldot);

		forces[k]=forces[k].add(fs.add(fd));
		forces[j]=forces[j].sub(fs.add(fd));
	}
	
	// [TO-DO] Update positions and velocities
	for(var i=0;i<positions.length;i++){
		var a=forces[i].div(particleMass);
		velocities[i]=velocities[i].add(a.mul(dt));
		positions[i]=positions[i].add(velocities[i].mul(dt));
	}

	// [TO-DO] Handle collisions
	
	//gravity
	for(var i=0;i<positions.length;i++){
		if(positions[i].z <= 0){
			positions[i].z = 0;
		}
		if(positions[i].y+radii[i]<=-5){
			positions[i].y=-5-radii[i];
			//forces[i].x=-forces[i].mul(restitution).x;
			//forces[i].y=-forces[i].mul(restitution).y;
			velocities[i].x=-velocities[i].x;
			velocities[i].y=-velocities[i].y;
		}
		else if(positions[i].y+radii[i]>=5.4){
			positions[i].y=5.4-radii[i];
			//forces[i].x=-forces[i].mul(restitution).x;
			//forces[i].y=-forces[i].mul(restitution).y;
			velocities[i].x=-velocities[i].x;
			velocities[i].y=-velocities[i].y;
		}

		if(positions[i].x+radii[i]<=-2.5){
			positions[i].x=-2.5-radii[i];
			//forces[i].x=-forces[i].mul(restitution).x;
			//forces[i].y=-forces[i].mul(restitution).y;
			velocities[i].x=-velocities[i].x;
			velocities[i].y=-velocities[i].y;
		}
		else if(positions[i].x+radii[i]>=3){
			positions[i].x=3-radii[i];
			//forces[i].x=-forces[i].mul(restitution).x;
			//forces[i].y=-forces[i].mul(restitution).y;
			velocities[i].x=-velocities[i].x;
			velocities[i].y=-velocities[i].y;
		}
	}

	//
	
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

	for(var i=0;i<positions.length;i++){
		if(velocities[i].x<0.01 && velocities[i].x>-0.01){
			velocities[i].x=0;
		}
		if(velocities[i].y<0.01 && velocities[i].y>-0.01){
			velocities[i].y=0;
		}
		if(velocities[i].z<0.01 && velocities[i].z>-0.01){
			velocities[i].z=0;
		}
	}
}

