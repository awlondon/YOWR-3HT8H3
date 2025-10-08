export const TRIANGLES_VERT = /* glsl */`
#version 300 es
in vec2 a_world;
in float a_z;
in vec4 a_color;
uniform mat3 u_view;
uniform mat3 u_proj;
out vec4 v_color;
void main(){
  vec3 clip = u_proj * (u_view * vec3(a_world, 1.0));
  gl_Position = vec4(clip.xy, a_z, 1.0);
  v_color = a_color;
}
`;
