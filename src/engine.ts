import { Cat, CatPlatform, CatState, Season, YarnBall } from './types';
import { sound } from './audio';

const SPEECH_MESSAGES = [
  '喵~ 摸摸我！',
  '呼嚕呼嚕~ 好舒服！',
  '謝謝你畫我！💖',
  '喵嗚~ (搖尾巴)',
  '這片草地好棒喔！',
  '小畫家你好呀！🐱',
  '喵~ 準備睡午覺！',
  '發現毛線球了！🐾',
  '我是最可愛的！✨'
];

interface SeasonalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  type: 'petal' | 'sparkle' | 'leaf' | 'snowflake';
  color: string;
}

export class CatParadiseEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public cats: Cat[] = [];
  public platforms: CatPlatform[] = [];
  public yarnBall: YarnBall;
  public maxCats: number = 40;
  public LIMIT: number = 25; // 流浪貓超載危機上限
  public isCrisisMode: boolean = false;
  public onCrisisModeChange?: (isCrisis: boolean) => void;
  public groundY: number = 0;
  public season: Season = 'spring';
  private seasonalParticles: SeasonalParticle[] = [];
  
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  // Track total scanned count
  public totalCatsAdmitted: number = 0;
  public onCatCountChange?: (current: number, total: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.yarnBall = {
      x: 300,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 22,
      rotation: 0,
      color: '#ff85a2',
      trail: []
    };
    this.handleResize();
    this.initSeasonalParticles();
  }

  public setSeason(newSeason: Season) {
    this.season = newSeason;
    
    // Update yarn ball style for season
    switch (newSeason) {
      case 'spring':
        this.yarnBall.color = '#ff85a2'; // Cherry pink
        break;
      case 'summer':
        this.yarnBall.color = '#ff6b6b'; // Vivid coral
        break;
      case 'autumn':
        this.yarnBall.color = '#e8590c'; // Warm pumpkin amber
        break;
      case 'winter':
        this.yarnBall.color = '#ffffff'; // Snowball / White wool
        break;
    }

    this.initSeasonalParticles();

    // Trigger seasonal reaction in cats
    this.cats.forEach(c => {
      if (c.state !== 'AIRDROP' && c.state !== 'DEPARTING') {
        if (newSeason === 'winter') {
          if (Math.random() < 0.6) {
            c.state = Math.random() < 0.5 ? 'SNEEZE' : 'CURL_UP';
            c.stateTimer = 0;
          } else {
            c.speechBubble = '下雪了！好冷冷~ ❄️';
            c.speechTimer = 2.5;
          }
        } else if (newSeason === 'spring') {
          c.speechBubble = '花開了！抓花瓣~ 🌸';
          c.speechTimer = 2.2;
        } else if (newSeason === 'summer') {
          c.speechBubble = '暖洋洋的夏天來了！☀️';
          c.speechTimer = 2.2;
        } else if (newSeason === 'autumn') {
          c.speechBubble = '秋風吹拂，好多落葉！🍁';
          c.speechTimer = 2.2;
        }
      }
    });
  }

  private initSeasonalParticles() {
    this.seasonalParticles = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      this.seasonalParticles.push(this.createParticle(Math.random() * (this.width || 1000), Math.random() * (this.height || 600)));
    }
  }

  private createParticle(x?: number, y?: number): SeasonalParticle {
    const px = x !== undefined ? x : Math.random() * this.width;
    const py = y !== undefined ? y : -15;

    let type: 'petal' | 'sparkle' | 'leaf' | 'snowflake' = 'petal';
    let color = '#ffb7b2';
    let size = 8 + Math.random() * 8;
    let vy = 35 + Math.random() * 45;
    let vx = (Math.random() - 0.5) * 40;

    switch (this.season) {
      case 'spring':
        type = 'petal';
        color = Math.random() > 0.4 ? '#ffcad4' : '#ffb7b2';
        size = 8 + Math.random() * 6;
        vx = 25 + Math.random() * 35; // drift right with spring breeze
        break;
      case 'summer':
        type = 'sparkle';
        color = Math.random() > 0.5 ? '#ffd166' : '#ffee93';
        size = 5 + Math.random() * 5;
        vy = -10 + (Math.random() - 0.5) * 30; // float upwards like fireflies
        vx = (Math.random() - 0.5) * 35;
        break;
      case 'autumn':
        type = 'leaf';
        color = ['#d9480f', '#e8590c', '#f59f00', '#c92a2a'][Math.floor(Math.random() * 4)];
        size = 12 + Math.random() * 8;
        vx = -30 - Math.random() * 40; // drift left with autumn wind
        vy = 45 + Math.random() * 50;
        break;
      case 'winter':
        type = 'snowflake';
        color = '#ffffff';
        size = 6 + Math.random() * 8;
        vy = 25 + Math.random() * 40;
        vx = (Math.random() - 0.5) * 25;
        break;
    }

    return {
      x: px,
      y: py,
      vx,
      vy,
      size,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3,
      type,
      color
    };
  }

  public handleResize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(this.dpr, this.dpr);

    this.groundY = this.height - 96;

    // 確保跳台位置安全避開左上角 QR 便條區 (y >= 290)，不與便條互相遮擋
    const safeHighY = Math.max(300, this.groundY - 185);
    const safeMidY = Math.max(340, this.groundY - 95);

    // 分區重建：左半邊流浪貓街區 (Stray Cat Street) 與 右半邊貓狗躍動園區 (Animal Shelter)
    this.platforms = [
      // 左側街區：木箱紙箱跳台與紅磚牆高台
      {
        id: 'p_street1',
        name: '街區紙箱跳台',
        x: Math.max(70, this.width * 0.11),
        y: safeMidY,
        width: 145,
        height: 24
      },
      {
        id: 'p_street2',
        name: '街區磚牆高台',
        x: Math.max(225, this.width * 0.29),
        y: safeHighY,
        width: 140,
        height: 24
      },
      // 右側貓狗躍動園區：園區原木貓跳台與陽台眺望台
      {
        id: 'p_shelter1',
        name: '躍動園區低台',
        x: this.width * 0.62,
        y: safeMidY,
        width: 155,
        height: 24
      },
      {
        id: 'p_shelter2',
        name: '躍動園區眺望台',
        x: Math.min(this.width - 175, this.width * 0.79),
        y: safeHighY,
        width: 150,
        height: 24
      }
    ];

    if (this.yarnBall.y === 0 || this.yarnBall.y > this.groundY) {
      this.yarnBall.x = this.width * 0.5;
      this.yarnBall.y = this.groundY - this.yarnBall.radius;
    }
  }

  public addCat(name: string, imageSrc: string): Cat {
    // If capacity reached, gently dismiss the oldest non-departing cat
    if (this.cats.length >= this.maxCats) {
      const oldestActive = this.cats.find(c => c.state !== 'DEPARTING');
      if (oldestActive) {
        this.departCat(oldestActive);
      }
    }

    const img = new Image();
    img.src = imageSrc;

    // Spawn point: keep clear of the top-left QR sticky note (x >= 220) and top-right hint note
    const minSpawnX = Math.min(220, this.width * 0.25);
    const maxSpawnX = Math.max(minSpawnX + 120, this.width - 235);
    const spawnX = minSpawnX + Math.random() * (maxSpawnX - minSpawnX);
    const spawnY = -120;

    const cat: Cat = {
      id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name || '手繪貓咪',
      src: imageSrc,
      img,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() - 0.5) * 40,
      vy: 110 + Math.random() * 40, // fall speed
      targetX: spawnX,
      targetY: this.groundY - 35,
      width: 110,
      height: 110,
      scale: 1,
      squashX: 1,
      squashY: 1,
      rotation: 0,
      flipX: Math.random() > 0.5,
      state: 'AIRDROP',
      stateTimer: 0,
      walkCycle: Math.random() * 10,
      platform: null,
      alpha: 1,
      speechBubble: '來囉~！🎈',
      speechTimer: 2.2,
      parachuteProgress: 0,
      parachuteWobble: Math.random() * 10,
      hearts: [],
      zzzTimer: 0
    };

    this.cats.push(cat);
    this.totalCatsAdmitted++;
    sound.playPaperRustle();

    this.checkCrisisMode();

    if (this.onCatCountChange) {
      this.onCatCountChange(this.getActiveCatCount(), this.totalCatsAdmitted);
    }

    return cat;
  }

  public getActiveCatCount(): number {
    return this.cats.filter(c => c.state !== 'DEPARTING' && c.state !== 'ADOPTED').length;
  }

  public checkCrisisMode() {
    const activeCount = this.getActiveCatCount();
    const crisis = activeCount >= this.LIMIT;
    if (this.isCrisisMode !== crisis) {
      this.isCrisisMode = crisis;
      if (this.onCrisisModeChange) {
        this.onCrisisModeChange(crisis);
      }
      if (crisis) {
        sound.playPaperRustle();
      }
    }
  }

  public adoptCat(catToAdopt?: Cat): boolean {
    const cat = catToAdopt || this.cats.find(c => c.state !== 'DEPARTING' && c.state !== 'ADOPTED');
    if (!cat) return false;

    cat.state = 'ADOPTED';
    cat.stateTimer = 0;
    cat.vy = -170;
    cat.vx = 45; // happily hopping toward the shelter exit
    cat.speechBubble = '我有新家了！謝謝你~ 💖🏠';
    cat.speechTimer = 3.5;

    // Adoption golden hearts & happy celebration particles
    for (let h = 0; h < 6; h++) {
      cat.hearts.push({
        x: cat.x + (Math.random() - 0.5) * 50,
        y: cat.y - cat.height + (Math.random() - 0.5) * 30,
        vy: -55 - Math.random() * 55,
        alpha: 1,
        scale: 1.1 + Math.random() * 0.5
      });
    }

    sound.playAdoptChime();
    sound.playBoing();

    // Check if crisis mode is relieved
    this.checkCrisisMode();

    if (this.onCatCountChange) {
      this.onCatCountChange(this.getActiveCatCount(), this.totalCatsAdmitted);
    }

    return true;
  }

  public departCat(cat: Cat) {
    cat.state = 'DEPARTING';
    cat.speechBubble = '喵~ 我去休息囉！✨';
    cat.speechTimer = 3.0;
    cat.vy = -70; // Float upwards
    cat.vx = (Math.random() - 0.5) * 30;
  }

  public petCatAt(screenX: number, screenY: number): boolean {
    // Hit test cats from top to bottom
    for (let i = this.cats.length - 1; i >= 0; i--) {
      const cat = this.cats[i];
      if (cat.state === 'DEPARTING' || cat.state === 'ADOPTED' || cat.state === 'AIRDROP') continue;

      const halfW = (cat.width * cat.scale) / 2;
      const halfH = (cat.height * cat.scale) / 2;
      const dist = Math.hypot(screenX - cat.x, screenY - (cat.y - halfH));

      if (dist < halfW + 15) {
        // 如果處於超載危機模式，點擊該隻貓咪直接執行「愛心認養」解除危機！
        if (this.isCrisisMode) {
          this.adoptCat(cat);
          return true;
        }

        // 一般狀態下：摸摸與互動跳躍
        cat.state = 'PETTED';
        cat.stateTimer = 1.6;
        cat.squashX = 0.85;
        cat.squashY = 1.35;
        cat.vy = -180; // Jump joyfully
        cat.speechBubble = SPEECH_MESSAGES[Math.floor(Math.random() * SPEECH_MESSAGES.length)];
        cat.speechTimer = 2.5;

        // Spawn heart particles
        for (let h = 0; h < 4; h++) {
          cat.hearts.push({
            x: cat.x + (Math.random() - 0.5) * 40,
            y: cat.y - cat.height + (Math.random() - 0.5) * 20,
            vy: -40 - Math.random() * 40,
            alpha: 1,
            scale: 0.8 + Math.random() * 0.5
          });
        }

        sound.playMeow(0.9 + Math.random() * 0.3);
        sound.playBoing();
        return true;
      }
    }

    // Hit test yarn ball
    const yarnDist = Math.hypot(screenX - this.yarnBall.x, screenY - this.yarnBall.y);
    if (yarnDist < this.yarnBall.radius + 15) {
      this.yarnBall.vx = (Math.random() - 0.5) * 400;
      this.yarnBall.vy = -160;
      sound.playBoing();
      return true;
    }

    return false;
  }

  public kickYarnBall(dx: number, dy: number) {
    this.yarnBall.vx += dx;
    this.yarnBall.vy += dy;
  }

  public start() {
    this.lastTime = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public clearAll() {
    // Clean memory
    this.cats.forEach(c => {
      c.img.src = '';
    });
    this.cats = [];
    if (this.onCatCountChange) {
      this.onCatCountChange(0, this.totalCatsAdmitted);
    }
  }

  private update(dt: number) {
    this.updateYarnBall(dt);
    this.updateSeasonalParticles(dt);

    for (let i = this.cats.length - 1; i >= 0; i--) {
      const cat = this.cats[i];
      this.updateCat(cat, dt);

      // Remove departed or adopted cats when faded out
      if ((cat.state === 'DEPARTING' || cat.state === 'ADOPTED') && (cat.alpha <= 0.02 || cat.y < -150)) {
        // Free image reference
        cat.img.src = '';
        this.cats.splice(i, 1);
        this.checkCrisisMode();
        if (this.onCatCountChange) {
          this.onCatCountChange(this.getActiveCatCount(), this.totalCatsAdmitted);
        }
      }
    }
  }

  private updateSeasonalParticles(dt: number) {
    for (let i = 0; i < this.seasonalParticles.length; i++) {
      const p = this.seasonalParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;

      // Wrap or regenerate when out of bounds
      if (p.y > this.height + 20 || p.y < -40 || p.x > this.width + 40 || p.x < -40) {
        this.seasonalParticles[i] = this.createParticle(
          Math.random() * this.width,
          this.season === 'summer' ? this.height + 10 : -15
        );
      }
    }
  }

  private updateYarnBall(dt: number) {
    // Gravity
    this.yarnBall.vy += 450 * dt;
    this.yarnBall.x += this.yarnBall.vx * dt;
    this.yarnBall.y += this.yarnBall.vy * dt;

    // Floor collision
    const floorY = this.groundY - this.yarnBall.radius;
    if (this.yarnBall.y >= floorY) {
      this.yarnBall.y = floorY;
      if (Math.abs(this.yarnBall.vy) > 30) {
        this.yarnBall.vy = -this.yarnBall.vy * 0.55;
      } else {
        this.yarnBall.vy = 0;
      }
      // Friction
      this.yarnBall.vx *= 0.94;
    }

    // Wall bounce
    if (this.yarnBall.x < this.yarnBall.radius + 15) {
      this.yarnBall.x = this.yarnBall.radius + 15;
      this.yarnBall.vx = -this.yarnBall.vx * 0.7;
    } else if (this.yarnBall.x > this.width - this.yarnBall.radius - 15) {
      this.yarnBall.x = this.width - this.yarnBall.radius - 15;
      this.yarnBall.vx = -this.yarnBall.vx * 0.7;
    }

    // Rotation
    this.yarnBall.rotation += (this.yarnBall.vx / this.yarnBall.radius) * dt;

    // Trail update
    if (Math.abs(this.yarnBall.vx) > 10 || Math.abs(this.yarnBall.vy) > 10) {
      this.yarnBall.trail.push({ x: this.yarnBall.x, y: this.yarnBall.y });
      if (this.yarnBall.trail.length > 25) {
        this.yarnBall.trail.shift();
      }
    } else if (this.yarnBall.trail.length > 0 && Math.random() < 0.05) {
      this.yarnBall.trail.shift();
    }
  }

  private updateCat(cat: Cat, dt: number) {
    cat.stateTimer += dt;
    cat.walkCycle += dt;
    cat.parachuteWobble += dt * 3;

    // Update speech bubble timer
    if (cat.speechTimer > 0) {
      cat.speechTimer -= dt;
      if (cat.speechTimer <= 0) {
        cat.speechBubble = null;
      }
    }

    // Update hearts
    for (let h = cat.hearts.length - 1; h >= 0; h--) {
      const heart = cat.hearts[h];
      heart.y += heart.vy * dt;
      heart.alpha -= dt * 0.8;
      if (heart.alpha <= 0) {
        cat.hearts.splice(h, 1);
      }
    }

    // Squash & stretch recovery spring
    cat.squashX += (1 - cat.squashX) * 12 * dt;
    cat.squashY += (1 - cat.squashY) * 12 * dt;

    switch (cat.state) {
      case 'AIRDROP': {
        cat.y += cat.vy * dt;
        cat.x += cat.vx * dt;
        cat.rotation = Math.sin(cat.parachuteWobble) * 0.18;

        // Check if landed on platform or ground
        const currentTargetY = this.groundY - 10;
        if (cat.y >= currentTargetY) {
          cat.y = currentTargetY;
          cat.state = 'BOUNCE';
          cat.stateTimer = 0;
          cat.squashX = 1.35;
          cat.squashY = 0.65;
          cat.rotation = 0;
          cat.speechBubble = '安全降落！🐾';
          cat.speechTimer = 2.0;
          sound.playBoing();
          sound.playMeow(1.1);
        }
        break;
      }

      case 'BOUNCE': {
        // Rebound
        if (cat.stateTimer > 0.45) {
          cat.state = 'WALK';
          cat.stateTimer = 0;
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      case 'WALK': {
        const dx = cat.targetX - cat.x;
        cat.flipX = dx > 0;

        // 危機超載模式下速度減半，表現出空間擁擠感
        const speed = this.isCrisisMode ? 32 : 65;
        if (Math.abs(dx) > 10) {
          cat.x += Math.sign(dx) * speed * dt;
          // Paper puppet walking tilt & bob
          cat.rotation = Math.sin(cat.walkCycle * 9) * 0.12;
          cat.squashY = 1 + Math.sin(cat.walkCycle * 18) * 0.08;
        } else {
          cat.rotation = 0;
          cat.squashY = 1;
          // Finished walking, transition to new behavior
          this.transitionToRandomState(cat);
        }

        // Interaction with yarn ball
        const distToYarn = Math.hypot(this.yarnBall.x - cat.x, this.yarnBall.y - cat.y);
        if (distToYarn < 65 && Math.random() < 0.03) {
          cat.state = 'PLAY_YARN';
          cat.stateTimer = 0;
        }
        break;
      }

      case 'IDLE': {
        cat.rotation = Math.sin(cat.walkCycle * 2) * 0.04;
        if (cat.stateTimer > 3.0 + Math.random() * 3) {
          this.transitionToRandomState(cat);
        }
        break;
      }

      case 'PLAY_YARN': {
        // Chase yarn ball
        const dx = this.yarnBall.x - cat.x;
        cat.flipX = dx > 0;
        const dist = Math.abs(dx);

        if (dist > 35) {
          cat.x += Math.sign(dx) * 85 * dt;
          cat.rotation = Math.sin(cat.walkCycle * 12) * 0.15;
        } else {
          // Bat the ball!
          if (cat.stateTimer > 0.3) {
            this.yarnBall.vx = (cat.flipX ? 1 : -1) * (180 + Math.random() * 120);
            this.yarnBall.vy = -120;
            cat.squashX = 1.25;
            cat.squashY = 0.8;
            cat.speechBubble = this.season === 'winter' ? '抓到雪球了！❄️' : '抓到了！🧶';
            cat.speechTimer = 1.8;
            sound.playBoing();
            cat.state = 'WALK';
            this.pickNewWalkTarget(cat);
          }
        }
        if (cat.stateTimer > 5.0) {
          cat.state = 'WALK';
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      case 'CLIMB': {
        // Staying on cat tree platform
        cat.rotation = Math.sin(cat.walkCycle * 2) * 0.03;
        if (cat.stateTimer > 7.0) {
          // Jump down
          cat.platform = null;
          cat.state = 'WALK';
          cat.y = this.groundY - 10;
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      case 'SLEEP': {
        cat.rotation = 0;
        cat.squashY = 0.85;
        cat.squashX = 1.15;
        cat.zzzTimer += dt;
        if (cat.zzzTimer > 1.8) {
          cat.zzzTimer = 0;
          // Zzz effect
          cat.speechBubble = 'Zzz... 💤';
          cat.speechTimer = 1.5;
        }
        if (cat.stateTimer > 10.0 + Math.random() * 5) {
          cat.state = 'WALK';
          cat.speechBubble = this.season === 'winter' ? '好想烤暖爐... ♨️' : '喵~ 睡飽了！☀️';
          cat.speechTimer = 2.0;
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      case 'ROLL': {
        cat.rotation = Math.sin(cat.stateTimer * 6) * 0.45;
        cat.squashX = 1.2;
        cat.squashY = 0.8;
        if (cat.stateTimer > 2.5) {
          cat.state = 'WALK';
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      // --- Seasonal Special Behaviors ---
      case 'SNEEZE': {
        // Winter: Cold trembling anticipation, sudden sneeze burst
        cat.rotation = Math.sin(cat.stateTimer * 42) * 0.08;
        cat.squashX = 0.94;
        cat.squashY = 1.08;

        if (cat.stateTimer > 0.8 && cat.stateTimer < 0.95 && (!cat.speechBubble || !cat.speechBubble.includes('哈啾'))) {
          cat.vy = -75;
          cat.squashX = 1.35;
          cat.squashY = 0.65;
          cat.speechBubble = '哈啾！好凍喔 🤧';
          cat.speechTimer = 2.2;
          sound.playSneeze();

          // Spawn ice/snow crystals
          for (let h = 0; h < 3; h++) {
            cat.hearts.push({
              x: cat.x + (cat.flipX ? 22 : -22),
              y: cat.y - cat.height * 0.65,
              vy: -40 - Math.random() * 40,
              alpha: 1,
              scale: 0.8
            });
          }
        }

        if (cat.stateTimer > 2.4) {
          this.transitionToRandomState(cat);
        }
        break;
      }

      case 'CURL_UP': {
        // Winter: Shivering tight loaf
        cat.squashX = 1.25;
        cat.squashY = 0.72;
        cat.rotation = Math.sin(cat.walkCycle * 22) * 0.03; // Cold shiver

        if (cat.stateTimer < 0.2 && !cat.speechBubble) {
          cat.speechBubble = '好冷冷~ 縮成毛球 ❄️';
          cat.speechTimer = 2.2;
        }

        if (cat.stateTimer > 7.5 + Math.random() * 4) {
          cat.state = 'WALK';
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      case 'CHASE_PETAL': {
        // Spring: Playful pouncing on petals
        cat.rotation = Math.sin(cat.walkCycle * 14) * 0.15;
        cat.squashY = 1.2;
        if (cat.stateTimer < 0.2 && !cat.speechBubble) {
          cat.speechBubble = '抓春天的花瓣！🌸';
          cat.speechTimer = 2.0;
          cat.vy = -120;
          sound.playBoing();
        }
        if (cat.stateTimer > 3.2) {
          cat.state = 'WALK';
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      case 'HEAT_EXHAUSTED': {
        // Summer: Melted flat into liquid cat
        cat.squashX = 1.45;
        cat.squashY = 0.55;
        cat.rotation = 0;
        if (cat.stateTimer < 0.2 && !cat.speechBubble) {
          cat.speechBubble = '熱到融化成貓貓液體... 🍦';
          cat.speechTimer = 2.5;
        }
        if (cat.stateTimer > 7.0) {
          cat.state = 'WALK';
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      case 'LEAF_PILE': {
        // Autumn: Burrowing into crispy paper leaves
        cat.rotation = Math.sin(cat.stateTimer * 8) * 0.25;
        cat.squashX = 1.2;
        cat.squashY = 0.8;
        if (cat.stateTimer < 0.2 && !cat.speechBubble) {
          cat.speechBubble = '落葉堆裡好暖和！🍁';
          cat.speechTimer = 2.0;
        }
        if (cat.stateTimer > 4.0) {
          cat.state = 'WALK';
          this.pickNewWalkTarget(cat);
        }
        break;
      }

      case 'PETTED': {
        cat.y += cat.vy * dt;
        cat.vy += 450 * dt; // gravity

        const baseFloor = cat.platform ? cat.platform.y - 10 : this.groundY - 10;
        if (cat.y >= baseFloor) {
          cat.y = baseFloor;
          cat.vy = 0;
          if (cat.stateTimer > 1.5) {
            cat.state = 'WALK';
            this.pickNewWalkTarget(cat);
          }
        }
        break;
      }

      case 'DEPARTING': {
        cat.y += cat.vy * dt;
        cat.x += cat.vx * dt;
        cat.alpha -= dt * 0.35;
        cat.rotation = Math.sin(cat.walkCycle * 4) * 0.15;
        break;
      }

      case 'ADOPTED': {
        // Joyfully hopping toward forever home!
        cat.y += cat.vy * dt;
        cat.x += cat.vx * dt;
        cat.vy += 320 * dt; // light gravity hop
        cat.alpha -= dt * 0.38;
        cat.rotation = Math.sin(cat.walkCycle * 8) * 0.18;
        cat.squashX = 1.15;
        cat.squashY = 0.88;
        break;
      }
    }
  }

  private pickNewWalkTarget(cat: Cat) {
    if (cat.platform) {
      // Walk on platform
      const minX = cat.platform.x + 20;
      const maxX = cat.platform.x + cat.platform.width - 20;
      cat.targetX = minX + Math.random() * (maxX - minX);
      cat.targetY = cat.platform.y - 10;
    } else {
      // Walk on lawn
      const margin = 120;
      cat.targetX = margin + Math.random() * (this.width - margin * 2);
      cat.targetY = this.groundY - 10;
    }
  }

  private transitionToRandomState(cat: Cat) {
    cat.stateTimer = 0;
    const r = Math.random();

    // If currently on ground, chance to climb cat tree
    if (!cat.platform && r < 0.20 && this.platforms.length > 0) {
      const targetPlat = this.platforms[Math.floor(Math.random() * this.platforms.length)];
      cat.platform = targetPlat;
      cat.state = 'CLIMB';
      cat.x = targetPlat.x + targetPlat.width / 2;
      cat.y = targetPlat.y - 10;
      cat.speechBubble = '登高望遠！🐾';
      cat.speechTimer = 2.0;
      sound.playBoing();
      return;
    }

    // Seasonal special behavior injection
    if (this.season === 'winter') {
      if (r < 0.35) {
        cat.state = 'CURL_UP';
        return;
      } else if (r < 0.60) {
        cat.state = 'SNEEZE';
        return;
      }
    } else if (this.season === 'spring') {
      if (r < 0.30) {
        cat.state = 'CHASE_PETAL';
        return;
      }
    } else if (this.season === 'summer') {
      if (r < 0.30) {
        cat.state = 'HEAT_EXHAUSTED';
        return;
      }
    } else if (this.season === 'autumn') {
      if (r < 0.30) {
        cat.state = 'LEAF_PILE';
        return;
      }
    }

    if (r < 0.45) {
      cat.state = 'WALK';
      this.pickNewWalkTarget(cat);
    } else if (r < 0.70) {
      cat.state = 'IDLE';
    } else if (r < 0.85) {
      cat.state = 'SLEEP';
      cat.zzzTimer = 0;
    } else {
      cat.state = 'ROLL';
      cat.speechBubble = '伸個懶腰~ ✨';
      cat.speechTimer = 2.0;
    }
  }

  private render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Seasonal Floating Particles (behind objects)
    this.renderSeasonalParticles();

    // 2. Draw Yarn Trail & Ball
    this.renderYarn();

    // 3. Draw Cardboard Cat Tree Platforms
    this.renderPlatforms();

    // 4. Render Cats
    const sortedCats = [...this.cats].sort((a, b) => a.y - b.y);
    for (const cat of sortedCats) {
      this.renderCat(cat);
    }
  }

  private renderSeasonalParticles() {
    const ctx = this.ctx;
    ctx.save();

    for (const p of this.seasonalParticles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'snowflake') {
        // Hand-cut paper snowflake / white snowball speck
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#c5e2ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 6-pointed paper snowflake star
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        for (let a = 0; a < 3; a++) {
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.6, 0);
          ctx.lineTo(p.size * 0.6, 0);
          ctx.stroke();
          ctx.rotate(Math.PI / 3);
        }
      } else if (p.type === 'petal') {
        // Cherry blossom paper petal
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.7);
        ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.4, p.size * 0.5, p.size * 0.6, 0, p.size * 0.7);
        ctx.bezierCurveTo(-p.size * 0.5, p.size * 0.6, -p.size * 0.6, -p.size * 0.4, 0, -p.size * 0.7);
        ctx.fill();
      } else if (p.type === 'leaf') {
        // Autumn maple / ginkgo paper leaf
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.6);
        ctx.lineTo(p.size * 0.5, -p.size * 0.2);
        ctx.lineTo(p.size * 0.6, p.size * 0.3);
        ctx.lineTo(0, p.size * 0.7);
        ctx.lineTo(-p.size * 0.6, p.size * 0.3);
        ctx.lineTo(-p.size * 0.5, -p.size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Leaf vein
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.5);
        ctx.lineTo(0, p.size * 0.6);
        ctx.stroke();
      } else if (p.type === 'sparkle') {
        // Summer golden pollen / firefly
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private renderPlatforms() {
    const ctx = this.ctx;
    ctx.save();

    for (const p of this.platforms) {
      // Platform cardstock shadow
      ctx.fillStyle = 'rgba(70, 40, 15, 0.18)';
      ctx.fillRect(p.x + 4, p.y + 6, p.width, p.height);

      // Cardboard surface (corrugated paper texture)
      ctx.fillStyle = '#d4b383';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Stripes on cardboard edge
      ctx.fillStyle = '#b89464';
      for (let sx = p.x; sx < p.x + p.width; sx += 8) {
        ctx.fillRect(sx, p.y, 4, p.height);
      }

      // Paper tape accent on side
      ctx.fillStyle = 'rgba(255, 235, 160, 0.7)';
      ctx.fillRect(p.x + 8, p.y - 4, 28, 10);

      // Cute hand-drawn wood screw / button
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.arc(p.x + 12, p.y + 12, 4, 0, Math.PI * 2);
      ctx.arc(p.x + p.width - 12, p.y + 12, 4, 0, Math.PI * 2);
      ctx.fill();

      // Support post below
      ctx.fillStyle = '#c59f6e';
      ctx.fillRect(p.x + p.width / 2 - 12, p.y + p.height, 24, 70);
      ctx.fillStyle = '#a68052';
      for (let py = p.y + p.height; py < p.y + p.height + 70; py += 10) {
        ctx.fillRect(p.x + p.width / 2 - 12, py, 24, 3);
      }

      // Zone label stamp on platform
      ctx.font = 'bold 11px sans-serif';
      if (p.id.includes('street')) {
        ctx.fillStyle = '#6d4726';
        ctx.fillText('📦 街區木箱', p.x + 36, p.y + 16);
      } else if (p.id.includes('shelter')) {
        ctx.fillStyle = '#c94a17';
        ctx.fillText('🐾 躍動跳台', p.x + 36, p.y + 16);
      }

      // === Seasonal Platform Decorations ===
      if (this.season === 'winter') {
        // Torn paper snowcap on top of platform
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(p.x - 2, p.y);
        ctx.lineTo(p.x + p.width + 2, p.y);
        ctx.bezierCurveTo(p.x + p.width, p.y - 8, p.x + p.width * 0.7, p.y - 12, p.x + p.width * 0.5, p.y - 9);
        ctx.bezierCurveTo(p.x + p.width * 0.3, p.y - 12, p.x, p.y - 7, p.x - 2, p.y);
        ctx.closePath();
        ctx.fill();

        // Hanging paper icicles
        ctx.fillStyle = '#e7f5ff';
        ctx.strokeStyle = '#c5e2ff';
        ctx.lineWidth = 1;
        for (let ix = p.x + 20; ix < p.x + p.width - 20; ix += 32) {
          ctx.beginPath();
          ctx.moveTo(ix - 5, p.y + p.height);
          ctx.lineTo(ix + 5, p.y + p.height);
          ctx.lineTo(ix, p.y + p.height + 14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (this.season === 'autumn') {
        // Fallen maple paper leaves on platform corners
        ctx.fillStyle = '#d9480f';
        ctx.beginPath();
        ctx.arc(p.x + 18, p.y - 2, 5, 0, Math.PI * 2);
        ctx.arc(p.x + p.width - 24, p.y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.season === 'spring') {
        // Cherry petals on platform
        ctx.fillStyle = '#ffcad4';
        ctx.beginPath();
        ctx.arc(p.x + 20, p.y - 1, 4, 0, Math.PI * 2);
        ctx.arc(p.x + p.width - 20, p.y - 1, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private renderYarn() {
    const ctx = this.ctx;
    ctx.save();

    // Yarn trail line
    if (this.yarnBall.trail.length > 1) {
      ctx.strokeStyle = this.season === 'winter' ? '#a5d8ff' : this.yarnBall.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.yarnBall.trail[0].x, this.yarnBall.trail[0].y);
      for (let i = 1; i < this.yarnBall.trail.length; i++) {
        ctx.lineTo(this.yarnBall.trail[i].x, this.yarnBall.trail[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Yarn ball shadow
    ctx.fillStyle = this.season === 'winter' ? 'rgba(70, 110, 160, 0.22)' : 'rgba(70, 40, 15, 0.2)';
    ctx.beginPath();
    ctx.ellipse(this.yarnBall.x, this.groundY - 2, this.yarnBall.radius * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yarn ball body
    ctx.translate(this.yarnBall.x, this.yarnBall.y);
    ctx.rotate(this.yarnBall.rotation);

    if (this.season === 'winter') {
      // Fluffy White Snowball / Wool Pom-pom effect!
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#c5e2ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.yarnBall.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fluffy scalloped paper snowball contours
      ctx.strokeStyle = '#d0ebff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.yarnBall.radius * 0.7, 0.2 * Math.PI, 1.3 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(2, -2, this.yarnBall.radius * 0.45, 0.7 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();

      // Little snowflake on snowball
      ctx.strokeStyle = '#74c0fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
      ctx.moveTo(0, -4); ctx.lineTo(0, 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.yarnBall.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.yarnBall.radius, 0, Math.PI * 2);
      ctx.fill();

      // Yarn winding lines
      ctx.strokeStyle = '#ffe3e3';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.yarnBall.radius * 0.7, 0.2 * Math.PI, 1.2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(3, -2, this.yarnBall.radius * 0.5, 0.8 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();

      // Free loose yarn strand
      ctx.strokeStyle = this.yarnBall.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.yarnBall.radius, 0);
      ctx.quadraticCurveTo(this.yarnBall.radius + 15, -10, this.yarnBall.radius + 20, 10);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderCat(cat: Cat) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, cat.alpha));

    const drawW = cat.width * cat.scale * cat.squashX;
    const drawH = cat.height * cat.scale * cat.squashY;

    // 1. Draw Parachute if AIRDROP
    if (cat.state === 'AIRDROP') {
      this.renderParachute(cat);
    }

    // 2. Draw Departing Wings / Balloon
    if (cat.state === 'DEPARTING') {
      this.renderDepartingEffects(cat);
    }

    // 3. Ground / Platform Shadow
    if (cat.state !== 'AIRDROP' && cat.state !== 'DEPARTING') {
      ctx.fillStyle = 'rgba(60, 35, 15, 0.22)';
      ctx.beginPath();
      const shadowW = (cat.width * cat.scale * cat.squashX) * 0.45;
      const shadowH = 7 * cat.squashY;
      ctx.ellipse(cat.x, cat.y - 2, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Cat Sprite Transformation
    ctx.translate(cat.x, cat.y);
    ctx.rotate(cat.rotation);
    if (!cat.flipX) {
      ctx.scale(-1, 1);
    }

    // Paper Cutout Border & Shadow Effect
    ctx.save();
    ctx.shadowColor = 'rgba(70, 40, 15, 0.25)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Draw the transparent PNG cat
    if (cat.img.complete && cat.img.naturalWidth > 0) {
      ctx.drawImage(
        cat.img,
        -drawW / 2,
        -drawH,
        drawW,
        drawH
      );
    } else {
      // Fallback cute paper cutout placeholder if image is still loading
      this.renderPlaceholderCat(drawW, drawH);
    }
    ctx.restore();

    ctx.restore(); // Restore cat transform

    // 5. Speech Bubble & Hearts (rendered in world space above cat)
    this.renderCatOverlays(cat);
  }

  private renderParachute(cat: Cat) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cat.x, cat.y - cat.height * 0.9);
    ctx.rotate(cat.rotation * 0.7);

    // Parachute cords (paper strings)
    ctx.strokeStyle = '#8d5b4c';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);

    const chuteW = 85;
    const chuteH = 50;
    const cordAttachY = 20;

    ctx.beginPath();
    ctx.moveTo(-chuteW / 2 + 5, -chuteH);
    ctx.lineTo(0, cordAttachY);
    ctx.moveTo(chuteW / 2 - 5, -chuteH);
    ctx.lineTo(0, cordAttachY);
    ctx.moveTo(-chuteW / 4, -chuteH);
    ctx.lineTo(0, cordAttachY);
    ctx.moveTo(chuteW / 4, -chuteH);
    ctx.lineTo(0, cordAttachY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paper Parachute canopy (Crayon stripes)
    const stripes = ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2'];
    const sliceW = chuteW / stripes.length;

    for (let i = 0; i < stripes.length; i++) {
      ctx.fillStyle = stripes[i];
      ctx.beginPath();
      const sx = -chuteW / 2 + i * sliceW;
      ctx.moveTo(sx, -chuteH);
      ctx.bezierCurveTo(
        sx + sliceW / 2,
        -chuteH - 35,
        sx + sliceW / 2,
        -chuteH - 35,
        sx + sliceW,
        -chuteH
      );
      ctx.closePath();
      ctx.fill();
    }

    // Torn paper scalloped edge on parachute bottom
    ctx.fillStyle = '#ffffff';
    for (let x = -chuteW / 2; x < chuteW / 2; x += 10) {
      ctx.beginPath();
      ctx.arc(x + 5, -chuteH, 5, 0, Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderDepartingEffects(cat: Cat) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cat.x, cat.y - cat.height * 0.6);

    // Paper Angel Wings
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d4b383';
    ctx.lineWidth = 2;

    // Left wing
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.bezierCurveTo(-60, -30, -50, -60, -15, -25);
    ctx.fill();
    ctx.stroke();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.bezierCurveTo(60, -30, 50, -60, 15, -25);
    ctx.fill();
    ctx.stroke();

    // Little paper halo
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -cat.height * 0.5 - 10, 22, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderPlaceholderCat(w: number, h: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#f79f4a';
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w * 0.4, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐱', 0, -h / 2 + 5);
  }

  private renderCatOverlays(cat: Cat) {
    const ctx = this.ctx;
    ctx.save();

    // Render Hearts
    for (const heart of cat.hearts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, heart.alpha);
      ctx.translate(heart.x, heart.y);
      ctx.scale(heart.scale, heart.scale);

      ctx.fillStyle = '#ff6b81';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-8, -10, -16, 2, 0, 14);
      ctx.bezierCurveTo(16, 2, 8, -10, 0, 0);
      ctx.fill();

      ctx.restore();
    }

    // Render Speech Bubble
    if (cat.speechBubble) {
      const bubbleY = cat.y - cat.height * 1.05;
      ctx.font = 'bold 15px "Zen Maru Gothic", sans-serif';
      const textMetrics = ctx.measureText(cat.speechBubble);
      const padding = 12;
      const bubbleW = textMetrics.width + padding * 2;
      const bubbleH = 32;

      ctx.save();
      ctx.translate(cat.x, bubbleY);

      // Cardstock shadow
      ctx.fillStyle = 'rgba(70, 40, 15, 0.2)';
      ctx.beginPath();
      ctx.roundRect(-bubbleW / 2 + 2, -bubbleH + 2, bubbleW, bubbleH, 10);
      ctx.fill();

      // Craft paper background
      ctx.fillStyle = '#fffdfa';
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-bubbleW / 2, -bubbleH, bubbleW, bubbleH, 10);
      ctx.fill();
      ctx.stroke();

      // Tail of speech bubble
      ctx.fillStyle = '#fffdfa';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = '#5c3a21';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat.speechBubble, 0, -bubbleH / 2);

      ctx.restore();
    }

    ctx.restore();
  }
}
