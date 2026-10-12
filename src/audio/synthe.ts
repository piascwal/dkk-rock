/**
 * Tout le son est synthétisé (Web Audio) : pas un seul fichier à charger.
 * Le contexte audio ne démarre qu'après un premier geste du joueur (règle des navigateurs).
 */
export class Synthe {
  ctx: AudioContext | null = null;
  private maitre!: GainNode;
  effets!: GainNode;
  musique!: GainNode;
  private bruitBlanc!: AudioBuffer;
  private distorsion!: WaveShaperNode;

  /** À appeler depuis un geste (toucher, touche). */
  demarre(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.maitre = ctx.createGain();
    this.maitre.gain.value = 0.7;
    const compresseur = ctx.createDynamicsCompressor();
    this.maitre.connect(compresseur).connect(ctx.destination);
    this.effets = ctx.createGain();
    this.effets.connect(this.maitre);
    this.musique = ctx.createGain();
    this.musique.gain.value = 0.35;
    this.musique.connect(this.maitre);
    this.bruitBlanc = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.bruitBlanc.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.distorsion = ctx.createWaveShaper();
    const courbe = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 512 - 1) * 4;
      courbe[i] = Math.tanh(x);
    }
    this.distorsion.curve = courbe;
    this.distorsion.connect(this.maitre);
  }

  get pret(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** Une note : oscillateur, enveloppe, glissando optionnel. */
  note(o: {
    freq: number;
    duree: number;
    type?: OscillatorType;
    volume?: number;
    vers?: number;
    quand?: number;
    sortie?: AudioNode;
    distordu?: boolean;
    filtre?: number;
  }): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = o.quand ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'square';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.vers) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.vers), t + o.duree);
    g.gain.setValueAtTime(o.volume ?? 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + o.duree);
    let noeud: AudioNode = osc.connect(g);
    if (o.filtre) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.filtre;
      noeud = noeud.connect(f);
    }
    noeud.connect(o.distordu ? this.distorsion : (o.sortie ?? this.effets));
    osc.start(t);
    osc.stop(t + o.duree + 0.02);
  }

  /** Du bruit filtré : explosions, caisse claire, charleston, souffle. */
  bruit(o: {
    duree: number;
    volume?: number;
    passeHaut?: number;
    passeBas?: number;
    quand?: number;
    sortie?: AudioNode;
  }): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = o.quand ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.bruitBlanc;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.volume ?? 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + o.duree);
    let n: AudioNode = src;
    if (o.passeHaut) {
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = o.passeHaut;
      n = n.connect(f);
    }
    if (o.passeBas) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.passeBas, t);
      f.frequency.exponentialRampToValueAtTime(80, t + o.duree);
      n = n.connect(f);
    }
    n.connect(g).connect(o.sortie ?? this.effets);
    src.start(t, Math.random() * 0.5);
    src.stop(t + o.duree + 0.02);
  }

  volumes(effets: boolean, musique: boolean): void {
    if (!this.ctx) return;
    this.effets.gain.value = effets ? 1 : 0;
    this.musique.gain.value = musique ? 0.35 : 0;
  }
}
