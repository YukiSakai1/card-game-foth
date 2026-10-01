import numpy as np
import wave

SAMPLE_RATE = 32000
BPM = 126.0
BEAT_SEC = 60.0 / BPM
SIXTEENTH_SEC = BEAT_SEC / 4.0  # 1/16 note duration in 2/4 (4 per beat)
MEASURE_16THS = 8              # 8 sixteenth notes per measure (2/4 time)
NUM_MEASURES = 64              # 64 measures of 2/4 = 32 bars of 4/4
TOTAL_16THS = NUM_MEASURES * MEASURE_16THS
TOTAL_SEC = TOTAL_16THS * SIXTEENTH_SEC
TOTAL_SAMPLES = int(TOTAL_SEC * SAMPLE_RATE)

print(f"Synthesizing Mozart's Turkish March: BPM={BPM}, Measures={NUM_MEASURES}, Duration={TOTAL_SEC:.2f}s, Samples={TOTAL_SAMPLES}")

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
    if not note_name or note_name == '_':
        return 0.0
    name = note_name[:-1].upper()
    octave = int(note_name[-1])
    semitone = NOTE_MAP[name]
    midi = 12 + octave * 12 + semitone
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))

# Build Melody sequence (list of (start_16th, duration_16th, note_name))
melody_events = []

def add_melody(start_m, notes_with_durations):
    curr_16th = start_m * MEASURE_16THS
    for note, dur in notes_with_durations:
        if note != '_':
            melody_events.append((curr_16th, dur, note))
        curr_16th += dur

# --- Section 1: Theme A (A minor) Measures 0 - 15 ---
theme_a_part1 = [
    # M0: pick up motif
    ('B4', 1), ('A4', 1), ('G#4', 1), ('A4', 1), ('C5', 4),
    # M1: second motif
    ('D5', 1), ('C5', 1), ('B4', 1), ('C5', 1), ('E5', 4),
    # M2: rising run
    ('F5', 1), ('E5', 1), ('D#5', 1), ('E5', 1), ('B5', 1), ('A5', 1), ('G#5', 1), ('A5', 1),
    # M3: high climax
    ('B5', 1), ('A5', 1), ('G#5', 1), ('A5', 1), ('C6', 4),
    # M4: descending run
    ('B5', 2), ('A5', 1), ('G5', 1), ('F5', 1), ('E5', 1), ('D5', 1), ('C5', 1),
    # M5: cadence 1
    ('B4', 2), ('C5', 1), ('D5', 1), ('E4', 4),
    # M6: repeat pick up motif
    ('B4', 1), ('A4', 1), ('G#4', 1), ('A4', 1), ('C5', 4),
    # M7: repeat second motif
    ('D5', 1), ('C5', 1), ('B4', 1), ('C5', 1), ('E5', 4),
    # M8: rising run
    ('F5', 1), ('E5', 1), ('D#5', 1), ('E5', 1), ('A5', 1), ('G#5', 1), ('F#5', 1), ('G#5', 1),
    # M9: resolution in A minor
    ('E5', 1), ('D5', 1), ('C5', 1), ('B4', 1), ('A4', 4),
]
add_melody(0, theme_a_part1)

# Repeat Theme A variation with octave/harmony (Measures 10 - 19)
theme_a_part2 = [
    ('B4', 1), ('A4', 1), ('G#4', 1), ('A4', 1), ('C5', 4),
    ('D5', 1), ('C5', 1), ('B4', 1), ('C5', 1), ('E5', 4),
    ('F5', 1), ('E5', 1), ('D#5', 1), ('E5', 1), ('B5', 1), ('A5', 1), ('G#5', 1), ('A5', 1),
    ('B5', 1), ('A5', 1), ('G#5', 1), ('A5', 1), ('C6', 4),
    ('B5', 2), ('A5', 1), ('G5', 1), ('F5', 1), ('E5', 1), ('D5', 1), ('C5', 1),
    ('B4', 2), ('C5', 1), ('D5', 1), ('E4', 4),
    ('B4', 1), ('A4', 1), ('G#4', 1), ('A4', 1), ('C5', 4),
    ('D5', 1), ('C5', 1), ('B4', 1), ('C5', 1), ('E5', 4),
    ('F5', 1), ('E5', 1), ('D#5', 1), ('E5', 1), ('A5', 1), ('G#5', 1), ('F#5', 1), ('G#5', 1),
    ('E5', 1), ('D5', 1), ('C5', 1), ('B4', 1), ('A4', 4),
]
add_melody(10, theme_a_part2)

# --- Section 2: Theme B (C Major / G Major) Measures 20 - 31 ---
theme_b = [
    # M20-21
    ('G4', 2), ('E5', 1), ('D5', 1), ('C5', 2), ('B4', 1), ('A4', 1),
    ('G4', 2), ('G4', 1), ('A4', 1), ('B4', 1), ('C5', 1), ('D5', 1), ('E5', 1),
    # M22-23
    ('F5', 2), ('E5', 1), ('D5', 1), ('C5', 2), ('B4', 1), ('A4', 1),
    ('G4', 2), ('F#4', 1), ('G4', 1), ('A4', 1), ('B4', 1), ('C5', 1), ('D5', 1),
    # M24-25
    ('E5', 2), ('D5', 1), ('C5', 1), ('B4', 2), ('A4', 1), ('G#4', 1),
    ('A4', 2), ('B4', 1), ('C5', 1), ('D5', 1), ('E5', 1), ('F5', 1), ('G5', 1),
    # M26-27 (Cadence into A Major)
    ('A5', 2), ('G5', 1), ('F5', 1), ('E5', 1), ('D5', 1), ('C5', 1), ('B4', 1),
    ('A4', 2), ('B4', 2), ('C#5', 4),
    # M28-31
    ('E5', 2), ('D5', 1), ('C#5', 1), ('B4', 2), ('A4', 1), ('G#4', 1),
    ('A4', 2), ('B4', 1), ('C#5', 1), ('D5', 1), ('E5', 1), ('F#5', 1), ('G#5', 1),
    ('A5', 2), ('G#5', 1), ('F#5', 1), ('E5', 1), ('D5', 1), ('C#5', 1), ('B4', 1),
    ('A4', 4), ('E4', 4),
]
add_melody(20, theme_b)

# --- Section 3: Theme C (A Major Triumphant March - The Famous Alla Turca Theme!) Measures 32 - 47 ---
theme_c = [
    # M32-33: A Major march motif
    ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('C#5', 1),
    ('D5', 1), ('E5', 1), ('F#5', 1), ('D5', 1), ('B4', 1), ('D5', 1), ('F#5', 1), ('D5', 1),
    # M34-35
    ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('C#5', 1),
    ('B4', 1), ('C#5', 1), ('D5', 1), ('B4', 1), ('G#4', 1), ('B4', 1), ('D5', 1), ('B4', 1),
    # M36-37: repeat march motif
    ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('C#5', 1),
    ('D5', 1), ('E5', 1), ('F#5', 1), ('D5', 1), ('B4', 1), ('D5', 1), ('F#5', 1), ('D5', 1),
    # M38-39: resolution
    ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('B4', 1), ('C#5', 1), ('D5', 1), ('B4', 1),
    ('A4', 2), ('C#5', 2), ('A4', 4),
    # M40-47: Second iteration with octave upper bells
    ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('A5', 1), ('C#6', 1), ('E6', 1), ('C#6', 1),
    ('D6', 1), ('E6', 1), ('F#6', 1), ('D6', 1), ('B5', 1), ('D6', 1), ('F#6', 1), ('D6', 1),
    ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('A5', 1), ('C#6', 1), ('E6', 1), ('C#6', 1),
    ('B5', 1), ('C#6', 1), ('D6', 1), ('B5', 1), ('G#5', 1), ('B5', 1), ('D6', 1), ('B5', 1),
    ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('A5', 1), ('C#6', 1), ('E6', 1), ('C#6', 1),
    ('D6', 1), ('E6', 1), ('F#6', 1), ('D6', 1), ('B5', 1), ('D6', 1), ('F#6', 1), ('D6', 1),
    ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('B5', 1), ('C#6', 1), ('D6', 1), ('B5', 1),
    ('A5', 2), ('C#6', 2), ('A5', 4),
]
add_melody(32, theme_c)

# --- Section 4: Grand Reprise & Coda (Measures 48 - 63) ---
theme_reprise = [
    # Theme A High Octave Reprise with energetic march rhythm
    ('B4', 1), ('A4', 1), ('G#4', 1), ('A4', 1), ('C5', 4),
    ('D5', 1), ('C5', 1), ('B4', 1), ('C5', 1), ('E5', 4),
    ('F5', 1), ('E5', 1), ('D#5', 1), ('E5', 1), ('B5', 1), ('A5', 1), ('G#5', 1), ('A5', 1),
    ('B5', 1), ('A5', 1), ('G#5', 1), ('A5', 1), ('C6', 4),
    ('B5', 2), ('A5', 1), ('G5', 1), ('F5', 1), ('E5', 1), ('D5', 1), ('C5', 1),
    ('B4', 2), ('C5', 1), ('D5', 1), ('E4', 4),
    ('B4', 1), ('A4', 1), ('G#4', 1), ('A4', 1), ('C5', 4),
    ('D5', 1), ('C5', 1), ('B4', 1), ('C5', 1), ('E5', 4),
    # Coda ending leading cleanly back into measure 0 pick up!
    ('F5', 1), ('E5', 1), ('D#5', 1), ('E5', 1), ('A5', 1), ('G#5', 1), ('F#5', 1), ('G#5', 1),
    ('E5', 1), ('D5', 1), ('C5', 1), ('B4', 1), ('A4', 4),
    ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('C#5', 1),
    ('D5', 1), ('E5', 1), ('F#5', 1), ('D5', 1), ('B4', 1), ('D5', 1), ('F#5', 1), ('D5', 1),
    ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('B4', 1), ('C#5', 1), ('D5', 1), ('B4', 1),
    ('A4', 2), ('E5', 2), ('A5', 4),
    ('E5', 2), ('C5', 2), ('A4', 4),
    ('E4', 4), ('A4', 4),  # Sustains and lands on A4 at loop turnaround
]
add_melody(48, theme_reprise)

# Harmony / Chords for each of the 64 measures
chords_by_measure = []
for m in range(NUM_MEASURES):
    if m in (0, 6, 10, 16, 48, 54):
        chords_by_measure.append(('A2', 'E3', 'A3', 'C4'))  # Am
    elif m in (1, 7, 11, 17, 49, 55):
        chords_by_measure.append(('C3', 'G3', 'C4', 'E4'))  # C
    elif m in (2, 8, 12, 18, 50, 56):
        chords_by_measure.append(('D3', 'F3', 'A3', 'D4'))  # Dm
    elif m in (3, 13, 51):
        chords_by_measure.append(('A2', 'E3', 'A3', 'C4'))  # Am
    elif m in (4, 14, 52):
        chords_by_measure.append(('D3', 'F3', 'A3', 'D4'))  # Dm
    elif m in (5, 15, 53):
        chords_by_measure.append(('E2', 'B2', 'E3', 'G#3')) # E
    elif m in (9, 19, 57):
        chords_by_measure.append(('A2', 'E3', 'A3', 'C4'))  # Am
    elif m in (20, 22):
        chords_by_measure.append(('C3', 'G3', 'C4', 'E4'))  # C
    elif m in (21, 23):
        chords_by_measure.append(('G2', 'D3', 'G3', 'B3'))  # G
    elif m in (24, 25):
        chords_by_measure.append(('A2', 'E3', 'A3', 'C4'))  # Am
    elif m in (26, 27):
        chords_by_measure.append(('E2', 'B2', 'E3', 'G#3')) # E
    elif 28 <= m <= 31:
        chords_by_measure.append(('A2', 'E3', 'A3', 'C#4')) # A
    elif 32 <= m <= 47 or 58 <= m <= 63:
        if m % 2 == 0:
            chords_by_measure.append(('A2', 'E3', 'A3', 'C#4')) # A Major
        else:
            chords_by_measure.append(('E2', 'B2', 'E3', 'G#3')) # E Major
    else:
        chords_by_measure.append(('A2', 'E3', 'A3', 'C4'))

# Audio buffers
left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)

# 1. DRUMS & PERCUSSION (Turkish March Janissary Style: Concert Bass Drum + Crisp Snare + Cymbals)
print("Rendering Turkish March Percussion...")
samples_per_beat = int(BEAT_SEC * SAMPLE_RATE)
samples_per_16th = int(SIXTEENTH_SEC * SAMPLE_RATE)

for m in range(NUM_MEASURES):
    m_start = int(m * MEASURE_16THS * samples_per_16th)
    is_major = (32 <= m <= 47) or (58 <= m <= 63)
    is_heavy = is_major or (m >= 48)
    
    # 2 beats per measure in 2/4
    for beat in range(2):
        beat_start = m_start + beat * samples_per_beat
        
        # Bass Drum on downbeats
        kick_len = int(0.20 * SAMPLE_RATE)
        kt = np.linspace(0, 0.20, kick_len, endpoint=False)
        k_freq = 130.0 * np.exp(-kt * 24.0) + 42.0
        k_phase = 2.0 * np.pi * np.cumsum(k_freq) / SAMPLE_RATE
        k_env = np.exp(-kt * (14.0 if is_heavy else 18.0))
        kick = np.sin(k_phase) * k_env * (1.1 if is_heavy else 0.85)
        
        end_k = min(TOTAL_SAMPLES, beat_start + kick_len)
        actual_k = end_k - beat_start
        if actual_k > 0:
            left[beat_start:end_k] += kick[:actual_k] * 0.65
            right[beat_start:end_k] += kick[:actual_k] * 0.65
            
        # Snare / Turkish March Percussion
        snare_len = int(0.18 * SAMPLE_RATE)
        st = np.linspace(0, 0.18, snare_len, endpoint=False)
        s_noise = np.random.uniform(-1.0, 1.0, snare_len) * np.exp(-st * 28.0)
        s_tone = np.sin(2.0 * np.pi * 220.0 * st) * np.exp(-st * 36.0)
        snare = (s_noise * 0.7 + s_tone * 0.3) * (0.95 if (beat == 1 or is_heavy) else 0.5)
        
        end_s = min(TOTAL_SAMPLES, beat_start + snare_len)
        actual_s = end_s - beat_start
        if actual_s > 0:
            left[beat_start:end_s] += snare[:actual_s] * 0.45
            right[beat_start:end_s] += snare[:actual_s] * 0.45
            
        # Turkish Metallic Cymbals / Tambourine on beat 2 or offbeats
        if is_heavy or beat == 1:
            cym_len = int(0.26 * SAMPLE_RATE)
            ct = np.linspace(0, 0.26, cym_len, endpoint=False)
            c_noise = np.random.uniform(-1.0, 1.0, cym_len) * np.exp(-ct * (16.0 if is_major else 24.0))
            cym = c_noise * (0.55 if is_major else 0.35)
            end_c = min(TOTAL_SAMPLES, beat_start + cym_len)
            actual_c = end_c - beat_start
            if actual_c > 0:
                left[beat_start:end_c] += cym[:actual_c] * 0.40
                right[beat_start:end_c] += cym[:actual_c] * 0.40

# 2. ACCOMPANIMENT & BASS (Alberti Bass / March Chords)
print("Rendering Accompaniment & Bass...")
for m in range(NUM_MEASURES):
    chord = chords_by_measure[m]
    m_start = int(m * MEASURE_16THS * samples_per_16th)
    
    # 8 sixteenth notes per measure: classical Alberti pattern (root, 5th, 3rd, 5th, root, 5th, 3rd, 5th)
    pattern_notes = [chord[0], chord[1], chord[2], chord[1], chord[0], chord[1], chord[2], chord[3]]
    
    for s in range(MEASURE_16THS):
        note_name = pattern_notes[s]
        freq = note_to_freq(note_name)
        note_start = m_start + s * samples_per_16th
        dur_samples = int(samples_per_16th * 1.8)  # slightly sustained for warmth
        
        end_sample = min(TOTAL_SAMPLES, note_start + dur_samples)
        actual_samples = end_sample - note_start
        if actual_samples <= 0:
            continue
            
        t = np.linspace(0, actual_samples / SAMPLE_RATE, actual_samples, endpoint=False)
        env = np.exp(-t * 9.0)
        
        # Warm piano acoustic tone: fundamental + harmonics
        tone = np.sin(2.0 * np.pi * freq * t) * 0.65
        tone += np.sin(2.0 * np.pi * freq * 2.0 * t) * 0.28
        tone += np.sin(2.0 * np.pi * freq * 3.0 * t) * 0.12
        tone += np.sin(2.0 * np.pi * freq * 4.0 * t) * 0.05
        
        sig = tone * env * 0.32
        
        # Panning
        pan = 0.42 + 0.16 * (s % 2)
        left[note_start:end_sample] += sig * pan
        right[note_start:end_sample] += sig * (1.0 - pan)

# 3. MELODY (Crystal Clear High Piano / Harpsichord Lead)
print("Rendering Melody...")
for start_16th, dur_16th, note_name in melody_events:
    freq = note_to_freq(note_name)
    if freq <= 0:
        continue
        
    start_sample = int(start_16th * samples_per_16th)
    dur_sec = dur_16th * SIXTEENTH_SEC
    note_samples = int((dur_sec + 0.12) * SAMPLE_RATE)  # slight ring-out
    
    end_sample = min(TOTAL_SAMPLES, start_sample + note_samples)
    actual_samples = end_sample - start_sample
    if actual_samples <= 0:
        continue
        
    t = np.linspace(0, actual_samples / SAMPLE_RATE, actual_samples, endpoint=False)
    
    # Sharp attack, singing decay
    attack = np.minimum(1.0, t / 0.003)
    decay = np.exp(-t * (4.5 if dur_16th >= 4 else 7.5))
    env = attack * decay
    
    # Acoustic Piano / Bells Lead
    lead = np.sin(2.0 * np.pi * freq * t) * 0.60
    lead += np.sin(2.0 * np.pi * freq * 2.0 * t) * 0.30
    lead += np.sin(2.0 * np.pi * freq * 3.0 * t) * 0.18
    lead += np.sin(2.0 * np.pi * freq * 4.0 * t) * 0.08
    lead += np.sin(2.0 * np.pi * freq * 5.0 * t) * 0.04
    
    # Upper octave shine
    lead += np.sin(2.0 * np.pi * freq * 2.002 * t) * 0.12
    
    sig = lead * env * 0.48
    
    # Slight stereo chorus
    left[start_sample:end_sample] += sig * 0.52
    right[start_sample:end_sample] += sig * 0.48

# 4. MASTERING & SEAMLESS LOOP CROSSFADE
print("Mastering & Applying Seamless Loop...")

# Soft clipping / Limiter
mix_l = np.tanh(left * 1.35)
mix_r = np.tanh(right * 1.35)

# Normalization to -0.6 dB
peak = max(np.max(np.abs(mix_l)), np.max(np.abs(mix_r)))
if peak > 0:
    mix_l = (mix_l / peak) * 0.94
    mix_r = (mix_r / peak) * 0.94

# Seamless loop crossfade at the boundary (100ms)
fade_len = int(0.10 * SAMPLE_RATE)
for i in range(fade_len):
    w = i / float(fade_len)
    mix_l[i] = mix_l[i] * w + mix_l[TOTAL_SAMPLES - fade_len + i] * (1.0 - w)
    mix_r[i] = mix_r[i] * w + mix_r[TOTAL_SAMPLES - fade_len + i] * (1.0 - w)

# Convert to 16-bit PCM
audio_int16_l = np.int16(mix_l * 32767)
audio_int16_r = np.int16(mix_r * 32767)

interleaved = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
interleaved[0::2] = audio_int16_l
interleaved[1::2] = audio_int16_r

output_path = 'audio/force_of_the_horse_bgm.wav'
with wave.open(output_path, 'wb') as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    wav_file.writeframes(interleaved.tobytes())

print(f"Successfully generated Mozart's Turkish March BGM at: {output_path} ({TOTAL_SEC:.2f}s, {len(interleaved.tobytes())} bytes)")
