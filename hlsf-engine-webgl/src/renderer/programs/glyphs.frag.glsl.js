export const GLYPHS_FRAG = /* glsl */`
#version 300 es
precision mediump float;
uniform sampler2D u_atlas;
in vec2 v_uv;
in vec4 v_color;
out vec4 outColor;
void main(){
  float sample = texture(u_atlas, v_uv).r;
  float edge = fwidth(sample);
  float alpha = smoothstep(0.5 - edge, 0.5 + edge, sample);
  outColor = vec4(v_color.rgb, v_color.a * alpha);
}
`;
