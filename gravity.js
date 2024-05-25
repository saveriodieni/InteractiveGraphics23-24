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

// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle
	
	// [TO-DO] Compute the total force of each particle
	for(var i=0;i<positions.length;i++){
		forces[i]=new Vec3(particleMass*gravity.x,particleMass*gravity.y,particleMass*gravity.z);
	}
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
	
	/*for(var i=0;i<positions.length;i++){
		if(positions[i].z<=0){
			positions[i].z=0;
			var a=forces[i].div(particleMass);
			velocities[i]=(velocities[i].mul(-restitution)).add(a.mul(dt));
			positions[i]=positions[i].add(velocities[i].mul(dt));
		}
		else if(positions[i].z>=1){
			positions[i].z=1;
			var a=forces[i].div(particleMass);
			velocities[i]=(velocities[i].mul(-restitution)).add(a.mul(dt));
			positions[i]=positions[i].add(velocities[i].mul(dt));
		}
	}*/
}

