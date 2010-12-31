var HNMegaTextureShaders = {};
// float maxLevel = ceil( log2( max( u_mt_tex.x, u_mt_tex.y ) ) ) - 8.0;
HNMegaTextureShaders.sharedvs = "";
HNMegaTextureShaders.sharedfs = [
"#extension GL_OES_standard_derivatives : enable",
"precision highp float;",
"uniform vec4 u_mt_tex;", // [ width, height, tileSize, id ]
"float MTCalculateMipLevel( const in vec2 uv, const in float bias ) {",
"   vec2 dx = dFdx( uv * u_mt_tex.x );",
"   vec2 dy = dFdy( uv * u_mt_tex.y );",
"	return log2( max( dot( dx, dx ), dot( dy, dy ) ) ) / 2.0 + bias;",
"}",
""
].join("\n");
HNMegaTextureShaders.pass1vs = "";
HNMegaTextureShaders.pass1fs = [
"uniform vec2 u_mt_params;", // [ bias, maxLevel, xx, xx ]
"vec4 MTCalculateTileKeyRGBA( const in vec2 uv ) {",
"   float level = clamp( floor( MTCalculateMipLevel( uv, u_mt_params.x ) ), 0.0, u_mt_params.y );",
"   vec2 texIS = uv.xy * u_mt_tex.xy;",                     // [0-1]x[0-1] -> [0-texwidth]x[0-texheight]
"   vec2 texLS = texIS / exp2( level );",                   // -> [0-levelwidth]x[0-levelheight]
"   vec2 texTS = floor( texLS / u_mt_tex.z );",             // -> [0->tileswide]x[0-tileshigh]
"   return vec4( u_mt_params.y - level, texTS.xy, u_mt_tex.w ) / 255.0;", // [ texId, level, tileX, tileY ] -> RGBA
"}"
].join("\n");
HNMegaTextureShaders.pass2vs = "";
HNMegaTextureShaders.pass2fs = [
// TODO: split out
"uniform vec4 u_mt_texCache;",  // [ cache width, cache height, xx, xx ]
"uniform vec4 u_mt_texLookup;", // [ qt width, qt height, tileOverlap, maxLevel ]
"uniform sampler2D s_mt_lookup;",
"uniform sampler2D s_mt_texCache;",
"vec4 MTSampleLevel( const in vec2 uv, const in float level ) {",
"   vec2 texIS = uv.xy * u_mt_tex.xy;",                     // [0-1]x[0-1] -> [0-texwidth]x[0-texheight]
"   vec2 texLS = texIS / exp2( level );",                   // -> [0-levelwidth]x[0-levelheight]
"   vec2 texTSf = texLS / u_mt_tex.z;",                     // -> [0->tileswide]x[0-tileshigh] (fractional)
"   vec2 texTS = floor( texTSf );",
"   // Find offset in quad tree for the tile we want",
"   vec2 qtoff = vec2( exp2( u_mt_texLookup.w - level ) + texTS.x, texTS.y ) / u_mt_texLookup.xy;",
"   // Sample from quad tree to find tile data",
"   vec4 tile = texture2D( s_mt_lookup, qtoff );",
"   // Calculate the tile's texture coordinates in the cache texture",
"   vec2 tadj = fract( texTSf / ( tile.z * 255.0 ) );",
"   vec2 tcoff = ( tile.xy * 255.0 * ( u_mt_tex.z + u_mt_texLookup.z * 2.0 ) + ( tadj * u_mt_tex.z + u_mt_texLookup.z ) ) / u_mt_texCache.xy;",
"   // Sample the tile cache",
"   return texture2D( s_mt_texCache, vec2( tcoff.x, 1.0 - tcoff.y ) );",
"}",
"vec4 MTSampleBilinear( const in vec2 uv ) {",
"   float level = clamp( floor( MTCalculateMipLevel( uv, 0.0 ) ), 0.0, u_mt_texLookup.w );",
"   return MTSampleLevel( uv, level );",
"}",
"vec4 MTSampleTrilinear( const in vec2 uv ) {",
"   float levelf = clamp( MTCalculateMipLevel( uv, 0.0 ), 0.0, u_mt_texLookup.w );",
"   float level = floor( levelf );",
"   vec4 l0 = MTSampleLevel( uv, level );",
"   vec4 l1 = MTSampleLevel( uv, level + 1.0 );",
"   return mix( l0, l1, levelf - level );",
"}"
].join("\n");

HNMegaTextureShaders.prependPass1vs = function (source) {
    return [HNMegaTextureShaders.sharedvs, HNMegaTextureShaders.pass1vs, source].join("\n");
}
HNMegaTextureShaders.prependPass1fs = function (source) {
    return [HNMegaTextureShaders.sharedfs, HNMegaTextureShaders.pass1fs, source].join("\n");
}
HNMegaTextureShaders.prependPass2vs = function (source) {
    return [HNMegaTextureShaders.sharedvs, HNMegaTextureShaders.pass2vs, source].join("\n");
}
HNMegaTextureShaders.prependPass2fs = function (source) {
    return [HNMegaTextureShaders.sharedfs, HNMegaTextureShaders.pass2fs, source].join("\n");
}