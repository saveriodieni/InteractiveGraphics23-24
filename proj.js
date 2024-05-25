var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		vec3 lightDir = lights[i].position - position;
        float distanceToLight = length(lightDir);
        lightDir = normalize(lightDir);

		Ray shadowRay;
        shadowRay.pos = position + 0.001 * normal; // Move the origin slightly to avoid self-shadowing
        shadowRay.dir = lightDir;

		HitInfo shadowHit;
        bool inShadow = IntersectRay(shadowHit, shadowRay);
        
		// TO-DO: Check for shadows
		if (!inShadow) {
            // TO-DO: If not shadowed, perform shading using the Blinn model
            float diffuse = max(0.0, dot(normal, lightDir));
            vec3 halfway = normalize(lightDir + view);
            float specular = pow(max(0.0, dot(normal, halfway)), mtl.n);
            color += lights[i].intensity * (
                mtl.k_d * diffuse +
                mtl.k_s * specular
            );
        }
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
    hit.t = 1e30;
    bool foundHit = false;
    for ( int i=0; i<NUM_SPHERES; ++i ) {
        vec3 oc = ray.pos - spheres[i].center;
        float a =dot(ray.dir, ray.dir);
		if(a==0.0) continue;
        float b = 2.0 * dot(oc, ray.dir);
        float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
        float discriminant = b*b - 4.0*a*c;
        if (discriminant > 0.0) {
            // Ray intersects the sphere
            float temp = (-b - sqrt(discriminant)) / (2.0*a);
            if (temp < hit.t && temp > 0.0) {
                hit.t = temp;
                hit.position = ray.pos + ray.dir * hit.t;
                hit.normal = normalize(hit.position - spheres[i].center);
                hit.mtl = spheres[i].mtl;
                foundHit = true;
            }
        }
    }
    return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
    HitInfo hit;
    if ( IntersectRay( hit, ray ) ) {
        vec3 view = normalize( -ray.dir );
        vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
        
        // Compute reflections
        for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			vec3 k_s = hit.mtl.k_s;
            if ( bounce >= bounceLimit ) break;
            if ( k_s.r + k_s.g + k_s.b <= 0.0 ) break;
            
            Ray r; // this is the reflection ray
            HitInfo h; // reflection hit info
            
            // Initialize the reflection ray
            r.pos = hit.position + 0.001 * hit.normal;
            r.dir = reflect(ray.dir, hit.normal);
            
            if ( IntersectRay( h, r ) ) {
                // Hit found, so shade the hit point
                clr += Shade( h.mtl, h.position, h.normal, normalize(-r.dir) );
                // Update the loop variables for tracing the next reflection ray
                ray = r;
                hit = h;
            } else {
                // The reflection ray did not intersect with anything,
                // so we are using the environment color
                clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
                break; // no more reflections
            }
        }
        return vec4( clr, 1 );
    } else {
        return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 ); // return the environment color
    }
}`;