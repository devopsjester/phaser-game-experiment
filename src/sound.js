// =============================================================
// PAC-DASH Sound Manager
// Pac-Man style SFX + 80s electronic background music
// All sounds generated programmatically via Web Audio API
// =============================================================
'use strict';

var SoundManager = (function () {

  var _ctx = null;        // AudioContext (created on first user gesture)
  var _sfxOn = true;
  var _musicOn = true;
  var _musicNodes = null;  // { oscillators, gains, master } for stopping music
  var _musicPlaying = false;

  // ---- persistence ----
  function _loadPrefs () {
    try {
      var s = localStorage.getItem('pacDashSfx');
      var m = localStorage.getItem('pacDashMusic');
      if (s !== null) _sfxOn = s === '1';
      if (m !== null) _musicOn = m === '1';
    } catch (_e) { /* localStorage unavailable */ }
  }

  function _savePrefs () {
    try {
      localStorage.setItem('pacDashSfx', _sfxOn ? '1' : '0');
      localStorage.setItem('pacDashMusic', _musicOn ? '1' : '0');
    } catch (_e) { /* localStorage unavailable */ }
  }

  // ---- AudioContext helpers ----
  function _ensureCtx () {
    if (!_ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) _ctx = new AC();
    }
    if (_ctx && _ctx.state === 'suspended') {
      _ctx.resume();
    }
    return _ctx;
  }

  // ---- SFX generators ----

  /** Classic pac-man "waka" chomp sound */
  function _playWaka () {
    var ctx = _ensureCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.10);
  }

  /** Ghost eaten – ascending chirp */
  function _playEatGhost () {
    var ctx = _ensureCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  /** Power-up activated – rising arpeggio */
  function _playPowerUp () {
    var ctx = _ensureCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    var notes = [262, 330, 392, 523, 659];
    notes.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      var t = now + i * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  /** Player hit / death – descending wail */
  function _playDeath () {
    var ctx = _ensureCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.10, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.70);
  }

  /** Game over – sad descending tones */
  function _playGameOver () {
    var ctx = _ensureCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    var notes = [392, 330, 262, 196, 131];
    notes.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      var t = now + i * 0.20;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  /** Fruit pickup – quick bright blip */
  function _playFruit () {
    var ctx = _ensureCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // ---- 80s Electronic Background Music ----

  function _startMusic () {
    var ctx = _ensureCtx();
    if (!ctx) return;
    if (_musicPlaying) return;

    var master = ctx.createGain();
    master.gain.setValueAtTime(0.10, ctx.currentTime);
    master.connect(ctx.destination);

    var oscillators = [];
    var gains = [];

    // Bass line – a looping sequence using a square wave
    var bassOsc = ctx.createOscillator();
    var bassGain = ctx.createGain();
    bassOsc.type = 'square';
    bassOsc.frequency.setValueAtTime(65, ctx.currentTime);
    bassGain.gain.setValueAtTime(0.35, ctx.currentTime);
    bassOsc.connect(bassGain);
    bassGain.connect(master);
    bassOsc.start();
    oscillators.push(bassOsc);
    gains.push(bassGain);

    // Programmatic bass sequence
    var bassNotes = [65, 65, 82, 82, 98, 98, 87, 87];
    var bassStepTime = 0.375; // 160 BPM eighth notes

    function scheduleBass () {
      if (!_musicPlaying) return;
      var now = ctx.currentTime;
      for (var i = 0; i < bassNotes.length; i++) {
        var t = now + i * bassStepTime;
        bassOsc.frequency.setValueAtTime(bassNotes[i], t);
      }
      _musicNodes._bassTimerId = setTimeout(scheduleBass, bassNotes.length * bassStepTime * 1000 - 50);
    }
    scheduleBass();

    // Pad – triangle wave chord for atmosphere
    var padFreqs = [196, 247, 294]; // G3, B3, D4 – G major
    padFreqs.forEach(function (freq) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(g);
      g.connect(master);
      osc.start();
      oscillators.push(osc);
      gains.push(g);
    });

    // Arpeggiated lead – sawtooth with volume envelope
    var leadOsc = ctx.createOscillator();
    var leadGain = ctx.createGain();
    leadOsc.type = 'sawtooth';
    leadOsc.frequency.setValueAtTime(392, ctx.currentTime);
    leadGain.gain.setValueAtTime(0.06, ctx.currentTime);
    leadOsc.connect(leadGain);
    leadGain.connect(master);
    leadOsc.start();
    oscillators.push(leadOsc);
    gains.push(leadGain);

    // Lead arpeggio sequence
    var leadNotes = [392, 494, 588, 784, 588, 494, 392, 294];
    var leadStepTime = 0.1875; // Sixteenth notes at 160 BPM

    function scheduleLead () {
      if (!_musicPlaying) return;
      var now = ctx.currentTime;
      for (var i = 0; i < leadNotes.length; i++) {
        var t = now + i * leadStepTime;
        leadOsc.frequency.setValueAtTime(leadNotes[i], t);
        leadGain.gain.setValueAtTime(0.06, t);
        leadGain.gain.exponentialRampToValueAtTime(0.01, t + leadStepTime * 0.8);
      }
      _musicNodes._leadTimerId = setTimeout(scheduleLead, leadNotes.length * leadStepTime * 1000 - 50);
    }
    scheduleLead();

    _musicNodes = { oscillators: oscillators, gains: gains, master: master,
                    _bassTimerId: null, _leadTimerId: null };
    _musicPlaying = true;
  }

  function _stopMusic () {
    if (!_musicPlaying || !_musicNodes) return;
    if (_musicNodes._bassTimerId) clearTimeout(_musicNodes._bassTimerId);
    if (_musicNodes._leadTimerId) clearTimeout(_musicNodes._leadTimerId);
    _musicNodes.oscillators.forEach(function (osc) {
      try { osc.stop(); } catch (_e) { /* already stopped */ }
    });
    _musicNodes.master.disconnect();
    _musicNodes = null;
    _musicPlaying = false;
  }

  // ---- public API ----
  _loadPrefs();

  return {
    /** Initialise audio context (call on first user gesture). */
    init: function () {
      _ensureCtx();
    },

    // -- SFX --
    playWaka:     function () { if (_sfxOn) _playWaka(); },
    playEatGhost: function () { if (_sfxOn) _playEatGhost(); },
    playPowerUp:  function () { if (_sfxOn) _playPowerUp(); },
    playDeath:    function () { if (_sfxOn) _playDeath(); },
    playGameOver: function () { if (_sfxOn) _playGameOver(); },
    playFruit:    function () { if (_sfxOn) _playFruit(); },

    // -- Music --
    startMusic: function () { if (_musicOn) _startMusic(); },
    stopMusic:  function () { _stopMusic(); },

    // -- Toggles --
    isSfxOn:   function () { return _sfxOn; },
    isMusicOn: function () { return _musicOn; },

    toggleSfx: function () {
      _sfxOn = !_sfxOn;
      _savePrefs();
      return _sfxOn;
    },

    toggleMusic: function () {
      _musicOn = !_musicOn;
      _savePrefs();
      if (_musicOn) {
        _startMusic();
      } else {
        _stopMusic();
      }
      return _musicOn;
    },

    /** Stop all audio (cleanup). */
    destroy: function () {
      _stopMusic();
      if (_ctx) {
        _ctx.close();
        _ctx = null;
      }
    },
  };
})();

// ---- Export for testing (Node.js / Jest) ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundManager: SoundManager };
}
