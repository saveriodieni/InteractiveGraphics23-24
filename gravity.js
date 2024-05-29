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
function SimTimeStep(dt, positions, radii, velocities, muS, muD, particleMass, gravity, restitution) {
    var forces = Array(positions.length); // The total force per particle
    if (iteration === undefined) iteration = 0;
    else iteration++;
    
    // Compute the total force for each particle
    for (var i = 0; i < positions.length; i++) {
        forces[i] = new Vec3(0, 0, 0);
        if (positions[i].z > 0.01) forces[i] = gravity.mul(particleMass);

        // Apply an initial impulse to the last particle
        if (i == positions.length - 1 && iteration == 0) {
            var impulse = new Vec3(0, -5000.0, 0);
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
    }

    // Update positions and velocities
    for (var i = 0; i < positions.length; i++) {
        var a = forces[i].div(particleMass);
        velocities[i] = velocities[i].add(a.mul(dt));
        positions[i] = positions[i].add(velocities[i].mul(dt));
    }

    // Handle collisions with ground and walls
    for (var i = 0; i < positions.length; i++) {
        if (positions[i].z <= 0) {
            positions[i].z = 0;
            velocities[i].z = -velocities[i].z * restitution;
        }
        if (positions[i].y + radii[i] <= -5) {
            positions[i].y = -5 - radii[i];
            velocities[i].y = -velocities[i].y * restitution;
        } else if (positions[i].y + radii[i] >= 5.4) {
            positions[i].y = 5.4 - radii[i];
            velocities[i].y = -velocities[i].y * restitution;
        }
        if (positions[i].x + radii[i] <= -2.5) {
            positions[i].x = -2.5 - radii[i];
            velocities[i].x = -velocities[i].x * restitution;
        } else if (positions[i].x + radii[i] >= 2.85) {
            positions[i].x = 2.85 - radii[i];
            velocities[i].x = -velocities[i].x * restitution;
        }
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

    // Apply small velocity threshold to stop the particle
    for (var i = 0; i < positions.length; i++) {
        if (Math.abs(velocities[i].x) < 0.01) velocities[i].x = 0;
        if (Math.abs(velocities[i].y) < 0.01) velocities[i].y = 0;
        if (Math.abs(velocities[i].z) < 0.01) velocities[i].z = 0;
    }
}