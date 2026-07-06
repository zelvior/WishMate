import { MusicTheme } from "../types";

let audioCtx: AudioContext | null = null;
let currentNotesTimeout: number[] = [];
let bassOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
let melodyOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
let isPlaying = false;

// Note frequencies (C Major)
const NOTES = {
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.00,
  // Bass/Chords
  C3: 130.81,
  F3: 174.61,
  G3: 196.00,
  A3: 220.00,
  E3: 164.81,
  D3: 146.83,
};

// Happy Birthday Melody definition: [noteName, relativeDuration]
// Durations: 0.5 (eighth), 0.5 (eighth), 1.0 (quarter), 1.0 (quarter), 1.0 (quarter), 2.0 (half)
const SONG_MELODY: [keyof typeof NOTES, number][] = [
  ['G4', 0.5], ['G4', 0.5], ['A4', 1.0], ['G4', 1.0], ['C5', 1.0], ['B4', 2.0], // Happy Birthday to You
  ['G4', 0.5], ['G4', 0.5], ['A4', 1.0], ['G4', 1.0], ['D5', 1.0], ['C5', 2.0], // Happy Birthday to You
  ['G4', 0.5], ['G4', 0.5], ['G5', 1.0], ['E5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 2.0], // Happy Birthday Dear [Name]
  ['F5', 0.5], ['F5', 0.5], ['E5', 1.0], ['C5', 1.0], ['D5', 1.0], ['C5', 3.0]  // Happy Birthday to You
];

// Chords timeline matching the melody bars
const CHORDS: { timeIndex: number; chord: (keyof typeof NOTES)[] }[] = [
  { timeIndex: 0, chord: ['C3', 'E3'] },
  { timeIndex: 4, chord: ['G3', 'B4'] },
  { timeIndex: 10, chord: ['G3', 'D3'] },
  { timeIndex: 14, chord: ['C3', 'G3'] },
  { timeIndex: 20, chord: ['C3', 'E3'] },
  { timeIndex: 25, chord: ['F3', 'A3'] },
  { timeIndex: 30, chord: ['C3', 'F3'] },
  { timeIndex: 34, chord: ['G3', 'C3'] }
];

export function stopBirthdaySong() {
  isPlaying = false;
  
  // Clear all upcoming note timeouts
  currentNotesTimeout.forEach(clearTimeout);
  currentNotesTimeout = [];

  // Stop and disconnect all active oscillators
  bassOscillators.forEach(o => {
    try { o.osc.stop(); o.osc.disconnect(); } catch (e) {}
  });
  bassOscillators = [];

  melodyOscillators.forEach(o => {
    try { o.osc.stop(); o.osc.disconnect(); } catch (e) {}
  });
  melodyOscillators = [];

  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.suspend();
  }
}

export function isSongPlaying() {
  return isPlaying;
}

export function playBirthdaySong(theme: MusicTheme) {
  // Stop existing first
  stopBirthdaySong();
  
  try {
    // Create AudioContext lazily
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isPlaying = true;
    playCycle(theme);
  } catch (err) {
    console.error("Web Audio failed to play:", err);
  }
}

function playCycle(theme: MusicTheme) {
  if (!isPlaying || !audioCtx) return;

  const tempoMap = {
    classic: 110, // BPM
    pop: 135,
    synthwave: 115,
    lofi: 80
  };

  const bpm = tempoMap[theme];
  const beatDuration = 60 / bpm; // Seconds per beat

  let currentTime = audioCtx.currentTime + 0.1;

  // Render melody and chords
  let currentBeat = 0;

  // Play continuous chord sequence
  CHORDS.forEach((c) => {
    const chordTime = currentTime + (c.timeIndex * beatDuration * 0.5);
    
    // Play notes in chord
    c.chord.forEach((noteName) => {
      if (!audioCtx || !isPlaying) return;
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      // Select oscillator type & filter based on theme
      setupSynthTone(theme, osc, gain, true);

      osc.frequency.setValueAtTime(NOTES[noteName], chordTime);
      
      // Chord fade-in and envelope
      gain.gain.setValueAtTime(0, chordTime);
      gain.gain.linearRampToValueAtTime(theme === 'synthwave' ? 0.08 : 0.05, chordTime + 0.1);
      
      const duration = 4 * beatDuration; // chords last 4 beats
      gain.gain.setValueAtTime(theme === 'synthwave' ? 0.08 : 0.05, chordTime + duration - 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordTime + duration);
      
      osc.start(chordTime);
      osc.stop(chordTime + duration);
      
      bassOscillators.push({ osc, gain });
    });
  });

  // Play Melody notes
  SONG_MELODY.forEach(([noteName, beats], idx) => {
    const noteTime = currentTime + (currentBeat * beatDuration);
    const duration = beats * beatDuration * 0.95; // Slightly shorter to create note gaps
    
    if (!audioCtx || !isPlaying) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    setupSynthTone(theme, osc, gain, false);
    osc.frequency.setValueAtTime(NOTES[noteName], noteTime);

    // Dynamic Vibrato for Lo-fi
    if (theme === 'lofi') {
      const vibrato = audioCtx.createOscillator();
      const vibratoGain = audioCtx.createGain();
      vibrato.frequency.value = 4.5; // slow wobble
      vibratoGain.gain.value = 2.5; // depth
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start(noteTime);
      vibrato.stop(noteTime + duration);
    }
    
    // Attack-Decay envelope
    gain.gain.setValueAtTime(0, noteTime);
    
    // Lead volume levels
    const maxVol = theme === 'synthwave' ? 0.12 : theme === 'classic' ? 0.15 : 0.1;
    gain.gain.linearRampToValueAtTime(maxVol, noteTime + 0.03); // Quick attack
    
    // Decay-Sustain-Release
    gain.gain.setValueAtTime(maxVol, noteTime + duration - 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + duration);
    
    osc.start(noteTime);
    osc.stop(noteTime + duration);
    
    melodyOscillators.push({ osc, gain });
    
    currentBeat += beats;
  });

  // Calculate total duration to loop the song seamlessly
  const totalSongSeconds = currentBeat * beatDuration;
  
  const loopTimeout = window.setTimeout(() => {
    if (isPlaying) {
      // Clear terminated oscillators from state to prevent memory leak
      bassOscillators = [];
      melodyOscillators = [];
      playCycle(theme);
    }
  }, totalSongSeconds * 1000);

  currentNotesTimeout.push(loopTimeout);
}

function setupSynthTone(theme: MusicTheme, osc: OscillatorNode, gain: GainNode, isBass: boolean) {
  if (theme === 'classic') {
    // Elegant warm triangle waves with high pluck
    osc.type = isBass ? 'triangle' : 'sine';
  } else if (theme === 'pop') {
    // Energetic retro-game square waves
    osc.type = isBass ? 'triangle' : 'square';
  } else if (theme === 'synthwave') {
    // Deep 80s detuned sawtooth waves
    osc.type = isBass ? 'sawtooth' : 'sawtooth';
    if (!isBass) {
      // Add slight detune
      osc.detune.setValueAtTime(6, audioCtx!.currentTime);
    }
  } else if (theme === 'lofi') {
    // Very soft triangle wave, dreamy vibes
    osc.type = isBass ? 'triangle' : 'triangle';
  }
}
export function playPopSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const popCtx = audioCtx || new AudioContextClass();
    const osc = popCtx.createOscillator();
    const gain = popCtx.createGain();
    
    osc.connect(gain);
    gain.connect(popCtx.destination);
    
    const now = popCtx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {}
}

export function playBlowSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const popCtx = audioCtx || new AudioContextClass();
    const osc = popCtx.createOscillator();
    const gain = popCtx.createGain();
    
    osc.connect(gain);
    gain.connect(popCtx.destination);
    
    const now = popCtx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {}
}
