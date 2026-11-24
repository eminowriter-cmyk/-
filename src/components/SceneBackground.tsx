import React from 'react';
import { Season } from '../types';

interface SceneBackgroundProps {
  season: Season;
}

interface SeasonPalette {
  streetSkyTop: string;
  streetSkyBottom: string;
  shelterSkyTop: string;
  shelterSkyBottom: string;
  sunFill: string;
  sunRing: string;
  lawnBack: string;
  lawnFront: string;
  bushColor: string;
  bushDark: string;
  snowOpacity: number;
  cloudTint: string;
}

const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    streetSkyTop: '#e3ddd1',
    streetSkyBottom: '#efe5cf',
    shelterSkyTop: '#fff9ef',
    shelterSkyBottom: '#f7ead2',
    sunFill: '#ffd166',
    sunRing: '#f79f4a',
    lawnBack: '#82c91e',
    lawnFront: '#94d82d',
    bushColor: '#6b9e3e',
    bushDark: '#4f7a2c',
    snowOpacity: 0,
    cloudTint: '#ffffff'
  },
  summer: {
    streetSkyTop: '#e5dcc8',
    streetSkyBottom: '#f2e4bd',
    shelterSkyTop: '#fffbe6',
    shelterSkyBottom: '#fae8a8',
    sunFill: '#ff922b',
    sunRing: '#f76707',
    lawnBack: '#51cf66',
    lawnFront: '#40c057',
    bushColor: '#4c8f32',
    bushDark: '#366b22',
    snowOpacity: 0,
    cloudTint: '#fffdf7'
  },
  autumn: {
    streetSkyTop: '#dfd2c3',
    streetSkyBottom: '#ebd4ba',
    shelterSkyTop: '#fdf5ea',
    shelterSkyBottom: '#f2d9ba',
    sunFill: '#f76707',
    sunRing: '#d9480f',
    lawnBack: '#d97706',
    lawnFront: '#e8590c',
    bushColor: '#b85d19',
    bushDark: '#8c410d',
    snowOpacity: 0,
    cloudTint: '#fff9f0'
  },
  winter: {
    streetSkyTop: '#d7e2ec',
    streetSkyBottom: '#e3ecf5',
    shelterSkyTop: '#f1f8fe',
    shelterSkyBottom: '#d9eaf8',
    sunFill: '#e7f5ff',
    sunRing: '#74c0fc',
    lawnBack: '#cce7ff',
    lawnFront: '#f8fbff',
    bushColor: '#7a9e8b',
    bushDark: '#5b7a6b',
    snowOpacity: 0.92,
    cloudTint: '#f8fcff'
  }
};

export const SceneBackground: React.FC<SceneBackgroundProps> = ({ season }) => {
  const pal = SEASON_PALETTES[season];

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 flex"
      aria-hidden="true"
    >
      {/* Shared SVG Filters for Hand-Drawn Crayon & Paper Cutout Collage Feel */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Paper cutout white edge + soft drop shadow */}
          <filter id="paper-cutout" x="-8%" y="-8%" width="116%" height="118%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="dilated" />
            <feFlood floodColor="#fffdf7" result="paperColor" />
            <feComposite in="paperColor" in2="dilated" operator="in" result="whiteBorder" />
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation="3"
              floodColor="#4a3118"
              floodOpacity="0.22"
              in="whiteBorder"
              result="shadowedBorder"
            />
            <feMerge>
              <feMergeNode in="shadowedBorder" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle wax crayon edge wobble */}
          <filter id="crayon-wobble" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Corrugated cardboard stripe pattern */}
          <pattern id="corrugated-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#cfa26b" />
            <rect width="4" height="10" fill="#bd8e56" opacity="0.55" />
          </pattern>

          {/* Crayon crosshatch shading pattern */}
          <pattern id="crayon-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <line x1="0" y1="3" x2="12" y2="3" stroke="#3b2615" strokeWidth="1.1" strokeDasharray="4,2" opacity="0.16" />
            <line x1="0" y1="9" x2="12" y2="9" stroke="#3b2615" strokeWidth="0.9" strokeDasharray="6,3" opacity="0.12" />
          </pattern>

          {/* Craft paper subtle grain */}
          <pattern id="paper-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="6" r="0.8" fill="#8b6b4a" opacity="0.12" />
            <circle cx="17" cy="14" r="1" fill="#8b6b4a" opacity="0.09" />
            <circle cx="11" cy="21" r="0.7" fill="#6b4f35" opacity="0.11" />
          </pattern>
        </defs>
      </svg>

      {/* =========================================================================
          LEFT HALF: 流浪貓街區 (Stray Cat Street — Hand-Drawn Paper Cutout & Crayon)
          Faithfully inspired by Reference Image 1
         ========================================================================= */}
      <div
        className="relative w-1/2 h-full overflow-hidden border-r-[3px] border-dashed border-[#b89464]/70 transition-colors duration-700"
        style={{
          background: `linear-gradient(180deg, ${pal.streetSkyTop} 0%, ${pal.streetSkyBottom} 100%)`
        }}
      >
        {/* Subtle craft paper dot overlay */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(rgba(120, 88, 52, 0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Street Scene Full Collage SVG */}
        <svg
          viewBox="0 0 800 620"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 w-full h-full"
        >
          {/* Paper Clouds in Sky (stitched dashed outline) */}
          <g filter="url(#crayon-wobble)" opacity="0.85">
            <path
              d="M310 115 C310 95, 345 92, 358 104 C372 86, 412 90, 418 110 C438 112, 442 136, 418 138 L316 138 C296 138, 294 117, 310 115 Z"
              fill={pal.cloudTint}
              stroke="#c4b39a"
              strokeWidth="2.5"
              strokeDasharray="6,4"
            />
            <path
              d="M590 88 C590 74, 616 70, 626 80 C638 66, 668 70, 672 85 C688 87, 690 104, 672 106 L596 106 C580 106, 578 90, 590 88 Z"
              fill={pal.cloudTint}
              stroke="#c4b39a"
              strokeWidth="2.2"
              strokeDasharray="5,4"
            />
          </g>

          {/* Background Crumbling Red Brick Wall — Left Section (Paper Cutout) */}
          <g filter="url(#paper-cutout)">
            {/* Stepped Broken Brick Silhouette */}
            <path
              d="M58 292 L246 292 L246 310 L278 310 L278 332 L302 332 L302 354 L318 354 L318 378 L334 378 L334 452 L58 452 Z"
              fill="#be5a3e"
              stroke="#783422"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Concrete top ledge on left wall */}
            <path
              d="M54 282 L252 282 L254 295 L54 295 Z"
              fill="#bdb5aa"
              stroke="#736c63"
              strokeWidth="2"
            />
            {/* Hand-drawn Crayon Brick Rows & Mortar */}
            <g stroke="#7c3624" strokeWidth="1.8" opacity="0.72" filter="url(#crayon-wobble)">
              {/* Brick texture rectangles */}
              <rect x="66" y="302" width="38" height="16" rx="1" fill="#a84830" />
              <rect x="114" y="302" width="42" height="16" rx="1" fill="#cc694b" />
              <rect x="166" y="302" width="36" height="16" rx="1" fill="#9c412b" />
              <rect x="210" y="302" width="32" height="16" rx="1" fill="#c76246" />

              <rect x="82" y="324" width="40" height="16" rx="1" fill="#c96548" />
              <rect x="132" y="324" width="38" height="16" rx="1" fill="#a1442d" />
              <rect x="180" y="324" width="44" height="16" rx="1" fill="#b55237" />
              <rect x="234" y="324" width="38" height="16" rx="1" fill="#d17052" />

              <rect x="66" y="346" width="36" height="16" rx="1" fill="#b24d34" />
              <rect x="112" y="346" width="46" height="16" rx="1" fill="#cc6b4d" />
              <rect x="168" y="346" width="40" height="16" rx="1" fill="#9b3e28" />
              <rect x="218" y="346" width="44" height="16" rx="1" fill="#c25e42" />
              <rect x="270" y="346" width="28" height="16" rx="1" fill="#a64730" />

              <rect x="86" y="368" width="42" height="16" rx="1" fill="#9e422b" />
              <rect x="138" y="368" width="38" height="16" rx="1" fill="#c76447" />
              <rect x="186" y="368" width="42" height="16" rx="1" fill="#b34e34" />
              <rect x="238" y="368" width="40" height="16" rx="1" fill="#cf6e50" />
              <rect x="286" y="368" width="30" height="16" rx="1" fill="#a84931" />

              <rect x="66" y="390" width="44" height="16" rx="1" fill="#c9684b" />
              <rect x="120" y="390" width="40" height="16" rx="1" fill="#a5462f" />
              <rect x="170" y="390" width="44" height="16" rx="1" fill="#bf5c40" />
              <rect x="224" y="390" width="40" height="16" rx="1" fill="#9e402a" />
              <rect x="274" y="390" width="42" height="16" rx="1" fill="#c46044" />
            </g>
            {/* Crayon shading overlay on wall */}
            <path
              d="M58 292 L246 292 L246 310 L278 310 L278 332 L302 332 L302 354 L318 354 L318 378 L334 378 L334 452 L58 452 Z"
              fill="url(#crayon-hatch)"
            />
            {/* Optional winter snow cap on brick wall */}
            {pal.snowOpacity > 0 && (
              <path
                d="M52 282 Q100 272 150 280 Q200 270 255 282 L255 292 Q180 288 52 292 Z"
                fill="#ffffff"
                opacity={pal.snowOpacity}
              />
            )}
          </g>

          {/* Right-Center Lower Broken Brick Wall + Leaning Cardboard Panels */}
          <g filter="url(#paper-cutout)">
            <path
              d="M442 364 L526 364 L526 352 L606 352 L606 446 L442 446 Z"
              fill="#c56548"
              stroke="#7c3624"
              strokeWidth="2.2"
            />
            {/* Tall Corrugated Cardboard Sheet leaning behind cans */}
            <polygon
              points="502,312 562,306 574,438 512,442"
              fill="url(#corrugated-pattern)"
              stroke="#7e5730"
              strokeWidth="2.2"
            />
            {/* Stacked Wooden Crates (Right-center) */}
            <g transform="translate(572, 344) rotate(8)">
              <rect x="0" y="0" width="60" height="52" fill="#cfa066" stroke="#704a25" strokeWidth="2.3" />
              <rect x="7" y="7" width="46" height="38" fill="#b7864d" stroke="#704a25" strokeWidth="1.6" />
              <line x1="7" y1="45" x2="53" y2="7" stroke="#704a25" strokeWidth="2.2" />
            </g>
            <g transform="translate(562, 396) rotate(-2)">
              <rect x="0" y="0" width="66" height="52" fill="#d9ad73" stroke="#704a25" strokeWidth="2.3" />
              <line x1="4" y1="18" x2="62" y2="18" stroke="#855a30" strokeWidth="1.6" strokeDasharray="5,3" />
              <line x1="4" y1="35" x2="62" y2="35" stroke="#855a30" strokeWidth="1.6" strokeDasharray="5,3" />
            </g>
            {/* Smaller box left of cans */}
            <g transform="translate(432, 412)">
              <rect x="0" y="0" width="38" height="38" fill="#c99a61" stroke="#6e4a27" strokeWidth="2" />
              <rect x="6" y="6" width="26" height="26" fill="#9c7040" stroke="#6e4a27" strokeWidth="1.4" />
            </g>
          </g>

          {/* Cracked Sidewalk & Dark Crayon Asphalt Street Base */}
          <g>
            {/* Upper Sidewalk Slab (torn paper top edge) */}
            <path
              d="M0 442 Q40 436 85 442 T175 440 T265 444 T355 439 T445 443 T535 438 T625 442 T715 439 L800 442 L800 500 L0 500 Z"
              fill="#8d8b88"
              stroke="#5c5955"
              strokeWidth="2"
            />
            {/* Curb edge shadow */}
            <path d="M0 486 L800 488 L800 498 L0 496 Z" fill="#6b6865" />

            {/* Dark Asphalt Road (Crayon textured) */}
            <path
              d="M0 496 L800 496 L800 582 L0 582 Z"
              fill="#4d4c4a"
            />
            <path d="M0 496 L800 496 L800 582 L0 582 Z" fill="url(#crayon-hatch)" />

            {/* Hand-sketched Pavement Grates & Cracks (inspired by Image 1) */}
            <g stroke="#2c2b29" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.65" filter="url(#crayon-wobble)">
              <path d="M110 526 L142 524 L138 548 L106 549 Z" />
              <line x1="124" y1="525" x2="121" y2="548" />
              <path d="M235 530 L272 528 L268 552 L232 553 Z" />
              <path d="M318 532 L352 530 L348 550 L314 551 Z" />
              <path d="M446 534 L484 532 L480 556 L442 556 Z" />
              <line x1="464" y1="533" x2="462" y2="556" />
              <path d="M604 528 L636 526 L632 548 L600 549 Z" />
            </g>

            {/* Bottom Foreground Sidewalk Strip */}
            <path
              d="M0 572 Q65 566 130 572 T260 570 T390 574 T520 569 T650 572 L800 570 L800 620 L0 620 Z"
              fill="#84827e"
              stroke="#5c5955"
              strokeWidth="2"
            />
          </g>

          {/* Left Overflowing Metal Trash Can + Tied Black Garbage Bags + Tilted Wooden Crate */}
          <g filter="url(#paper-cutout)">
            {/* Leaning Trash Can Lid */}
            <ellipse cx="88" cy="436" rx="11" ry="24" transform="rotate(14 88 436)" fill="#9fa4a8" stroke="#53585c" strokeWidth="2" />

            {/* Left Ribbed Silver Trash Can */}
            <path d="M100 388 L152 388 L146 462 L106 462 Z" fill="#a7adb2" stroke="#52575c" strokeWidth="2.3" />
            <g stroke="#646a70" strokeWidth="2">
              <line x1="112" y1="395" x2="115" y2="455" />
              <line x1="126" y1="395" x2="126" y2="455" />
              <line x1="140" y1="395" x2="137" y2="455" />
            </g>
            {/* Overflowing colorful food scraps */}
            <path d="M102 388 Q112 368 126 376 Q138 364 150 388 Z" fill="#7c5634" stroke="#4a3118" strokeWidth="1.8" />
            <path d="M108 386 Q116 372 124 384 Z" fill="#74b816" />
            <path d="M128 385 Q138 370 146 385 Z" fill="#f59f00" />
            <circle cx="123" cy="376" r="4" fill="#e03131" />

            {/* Cluster of Tied Black Garbage Bags (Exact Collage Silhouette from Image 1) */}
            <g>
              {/* Back bag */}
              <path
                d="M214 405 C204 414, 198 438, 212 454 C228 462, 260 460, 268 446 C276 430, 266 408, 248 402 L254 391 L239 396 L232 388 L230 400 Z"
                fill="#222428"
                stroke="#111214"
                strokeWidth="2"
              />
              {/* Left bag */}
              <path
                d="M188 418 C176 426, 174 452, 188 462 C204 470, 232 468, 240 456 C246 444, 236 422, 216 416 L220 406 L207 411 L201 404 L200 415 Z"
                fill="#1b1d20"
                stroke="#0f1012"
                strokeWidth="2"
              />
              {/* Front-right plump bag */}
              <path
                d="M250 422 C238 430, 236 456, 252 466 C268 474, 298 470, 304 456 C309 442, 298 424, 280 418 L286 408 L272 413 L266 406 L265 416 Z"
                fill="#26282d"
                stroke="#111214"
                strokeWidth="2"
              />
              {/* White wax-crayon crinkled highlights on garbage bags */}
              <path d="M192 436 Q198 444 208 442" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.22" strokeLinecap="round" />
              <path d="M256 440 Q266 448 280 444" stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.22" strokeLinecap="round" />
            </g>

            {/* Tilted Open Wooden Crate beside garbage bags */}
            <g transform="translate(302, 412) rotate(-22)">
              <rect x="0" y="0" width="52" height="48" fill="#d4a66a" stroke="#6e4a24" strokeWidth="2.4" />
              <rect x="8" y="8" width="36" height="32" fill="#8b6238" stroke="#6e4a24" strokeWidth="1.6" />
              <line x1="0" y1="0" x2="8" y2="8" stroke="#6e4a24" strokeWidth="1.8" />
              <line x1="52" y1="0" x2="44" y2="8" stroke="#6e4a24" strokeWidth="1.8" />
            </g>
          </g>

          {/* Right Trio of Ribbed Silver Trash Cans (from Image 1) */}
          <g filter="url(#paper-cutout)">
            {/* Can 1 (Closed lid) */}
            <g transform="translate(458, 384)">
              <path d="M6 12 L56 12 L50 82 L12 82 Z" fill="#9ea5ab" stroke="#4f5459" strokeWidth="2.2" />
              <path d="M2 12 Q31 0 60 12 Z" fill="#8a9197" stroke="#4f5459" strokeWidth="2" />
              <rect x="24" y="2" width="14" height="5" rx="2" fill="#6d7378" />
              <line x1="18" y1="20" x2="20" y2="75" stroke="#5f656b" strokeWidth="2" />
              <line x1="31" y1="20" x2="31" y2="75" stroke="#5f656b" strokeWidth="2" />
              <line x1="44" y1="20" x2="42" y2="75" stroke="#5f656b" strokeWidth="2" />
            </g>
            {/* Can 2 (Overflowing scraps) */}
            <g transform="translate(518, 386)">
              <path d="M4 12 L54 12 L48 84 L10 84 Z" fill="#a8afb5" stroke="#4f5459" strokeWidth="2.2" />
              <path d="M6 12 Q18 -6 32 4 Q42 -8 52 12 Z" fill="#7d5634" stroke="#4a3118" strokeWidth="1.8" />
              <path d="M12 10 Q20 -2 28 10 Z" fill="#82c91e" />
              <path d="M32 10 Q42 -2 48 10 Z" fill="#ffd43b" />
              <line x1="17" y1="20" x2="19" y2="76" stroke="#5f656b" strokeWidth="2" />
              <line x1="30" y1="20" x2="30" y2="76" stroke="#5f656b" strokeWidth="2" />
              <line x1="43" y1="20" x2="41" y2="76" stroke="#5f656b" strokeWidth="2" />
            </g>
            {/* Can 3 (Far right, open with leaning lid) */}
            <g transform="translate(652, 392)">
              <path d="M4 10 L54 10 L48 80 L10 80 Z" fill="#99a0a6" stroke="#4f5459" strokeWidth="2.2" />
              <ellipse cx="29" cy="10" rx="24" ry="6" fill="#5e432b" stroke="#4f5459" strokeWidth="1.8" />
              <line x1="17" y1="18" x2="19" y2="73" stroke="#5f656b" strokeWidth="2" />
              <line x1="29" y1="18" x2="29" y2="73" stroke="#5f656b" strokeWidth="2" />
              <line x1="41" y1="18" x2="39" y2="73" stroke="#5f656b" strokeWidth="2" />
              {/* Leaning lid on right */}
              <ellipse cx="60" cy="56" rx="10" ry="22" transform="rotate(-16 60 56)" fill="#a5acb2" stroke="#4f5459" strokeWidth="2" />
            </g>
            {/* Little purple bottle beside crate */}
            <rect x="636" y="438" width="11" height="24" rx="3" fill="#a864a8" stroke="#5c2d5c" strokeWidth="1.5" />
          </g>

          {/* Tall Curved Streetlamp with Dangling Tangled Wires (Signature Element of Image 1) */}
          <g filter="url(#paper-cutout)">
            {/* Curved Pole */}
            <path
              d="M168 578 L174 146 C174 114, 198 100, 240 98 L254 98"
              fill="none"
              stroke="#8c8378"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M168 578 L174 146 C174 114, 198 100, 240 98 L254 98"
              fill="none"
              stroke="#5c554d"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Lamp Fixture Head */}
            <path
              d="M240 90 C258 84, 286 88, 294 100 C282 108, 254 108, 240 100 Z"
              fill="#999187"
              stroke="#544e46"
              strokeWidth="2.2"
            />
            {/* Warm Pale Yellow Bulb Glow */}
            <ellipse cx="272" cy="103" rx="16" ry="5" fill="#fff3bf" stroke="#e6c367" strokeWidth="1.5" />
            {/* Tangled Dangling Wires near curved neck (just like Image 1!) */}
            <path
              d="M174 138 C186 154, 192 120, 200 106 C206 130, 226 128, 232 98 C236 122, 242 130, 240 144"
              fill="none"
              stroke="#3b2c22"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M200 106 C198 136, 194 156, 198 172"
              fill="none"
              stroke="#3b2c22"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* Winter snow on streetlamp head */}
            {pal.snowOpacity > 0 && (
              <path
                d="M242 90 Q268 78 292 94 Q266 90 242 90 Z"
                fill="#ffffff"
                opacity={pal.snowOpacity}
              />
            )}
          </g>

          {/* Scattered Paper Collage Street Litter, Weeds & Bottom-Right Shrub */}
          <g filter="url(#crayon-wobble)">
            {/* Folded Newspaper */}
            <g transform="translate(206, 512) rotate(-14)">
              <rect x="0" y="0" width="32" height="22" fill="#e9e4da" stroke="#7d776d" strokeWidth="1.6" />
              <line x1="4" y1="6" x2="26" y2="6" stroke="#7d776d" strokeWidth="1.4" />
              <line x1="4" y1="11" x2="24" y2="11" stroke="#7d776d" strokeWidth="1.4" />
              <line x1="4" y1="16" x2="18" y2="16" stroke="#7d776d" strokeWidth="1.4" />
            </g>
            {/* Red Soda Cans */}
            <g transform="translate(106, 488) rotate(12)">
              <rect x="0" y="0" width="12" height="20" rx="2" fill="#e03131" stroke="#7a1b1b" strokeWidth="1.5" />
              <rect x="0" y="6" width="12" height="5" fill="#f8f9fa" />
            </g>
            <g transform="translate(212, 560) rotate(78)">
              <rect x="0" y="0" width="12" height="22" rx="2" fill="#e03131" stroke="#7a1b1b" strokeWidth="1.5" />
              <rect x="0" y="7" width="12" height="6" fill="#f8f9fa" />
            </g>
            {/* Blue & Green Plastic Bottles */}
            <g transform="translate(612, 518) rotate(-8)">
              <rect x="0" y="0" width="24" height="11" rx="4" fill="#74c0fc" stroke="#1c7ed6" strokeWidth="1.5" />
              <rect x="8" y="0" width="7" height="11" fill="#339af0" />
            </g>
            <g transform="translate(642, 558) rotate(14)">
              <rect x="0" y="0" width="24" height="11" rx="4" fill="#74c0fc" stroke="#1c7ed6" strokeWidth="1.5" />
              <rect x="9" y="0" width="6" height="11" fill="#1971c2" />
            </g>
            <g transform="translate(496, 510) rotate(-18)">
              <rect x="0" y="0" width="20" height="10" rx="3" fill="#63e6be" stroke="#0ca678" strokeWidth="1.5" />
            </g>
            {/* Crumpled Paper Balls */}
            <path d="M538 514 L546 508 L554 514 L550 524 L540 522 Z" fill="#f3ebd8" stroke="#9e927c" strokeWidth="1.4" />
            <path d="M614 584 L622 578 L630 585 L626 594 L616 592 Z" fill="#f3ebd8" stroke="#9e927c" strokeWidth="1.4" />

            {/* Wild Green Crayon Weed Clumps Sprouting from Cracks */}
            <path d="M168 576 L154 562 M168 576 L166 556 M168 576 L184 564" stroke={pal.bushColor} strokeWidth="4" strokeLinecap="round" />
            <path d="M376 576 L366 552 M376 576 L378 548 M376 576 L390 556" stroke={pal.bushColor} strokeWidth="4" strokeLinecap="round" />
            <path d="M558 578 L544 550 M558 578 L560 544 M558 578 L572 554" stroke={pal.bushColor} strokeWidth="4" strokeLinecap="round" />
            <path d="M430 434 L420 404 M430 434 L434 398 M430 434 L444 410" stroke={pal.bushColor} strokeWidth="3.5" strokeLinecap="round" />

            {/* Foreground Bottom-Left Trash Can Rim */}
            <g transform="translate(52, 542)">
              <path d="M4 12 L74 12 L68 74 L10 74 Z" fill="#92999e" stroke="#4f5459" strokeWidth="2.4" />
              <ellipse cx="39" cy="12" rx="36" ry="8" fill="#adb5bd" stroke="#4f5459" strokeWidth="2" />
            </g>

            {/* Bottom-Right Torn-Paper Green Bush Cluster */}
            <g filter="url(#paper-cutout)">
              <path
                d="M664 606 C658 584, 678 568, 696 572 C704 552, 732 544, 748 558 C762 542, 790 546, 798 568 C806 582, 804 606, 792 612 L668 612 Z"
                fill={pal.bushColor}
                stroke={pal.bushDark}
                strokeWidth="2.5"
              />
              <path
                d="M684 590 Q704 576 720 588 M740 578 Q760 566 776 582"
                stroke={pal.bushDark}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
            </g>
          </g>

          {/* Hand-Taped Zone Nameplate (part of background, BEHIND cats) */}
          <g transform="translate(274, 212) rotate(-2)" filter="url(#paper-cutout)">
            <rect x="0" y="0" width="164" height="36" rx="4" fill="#fff9eb" stroke="#a67c52" strokeWidth="2.2" strokeDasharray="5,3" />
            {/* Mini tape strip */}
            <rect x="52" y="-10" width="60" height="14" fill="#ffd8a8" opacity="0.82" transform="rotate(2 82 -3)" />
            <text
              x="82"
              y="24"
              textAnchor="middle"
              fill="#6d4726"
              fontSize="16"
              fontWeight="900"
              fontFamily="'Zen Maru Gothic', 'PingFang TC', sans-serif"
            >
              流浪貓街區
            </text>
          </g>
        </svg>
      </div>

      {/* =========================================================================
          RIGHT HALF: 貓狗躍動園區 (Animal Shelter — Hand-Drawn Paper Cutout & Crayon)
          Faithfully inspired by Reference Image 2
         ========================================================================= */}
      <div
        className="relative w-1/2 h-full overflow-hidden transition-colors duration-700"
        style={{
          background: `linear-gradient(180deg, ${pal.shelterSkyTop} 0%, ${pal.shelterSkyBottom} 100%)`
        }}
      >
        {/* Subtle craft paper texture */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(rgba(160, 120, 70, 0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Shelter Scene Full Collage SVG */}
        <svg
          viewBox="0 0 800 620"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 w-full h-full"
        >
          {/* Hand-drawn Crayon Sun */}
          <g transform="translate(686, 86)" filter="url(#crayon-wobble)">
            <circle cx="0" cy="0" r="34" fill={pal.sunFill} stroke={pal.sunRing} strokeWidth="3" strokeDasharray="6,4" />
            <circle cx="0" cy="0" r="44" fill="none" stroke={pal.sunRing} strokeWidth="2.2" strokeDasharray="4,8" opacity="0.65" />
          </g>

          {/* Fluffy Stitched Paper Cloud */}
          <g filter="url(#crayon-wobble)" opacity="0.9">
            <path
              d="M110 108 C110 88, 146 84, 158 96 C174 78, 214 82, 220 102 C240 104, 244 128, 220 130 L116 130 C96 130, 94 110, 110 108 Z"
              fill={pal.cloudTint}
              stroke="#d6c2a5"
              strokeWidth="2.4"
              strokeDasharray="6,4"
            />
          </g>

          {/* Torn-Paper Back Lawn Layer (changes color per season!) */}
          <path
            d="M0 448 Q35 438 70 448 T140 445 T210 450 T280 443 T350 449 T420 444 T490 450 T560 443 T630 448 T700 444 T770 449 L800 446 L800 620 L0 620 Z"
            fill={pal.lawnBack}
            opacity="0.88"
            style={{ transition: 'fill 0.7s ease' }}
          />

          {/* =================================================================
              THE MODERN 2-STORY 「貓狗躍動園區」 BUILDING (Reference Image 2)
              Crafted in Paper Cutout Cardstock + Sketchy Crayon Architectural Lines
             ================================================================= */}
          <g filter="url(#paper-cutout)">
            {/* Far-Right Overhead Architectural Concrete Beams extending off-screen */}
            <polygon points="614,194 800,154 800,180 614,218" fill="#777b80" stroke="#3c4045" strokeWidth="2.2" />
            <polygon points="694,254 800,236 800,256 694,274" fill="#868b91" stroke="#3c4045" strokeWidth="2.2" />

            {/* Upper-Left Rooftop Penthouse Box */}
            <polygon points="94,234 134,226 164,236 164,274 94,278" fill="#f3e5cd" stroke="#5c4b3b" strokeWidth="2.2" />
            <polygon points="94,234 126,238 126,276 94,278" fill="#e6d3b5" stroke="#5c4b3b" strokeWidth="2" />

            {/* Right Single-Story Extension Wing */}
            <polygon points="688,368 792,386 792,456 688,468" fill="#f3e5cd" stroke="#5c4b3b" strokeWidth="2.2" />
            {/* Right wing door & windows */}
            <rect x="702" y="406" width="26" height="56" fill="#63686e" stroke="#34383d" strokeWidth="2" />
            <rect x="738" y="410" width="28" height="36" fill="#7494ab" stroke="#34383d" strokeWidth="2" />
            <line x1="752" y1="410" x2="752" y2="446" stroke="#34383d" strokeWidth="2" />
            <rect x="772" y="414" width="14" height="30" fill="#7494ab" stroke="#34383d" strokeWidth="1.8" />

            {/* Main 2-Story Building Body (Warm Cream Cardstock) */}
            <polygon points="30,290 614,174 700,232 700,468 30,458" fill="#f4e6cf" stroke="#594a3c" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Subtle side wall shading */}
            <polygon points="614,174 700,232 700,468 614,468" fill="#e8d6ba" stroke="#594a3c" strokeWidth="2.2" />
            {/* Crayon texture hatch over building facade */}
            <polygon points="30,290 614,174 700,232 700,468 30,458" fill="url(#crayon-hatch)" opacity="0.55" />

            {/* Sleek Slate-Gray Roofline Canopy Trim */}
            <polygon points="22,282 616,162 706,226 706,244 616,184 22,298" fill="#82878d" stroke="#3a3e42" strokeWidth="2.4" strokeLinejoin="round" />
            <polygon points="22,298 616,184 616,196 22,306" fill="#686d73" stroke="#3a3e42" strokeWidth="1.8" />

            {/* Winter Snow Blanket along Roof Canopy */}
            {pal.snowOpacity > 0 && (
              <path
                d="M22 282 L616 162 L706 224 L698 232 L614 174 L24 292 Z"
                fill="#ffffff"
                opacity={pal.snowOpacity}
              />
            )}

            {/* Left Wing Tall Vertical Architectural Columns & Windows */}
            <g>
              {/* Recessed glass bay */}
              <polygon points="38,302 248,266 248,452 38,448" fill="#7c9eb5" stroke="#3a3e42" strokeWidth="2" />
              {/* Vertical gray architectural fins/pillars */}
              <rect x="34" y="298" width="16" height="154" fill="#868b91" stroke="#3a3e42" strokeWidth="2" />
              <rect x="68" y="292" width="16" height="160" fill="#868b91" stroke="#3a3e42" strokeWidth="2" />
              <rect x="102" y="286" width="14" height="166" fill="#868b91" stroke="#3a3e42" strokeWidth="2" />
              <rect x="132" y="281" width="14" height="171" fill="#868b91" stroke="#3a3e42" strokeWidth="2" />
              <rect x="164" y="276" width="22" height="176" fill="#868b91" stroke="#3a3e42" strokeWidth="2" />
              <rect x="208" y="268" width="14" height="184" fill="#868b91" stroke="#3a3e42" strokeWidth="2" />
              {/* Horizontal mid divider */}
              <polygon points="38,364 248,352 248,366 38,376" fill="#8f949a" stroke="#3a3e42" strokeWidth="2" />
            </g>

            {/* 2nd Floor Large Grid-Paned Glass Windows (Center) */}
            <g>
              {/* Left 2F Window */}
              <polygon points="342,272 440,258 440,328 342,334" fill="#8eb4cc" stroke="#2c333a" strokeWidth="2.6" />
              <line x1="366" y1="268" x2="366" y2="332" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="392" y1="265" x2="392" y2="330" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="416" y1="261" x2="416" y2="329" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="342" y1="292" x2="440" y2="281" stroke="#2c333a" strokeWidth="2.2" />
              {/* Crayon glass reflection */}
              <line x1="352" y1="286" x2="378" y2="268" stroke="#ffffff" strokeWidth="2.4" opacity="0.6" strokeLinecap="round" />

              {/* Right 2F Window */}
              <polygon points="472,254 584,238 584,320 472,326" fill="#8eb4cc" stroke="#2c333a" strokeWidth="2.6" />
              <line x1="500" y1="250" x2="500" y2="324" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="528" y1="246" x2="528" y2="323" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="556" y1="242" x2="556" y2="321" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="472" y1="276" x2="584" y2="264" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="490" y1="268" x2="520" y2="248" stroke="#ffffff" strokeWidth="2.4" opacity="0.6" strokeLinecap="round" />
            </g>

            {/* Right Side Vertical Slit Windows */}
            <rect x="634" y="256" width="10" height="62" fill="#4f5c66" stroke="#2c333a" strokeWidth="1.8" />
            <rect x="656" y="266" width="10" height="54" fill="#4f5c66" stroke="#2c333a" strokeWidth="1.8" />
            <rect x="676" y="276" width="9" height="46" fill="#4f5c66" stroke="#2c333a" strokeWidth="1.8" />

            {/* 1st Floor Wide Glass Storefront Windows (Recessed Under Balcony) */}
            <g>
              <rect x="314" y="382" width="268" height="78" fill="#7ca2ba" stroke="#2c333a" strokeWidth="2.6" />
              {/* Mullions */}
              <line x1="348" y1="382" x2="348" y2="460" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="382" y1="382" x2="382" y2="460" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="422" y1="382" x2="422" y2="460" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="462" y1="382" x2="462" y2="460" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="502" y1="382" x2="502" y2="460" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="542" y1="382" x2="542" y2="460" stroke="#2c333a" strokeWidth="2.2" />
              <line x1="314" y1="406" x2="582" y2="406" stroke="#2c333a" strokeWidth="2.2" />
              {/* Warm sunlit interior reflection */}
              <polygon points="322,400 342,386 350,386 330,400" fill="#fff9db" opacity="0.45" />
              <polygon points="472,400 496,386 506,386 482,400" fill="#fff9db" opacity="0.45" />
            </g>

            {/* 2nd Floor Balcony Slab, Railing & 1st Floor Porch Columns (Iconic Modern Feature of Image 2) */}
            <g>
              {/* Balcony Top Handrail & Vertical Pickets */}
              <line x1="262" y1="324" x2="604" y2="294" stroke="#646970" strokeWidth="4.5" strokeLinecap="round" />
              <g stroke="#6e737a" strokeWidth="2.6" strokeLinecap="round">
                {Array.from({ length: 24 }).map((_, idx) => {
                  const t = idx / 23;
                  const rx = 266 + t * 334;
                  const topY = 324 - t * 29;
                  const botY = 354 - t * 28;
                  return <line key={idx} x1={rx} y1={topY} x2={rx} y2={botY} />;
                })}
              </g>

              {/* Heavy Gray Balcony Cantilever & Right Corner Pillar */}
              <polygon points="240,352 606,324 676,346 676,472 574,472 574,366 240,378" fill="#8b9096" stroke="#3a3e42" strokeWidth="2.4" strokeLinejoin="round" />
              {/* Balcony Underside Shadow */}
              <polygon points="246,378 574,366 574,380 246,390" fill="#6b7076" />
              {/* Two Front Porch Gray Columns */}
              <rect x="254" y="376" width="22" height="84" fill="#92979d" stroke="#3a3e42" strokeWidth="2.2" />
              <rect x="386" y="372" width="26" height="94" fill="#92979d" stroke="#3a3e42" strokeWidth="2.2" />
            </g>
          </g>

          {/* Torn-Paper Front Lawn Strip (Matches Cat Walking Surface!) */}
          <path
            d="M0 494 Q30 482 65 494 T135 490 T205 496 T275 488 T345 495 T415 489 T485 495 T555 488 T625 494 T695 490 T765 495 L800 492 L800 620 L0 620 Z"
            fill={pal.lawnFront}
            stroke="#5a8c27"
            strokeWidth="1.8"
            strokeOpacity="0.35"
            style={{ transition: 'fill 0.7s ease' }}
          />

          {/* Crayon Grass Tufts & Little Flowers on Lawn */}
          <g stroke="#4f8222" strokeWidth="2.4" strokeLinecap="round" opacity="0.65" filter="url(#crayon-wobble)">
            <path d="M460 538 L454 522 M460 538 L462 518 M460 538 L468 524" />
            <path d="M620 556 L614 542 M620 556 L622 538 M620 556 L628 544" />
            <path d="M726 534 L720 518 M726 534 L728 514 M726 534 L735 520" />
            <path d="M350 562 L344 548 M350 562 L352 544 M350 562 L358 550" />
          </g>

          {/* =================================================================
              ICONIC WOODEN ENTRANCE SIGN 「貓狗躍動園區」 WITH PEEKING CAT & DOG
              (Faithfully recreated from Reference Image 2 in Paper-Cutout & Crayon Style!)
              Placed in background layer (z-0) so live cats walk cleanly IN FRONT of it!
             ================================================================= */}
          <g transform="translate(46, 404)" filter="url(#paper-cutout)">
            {/* Left & Right Wooden Sign Posts */}
            <rect x="6" y="42" width="16" height="106" rx="4" fill="#6b4423" stroke="#3d2410" strokeWidth="2.4" />
            <rect x="206" y="42" width="16" height="106" rx="4" fill="#6b4423" stroke="#3d2410" strokeWidth="2.4" />

            {/* Arched Warm Peach Wooden Sign Board */}
            <path
              d="M20 56 Q114 14 208 56 L208 134 L20 134 Z"
              fill="#f8d4ab"
              stroke="#4a2c16"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            {/* Pastel Wavy Hills Decor along bottom of sign */}
            <path
              d="M22 132 L22 108 Q52 94 82 114 Q118 90 158 112 Q184 98 206 112 L206 132 Z"
              fill="#56b8b8"
              opacity="0.88"
            />
            <path
              d="M78 132 Q114 96 154 132 Z"
              fill="#f07878"
              opacity="0.9"
            />
            <path
              d="M22 132 Q44 114 68 132 Z"
              fill="#f28482"
              opacity="0.85"
            />

            {/* Hand-drawn Paw Prints on Sign */}
            <g fill="#4a2c16">
              {/* Top center paw */}
              <circle cx="122" cy="52" r="4.5" />
              <circle cx="116" cy="45" r="2.2" />
              <circle cx="122" cy="42" r="2.2" />
              <circle cx="128" cy="45" r="2.2" />
              {/* Bottom left paw */}
              <circle cx="72" cy="112" r="3.6" />
              <circle cx="67" cy="107" r="1.8" />
              <circle cx="72" cy="104" r="1.8" />
              <circle cx="77" cy="107" r="1.8" />
            </g>

            {/* Bold Hand-Lettered Title 「貓狗躍動園區」 */}
            <text
              x="114"
              y="98"
              textAnchor="middle"
              fill="#422614"
              fontSize="26"
              fontWeight="900"
              letterSpacing="1.5"
              fontFamily="'Zen Maru Gothic', 'PingFang TC', sans-serif"
            >
              貓狗躍動園區
            </text>

            {/* Cute Peeking Gray-and-White Cat (Top-Left of Sign, from Image 2!) */}
            <g transform="translate(26, 4)">
              {/* Ears */}
              <polygon points="8,24 12,2 28,15" fill="#9ea3a8" stroke="#3d2410" strokeWidth="2.4" strokeLinejoin="round" />
              <polygon points="12,20 14,8 23,16" fill="#ffb8c2" />
              <polygon points="56,24 52,2 36,15" fill="#9ea3a8" stroke="#3d2410" strokeWidth="2.4" strokeLinejoin="round" />
              <polygon points="52,20 50,8 41,16" fill="#ffb8c2" />
              {/* Head */}
              <ellipse cx="32" cy="34" rx="28" ry="23" fill="#a7acb2" stroke="#3d2410" strokeWidth="2.4" />
              {/* White lower muzzle mask */}
              <path d="M12 40 Q32 28 52 40 Q46 56 32 56 Q18 56 12 40 Z" fill="#fffdf9" />
              {/* Eyes */}
              <circle cx="21" cy="34" r="3" fill="#2b1e16" />
              <circle cx="43" cy="34" r="3" fill="#2b1e16" />
              {/* Nose & Cute w-mouth */}
              <polygon points="30,39 34,39 32,42" fill="#ff8fa3" />
              <path d="M27 44 Q30 47 32 43 Q34 47 37 44" fill="none" stroke="#3d2410" strokeWidth="1.8" strokeLinecap="round" />
              {/* Whiskers */}
              <line x1="2" y1="35" x2="12" y2="37" stroke="#3d2410" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="2" y1="41" x2="12" y2="41" stroke="#3d2410" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="52" y1="37" x2="62" y2="35" stroke="#3d2410" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="52" y1="41" x2="62" y2="41" stroke="#3d2410" strokeWidth="1.6" strokeLinecap="round" />
              {/* Tiny White Paws resting over top edge of sign */}
              <ellipse cx="14" cy="54" rx="7" ry="5" fill="#fffdf9" stroke="#3d2410" strokeWidth="2" />
              <ellipse cx="50" cy="54" rx="7" ry="5" fill="#fffdf9" stroke="#3d2410" strokeWidth="2" />
            </g>

            {/* Cute Peeking Black-and-White Dog (Top-Right of Sign, from Image 2!) */}
            <g transform="translate(142, 10)">
              {/* Floppy Dark Ears */}
              <ellipse cx="10" cy="28" rx="10" ry="16" transform="rotate(18 10 28)" fill="#3b3634" stroke="#241e1c" strokeWidth="2.4" />
              <ellipse cx="58" cy="30" rx="10" ry="16" transform="rotate(-18 58 30)" fill="#3b3634" stroke="#241e1c" strokeWidth="2.4" />
              {/* Head */}
              <ellipse cx="34" cy="34" rx="25" ry="22" fill="#3b3634" stroke="#241e1c" strokeWidth="2.4" />
              {/* White Center Blaze & Muzzle */}
              <path d="M29 14 Q34 12 39 14 L42 36 Q52 40 48 50 Q34 58 20 50 Q16 40 26 36 Z" fill="#fffdf9" />
              {/* Eyes */}
              <circle cx="22" cy="32" r="3" fill="#1a1513" />
              <circle cx="46" cy="32" r="3" fill="#1a1513" />
              <circle cx="21" cy="31" r="1" fill="#ffffff" />
              <circle cx="45" cy="31" r="1" fill="#ffffff" />
              {/* Nose & Happy Pink Tongue */}
              <ellipse cx="34" cy="40" rx="4.2" ry="3.2" fill="#241e1c" />
              <path d="M28 45 Q34 50 40 45" fill="none" stroke="#241e1c" strokeWidth="2" strokeLinecap="round" />
              <path d="M31 47 Q34 58 38 47 Z" fill="#ff758f" stroke="#c92a49" strokeWidth="1.4" />
              {/* Paws gripping sign */}
              <ellipse cx="14" cy="54" rx="7" ry="5" fill="#fffdf9" stroke="#241e1c" strokeWidth="2" />
              <ellipse cx="52" cy="54" rx="7" ry="5" fill="#fffdf9" stroke="#241e1c" strokeWidth="2" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
