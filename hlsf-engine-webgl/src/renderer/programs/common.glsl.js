export const COMMON_GLSL = /* glsl */`
vec3 hsv2rgb(vec3 c){
  vec3 p = abs(fract(vec3(c.x,c.x,c.x) + vec3(0.,2./6.,4./6.)) * 6. - 3.);
  vec3 rgb = c.z * mix(vec3(1.), clamp(p - 1., 0., 1.), c.y);
  return rgb;
}
float sdCircle(vec2 p, float r){ return length(p) - r; }
`;
