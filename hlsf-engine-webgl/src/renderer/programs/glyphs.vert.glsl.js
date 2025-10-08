export const GLYPHS_VERT = /* glsl */`
#version 300 es
in vec2 a_pos;
in vec2 i_world;
in float i_size;
in float i_z;
in vec4 i_color;
in vec4 i_uv;
uniform mat3 u_view;
uniform mat3 u_proj;
out vec2 v_uv;
out vec4 v_color;
void main(){
  vec2 world = i_world + a_pos * i_size;
  vec3 clip = u_proj * (u_view * vec3(world, 1.0));
  gl_Position = vec4(clip.xy, i_z, 1.0);
  vec2 uv0 = i_uv.xy;
  vec2 uv1 = i_uv.zw;
  v_uv = mix(uv0, uv1, (a_pos + 1.0) * 0.5);
  v_color = i_color;
}
`;
