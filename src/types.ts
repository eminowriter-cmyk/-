export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type CatState =
  | 'AIRDROP'         // Falling from the sky with parachute/balloon
  | 'BOUNCE'          // Landing squash and bounce
  | 'WALK'            // Wandering on the grass
  | 'IDLE'            // Looking around, tilting head, twitching ears
  | 'CLIMB'           // On the cardboard cat tree platforms
  | 'PLAY_YARN'       // Chasing and batting the yarn ball
  | 'SLEEP'           // Curled up sleeping with Zzz paper bubbles
  | 'ROLL'            // Playful rolling/stretching
  | 'PETTED'          // Jump with joy when clicked by visitor
  | 'DEPARTING'       // Gently floating away when max count is reached to free memory
  | 'ADOPTED'         // Adopted by visitor: joyful celebration, hearts & warm home departure
  // Seasonal special behaviors:
  | 'SNEEZE'          // Winter: Shiver and sneeze "哈啾！"
  | 'CURL_UP'         // Winter: Shivering tight loaf "冷颼颼縮成毛球"
  | 'CHASE_PETAL'     // Spring: Pounce and chase floating petals/butterflies
  | 'HEAT_EXHAUSTED'  // Summer: Melted flat into liquid cat "熱到散熱中"
  | 'LEAF_PILE';      // Autumn: Burrowing into crispy paper leaf pile

export interface CatPlatform {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Cat {
  id: string;
  name: string;
  src: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  scale: number;
  squashX: number;
  squashY: number;
  rotation: number;
  flipX: boolean;
  state: CatState;
  stateTimer: number;
  walkCycle: number;
  platform?: CatPlatform | null;
  alpha: number;
  speechBubble?: string | null;
  speechTimer: number;
  parachuteProgress: number; // 0 to 1
  parachuteWobble: number;
  hearts: Array<{ x: number; y: number; vy: number; alpha: number; scale: number }>;
  zzzTimer: number;
}

export interface YarnBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  color: string;
  trail: Array<{ x: number; y: number }>;
}

export type ScanMode = 'mock' | 'manifest' | 'directory' | 'sequential';

export interface ScanConfig {
  mode: ScanMode;
  folderPath: string; // e.g. "cats/"
  intervalSeconds: number;
  maxCats: number;
  soundEnabled: boolean;
  autoPlaySim: boolean;
}
