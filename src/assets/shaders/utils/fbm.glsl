//	<https://www.shadertoy.com/view/4dS3Wd>
//	By Morgan McGuire @morgan3d, http://graphicscodex.com
//
precision highp float;

float hash(float n) { highp float hn = n; return fract(sin(hn) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(float x) {
	float i = floor(x);
	float f = fract(x);
	float u = f * f * (3.0 - 2.0 * f);
	return mix(hash(i), hash(i + 1.0), u);
}

float noise(vec2 x) {
	vec2 i = floor(x);
	vec2 f = fract(x);

	// Four corners in 2D of a tile
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));

	// Simple 2D lerp using smoothstep envelope between the values.
	// return vec3(mix(mix(a, b, smoothstep(0.0, 1.0, f.x)),
	//			mix(c, d, smoothstep(0.0, 1.0, f.x)),
	//			smoothstep(0.0, 1.0, f.y)));

	// Same code, with the clamps in smoothstep and common subexpressions
	// optimized away.
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// This one has non-ideal tiling properties that I'm still tuning
float noise(vec3 x) {
	// Avoid naming this "step" — shadows GLSL builtin, causes wrong compilation on Intel/some mobile drivers
	const vec3 s = vec3(110, 241, 171);

	vec3 i = floor(x);
	vec3 f = fract(x);

	// For performance, compute the base input to a 1D hash from the integer part of the argument and the
	// incremental change to the 1D based on the 3D -> 1D wrapping
	// Use highp locally to avoid mediump overflow on mobile (dot product can exceed mediump max)
	highp vec3 hi = vec3(i);
	highp float n = dot(hi, vec3(110.0, 241.0, 171.0));

	vec3 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(mix( hash(n + dot(s, vec3(0, 0, 0))), hash(n + dot(s, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(s, vec3(0, 1, 0))), hash(n + dot(s, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(s, vec3(0, 0, 1))), hash(n + dot(s, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(s, vec3(0, 1, 1))), hash(n + dot(s, vec3(1, 1, 1))), u.x), u.y), u.z);
}

// float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
// vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
// vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

// float noise(vec3 p){
//     vec3 a = floor(p);
//     vec3 d = p - a;
//     d = d * d * (3.0 - 2.0 * d);

//     vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
//     vec4 k1 = perm(b.xyxy);
//     vec4 k2 = perm(k1.xyxy + b.zzww);

//     vec4 c = k2 + a.zzzz;
//     vec4 k3 = perm(c);
//     vec4 k4 = perm(c + 1.0);

//     vec4 o1 = fract(k3 * (1.0 / 41.0));
//     vec4 o2 = fract(k4 * (1.0 / 41.0));

//     vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
//     vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

//     return o4.y * d.y + o4.x * (1.0 - d.y);
// }


#define NUM_OCTAVES 5

float fbm(float x, int numOctaves) {
	float v = 0.0;
	float a = 1.0;
  float normalization = 0.0;
	float shift = float(100);
	for (int i = 0; i < numOctaves; ++i) {
    normalization += a;
		v += a * noise(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
  v /= normalization;
	return v;
}


float fbm(vec2 x, int numOctaves) {
	float v = 0.0;
	float a = 1.0;
  float normalization = 0.0;
	vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < numOctaves; ++i) {
    normalization += a;
		v += a * noise(x);
		x = rot * x * 2.0 + shift;
		a *= 0.5;
	}
  v /= normalization;
	return v;
}

// 1. Aggiungi questa funzione Hash che accetta un vec3 e restituisce un float.
// È "sine-less" e applica subito il fract, mantenendo i numeri piccolissimi.
float hashPerf(vec3 p3) {
    p3  = fract(p3 * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33); // Questo dot ora moltiplica numeri < 1.0, zero rischio overflow
    return fract((p3.x + p3.y) * p3.z);
}

// 2. Sostituisci la tua funzione noise con questa versione pulita
float noisePerf(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);

    // Curva di smoothing (Hermite interpolation)
    vec3 u = f * f * (3.0 - 2.0 * f);

    // Mixiamo gli 8 angoli del cubo passando direttamente il vec3 all'hash.
    // Nessuna moltiplicazione gigante, nessun rischio di overflow su Intel!
    return mix(mix(mix( hashPerf(i + vec3(0.0,0.0,0.0)), 
                        hashPerf(i + vec3(1.0,0.0,0.0)), u.x),
                   mix( hashPerf(i + vec3(0.0,1.0,0.0)), 
                        hashPerf(i + vec3(1.0,1.0,0.0)), u.x), u.y),
               mix(mix( hashPerf(i + vec3(0.0,0.0,1.0)), 
                        hashPerf(i + vec3(1.0,0.0,1.0)), u.x),
                   mix( hashPerf(i + vec3(0.0,1.0,1.0)), 
                        hashPerf(i + vec3(1.0,1.0,1.0)), u.x), u.y), u.z);
}


float fbm(vec3 x, int numOctaves) {
	float v = 0.0;
	float a = 1.0;
  float normalization = 0.0;
	// Shift of 1.7 instead of 100 prevents coordinate explosion across octaves
	// (shift=100 causes mediump overflow after 2+ octaves on mobile GPUs)
	vec3 shift = vec3(1.7);
	for (int i = 0; i < numOctaves; ++i) {
    normalization += a;
		v += a * noisePerf(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
  v /= normalization;

	return v;
}

#pragma glslify: export(fbm)

float turbulenceFBM(vec3 x, int numOctaves) {
	float v = 0.0;
	float a = 0.5;
  float normalization = 0.0;
	vec3 shift = vec3(100);
	for (int i = 0; i < numOctaves; ++i) {
    normalization += a;
    float n = noise(x) * 2.0 - 1.0;
		v += a * abs(n);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
  v /= normalization;
  
	return v;
}

float ridgedFBM(vec3 x, int numOctaves) {
	float v = 0.0;
	float a = 0.5;
  float normalization = 0.0;
	vec3 shift = vec3(100);
	for (int i = 0; i < numOctaves; ++i) {
    normalization += a;
    float n = noise(x) * 2.0 - 1.0;
    n = 1.0 - abs(n);
		v += a * n;
		x = x * 2.0 + shift;
		a *= 0.5;
	}
  v /= normalization;
  v = pow(v,2.0);
  
	return v;
}

float domainWarpingFBM(vec3 coords, int numOctaves) {

  vec3 offset = vec3(
    fbm(coords,numOctaves),
    fbm(coords + vec3(45.236, 22.458,0.0), numOctaves),0.0
  );

  vec3 offset2 = vec3(
    fbm(coords + 4. * offset + vec3(4.561,1.256,3.156), numOctaves),
    fbm(coords + 4. * offset + vec3(3.156,0.459,2.346), numOctaves),0.0
  );

  vec3 offset3 = vec3(
    fbm(coords + 8. * offset2 + vec3(8.569,2.356,1.259), numOctaves),
    fbm(coords + 8. * offset2 + vec3(7.149,0.2485,3.154), numOctaves),0.0
  );

  float noiseValue = fbm(coords + offset3,numOctaves);

  return noiseValue;

}