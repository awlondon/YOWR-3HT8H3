export const NODES_FRAG = /* glsl */`
#version 300 es
precision mediump float;
in vec2 v_local;
in vec4 v_color;
out vec4 outColor;
void main(){
  float d = length(v_local) - 1.0;
  float aa = fwidth(d);
  float alpha = smoothstep(0.5, -0.5, d / aa);
  float rim = 1.0 - smoothstep(0.96, 1.0, length(v_local));
  vec3 color = v_color.rgb + rim * 0.08;
  outColor = vec4(color, v_color.a * alpha);
}
`;
