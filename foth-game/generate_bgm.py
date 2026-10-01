import numpy as np
import wave

SAMPLE_RATE = 32000
BPM = 128.0
BEAT_SEC = 60.0 / BPM
BAR_SEC = BEAT_SEC * 4.0
NUM_BARS = 32  # 32 measures = 60.00 seconds exact seamless loop
TOTAL_SEC = NUM_BARS * BAR_SEC
TOTAL_SAMPLES = int(TOTAL_SEC * SAMPLE_RATE)

print(f"Generating BGM: BPM={BPM}, Bars={NUM_BARS}, Duration={TOTAL_SEC:.2f}s, Samples={TOTAL_SAMPLES}")

NOTE_MAP = {
    'C': 0, 'C#': 1, 'DB': 1,
    'D': 2, 'D#': 3, 'EB': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'GB': 6,
    'G': 7, 'G#': 8, 'AB': 8,
    'A': 9, 'A#': 10, 'BB': 10,
    'B': 11
}

def note_to_freq(note_name):
    name = note_name[:-1].upper()
    octave = int(note_name[-1])
    semitone = NOTE_MAP[name]
    midi = 12 + octave * 12 + semitone
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))

CHORDS = [
    # Section A (Bars 1-8: Driving Dm build)
    ('D3', 'F3', 'A3', 'D4'),
    ('Bb2', 'D3', 'F3', 'Bb3'),
    ('C3', 'E3', 'G3', 'C4'),
    ('A2', 'C3', 'E3', 'A3'),
    ('D3', 'F3', 'A3', 'D4'),
    ('Bb2', 'D3', 'F3', 'Bb3'),
    ('F3', 'A3', 'C4', 'F4'),
    ('C3', 'E3', 'G3', 'C4'),
    # Section B (Bars 9-16: Main Theme melody)
    ('D3', 'F3', 'A3', 'D4'),
    ('Bb2', 'D3', 'F3', 'Bb3'),
    ('C3', 'E3', 'G3', 'C4'),
    ('A2', 'C3', 'E3', 'A3'),
    ('D3', 'F3', 'A3', 'D4'),
    ('Bb2', 'D3', 'F3', 'Bb3'),
    ('G2', 'Bb2', 'D3', 'G3'),
    ('A2', 'C#3', 'E3', 'A3'),
    # Section C (Bars 17-24: Climax & High Energy)
    ('Bb2', 'D3', 'F3', 'Bb3'),
    ('C3', 'E3', 'G3', 'C4'),
    ('D3', 'F3', 'A3', 'D4'),
    ('F3', 'A3', 'C4', 'F4'),
    ('Bb2', 'D3', 'F3', 'Bb3'),
    ('C3', 'E3', 'G3', 'C4'),
    ('D3', 'F3', 'A3', 'D4'),
    ('A2', 'C3', 'E3', 'A3'),
    # Section D (Bars 25-32: Epic Outro resolving back into Bar 1 Dm)
    ('Bb2', 'D3', 'F3', 'Bb3'),
    ('C3', 'E3', 'G3', 'C4'),
    ('D3', 'F3', 'A3', 'D4'),
    ('G2', 'Bb2', 'D3', 'G3'),
    ('Bb2', 'D3', 'F3', 'Bb3'),
    ('C3', 'E3', 'G3', 'C4'),
    ('A2', 'C#3', 'E3', 'A3'),
    ('A2', 'D3', 'E3', 'A3'),
]

left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)

samples_per_beat = int(BEAT_SEC * SAMPLE_RATE)
samples_per_16th = int((BEAT_SEC / 4.0) * SAMPLE_RATE)

# 1. DRUMS & PERCUSSION
print("Synthesizing drums...")
for bar in range(NUM_BARS):
    bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
    # Energy curve
    drum_energy = 0.85 if bar < 4 else 1.0
    
    for beat in range(4):
        beat_start = bar_start + beat * samples_per_beat
        
        # Punchy Kick
        kick_len = int(0.24 * SAMPLE_RATE)
        kt = np.linspace(0, 0.24, kick_len, endpoint=False)
        k_freq = 150.0 * np.exp(-kt * 26.0) + 40.0
        k_phase = 2.0 * np.pi * np.cumsum(k_freq) / SAMPLE_RATE
        k_env = np.exp(-kt * 15.0)
        kick = np.sin(k_phase) * k_env * (1.15 * drum_energy)
        kick[:int(0.004 * SAMPLE_RATE)] += np.random.uniform(-0.25, 0.25, int(0.004 * SAMPLE_RATE)) * drum_energy
        
        end_k = min(TOTAL_SAMPLES, beat_start + kick_len)
        actual_k = end_k - beat_start
        if actual_k > 0:
            left[beat_start:end_k] += kick[:actual_k] * 0.72
            right[beat_start:end_k] += kick[:actual_k] * 0.72
            
        # Snare / Cyber Clap (beats 2 & 4)
        if beat in (1, 3):
            snare_len = int(0.22 * SAMPLE_RATE)
            st = np.linspace(0, 0.22, snare_len, endpoint=False)
            s_noise = np.random.uniform(-1.0, 1.0, snare_len) * np.exp(-st * 22.0)
            s_tone = np.sin(2.0 * np.pi * 190.0 * st) * np.exp(-st * 30.0)
            snare = (s_noise * 0.65 + s_tone * 0.35) * drum_energy
            
            end_s = min(TOTAL_SAMPLES, beat_start + snare_len)
            actual_s = end_s - beat_start
            if actual_s > 0:
                left[beat_start:end_s] += snare[:actual_s] * 0.52
                right[beat_start:end_s] += snare[:actual_s] * 0.52

        # Galloping 16th Hi-Hats
        for s16 in range(4):
            hat_start = beat_start + s16 * samples_per_16th
            hat_len = int(0.05 * SAMPLE_RATE)
            ht = np.linspace(0, 0.05, hat_len, endpoint=False)
            h_env = np.exp(-ht * (70.0 if s16 % 2 == 1 else 105.0))
            accent = 0.85 if s16 % 2 == 1 else 0.42
            if s16 == 0 and beat % 2 == 0:
                accent = 0.65
            hat = np.random.uniform(-1.0, 1.0, hat_len) * h_env * accent * 0.35 * drum_energy
            
            end_h = min(TOTAL_SAMPLES, hat_start + hat_len)
            actual_h = end_h - hat_start
            if actual_h > 0:
                pan_l = 0.5 + 0.18 * np.sin(s16)
                pan_r = 0.5 - 0.18 * np.sin(s16)
                left[hat_start:end_h] += hat[:actual_h] * pan_l
                right[hat_start:end_h] += hat[:actual_h] * pan_r

# 2. DRIVING CYBER BASSLINE
print("Synthesizing bassline...")
for bar in range(NUM_BARS):
    chord = CHORDS[bar]
    root_freq = note_to_freq(chord[0]) / 2.0
    bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
    
    for b16 in range(16):
        note_start = bar_start + b16 * samples_per_16th
        note_len = int(samples_per_16th * 0.85)
        bt = np.linspace(0, note_len / SAMPLE_RATE, note_len, endpoint=False)
        
        oct = 2.0 if (b16 % 4 in (1, 3)) else 1.0
        f = root_freq * oct
        
        saw = 2.0 * (f * bt - np.floor(0.5 + f * bt))
        sqr = np.sign(np.sin(2.0 * np.pi * f * bt))
        sub = np.sin(2.0 * np.pi * root_freq * bt)
        
        env = np.exp(-bt * 15.0)
        if b16 % 4 == 0:
            env[:int(0.03 * SAMPLE_RATE)] *= np.linspace(0.3, 1.0, int(0.03 * SAMPLE_RATE))
            
        bass_snd = (saw * 0.45 + sqr * 0.25 + sub * 0.45) * env * 0.52
        
        end_b = min(TOTAL_SAMPLES, note_start + note_len)
        actual_b = end_b - note_start
        if actual_b > 0:
            left[note_start:end_b] += bass_snd[:actual_b]
            right[note_start:end_b] += bass_snd[:actual_b]

# 3. SYNTH ARPEGGIO
print("Synthesizing arpeggios...")
for bar in range(NUM_BARS):
    chord = CHORDS[bar]
    freqs = [note_to_freq(n) for n in chord] + [note_to_freq(chord[0]) * 2.0, note_to_freq(chord[1]) * 2.0]
    bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
    
    for a16 in range(16):
        arp_start = bar_start + a16 * samples_per_16th
        arp_len = int(samples_per_16th * 1.7)
        at = np.linspace(0, arp_len / SAMPLE_RATE, arp_len, endpoint=False)
        
        idx = (a16 * 2 + (bar % 3)) % len(freqs)
        f = freqs[idx]
        
        a_env = np.exp(-at * 19.0)
        arp_l = np.sin(2.0 * np.pi * f * at) + 0.5 * np.sin(2.0 * np.pi * (f * 1.004) * at)
        arp_r = np.sin(2.0 * np.pi * (f * 0.996) * at) + 0.5 * np.sin(2.0 * np.pi * (f * 2.0) * at)
        
        snd_l = arp_l * a_env * 0.20
        snd_r = arp_r * a_env * 0.20
        
        end_a = min(TOTAL_SAMPLES, arp_start + arp_len)
        actual_a = end_a - arp_start
        if actual_a > 0:
            left[arp_start:end_a] += snd_l[:actual_a]
            right[arp_start:end_a] += snd_r[:actual_a]
        if arp_start + arp_len > TOTAL_SAMPLES:
            wrap_len = (arp_start + arp_len) - TOTAL_SAMPLES
            left[:wrap_len] += snd_l[actual_a:actual_a + wrap_len]
            right[:wrap_len] += snd_r[actual_a:actual_a + wrap_len]

# 4. EPIC HEROIC LEAD MELODY
print("Synthesizing lead melody...")
MELODY = [
    # Bars 1-8 (Theme A)
    ('D4', 0, 1.5), ('E4', 1.5, 0.5), ('F4', 2.0, 2.0),
    ('G4', 4.0, 1.5), ('A4', 5.5, 0.5), ('D5', 6.0, 2.0),
    ('C5', 8.0, 1.5), ('A4', 9.5, 0.5), ('G4', 10.0, 1.0), ('F4', 11.0, 1.0),
    ('E4', 12.0, 2.0), ('F4', 14.0, 1.0), ('E4', 15.0, 1.0),
    ('D4', 16.0, 1.5), ('F4', 17.5, 0.5), ('A4', 18.0, 2.0),
    ('Bb4', 20.0, 1.5), ('C5', 21.5, 0.5), ('D5', 22.0, 2.0),
    ('E5', 24.0, 1.5), ('F5', 25.5, 0.5), ('E5', 26.0, 1.0), ('D5', 27.0, 1.0),
    ('C5', 28.0, 2.0), ('A4', 30.0, 1.0), ('C5', 31.0, 1.0),
    # Bars 9-16 (Theme B - Climactic ascent)
    ('D5', 32.0, 2.0), ('C5', 34.0, 1.0), ('Bb4', 35.0, 1.0),
    ('A4', 36.0, 2.0), ('F4', 38.0, 1.0), ('G4', 39.0, 1.0),
    ('A4', 40.0, 1.5), ('Bb4', 41.5, 0.5), ('C5', 42.0, 2.0),
    ('D5', 44.0, 1.5), ('E5', 45.5, 0.5), ('F5', 46.0, 2.0),
    # Bars 17-24 (Theme C - Gallop rush)
    ('G5', 48.0, 1.5), ('F5', 49.5, 0.5), ('E5', 50.0, 1.0), ('D5', 51.0, 1.0),
    ('C5', 52.0, 2.0), ('A4', 54.0, 2.0),
    ('Bb4', 56.0, 1.5), ('C5', 57.5, 0.5), ('D5', 58.0, 2.0),
    ('E5', 60.0, 1.5), ('F5', 61.5, 0.5), ('G5', 62.0, 2.0),
    ('A5', 64.0, 2.0), ('G5', 66.0, 1.0), ('F5', 67.0, 1.0),
    ('E5', 68.0, 2.0), ('D5', 70.0, 1.0), ('C5', 71.0, 1.0),
    ('D5', 72.0, 2.0), ('E5', 74.0, 2.0),
    ('F5', 76.0, 2.0), ('G5', 78.0, 2.0),
    # Bars 25-32 (Theme D - Climax & Harmonic resolution to loop point)
    ('A5', 80.0, 2.5), ('G5', 82.5, 0.5), ('F5', 83.0, 1.0),
    ('E5', 84.0, 2.0), ('F5', 86.0, 1.0), ('D5', 87.0, 1.0),
    ('C5', 88.0, 1.5), ('D5', 89.5, 0.5), ('E5', 90.0, 2.0),
    ('F5', 92.0, 1.5), ('G5', 93.5, 0.5), ('A5', 94.0, 2.0),
    ('Bb5', 96.0, 2.0), ('A5', 98.0, 1.0), ('G5', 99.0, 1.0),
    ('F5', 100.0, 2.0), ('E5', 102.0, 2.0),
    ('D5', 104.0, 3.0), ('E5', 107.0, 1.0),
    ('D5', 108.0, 4.0),
    ('A4', 112.0, 2.0), ('D5', 114.0, 2.0),
    ('C#5', 116.0, 4.0),
    ('D5', 120.0, 4.0), # Seamless resolution matching Bar 1 D4/D5
]

for note, beat_offset, dur_beats in MELODY:
    start_samp = int(beat_offset * samples_per_beat)
    dur_samp = int((dur_beats * BEAT_SEC) * SAMPLE_RATE)
    
    if start_samp >= TOTAL_SAMPLES:
        continue
        
    freq = note_to_freq(note)
    lt = np.linspace(0, dur_samp / SAMPLE_RATE, dur_samp, endpoint=False)
    
    vib = np.sin(2.0 * np.pi * 5.6 * lt) * 4.0
    lead1 = np.sin(2.0 * np.pi * (freq + vib) * lt)
    lead2 = 0.5 * np.sin(2.0 * np.pi * (freq * 1.006 + vib) * lt)
    lead3 = 0.5 * np.sin(2.0 * np.pi * (freq * 0.994 + vib) * lt)
    lead4 = 0.35 * np.sin(2.0 * np.pi * (freq * 2.0) * lt)
    
    env = np.ones_like(lt)
    attack_len = min(len(lt), int(0.035 * SAMPLE_RATE))
    decay_len = min(len(lt), int(0.075 * SAMPLE_RATE))
    env[:attack_len] = np.linspace(0, 1, attack_len)
    env[-decay_len:] = np.linspace(1, 0, decay_len)
    
    lead_snd = (lead1 + lead2 + lead3 + lead4) * env * 0.30
    
    end_samp = min(TOTAL_SAMPLES, start_samp + dur_samp)
    act_len = end_samp - start_samp
    if act_len > 0:
        left[start_samp:end_samp] += lead_snd[:act_len] * 0.75
        right[start_samp:end_samp] += lead_snd[:act_len] * 0.75
        
    if start_samp + dur_samp > TOTAL_SAMPLES:
        wrap = (start_samp + dur_samp) - TOTAL_SAMPLES
        left[:wrap] += lead_snd[act_len:act_len + wrap] * 0.75
        right[:wrap] += lead_snd[act_len:act_len + wrap] * 0.75

# 5. VECTORIZED AMBIENT STEREO REVERB & DELAY WITH CIRCULAR WRAPAROUND
print("Applying reverb & circular loop wrap...")
delay_samples_l = int(0.35 * SAMPLE_RATE)
delay_samples_r = int(0.48 * SAMPLE_RATE)

delay_buf_l = np.roll(right, delay_samples_l) * 0.26
delay_buf_r = np.roll(left, delay_samples_r) * 0.26

left += delay_buf_l
right += delay_buf_r

# Normalize & Soft Limiter
print("Mastering & Normalizing...")
max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
if max_val > 0:
    left = np.tanh(left / max_val * 1.35) * 0.92
    right = np.tanh(right / max_val * 1.35) * 0.92

out_path = 'audio/force_of_the_horse_bgm.wav'
with wave.open(out_path, 'w') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    
    interleaved = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    interleaved[0::2] = (left * 32767.0).astype(np.int16)
    interleaved[1::2] = (right * 32767.0).astype(np.int16)
    wf.writeframes(interleaved.tobytes())

print(f"BGM generated successfully at {out_path}!")
