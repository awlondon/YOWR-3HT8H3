export const NODES_VERT = /* glsl */`
#version 300 es
in vec2 a_pos;
in vec2 i_world;
in float i_radius;
in float i_z;
in vec4 i_color;
uniform mat3 u_view;
uniform mat3 u_proj;
out vec2 v_local;
out vec4 v_color;
void main(){
  vec2 pLocal = a_pos;
  v_local = pLocal;
  vec2 world = i_world + pLocal * i_radius;
  vec3 clip = u_proj * (u_view * vec3(world, 1.0));
  gl_Position = vec4(clip.xy, i_z, 1.0);
  v_color = i_color;
}
`;
