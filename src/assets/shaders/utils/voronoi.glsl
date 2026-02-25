// utils/voronoi.glsl
// Basato su lygia/generative/voronoi.glsl + F2 aggiunto
#define TAU 6.28318530718


vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

// Restituisce vec4:
//   .xy = posizione del punto più vicino (cell ID)
//   .z  = F1 (distanza al più vicino)
//   .w  = F2 (distanza al secondo più vicino)

vec4 voronoi(vec2 uv, float time) {
    vec2 i_uv = floor(uv);
    vec2 f_uv = fract(uv);

    float F1 = 2.0;
    float F2 = 2.0;
    vec2  cell = vec2(0.0);

    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = 0.5 + .5 * sin(time + TAU * random2(i_uv + neighbor));
            vec2 diff = neighbor + point - f_uv;
            float dist = length(diff);

            if (dist < F1) {
                F2   = F1;   // il vecchio primo diventa secondo
                F1   = dist;
                cell = point;
            } else if (dist < F2) {
                F2 = dist;   // aggiorna solo il secondo
            }
        }
    }
    return vec4(cell, F1, F2);
}

vec4 voronoi(vec2 p)  { return voronoi(p, 0.0); }
vec4 voronoi(vec3 p)  { return voronoi(p.xy, p.z); }

#pragma glslify: export(voronoi)