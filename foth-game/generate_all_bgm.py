import numpy as np
import wave
import os

SAMPLE_RATE = 32000

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

def save_wav(path, left, right):
    # Master limiter & normalize
    mix_l = np.tanh(left * 1.30)
    mix_r = np.tanh(right * 1.30)
    peak = max(np.max(np.abs(mix_l)), np.max(np.abs(mix_r)))
    if peak > 0:
        mix_l = (mix_l / peak) * 0.94
        mix_r = (mix_r / peak) * 0.94
    
    # 80ms loop crossfade
    fade_len = int(0.08 * SAMPLE_RATE)
    n = len(mix_l)
    for i in range(fade_len):
        w = i / float(fade_len)
        mix_l[i] = mix_l[i] * w + mix_l[n - fade_len + i] * (1.0 - w)
        mix_r[i] = mix_r[i] * w + mix_r[n - fade_len + i] * (1.0 - w)
        
    audio_int16_l = np.int16(mix_l * 32767)
    audio_int16_r = np.int16(mix_r * 32767)
    interleaved = np.empty((n * 2,), dtype=np.int16)
    interleaved[0::2] = audio_int16_l
    interleaved[1::2] = audio_int16_r
    
    with wave.open(path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(interleaved.tobytes())
    print(f"Generated: {path} ({len(mix_l)/SAMPLE_RATE:.2f}s)")


# ==========================================
# 1. TRACK 1: TURKISH MARCH (モーツァルト トルコ行進曲)
# ==========================================
def generate_turkish_march():
    BPM = 126.0
    BEAT_SEC = 60.0 / BPM
    SIXTEENTH_SEC = BEAT_SEC / 4.0
    MEASURE_16THS = 8
    NUM_MEASURES = 64
    TOTAL_16THS = NUM_MEASURES * MEASURE_16THS
    TOTAL_SAMPLES = int(TOTAL_16THS * SIXTEENTH_SEC * SAMPLE_RATE)

    left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    samples_per_beat = int(BEAT_SEC * SAMPLE_RATE)
    samples_per_16th = int(SIXTEENTH_SEC * SAMPLE_RATE)

    melody_events = []
    def add_m(start_m, notes):
        c = start_m * MEASURE_16THS
        for n, dur in notes:
            if n != '_': melody_events.append((c, dur, n))
            c += dur

    # Theme A
    t_a = [
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
    add_m(0, t_a)
    add_m(10, t_a)

    # Theme B
    t_b = [
        ('G4', 2), ('E5', 1), ('D5', 1), ('C5', 2), ('B4', 1), ('A4', 1),
        ('G4', 2), ('G4', 1), ('A4', 1), ('B4', 1), ('C5', 1), ('D5', 1), ('E5', 1),
        ('F5', 2), ('E5', 1), ('D5', 1), ('C5', 2), ('B4', 1), ('A4', 1),
        ('G4', 2), ('F#4', 1), ('G4', 1), ('A4', 1), ('B4', 1), ('C5', 1), ('D5', 1),
        ('E5', 2), ('D5', 1), ('C5', 1), ('B4', 2), ('A4', 1), ('G#4', 1),
        ('A4', 2), ('B4', 1), ('C5', 1), ('D5', 1), ('E5', 1), ('F5', 1), ('G5', 1),
        ('A5', 2), ('G5', 1), ('F5', 1), ('E5', 1), ('D5', 1), ('C5', 1), ('B4', 1),
        ('A4', 2), ('B4', 2), ('C#5', 4),
        ('E5', 2), ('D5', 1), ('C#5', 1), ('B4', 2), ('A4', 1), ('G#4', 1),
        ('A4', 2), ('B4', 1), ('C#5', 1), ('D5', 1), ('E5', 1), ('F#5', 1), ('G#5', 1),
        ('A5', 2), ('G#5', 1), ('F#5', 1), ('E5', 1), ('D5', 1), ('C#5', 1), ('B4', 1),
        ('A4', 4), ('E4', 4),
    ]
    add_m(20, t_b)

    # Theme C (A Major Alla Turca)
    t_c = [
        ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('C#5', 1),
        ('D5', 1), ('E5', 1), ('F#5', 1), ('D5', 1), ('B4', 1), ('D5', 1), ('F#5', 1), ('D5', 1),
        ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('C#5', 1),
        ('B4', 1), ('C#5', 1), ('D5', 1), ('B4', 1), ('G#4', 1), ('B4', 1), ('D5', 1), ('B4', 1),
        ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('C#5', 1),
        ('D5', 1), ('E5', 1), ('F#5', 1), ('D5', 1), ('B4', 1), ('D5', 1), ('F#5', 1), ('D5', 1),
        ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('B4', 1), ('C#5', 1), ('D5', 1), ('B4', 1),
        ('A4', 2), ('C#5', 2), ('A4', 4),
        ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('A5', 1), ('C#6', 1), ('E6', 1), ('C#6', 1),
        ('D6', 1), ('E6', 1), ('F#6', 1), ('D6', 1), ('B5', 1), ('D6', 1), ('F#6', 1), ('D6', 1),
        ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('A5', 1), ('C#6', 1), ('E6', 1), ('C#6', 1),
        ('B5', 1), ('C#6', 1), ('D6', 1), ('B5', 1), ('G#5', 1), ('B5', 1), ('D6', 1), ('B5', 1),
        ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('A5', 1), ('C#6', 1), ('E6', 1), ('C#6', 1),
        ('D6', 1), ('E6', 1), ('F#6', 1), ('D6', 1), ('B5', 1), ('D6', 1), ('F#6', 1), ('D6', 1),
        ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('B5', 1), ('C#6', 1), ('D6', 1), ('B5', 1),
        ('A5', 2), ('C#6', 2), ('A5', 4),
    ]
    add_m(32, t_c)

    # Reprise
    t_rep = [
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
        ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('C#5', 1),
        ('D5', 1), ('E5', 1), ('F#5', 1), ('D5', 1), ('B4', 1), ('D5', 1), ('F#5', 1), ('D5', 1),
        ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('B4', 1), ('C#5', 1), ('D5', 1), ('B4', 1),
        ('A4', 2), ('E5', 2), ('A5', 4),
        ('E5', 2), ('C5', 2), ('A4', 4),
        ('E4', 4), ('A4', 4),
    ]
    add_m(48, t_rep)

    # Percussion & Chords
    for m in range(NUM_MEASURES):
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        is_major = (32 <= m <= 47) or (58 <= m <= 63)
        for beat in range(2):
            beat_start = m_start + beat * samples_per_beat
            # Kick
            klen = int(0.20 * SAMPLE_RATE)
            kt = np.linspace(0, 0.20, klen, endpoint=False)
            kick = np.sin(2.0 * np.pi * (130 * np.exp(-kt * 24) + 42) * kt) * np.exp(-kt * 16) * 0.7
            ek = min(TOTAL_SAMPLES, beat_start + klen)
            ak = ek - beat_start
            if ak > 0:
                left[beat_start:ek] += kick[:ak] * 0.65
                right[beat_start:ek] += kick[:ak] * 0.65
            # Snare
            slen = int(0.18 * SAMPLE_RATE)
            st = np.linspace(0, 0.18, slen, endpoint=False)
            snare = (np.random.uniform(-1, 1, slen) * np.exp(-st * 28) * 0.7 + np.sin(2*np.pi*220*st)*np.exp(-st*36)*0.3) * (0.9 if beat == 1 else 0.5)
            es = min(TOTAL_SAMPLES, beat_start + slen)
            as_ = es - beat_start
            if as_ > 0:
                left[beat_start:es] += snare[:as_] * 0.45
                right[beat_start:es] += snare[:as_] * 0.45

    # Chords
    chords = []
    for m in range(NUM_MEASURES):
        if m in (0, 6, 10, 16, 48, 54): chords.append(('A2', 'E3', 'A3', 'C4'))
        elif m in (1, 7, 11, 17, 49, 55): chords.append(('C3', 'G3', 'C4', 'E4'))
        elif m in (2, 8, 12, 18, 50, 56): chords.append(('D3', 'F3', 'A3', 'D4'))
        elif m in (5, 15, 53, 26, 27): chords.append(('E2', 'B2', 'E3', 'G#3'))
        elif 32 <= m <= 47 or 58 <= m <= 63:
            chords.append(('A2', 'E3', 'A3', 'C#4') if m % 2 == 0 else ('E2', 'B2', 'E3', 'G#3'))
        else: chords.append(('A2', 'E3', 'A3', 'C4'))

    for m in range(NUM_MEASURES):
        chord = chords[m]
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        patt = [chord[0], chord[1], chord[2], chord[1], chord[0], chord[1], chord[2], chord[3]]
        for s in range(MEASURE_16THS):
            fq = note_to_freq(patt[s])
            n_start = m_start + s * samples_per_16th
            dur_s = int(samples_per_16th * 1.8)
            es = min(TOTAL_SAMPLES, n_start + dur_s)
            as_ = es - n_start
            if as_ > 0:
                t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
                tone = (np.sin(2*np.pi*fq*t)*0.65 + np.sin(4*np.pi*fq*t)*0.28 + np.sin(6*np.pi*fq*t)*0.12) * np.exp(-t*9) * 0.32
                left[n_start:es] += tone * 0.52
                right[n_start:es] += tone * 0.48

    for s16, dur, n_name in melody_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.12) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.003) * np.exp(-t * (4.5 if dur >= 4 else 7.5))
            lead = (np.sin(2*np.pi*fq*t)*0.6 + np.sin(4*np.pi*fq*t)*0.3 + np.sin(6*np.pi*fq*t)*0.18 + np.sin(4.004*np.pi*fq*t)*0.12) * env * 0.48
            left[n_start:es] += lead * 0.52
            right[n_start:es] += lead * 0.48

    save_wav('audio/bgm_turkish_march.wav', left, right)
    save_wav('audio/force_of_the_horse_bgm.wav', left, right)


# ==========================================
# 2. TRACK 2: WILLIAM TELL OVERTURE (ウィリアム・テル序曲 - 世紀の大疾走)
# ==========================================
def generate_william_tell():
    BPM = 138.0
    BEAT_SEC = 60.0 / BPM
    SIXTEENTH_SEC = BEAT_SEC / 4.0
    MEASURE_16THS = 8  # 2/4 time
    NUM_MEASURES = 64
    TOTAL_SAMPLES = int(NUM_MEASURES * MEASURE_16THS * SIXTEENTH_SEC * SAMPLE_RATE)

    left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    samples_per_beat = int(BEAT_SEC * SAMPLE_RATE)
    samples_per_16th = int(SIXTEENTH_SEC * SAMPLE_RATE)

    melody_events = []
    def add_m(start_m, notes):
        c = start_m * MEASURE_16THS
        for n, dur in notes:
            if n != '_': melody_events.append((c, dur, n))
            c += dur

    # William Tell Gallop Motif:
    # da-da-dum (E4 E4 E4), A4 (8th) / da-da-dum, A4 / da-da-dum, A4 B4 C#5 D5 | E5 (quarter) ...
    # 16th triplets / sixteenth notes: (E4 1, E4 1, E4 1, _ 1), A4 (2)
    wt_motif = [
        # M0-1
        ('E4', 1), ('E4', 1), ('E4', 1), ('_', 1), ('A4', 2), ('_', 2),
        ('E4', 1), ('E4', 1), ('E4', 1), ('_', 1), ('A4', 2), ('_', 2),
        # M2-3
        ('E4', 1), ('E4', 1), ('E4', 1), ('_', 1), ('A4', 1), ('B4', 1), ('C#5', 1), ('D5', 1),
        ('E5', 4), ('E5', 4),
        # M4-5: Fanfare second phrase
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('F#5', 2), ('_', 2),
        ('D5', 1), ('D5', 1), ('D5', 1), ('_', 1), ('E5', 2), ('_', 2),
        # M6-7
        ('C#5', 1), ('C#5', 1), ('C#5', 1), ('_', 1), ('D5', 1), ('C#5', 1), ('B4', 1), ('A4', 1),
        ('B4', 4), ('E4', 4),
        # M8-15: Repeat with full cadence
        ('E4', 1), ('E4', 1), ('E4', 1), ('_', 1), ('A4', 2), ('_', 2),
        ('E4', 1), ('E4', 1), ('E4', 1), ('_', 1), ('A4', 2), ('_', 2),
        ('E4', 1), ('E4', 1), ('E4', 1), ('_', 1), ('A4', 1), ('B4', 1), ('C#5', 1), ('D5', 1),
        ('E5', 4), ('E5', 4),
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('F#5', 2), ('_', 2),
        ('D5', 1), ('D5', 1), ('D5', 1), ('_', 1), ('E5', 2), ('_', 2),
        ('C#5', 1), ('D5', 1), ('E5', 1), ('C#5', 1), ('B4', 1), ('C#5', 1), ('B4', 1), ('G#4', 1),
        ('A4', 4), ('A4', 4),
    ]
    add_m(0, wt_motif)
    add_m(16, wt_motif)

    # Bridge (D Major / E Major development) M32-47
    wt_bridge = [
        ('F#5', 2), ('F#5', 1), ('G#5', 1), ('A5', 2), ('F#5', 2),
        ('E5', 2), ('C#5', 1), ('D5', 1), ('E5', 2), ('C#5', 2),
        ('D5', 2), ('B4', 1), ('C#5', 1), ('D5', 2), ('B4', 2),
        ('C#5', 2), ('A4', 1), ('B4', 1), ('C#5', 4),
        ('F#5', 2), ('F#5', 1), ('G#5', 1), ('A5', 2), ('F#5', 2),
        ('E5', 2), ('C#5', 1), ('D5', 1), ('E5', 2), ('C#5', 2),
        ('B4', 2), ('C#5', 1), ('D5', 1), ('E5', 1), ('F#5', 1), ('G#5', 1), ('A5', 1),
        ('B5', 4), ('E5', 4),
        # M40-47: High energy run
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('A5', 2), ('_', 2),
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('A5', 2), ('_', 2),
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('A5', 1), ('B5', 1), ('C#6', 1), ('D6', 1),
        ('E6', 4), ('E6', 4),
        ('E6', 1), ('E6', 1), ('E6', 1), ('_', 1), ('F#6', 2), ('_', 2),
        ('D6', 1), ('D6', 1), ('D6', 1), ('_', 1), ('E6', 2), ('_', 2),
        ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('B5', 1), ('C#6', 1), ('B5', 1), ('G#5', 1),
        ('A5', 4), ('A5', 4),
    ]
    add_m(32, wt_bridge)

    # Grand Coda M48-63
    wt_coda = [
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('A5', 2), ('_', 2),
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('A5', 2), ('_', 2),
        ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('A5', 1), ('C#6', 1), ('E6', 1), ('C#6', 1),
        ('B5', 2), ('E6', 2), ('A5', 4),
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('A5', 2), ('_', 2),
        ('E5', 1), ('E5', 1), ('E5', 1), ('_', 1), ('A5', 2), ('_', 2),
        ('C#6', 1), ('D6', 1), ('E6', 1), ('C#6', 1), ('B5', 1), ('C#6', 1), ('B5', 1), ('G#5', 1),
        ('A5', 4), ('A5', 4),
        ('A5', 2), ('C#6', 2), ('E6', 4),
        ('E6', 2), ('C#6', 2), ('A5', 4),
        ('A5', 1), ('E5', 1), ('A5', 1), ('C#6', 1), ('E6', 4),
        ('A5', 4), ('E5', 4),
        ('A5', 2), ('E5', 2), ('A5', 4),
        ('A5', 2), ('E5', 2), ('A5', 4),
        ('A4', 4), ('E4', 4),
        ('A4', 8)
    ]
    add_m(48, wt_coda)

    # Galloping Drums & Bass (Horse Gallop rhythm)
    for m in range(NUM_MEASURES):
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        for beat in range(2):
            b_start = m_start + beat * samples_per_beat
            # Kick on downbeat
            klen = int(0.18 * SAMPLE_RATE)
            kt = np.linspace(0, 0.18, klen, endpoint=False)
            kick = np.sin(2*np.pi*(140*np.exp(-kt*26)+45)*kt) * np.exp(-kt*18) * 0.75
            ek = min(TOTAL_SAMPLES, b_start + klen)
            ak = ek - b_start
            if ak > 0:
                left[b_start:ek] += kick[:ak] * 0.65
                right[b_start:ek] += kick[:ak] * 0.65

            # Gallop Snare Triplet Pattern (da-da-dum)
            for s16 in (0, 1, 2):
                s_start = b_start + s16 * (samples_per_beat // 3)
                slen = int(0.10 * SAMPLE_RATE)
                st = np.linspace(0, 0.10, slen, endpoint=False)
                sn = np.random.uniform(-1, 1, slen) * np.exp(-st * 35) * (0.8 if s16==2 else 0.45)
                es = min(TOTAL_SAMPLES, s_start + slen)
                as_ = es - s_start
                if as_ > 0:
                    left[s_start:es] += sn[:as_] * 0.45
                    right[s_start:es] += sn[:as_] * 0.45

    # Galloping Bass (A2 - E3 octaves)
    for m in range(NUM_MEASURES):
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        root = 'A2' if m % 4 in (0, 1, 3) else 'E2'
        fifth = 'E3' if root == 'A2' else 'B2'
        for b in range(2):
            b_start = m_start + b * samples_per_beat
            for sub in (0, 1, 2):
                sub_start = b_start + sub * (samples_per_beat // 3)
                fq = note_to_freq(root if sub < 2 else fifth)
                durs = int(0.12 * SAMPLE_RATE)
                es = min(TOTAL_SAMPLES, sub_start + durs)
                as_ = es - sub_start
                if as_ > 0:
                    t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
                    bass = (np.sin(2*np.pi*fq*t)*0.7 + np.sin(4*np.pi*fq*t)*0.3) * np.exp(-t*14) * 0.4
                    left[sub_start:es] += bass * 0.5
                    right[sub_start:es] += bass * 0.5

    # Lead Synth / Brass
    for s16, dur, n_name in melody_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.14) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.005) * np.exp(-t * (3.8 if dur >= 4 else 8.0))
            brass = (np.sin(2*np.pi*fq*t)*0.55 + np.sin(4*np.pi*fq*t)*0.35 + np.sin(6*np.pi*fq*t)*0.2 + np.sin(8*np.pi*fq*t)*0.1) * env * 0.52
            left[n_start:es] += brass * 0.53
            right[n_start:es] += brass * 0.47

    save_wav('audio/bgm_william_tell.wav', left, right)


# ==========================================
# 3. TRACK 3: CYBER TURF (電脳疾走 - メインテーマ)
# ==========================================
def generate_cyber_turf():
    BPM = 130.0
    BEAT_SEC = 60.0 / BPM
    BAR_SEC = BEAT_SEC * 4.0
    NUM_BARS = 32
    TOTAL_SAMPLES = int(NUM_BARS * BAR_SEC * SAMPLE_RATE)

    left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    samples_per_beat = int(BEAT_SEC * SAMPLE_RATE)
    samples_per_16th = int((BEAT_SEC / 4.0) * SAMPLE_RATE)

    CHORDS = [
        ('D3', 'F3', 'A3', 'D4'), ('Bb2', 'D3', 'F3', 'Bb3'), ('C3', 'E3', 'G3', 'C4'), ('A2', 'C3', 'E3', 'A3'),
        ('D3', 'F3', 'A3', 'D4'), ('Bb2', 'D3', 'F3', 'Bb3'), ('F3', 'A3', 'C4', 'F4'), ('C3', 'E3', 'G3', 'C4'),
        ('D3', 'F3', 'A3', 'D4'), ('Bb2', 'D3', 'F3', 'Bb3'), ('C3', 'E3', 'G3', 'C4'), ('A2', 'C3', 'E3', 'A3'),
        ('D3', 'F3', 'A3', 'D4'), ('Bb2', 'D3', 'F3', 'Bb3'), ('G2', 'Bb2', 'D3', 'G3'), ('A2', 'C#3', 'E3', 'A3'),
        ('Bb2', 'D3', 'F3', 'Bb3'), ('C3', 'E3', 'G3', 'C4'), ('D3', 'F3', 'A3', 'D4'), ('F3', 'A3', 'C4', 'F4'),
        ('Bb2', 'D3', 'F3', 'Bb3'), ('C3', 'E3', 'G3', 'C4'), ('D3', 'F3', 'A3', 'D4'), ('A2', 'C3', 'E3', 'A3'),
        ('Bb2', 'D3', 'F3', 'Bb3'), ('C3', 'E3', 'G3', 'C4'), ('D3', 'F3', 'A3', 'D4'), ('G2', 'Bb2', 'D3', 'G3'),
        ('Bb2', 'D3', 'F3', 'Bb3'), ('C3', 'E3', 'G3', 'C4'), ('A2', 'C#3', 'E3', 'A3'), ('A2', 'D3', 'E3', 'A3'),
    ]

    for bar in range(NUM_BARS):
        bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
        for beat in range(4):
            beat_start = bar_start + beat * samples_per_beat
            # Kick
            klen = int(0.24 * SAMPLE_RATE)
            kt = np.linspace(0, 0.24, klen, endpoint=False)
            kick = np.sin(2*np.pi*(150*np.exp(-kt*26)+40)*kt) * np.exp(-kt*15) * 1.1
            ek = min(TOTAL_SAMPLES, beat_start + klen)
            ak = ek - beat_start
            if ak > 0:
                left[beat_start:ek] += kick[:ak] * 0.7
                right[beat_start:ek] += kick[:ak] * 0.7
            # Snare
            if beat in (1, 3):
                slen = int(0.22 * SAMPLE_RATE)
                st = np.linspace(0, 0.22, slen, endpoint=False)
                snare = np.random.uniform(-1, 1, slen) * np.exp(-st * 22) * 0.6 + np.sin(2*np.pi*190*st)*np.exp(-st*30)*0.35
                es = min(TOTAL_SAMPLES, beat_start + slen)
                as_ = es - beat_start
                if as_ > 0:
                    left[beat_start:es] += snare[:as_] * 0.5
                    right[beat_start:es] += snare[:as_] * 0.5
            # 16th hats
            for s in range(4):
                hstart = beat_start + s * samples_per_16th
                hlen = int(0.05 * SAMPLE_RATE)
                ht = np.linspace(0, 0.05, hlen, endpoint=False)
                hat = np.random.uniform(-1, 1, hlen) * np.exp(-ht * 85) * (0.8 if s%2==1 else 0.4) * 0.35
                eh = min(TOTAL_SAMPLES, hstart + hlen)
                ah = eh - hstart
                if ah > 0:
                    left[hstart:eh] += hat[:ah] * 0.5
                    right[hstart:eh] += hat[:ah] * 0.5

    # Bassline
    for bar in range(NUM_BARS):
        chord = CHORDS[bar]
        rf = note_to_freq(chord[0]) / 2.0
        bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
        for b16 in range(16):
            nstart = bar_start + b16 * samples_per_16th
            nlen = int(samples_per_16th * 0.85)
            eb = min(TOTAL_SAMPLES, nstart + nlen)
            ab = eb - nstart
            if ab > 0:
                t = np.linspace(0, ab/SAMPLE_RATE, ab, endpoint=False)
                oct_ = 2.0 if (b16%4 in (1,3)) else 1.0
                f = rf * oct_
                saw = (2.0 * (f * t - np.floor(0.5 + f * t))) * 0.5
                sin = np.sin(2*np.pi*f*t) * 0.5
                b_sig = (saw + sin) * np.exp(-t*16) * 0.45
                left[nstart:eb] += b_sig * 0.52
                right[nstart:eb] += b_sig * 0.48

    # Arpeggios & Leads
    for bar in range(NUM_BARS):
        chord = CHORDS[bar]
        bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
        for a16 in range(16):
            note = chord[a16 % len(chord)]
            fq = note_to_freq(note) * 2.0
            astart = bar_start + a16 * samples_per_16th
            alen = int(samples_per_16th * 1.5)
            ea = min(TOTAL_SAMPLES, astart + alen)
            aa = ea - astart
            if aa > 0:
                t = np.linspace(0, aa/SAMPLE_RATE, aa, endpoint=False)
                arp = np.sin(2*np.pi*fq*t) * np.exp(-t*12) * 0.28
                pan = 0.35 + 0.30 * ((a16 % 4) / 3.0)
                left[astart:ea] += arp * pan
                right[astart:ea] += arp * (1.0 - pan)

    save_wav('audio/bgm_cyber_turf.wav', left, right)


# ==========================================
# 4. TRACK 4: GRAND PRIX ROYALE (栄光のグランプリ)
# ==========================================
def generate_grand_prix():
    BPM = 124.0
    BEAT_SEC = 60.0 / BPM
    BAR_SEC = BEAT_SEC * 4.0
    NUM_BARS = 32
    TOTAL_SAMPLES = int(NUM_BARS * BAR_SEC * SAMPLE_RATE)

    left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    samples_per_beat = int(BEAT_SEC * SAMPLE_RATE)
    samples_per_16th = int((BEAT_SEC / 4.0) * SAMPLE_RATE)

    CHORDS = [
        ('G3', 'Bb3', 'D4', 'G4'), ('Eb3', 'G3', 'Bb3', 'Eb4'), ('F3', 'A3', 'C4', 'F4'), ('D3', 'F#3', 'A3', 'D4'),
        ('G3', 'Bb3', 'D4', 'G4'), ('Eb3', 'G3', 'Bb3', 'Eb4'), ('Bb3', 'D4', 'F4', 'Bb4'), ('F3', 'A3', 'C4', 'F4'),
        ('G3', 'Bb3', 'D4', 'G4'), ('Eb3', 'G3', 'Bb3', 'Eb4'), ('F3', 'A3', 'C4', 'F4'), ('D3', 'F#3', 'A3', 'D4'),
        ('Eb3', 'G3', 'Bb3', 'Eb4'), ('F3', 'A3', 'C4', 'F4'), ('G3', 'Bb3', 'D4', 'G4'), ('D3', 'F#3', 'A3', 'D4'),
        ('Eb3', 'G3', 'Bb3', 'Eb4'), ('F3', 'A3', 'C4', 'F4'), ('Bb3', 'D4', 'F4', 'Bb4'), ('G3', 'Bb3', 'D4', 'G4'),
        ('Eb3', 'G3', 'Bb3', 'Eb4'), ('F3', 'A3', 'C4', 'F4'), ('G3', 'Bb3', 'D4', 'G4'), ('D3', 'F#3', 'A3', 'D4'),
        ('Eb3', 'G3', 'Bb3', 'Eb4'), ('F3', 'A3', 'C4', 'F4'), ('Bb3', 'D4', 'F4', 'Bb4'), ('Eb3', 'G3', 'Bb3', 'Eb4'),
        ('C3', 'Eb3', 'G3', 'C4'), ('D3', 'F#3', 'A3', 'D4'), ('G3', 'Bb3', 'D4', 'G4'), ('G3', 'D4', 'G4', 'B4'),
    ]

    for bar in range(NUM_BARS):
        bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
        for beat in range(4):
            beat_start = bar_start + beat * samples_per_beat
            # Orchestral Timpani Kick
            klen = int(0.35 * SAMPLE_RATE)
            kt = np.linspace(0, 0.35, klen, endpoint=False)
            kick = np.sin(2*np.pi*(110*np.exp(-kt*18)+40)*kt) * np.exp(-kt*10) * 0.95
            ek = min(TOTAL_SAMPLES, beat_start + klen)
            ak = ek - beat_start
            if ak > 0:
                left[beat_start:ek] += kick[:ak] * 0.65
                right[beat_start:ek] += kick[:ak] * 0.65
            # Snare
            if beat in (1, 3):
                slen = int(0.25 * SAMPLE_RATE)
                st = np.linspace(0, 0.25, slen, endpoint=False)
                sn = np.random.uniform(-1, 1, slen) * np.exp(-st*18) * 0.65
                es = min(TOTAL_SAMPLES, beat_start + slen)
                as_ = es - beat_start
                if as_ > 0:
                    left[beat_start:es] += sn[:as_] * 0.45
                    right[beat_start:es] += sn[:as_] * 0.45

    # Symphonic String chords
    for bar in range(NUM_BARS):
        chord = CHORDS[bar]
        bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
        bar_samples = int(BAR_SEC * SAMPLE_RATE)
        eb = min(TOTAL_SAMPLES, bar_start + bar_samples)
        ab = eb - bar_start
        if ab > 0:
            t = np.linspace(0, ab/SAMPLE_RATE, ab, endpoint=False)
            env = np.sin(np.pi * t / BAR_SEC) ** 0.5
            str_sig = np.zeros(ab)
            for note in chord:
                fq = note_to_freq(note)
                str_sig += (np.sin(2*np.pi*fq*t)*0.5 + np.sin(4*np.pi*fq*t)*0.25 + np.sin(6*np.pi*fq*t)*0.1)
            str_sig *= env * 0.08
            left[bar_start:eb] += str_sig * 0.5
            right[bar_start:eb] += str_sig * 0.5

    # Piano & Horn Melody
    for bar in range(NUM_BARS):
        chord = CHORDS[bar]
        bar_start = int(bar * BAR_SEC * SAMPLE_RATE)
        melody_notes = [chord[0], chord[2], chord[1], chord[3], chord[2], chord[1]]
        for m_idx, m_note in enumerate(melody_notes):
            m_start = bar_start + int(m_idx * (BAR_SEC / 6.0) * SAMPLE_RATE)
            fq = note_to_freq(m_note) * 2.0
            dur_s = int((BAR_SEC / 6.0 + 0.2) * SAMPLE_RATE)
            em = min(TOTAL_SAMPLES, m_start + dur_s)
            am = em - m_start
            if am > 0:
                t = np.linspace(0, am/SAMPLE_RATE, am, endpoint=False)
                lead = (np.sin(2*np.pi*fq*t)*0.6 + np.sin(4*np.pi*fq*t)*0.25 + np.sin(6*np.pi*fq*t)*0.15) * np.exp(-t*5) * 0.35
                left[m_start:em] += lead * 0.52
                right[m_start:em] += lead * 0.48

    save_wav('audio/bgm_grand_prix.wav', left, right)


# ==========================================
# 5. TRACK 5: RYDEEN TECHNO (YMO風 電脳ライディーン)
# ==========================================
def generate_rydeen():
    BPM = 136.0
    BEAT_SEC = 60.0 / BPM
    SIXTEENTH_SEC = BEAT_SEC / 4.0
    MEASURE_16THS = 8  # 2/4 time measures
    NUM_MEASURES = 64  # 64 measures = 32 bars of 4/4
    TOTAL_SAMPLES = int(NUM_MEASURES * MEASURE_16THS * SIXTEENTH_SEC * SAMPLE_RATE)

    left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    samples_per_beat = int(BEAT_SEC * SAMPLE_RATE)
    samples_per_16th = int(SIXTEENTH_SEC * SAMPLE_RATE)

    melody_events = []
    def add_m(start_m, notes):
        c = start_m * MEASURE_16THS
        for n, dur in notes:
            if n != '_': melody_events.append((c, dur, n))
            c += dur

    # RYDEEN Signature Pentatonic Theme
    # Theme A (Measures 0-15)
    r_theme_a = [
        # Phrase 1: D5 E5 G5 A5 | B5 A5 G5 E5 | G5 (sustained)
        ('D5', 1), ('E5', 1), ('G5', 1), ('A5', 1), ('B5', 1), ('A5', 1), ('G5', 1), ('E5', 1),
        ('G5', 4), ('_', 4),
        # Phrase 2: D5 E5 G5 A5 | B5 D6 B5 A5 | G5 (sustained)
        ('D5', 1), ('E5', 1), ('G5', 1), ('A5', 1), ('B5', 1), ('D6', 1), ('B5', 1), ('A5', 1),
        ('G5', 4), ('_', 4),
        # Phrase 3: D5 E5 G5 A5 | B5 A5 G5 E5 | G5 E5 D5 B4
        ('D5', 1), ('E5', 1), ('G5', 1), ('A5', 1), ('B5', 1), ('A5', 1), ('G5', 1), ('E5', 1),
        ('G5', 1), ('E5', 1), ('D5', 1), ('B4', 1), ('D5', 2), ('E5', 2),
        # Phrase 4: G5 A5 G5 E5 | G5
        ('G5', 1), ('A5', 1), ('G5', 1), ('E5', 1), ('G5', 4),
        ('_', 8),
    ]
    add_m(0, r_theme_a)
    add_m(8, r_theme_a)

    # Theme B (The Emotional Bridge with soaring synth strings) Measures 16-31
    r_theme_b = [
        # B5 . A5 G5 | E5 . . . | G5 A5 B5 D6 | E6 . . .
        ('B5', 2), ('A5', 1), ('G5', 1), ('E5', 4),
        ('G5', 1), ('A5', 1), ('B5', 1), ('D6', 1), ('E6', 4),
        # D6 B5 A5 G5 | A5 . . . | G5 A5 B5 D6 | E6 . D6 B5
        ('D6', 1), ('B5', 1), ('A5', 1), ('G5', 1), ('A5', 4),
        ('G5', 1), ('A5', 1), ('B5', 1), ('D6', 1), ('E6', 2), ('D6', 1), ('B5', 1),
        # A5 G5 E5 D5 | G5 . . . | D5 E5 G5 A5 | B5 . . .
        ('A5', 1), ('G5', 1), ('E5', 1), ('D5', 1), ('G5', 4),
        ('D5', 1), ('E5', 1), ('G5', 1), ('A5', 1), ('B5', 4),
        ('A5', 1), ('G5', 1), ('E5', 1), ('D5', 1), ('G5', 4),
        ('_', 8),
    ]
    add_m(16, r_theme_b)

    # High-Energy Section C (Measures 32-47) with octave lead
    r_theme_c = [
        ('D6', 1), ('E6', 1), ('G6', 1), ('A6', 1), ('B6', 1), ('A6', 1), ('G6', 1), ('E6', 1),
        ('G6', 4), ('_', 4),
        ('D6', 1), ('E6', 1), ('G6', 1), ('A6', 1), ('B6', 1), ('D7', 1), ('B6', 1), ('A6', 1),
        ('G6', 4), ('_', 4),
        ('D6', 1), ('E6', 1), ('G6', 1), ('A6', 1), ('B6', 1), ('A6', 1), ('G6', 1), ('E6', 1),
        ('G6', 1), ('E6', 1), ('D6', 1), ('B5', 1), ('D6', 2), ('E6', 2),
        ('G6', 1), ('A6', 1), ('G6', 1), ('E6', 1), ('G6', 4),
        ('_', 8),
        # Climax fanfare
        ('B5', 2), ('A5', 1), ('G5', 1), ('E5', 4),
        ('G5', 1), ('A5', 1), ('B5', 1), ('D6', 1), ('E6', 4),
        ('D6', 1), ('B5', 1), ('A6', 1), ('G6', 1), ('A6', 4),
        ('G6', 2), ('E6', 2), ('D6', 2), ('B5', 2),
    ]
    add_m(32, r_theme_c)

    # Grand Reprise & Outro leading into Loop turnaround (Measures 48-63)
    r_outro = [
        ('D5', 1), ('E5', 1), ('G5', 1), ('A5', 1), ('B5', 1), ('A5', 1), ('G5', 1), ('E5', 1),
        ('G5', 4), ('_', 4),
        ('D5', 1), ('E5', 1), ('G5', 1), ('A5', 1), ('B5', 1), ('D6', 1), ('B5', 1), ('A5', 1),
        ('G5', 4), ('_', 4),
        ('G5', 1), ('A5', 1), ('B5', 1), ('D6', 1), ('E6', 2), ('D6', 1), ('B5', 1),
        ('A5', 1), ('G5', 1), ('E5', 1), ('D5', 1), ('G5', 4),
        ('D5', 2), ('G5', 2), ('B5', 2), ('D6', 2),
        ('G5', 4), ('D5', 4),
        ('G4', 8), ('_', 8)
    ]
    add_m(48, r_outro)

    # 1. DRUMS (YMO Style Electronic Disco/Techno Gallop + Simmons Toms & Horse Hooves)
    for m in range(NUM_MEASURES):
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        for beat in range(2):
            b_start = m_start + beat * samples_per_beat
            # Punchy TR-808 Kick
            klen = int(0.20 * SAMPLE_RATE)
            kt = np.linspace(0, 0.20, klen, endpoint=False)
            kick = np.sin(2*np.pi*(160*np.exp(-kt*28)+48)*kt) * np.exp(-kt*16) * 1.15
            ek = min(TOTAL_SAMPLES, b_start + klen)
            ak = ek - b_start
            if ak > 0:
                left[b_start:ek] += kick[:ak] * 0.72
                right[b_start:ek] += kick[:ak] * 0.72

            # Snare with snappy electronic noise on beat 2
            if beat == 1:
                slen = int(0.18 * SAMPLE_RATE)
                st = np.linspace(0, 0.18, slen, endpoint=False)
                snare = np.random.uniform(-1, 1, slen) * np.exp(-st*25) * 0.65 + np.sin(2*np.pi*240*st)*np.exp(-st*35)*0.35
                es = min(TOTAL_SAMPLES, b_start + slen)
                as_ = es - b_start
                if as_ > 0:
                    left[b_start:es] += snare[:as_] * 0.52
                    right[b_start:es] += snare[:as_] * 0.52

            # 16th Hi-Hats (chi-chi-chi-chi)
            for s in range(4):
                h_start = b_start + s * samples_per_16th
                hlen = int(0.045 * SAMPLE_RATE)
                ht = np.linspace(0, 0.045, hlen, endpoint=False)
                hat = np.random.uniform(-1, 1, hlen) * np.exp(-ht * (70 if s%2==1 else 110)) * (0.85 if s%2==1 else 0.4) * 0.35
                eh = min(TOTAL_SAMPLES, h_start + hlen)
                ah = eh - h_start
                if ah > 0:
                    left[h_start:eh] += hat[:ah] * 0.48
                    right[h_start:eh] += hat[:ah] * 0.52

            # Horse Hooves Woodblock Gallop (poko-poko sound)
            for h16 in (0, 1, 2, 3):
                hoof_start = b_start + h16 * samples_per_16th
                wlen = int(0.04 * SAMPLE_RATE)
                wt = np.linspace(0, 0.04, wlen, endpoint=False)
                w_freq = 900.0 if h16 % 2 == 0 else 1150.0
                wood = np.sin(2 * np.pi * w_freq * wt) * np.exp(-wt * 120.0) * 0.38
                ew = min(TOTAL_SAMPLES, hoof_start + wlen)
                aw = ew - hoof_start
                if aw > 0:
                    pan_l = 0.65 if h16 % 2 == 0 else 0.35
                    left[hoof_start:ew] += wood[:aw] * pan_l
                    right[hoof_start:ew] += wood[:aw] * (1.0 - pan_l)

    # 2. BASSLINE (Moog 16th Octave Galloping Techno Bass)
    chord_roots = ['G2', 'E2', 'C2', 'D2']
    for m in range(NUM_MEASURES):
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        root = chord_roots[(m // 2) % len(chord_roots)]
        rf = note_to_freq(root)
        for s in range(MEASURE_16THS):
            nstart = m_start + s * samples_per_16th
            nlen = int(samples_per_16th * 0.85)
            eb = min(TOTAL_SAMPLES, nstart + nlen)
            ab = eb - nstart
            if ab > 0:
                t = np.linspace(0, ab / SAMPLE_RATE, ab, endpoint=False)
                oct_ = 2.0 if (s % 2 == 1) else 1.0
                f = rf * oct_
                saw = 2.0 * (f * t - np.floor(0.5 + f * t))
                sqr = np.sign(np.sin(2 * np.pi * f * t))
                b_sig = (saw * 0.6 + sqr * 0.4) * np.exp(-t * 22.0) * 0.48
                left[nstart:eb] += b_sig * 0.52
                right[nstart:eb] += b_sig * 0.48

    # 3. LEAD SYNTH (Classic YMO Roland/Prophet-5 Lead)
    for s16, dur, n_name in melody_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.12) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.004) * np.exp(-t * (4.2 if dur >= 4 else 7.8))
            # Square wave + pulse + subtle chorus
            sqr = np.sign(np.sin(2 * np.pi * fq * t)) * 0.55
            sqr_detune = np.sign(np.sin(2 * np.pi * (fq * 1.003) * t)) * 0.35
            saw = (2.0 * (fq * t - np.floor(0.5 + fq * t))) * 0.25
            lead = (sqr + sqr_detune + saw) * env * 0.42
            left[n_start:es] += lead * 0.53
            right[n_start:es] += lead * 0.47

    save_wav('audio/bgm_rydeen.wav', left, right)

if __name__ == '__main__':
    print("=== Generating FORCE OF THE HORSE Music Suite ===")
    generate_turkish_march()
    generate_william_tell()
    generate_cyber_turf()
    generate_grand_prix()
    generate_rydeen()
    print("=== All BGM Tracks Generated Successfully ===")

