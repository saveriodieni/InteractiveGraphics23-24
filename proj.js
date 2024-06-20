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
uniform float blurScale;
uniform vec3     angularVelocity; // Uniform for angular velocity as a vector
uniform sampler2D tex;
uniform int numSamples;
uniform int shadowsEnabled;
uniform float shadowIntensity;

bool IntersectRay( inout HitInfo hit, Ray ray );

mat3 buildMotionBlurMatrix(vec3 angularVelocity, float time) {
    float angle = length(angularVelocity) * time; 
    if(angle > 0.0) {
        vec3 axis = normalize(angularVelocity);
        return mat3(cos(angle) + axis.x * axis.x * (1.0 - cos(angle)),
                    axis.x * axis.y * (1.0 - cos(angle)) - axis.z * sin(angle),
                    axis.x * axis.z * (1.0 - cos(angle)) + axis.y * sin(angle),
                    axis.y * axis.x * (1.0 - cos(angle)) + axis.z * sin(angle),
                    cos(angle) + axis.y * axis.y * (1.0 - cos(angle)),
                    axis.y * axis.z * (1.0 - cos(angle)) - axis.x * sin(angle),
                    axis.z * axis.x * (1.0 - cos(angle)) - axis.y * sin(angle),
                    axis.z * axis.y * (1.0 - cos(angle)) + axis.x * sin(angle),
                    cos(angle) + axis.z * axis.z * (1.0 - cos(angle)));
    }
    else{
        return mat3(1.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0);
    } 
}

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
        if (spheres[i].center.z < -0.2) continue; // Ignore spheres below the plane
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

    Material groundMaterial;
    groundMaterial.k_s=vec3(0.0,0.0,0.0);
    groundMaterial.n=1.0;

    // Check intersection with the ground rectangle
    float t_ground = (-ray.pos.z - 0.2) / ray.dir.z; // Intersection with z=-0.2 plane
    if (t_ground > 0.0 && t_ground < hit.t) {
        vec3 intersectionPoint = ray.pos + ray.dir * t_ground;
        // Define boundaries of the ground rectangle
        float xmin = -3.3;
        float xmax = 3.3;
        float ymin = -6.0;
        float ymax = 6.0;
        if (intersectionPoint.x >= xmin && intersectionPoint.x <= xmax && intersectionPoint.y >= ymin && intersectionPoint.y <= ymax) {
            hit.t = t_ground;
            hit.normal = vec3(0.0, 0.0, 1.0); // Ground plane normal
            if(shadowsEnabled == 0) hit.position = intersectionPoint + hit.normal;
            else hit.position = intersectionPoint;
            vec2 texCoord = vec2(intersectionPoint.x,intersectionPoint.y);
            groundMaterial.k_d=texture2D(tex, texCoord).rgb;
            hit.mtl = groundMaterial; // Assume ground has a predefined material
            foundHit = true;
        }
    }

    return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer(Ray ray) {
    vec3 finalColor = vec3(0.0);
    const int maxNumSamples = 20; // Adjust for more or fewer samples

    for (int i = 0; i < maxNumSamples; i++) {
        if(i>=numSamples) break;
        float t = pow(float(i) / float(numSamples - 1), 2.0); // Exponential distribution
        mat3 blurMatrix = buildMotionBlurMatrix(angularVelocity, t * blurScale);
        vec3 sampleDir = blurMatrix * ray.dir;
        Ray sampleRay = ray;
        sampleRay.dir = sampleDir;

        HitInfo hit;
        if (IntersectRay(hit, sampleRay)) {
            vec3 view = normalize(-sampleRay.dir);
            vec3 clr = Shade(hit.mtl, hit.position, hit.normal, view);

            // Compute reflections
            for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
                vec3 k_s = hit.mtl.k_s;
                if ( bounce >= bounceLimit ) break;
                if ( k_s.r + k_s.g + k_s.b <= 0.0 ) break;

                Ray r; // this is the reflection ray
                HitInfo h; // reflection hit info

                // Initialize the reflection ray
                r.pos = hit.position + 0.001 * hit.normal;
                r.dir = reflect(sampleRay.dir, hit.normal);

                if (IntersectRay(h, r)) {
                    // Hit found, so shade the hit point
                    clr += Shade(h.mtl, h.position, h.normal, normalize(-r.dir));
                    // Update the loop variables for tracing the next reflection ray
                    sampleRay = r;
                    hit = h;
                } else {
                    // The reflection ray did not intersect with anything,
                    // so we are using the environment color
                    clr += k_s * textureCube(envMap, r.dir.xzy).rgb;
                    break; // no more reflections
                }
            }
            finalColor += clr / float(numSamples); // Accumulate and average color
        } else {
            finalColor += textureCube(envMap, sampleRay.dir.xzy).rgb / float(numSamples); // Accumulate and average environment color
        }
    }
    if(length(finalColor) == 0.0 && shadowsEnabled == 1){
        vec2 texCoord = vec2(ray.dir.z,ray.dir.y);
        vec3 color = texture2D(tex, texCoord).rgb * shadowIntensity;
        return vec4(color, 1);
    }
    return vec4(finalColor, 1.0);
}`;