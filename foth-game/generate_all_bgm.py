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


# ==========================================
# 6. TRACK 6: YUGIOH BATTLE ARENA (遊戯王 封印されし記憶・古代決闘闘技場)
# ==========================================
def generate_yugioh_arena():
    BPM = 130.0
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

    # Ancient Colosseum Melody (D Harmonic Minor)
    # Section A (Measures 0-15: The Duel Commences)
    y_theme_a = [
        # Phrase 1: D5 . F5 E5 | D5 . A4 .
        ('D5', 2), ('F5', 1), ('E5', 1), ('D5', 2), ('A4', 2),
        # Phrase 2: Bb4 . D5 C5 | A4 . . .
        ('Bb4', 2), ('D5', 1), ('C5', 1), ('A4', 4),
        # Phrase 3: D5 . F5 G5 | A5 . Bb5 .
        ('D5', 2), ('F5', 1), ('G5', 1), ('A5', 2), ('Bb5', 2),
        # Phrase 4: A5 G5 F5 E5 | D5 . . .
        ('A5', 1), ('G5', 1), ('F5', 1), ('E5', 1), ('D5', 4),
        # Phrase 5: F5 . A5 G5 | F5 . C5 .
        ('F5', 2), ('A5', 1), ('G5', 1), ('F5', 2), ('C5', 2),
        # Phrase 6: D5 . F5 E5 | C#5 . . .
        ('D5', 2), ('F5', 1), ('E5', 1), ('C#5', 4),
        # Phrase 7: E5 F5 G5 A5 | Bb5 A5 G5 F5
        ('E5', 1), ('F5', 1), ('G5', 1), ('A5', 1), ('Bb5', 1), ('A5', 1), ('G5', 1), ('F5', 1),
        # Phrase 8: E5 D5 C#5 E5 | D5 . . .
        ('E5', 1), ('D5', 1), ('C#5', 1), ('E5', 1), ('D5', 4),
    ]
    add_m(0, y_theme_a)
    add_m(8, y_theme_a)

    # Section B (Measures 16-31: High-Stakes Ancient Egyptian Brass)
    y_theme_b = [
        # A5 . F5 . | D5 . . . | Bb5 . G5 . | E5 . . .
        ('A5', 2), ('F5', 2), ('D5', 4),
        ('Bb5', 2), ('G5', 2), ('E5', 4),
        # A5 . Bb5 A5 | G5 F5 E5 D5 | C#5 . E5 G5 | A5 . . .
        ('A5', 2), ('Bb5', 1), ('A5', 1), ('G5', 1), ('F5', 1), ('E5', 1), ('D5', 1),
        ('C#5', 2), ('E5', 1), ('G5', 1), ('A5', 4),
        # D6 . A5 . | F5 . D5 . | G5 . Bb5 A5 | G5 . E5 .
        ('D6', 2), ('A5', 2), ('F5', 2), ('D5', 2),
        ('G5', 2), ('Bb5', 1), ('A5', 1), ('G5', 2), ('E5', 2),
        # F5 G5 A5 Bb5 | C6 Bb5 A5 G5 | A5 . C#5 . | D5 . . .
        ('F5', 1), ('G5', 1), ('A5', 1), ('Bb5', 1), ('C6', 1), ('Bb5', 1), ('A5', 1), ('G5', 1),
        ('A5', 2), ('C#5', 2), ('D5', 4),
    ]
    add_m(16, y_theme_b)

    # Section C (Measures 32-47: Climax with Soaring Octave Trumpets)
    y_theme_c = [
        ('D6', 2), ('F6', 1), ('E6', 1), ('D6', 2), ('A5', 2),
        ('Bb5', 2), ('D6', 1), ('C6', 1), ('A5', 4),
        ('D6', 2), ('F6', 1), ('G6', 1), ('A6', 2), ('Bb6', 2),
        ('A6', 1), ('G6', 1), ('F6', 1), ('E6', 1), ('D6', 4),
        ('F6', 2), ('A6', 1), ('G6', 1), ('F6', 2), ('C6', 2),
        ('D6', 2), ('F6', 1), ('E6', 1), ('C#6', 4),
        ('E6', 1), ('F6', 1), ('G6', 1), ('A6', 1), ('Bb6', 1), ('A6', 1), ('G6', 1), ('F6', 1),
        ('E6', 1), ('D6', 1), ('C#6', 1), ('E6', 1), ('D6', 4),
        ('A6', 2), ('F6', 2), ('D6', 4),
        ('Bb6', 2), ('G6', 2), ('E6', 4),
        ('A6', 2), ('Bb6', 1), ('A6', 1), ('G6', 1), ('F6', 1), ('E6', 1), ('D6', 1),
        ('C#6', 2), ('E6', 1), ('G6', 1), ('A6', 4),
    ]
    add_m(32, y_theme_c)

    # Outro (Measures 48-63)
    y_outro = [
        ('D5', 2), ('F5', 1), ('E5', 1), ('D5', 2), ('A4', 2),
        ('Bb4', 2), ('D5', 1), ('C5', 1), ('A4', 4),
        ('D5', 2), ('F5', 1), ('G5', 1), ('A5', 2), ('Bb5', 2),
        ('A5', 1), ('G5', 1), ('F5', 1), ('E5', 1), ('D5', 4),
        ('D5', 2), ('F5', 2), ('A5', 2), ('D6', 2),
        ('A5', 2), ('F5', 2), ('D5', 4),
        ('A4', 2), ('C#5', 2), ('E5', 2), ('A5', 2),
        ('D5', 4), ('A4', 4),
        ('D4', 8), ('_', 8)
    ]
    add_m(48, y_outro)

    # 1. BATTLE DRUMS (Timpani + March Snare Rolls + Battle Cymbals)
    for m in range(NUM_MEASURES):
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        for beat in range(2):
            b_start = m_start + beat * samples_per_beat
            # Heavy Orchestral Timpani Kick on downbeats
            klen = int(0.25 * SAMPLE_RATE)
            kt = np.linspace(0, 0.25, klen, endpoint=False)
            kick = np.sin(2 * np.pi * (135 * np.exp(-kt * 22) + 38) * kt) * np.exp(-kt * 12) * 1.15
            ek = min(TOTAL_SAMPLES, b_start + klen)
            ak = ek - b_start
            if ak > 0:
                left[b_start:ek] += kick[:ak] * 0.72
                right[b_start:ek] += kick[:ak] * 0.72

            # March Snare roll (16th martial snare)
            for s16 in range(4):
                s_start = b_start + s16 * samples_per_16th
                slen = int(0.09 * SAMPLE_RATE)
                st = np.linspace(0, 0.09, slen, endpoint=False)
                sn = np.random.uniform(-1, 1, slen) * np.exp(-st * 38) * (0.85 if (s16 == 0 or beat == 1) else 0.45)
                es = min(TOTAL_SAMPLES, s_start + slen)
                as_ = es - s_start
                if as_ > 0:
                    left[s_start:es] += sn[:as_] * 0.42
                    right[s_start:es] += sn[:as_] * 0.42

    # 2. STRINGS OSTINATO (16th D-F-A-D driving rhythm)
    chords = []
    for m in range(NUM_MEASURES):
        if m % 4 == 0: chords.append(('D3', 'F3', 'A3', 'D4'))
        elif m % 4 == 1: chords.append(('Bb2', 'D3', 'F3', 'Bb3'))
        elif m % 4 == 2: chords.append(('G2', 'Bb2', 'D3', 'G3'))
        else: chords.append(('A2', 'C#3', 'E3', 'A3'))

    for m in range(NUM_MEASURES):
        chord = chords[m]
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        patt = [chord[0], chord[1], chord[2], chord[3], chord[2], chord[1], chord[0], chord[3]]
        for s in range(MEASURE_16THS):
            fq = note_to_freq(patt[s])
            n_start = m_start + s * samples_per_16th
            dur_s = int(samples_per_16th * 1.5)
            es = min(TOTAL_SAMPLES, n_start + dur_s)
            as_ = es - n_start
            if as_ > 0:
                t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
                # Staccato string ostinato
                saw = 2.0 * (fq * t - np.floor(0.5 + fq * t))
                tri = 2.0 * np.abs(2.0 * (fq * t - np.floor(fq * t + 0.5))) - 1.0
                str_tone = (saw * 0.55 + tri * 0.45) * np.exp(-t * 20.0) * 0.38
                left[n_start:es] += str_tone * 0.52
                right[n_start:es] += str_tone * 0.48

    # 3. TRUMPET & BRASS LEAD (Majestic Ancient Battle Trumpet)
    for s16, dur, n_name in melody_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.16) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.006) * np.exp(-t * (3.5 if dur >= 4 else 7.0))
            # Harmonic rich trumpet with vibrato
            vib = 1.0 + 0.008 * np.sin(2 * np.pi * 5.5 * t)
            f_vib = fq * vib
            lead = (np.sin(2 * np.pi * f_vib * t) * 0.52 +
                    np.sin(4 * np.pi * f_vib * t) * 0.32 +
                    np.sin(6 * np.pi * f_vib * t) * 0.22 +
                    np.sin(8 * np.pi * f_vib * t) * 0.10) * env * 0.50
            left[n_start:es] += lead * 0.53
            right[n_start:es] += lead * 0.47

    save_wav('audio/bgm_yugioh_arena.wav', left, right)

# ==========================================
# 7. TRACK 7: DRAGON QUEST OVERTURE (ロトの序曲風 冒険のファンファーレ＆マーチ)
# ==========================================
def generate_dq_overture():
    BPM = 122.0
    BEAT_SEC = 60.0 / BPM
    SIXTEENTH_SEC = BEAT_SEC / 4.0
    MEASURE_16THS = 16 # 4/4 Time Signature
    NUM_MEASURES = 40
    TOTAL_16THS = NUM_MEASURES * MEASURE_16THS
    TOTAL_SAMPLES = int(TOTAL_16THS * SIXTEENTH_SEC * SAMPLE_RATE)

    left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    samples_per_beat = int(BEAT_SEC * SAMPLE_RATE)
    samples_per_16th = int(SIXTEENTH_SEC * SAMPLE_RATE)

    melody_events = []
    harmony_events = []
    strings_events = []

    def add_m(start_m, notes):
        c = start_m * MEASURE_16THS
        for n, dur in notes:
            if n != '_': melody_events.append((c, dur, n))
            c += dur

    def add_h(start_m, notes):
        c = start_m * MEASURE_16THS
        for n, dur in notes:
            if n != '_': harmony_events.append((c, dur, n))
            c += dur

    def add_s(start_m, notes):
        c = start_m * MEASURE_16THS
        for n, dur in notes:
            if n != '_': strings_events.append((c, dur, n))
            c += dur

    # --- PART 1: ROYAL BRASS FANFARE (Measures 0 - 7) ---
    fanfare_m = [
        # M0
        ('C4', 3), ('E4', 1), ('G4', 4), ('C5', 4), ('E5', 4),
        # M1
        ('G5', 6), ('E5', 2), ('C5', 4), ('G4', 4),
        # M2
        ('F5', 3), ('E5', 1), ('D5', 4), ('G4', 4), ('D5', 4),
        # M3
        ('E5', 8), ('C5', 6), ('_', 2),
        # M4
        ('G4', 3), ('A4', 1), ('B4', 4), ('C5', 4), ('D5', 4),
        # M5
        ('E5', 3), ('F5', 1), ('G5', 4), ('A5', 4), ('B5', 4),
        # M6
        ('C6', 6), ('G5', 2), ('E5', 4), ('C5', 4),
        # M7
        ('G5', 8), ('G4', 4), ('_', 4),
    ]
    add_m(0, fanfare_m)

    fanfare_h = [
        # M0
        ('C3', 3), ('C4', 1), ('E4', 4), ('G4', 4), ('C5', 4),
        # M1
        ('E5', 6), ('C5', 2), ('G4', 4), ('E4', 4),
        # M2
        ('D5', 3), ('C5', 1), ('B4', 4), ('D4', 4), ('B4', 4),
        # M3
        ('C5', 8), ('G4', 6), ('_', 2),
        # M4
        ('E4', 3), ('F4', 1), ('G4', 4), ('A4', 4), ('B4', 4),
        # M5
        ('C5', 3), ('D5', 1), ('E5', 4), ('F5', 4), ('G5', 4),
        # M6
        ('A5', 6), ('E5', 2), ('C5', 4), ('G4', 4),
        # M7
        ('D5', 8), ('B3', 4), ('_', 4),
    ]
    add_h(0, fanfare_h)

    # --- PART 2: HEROIC ADVENTURE MARCH (Measures 8 - 23) ---
    march_theme = [
        # M8
        ('C5', 3), ('D5', 1), ('E5', 2), ('C5', 2), ('G4', 4), ('C5', 4),
        # M9
        ('D5', 3), ('E5', 1), ('F5', 2), ('D5', 2), ('G4', 4), ('D5', 4),
        # M10
        ('E5', 2), ('F5', 2), ('G5', 2), ('A5', 2), ('G5', 4), ('E5', 4),
        # M11
        ('D5', 6), ('C5', 2), ('D5', 6), ('_', 2),
        # M12
        ('C5', 3), ('D5', 1), ('E5', 2), ('C5', 2), ('G4', 4), ('C5', 4),
        # M13
        ('F5', 3), ('G5', 1), ('A5', 2), ('F5', 2), ('C5', 4), ('A5', 4),
        # M14
        ('G5', 3), ('E5', 1), ('C5', 2), ('G4', 2), ('A4', 2), ('B4', 2), ('C5', 2), ('D5', 2),
        # M15
        ('C5', 8), ('C5', 6), ('_', 2),

        # M16 (Soaring Trio / Adventure Bridge)
        ('A4', 4), ('C5', 4), ('E5', 4), ('A5', 4),
        # M17
        ('G5', 3), ('F5', 1), ('E5', 4), ('D5', 4), ('C5', 4),
        # M18
        ('F5', 4), ('A5', 4), ('C6', 4), ('F6', 2), ('E6', 2),
        # M19
        ('D6', 8), ('G5', 6), ('_', 2),
        # M20
        ('E5', 3), ('F5', 1), ('G5', 2), ('E5', 2), ('C5', 4), ('G4', 4),
        # M21
        ('A4', 3), ('B4', 1), ('C5', 2), ('A4', 2), ('F4', 4), ('C4', 4),
        # M22
        ('D4', 2), ('F4', 2), ('A4', 2), ('C5', 2), ('B4', 3), ('A4', 1), ('B4', 4),
        # M23
        ('C5', 8), ('C5', 6), ('_', 2),
    ]
    add_m(8, march_theme)

    march_harmony = [
        # M8
        ('G4', 3), ('A4', 1), ('C5', 2), ('G4', 2), ('E4', 4), ('G4', 4),
        # M9
        ('B4', 3), ('C5', 1), ('D5', 2), ('B4', 2), ('D4', 4), ('B4', 4),
        # M10
        ('C5', 2), ('D5', 2), ('E5', 2), ('F5', 2), ('E5', 4), ('C5', 4),
        # M11
        ('B4', 6), ('A4', 2), ('B4', 6), ('_', 2),
        # M12
        ('G4', 3), ('A4', 1), ('C5', 2), ('G4', 2), ('E4', 4), ('G4', 4),
        # M13
        ('A4', 3), ('B4', 1), ('C5', 2), ('A4', 2), ('F4', 4), ('C5', 4),
        # M14
        ('E5', 3), ('C5', 1), ('G4', 2), ('E4', 2), ('F4', 2), ('G4', 2), ('A4', 2), ('B4', 2),
        # M15
        ('G4', 8), ('E4', 6), ('_', 2),

        # M16
        ('E4', 4), ('A4', 4), ('C5', 4), ('E5', 4),
        # M17
        ('E5', 3), ('D5', 1), ('C5', 4), ('B4', 4), ('A4', 4),
        # M18
        ('D5', 4), ('F5', 4), ('A5', 4), ('D6', 2), ('C6', 2),
        # M19
        ('B5', 8), ('D5', 6), ('_', 2),
        # M20
        ('C5', 3), ('D5', 1), ('E5', 2), ('C5', 2), ('G4', 4), ('E4', 4),
        # M21
        ('F4', 3), ('G4', 1), ('A4', 2), ('F4', 2), ('C4', 4), ('A3', 4),
        # M22
        ('B3', 2), ('D4', 2), ('F4', 2), ('A4', 2), ('G4', 3), ('F#4', 1), ('G4', 4),
        # M23
        ('G4', 8), ('E4', 6), ('_', 2),
    ]
    add_h(8, march_harmony)

    # --- PART 3: FULL ORCHESTRAL REPRISE WITH SOARING STRINGS (Measures 24 - 39) ---
    # Octave up for majestic climax
    march_high = [
        # M24
        ('C6', 3), ('D6', 1), ('E6', 2), ('C6', 2), ('G5', 4), ('C6', 4),
        # M25
        ('D6', 3), ('E6', 1), ('F6', 2), ('D6', 2), ('G5', 4), ('D6', 4),
        # M26
        ('E6', 2), ('F6', 2), ('G6', 2), ('A6', 2), ('G6', 4), ('E6', 4),
        # M27
        ('D6', 6), ('C6', 2), ('D6', 6), ('_', 2),
        # M28
        ('C6', 3), ('D6', 1), ('E6', 2), ('C6', 2), ('G5', 4), ('C6', 4),
        # M29
        ('F6', 3), ('G6', 1), ('A6', 2), ('F6', 2), ('C6', 4), ('A6', 4),
        # M30
        ('G6', 3), ('E6', 1), ('C6', 2), ('G5', 2), ('A5', 2), ('B5', 2), ('C6', 2), ('D6', 2),
        # M31
        ('C6', 8), ('C6', 6), ('_', 2),

        # M32 (Outro March / Heroic Finale before Loop)
        ('E6', 3), ('F6', 1), ('G6', 2), ('E6', 2), ('C6', 4), ('G5', 4),
        # M33
        ('A5', 3), ('B5', 1), ('C6', 2), ('A5', 2), ('F5', 4), ('C5', 4),
        # M34
        ('D5', 2), ('F5', 2), ('A5', 2), ('C6', 2), ('B5', 3), ('A5', 1), ('B5', 4),
        # M35
        ('C6', 8), ('G5', 4), ('E5', 4),
        # M36 (Grand Royal Fanfare Cadence)
        ('C5', 3), ('E5', 1), ('G5', 4), ('C6', 4), ('E6', 4),
        # M37
        ('G6', 6), ('E6', 2), ('C6', 4), ('G5', 4),
        # M38
        ('F6', 3), ('E6', 1), ('D6', 4), ('G5', 4), ('B5', 4),
        # M39
        ('C6', 8), ('C5', 6), ('_', 2),
    ]
    add_m(24, march_high)
    add_s(24, march_high)

    # 1. BATTLE / ROYAL PERCUSSION (Timpani Rolls, March Snare & Crash Cymbals)
    for m in range(NUM_MEASURES):
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        is_fanfare = (m < 8 or m >= 36)

        # Timpani Kick on downbeats (Beat 1 & Beat 3 in 4/4)
        for beat in range(4):
            b_start = m_start + beat * samples_per_beat
            if beat == 0 or beat == 2 or is_fanfare:
                tlen = int(0.35 * SAMPLE_RATE)
                tt = np.linspace(0, 0.35, tlen, endpoint=False)
                # Resonant Orchestral Timpani
                timp_pitch = 65.0 if (m % 2 == 0) else 49.0 # C vs G
                timp = np.sin(2 * np.pi * (timp_pitch * (1.0 + 0.8 * np.exp(-tt * 25.0))) * tt) * np.exp(-tt * 8.0) * 1.35
                et = min(TOTAL_SAMPLES, b_start + tlen)
                at = et - b_start
                if at > 0:
                    left[b_start:et] += timp[:at] * 0.70
                    right[b_start:et] += timp[:at] * 0.70

            # March Snare (Crisp orchestral march rolls on beats 2 & 4 + 16th ghost notes)
            if not is_fanfare or (m in [3, 7, 39]):
                for s in range(4):
                    s_start = b_start + s * samples_per_16th
                    slen = int(0.08 * SAMPLE_RATE)
                    st = np.linspace(0, 0.08, slen, endpoint=False)
                    is_accent = (beat in [1, 3] and s == 0)
                    sn_vol = 0.85 if is_accent else 0.35
                    sn = np.random.uniform(-1, 1, slen) * np.exp(-st * 36.0) * sn_vol
                    es = min(TOTAL_SAMPLES, s_start + slen)
                    as_ = es - s_start
                    if as_ > 0:
                        left[s_start:es] += sn[:as_] * 0.40
                        right[s_start:es] += sn[:as_] * 0.40

        # Crash Cymbal on M0, M4, M8, M16, M24, M36
        if m in [0, 4, 8, 16, 24, 32, 36]:
            clen = int(1.2 * SAMPLE_RATE)
            ct = np.linspace(0, 1.2, clen, endpoint=False)
            cym = np.random.uniform(-1, 1, clen) * np.exp(-ct * 3.8) * 0.55
            ec = min(TOTAL_SAMPLES, m_start + clen)
            ac = ec - m_start
            if ac > 0:
                left[m_start:ec] += cym[:ac] * 0.45
                right[m_start:ec] += cym[:ac] * 0.55

    # 2. TUBA & BASS SECTION (Marching Oom-Pah Bass)
    bass_notes = []
    for m in range(NUM_MEASURES):
        if m < 8:
            # Fanfare Pedals
            if m in [0, 1, 3]: chord = ['C2', 'G2', 'C3', 'G2']
            elif m == 2: chord = ['G2', 'D2', 'G2', 'B2']
            elif m in [4, 5]: chord = ['C2', 'F2', 'G2', 'B2']
            elif m == 6: chord = ['A2', 'E2', 'F2', 'G2']
            else: chord = ['G2', 'D2', 'G2', 'G1']
        elif 8 <= m < 16 or 24 <= m < 32:
            # March Section A
            idx = (m - 8) % 8
            if idx == 0: chord = ['C2', 'G2', 'E2', 'G2']
            elif idx == 1: chord = ['G2', 'D2', 'B1', 'D2']
            elif idx == 2: chord = ['C2', 'G2', 'A2', 'E2']
            elif idx == 3: chord = ['G2', 'D2', 'G2', 'B1']
            elif idx == 4: chord = ['C2', 'G2', 'E2', 'G2']
            elif idx == 5: chord = ['F2', 'C2', 'A1', 'C2']
            elif idx == 6: chord = ['G2', 'E2', 'F2', 'G2']
            else: chord = ['C2', 'G2', 'C3', 'G2']
        elif 16 <= m < 24:
            # Bridge
            idx = (m - 16) % 8
            if idx == 0: chord = ['A1', 'E2', 'C2', 'E2']
            elif idx == 1: chord = ['E2', 'B1', 'G#1', 'B1']
            elif idx == 2: chord = ['F1', 'C2', 'A1', 'C2']
            elif idx == 3: chord = ['G1', 'D2', 'B1', 'D2']
            elif idx == 4: chord = ['C2', 'G2', 'E2', 'G2']
            elif idx == 5: chord = ['F1', 'C2', 'A1', 'C2']
            elif idx == 6: chord = ['D2', 'F2', 'G2', 'B1']
            else: chord = ['C2', 'G2', 'C3', 'G2']
        else:
            # Outro / Loop
            chord = ['C2', 'G2', 'E2', 'G2'] if m % 2 == 0 else ['G2', 'D2', 'G2', 'B1']
        bass_notes.append(chord)

    for m in range(NUM_MEASURES):
        chord = bass_notes[m]
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        for beat in range(4):
            fq = note_to_freq(chord[beat])
            b_start = m_start + beat * samples_per_beat
            blen = int(samples_per_beat * 0.92)
            eb = min(TOTAL_SAMPLES, b_start + blen)
            ab = eb - b_start
            if ab > 0:
                t = np.linspace(0, ab / SAMPLE_RATE, ab, endpoint=False)
                # Rich Warm Brass Tuba
                saw = 2.0 * (fq * t - np.floor(0.5 + fq * t))
                sin = np.sin(2 * np.pi * fq * t)
                env = np.exp(-t * 6.5) * np.minimum(1.0, t / 0.01)
                tuba = (saw * 0.45 + sin * 0.55) * env * 0.65
                left[b_start:eb] += tuba * 0.50
                right[b_start:eb] += tuba * 0.50

    # 3. FRENCH HORNS & BRASS HARMONY
    for s16, dur, n_name in harmony_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.18) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.015) * np.exp(-t * (2.8 if dur >= 6 else 6.0))
            vib = 1.0 + 0.006 * np.sin(2 * np.pi * 5.2 * t)
            f_vib = fq * vib
            # Warm Horns
            horn = (np.sin(2 * np.pi * f_vib * t) * 0.60 +
                    np.sin(4 * np.pi * f_vib * t) * 0.28 +
                    np.sin(6 * np.pi * f_vib * t) * 0.12) * env * 0.38
            left[n_start:es] += horn * 0.42
            right[n_start:es] += horn * 0.58

    # 4. HEROIC TRUMPET LEAD (Glorious Dragon Quest Fanfare & Adventure Lead)
    for s16, dur, n_name in melody_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.20) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.008) * np.exp(-t * (2.2 if dur >= 6 else 5.2))
            vib = 1.0 + (0.009 if dur >= 4 else 0.003) * np.sin(2 * np.pi * 5.8 * t)
            f_vib = fq * vib
            # Brilliant multi-harmonic Royal Trumpet
            lead = (np.sin(2 * np.pi * f_vib * t) * 0.50 +
                    np.sin(4 * np.pi * f_vib * t) * 0.30 +
                    np.sin(6 * np.pi * f_vib * t) * 0.20 +
                    np.sin(8 * np.pi * f_vib * t) * 0.12 +
                    np.sin(10 * np.pi * f_vib * t) * 0.06) * env * 0.52
            left[n_start:es] += lead * 0.54
            right[n_start:es] += lead * 0.46

    # 5. SOARING ORCHESTRAL STRINGS & FLUTE (High Octaves in Climax)
    for s16, dur, n_name in strings_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.25) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.02) * np.exp(-t * (1.8 if dur >= 6 else 4.5))
            vib = 1.0 + 0.012 * np.sin(2 * np.pi * 6.0 * t)
            f_vib = fq * vib
            flute = (np.sin(2 * np.pi * f_vib * t) * 0.70 +
                     np.sin(4 * np.pi * f_vib * t) * 0.20 +
                     np.sin(6 * np.pi * f_vib * t) * 0.10) * env * 0.35
            left[n_start:es] += flute * 0.48
            right[n_start:es] += flute * 0.52

    save_wav('audio/bgm_dq_overture.wav', left, right)

# ==========================================
# 8. TRACK 8: GREEN PASTURE GALLOP (緑の草原を駆ける風 〜ケルティック・大草原の疾走〜)
# ==========================================
def generate_green_pasture_gallop():
    BPM = 136.0
    BEAT_SEC = 60.0 / BPM
    # 6/8 compound meter: 6 eighth notes per measure. 12 sixteenth units per measure.
    SIXTEENTH_SEC = (BEAT_SEC * 2.0) / 12.0
    MEASURE_16THS = 12
    NUM_MEASURES = 48
    TOTAL_16THS = NUM_MEASURES * MEASURE_16THS
    TOTAL_SAMPLES = int(TOTAL_16THS * SIXTEENTH_SEC * SAMPLE_RATE)

    left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    samples_per_16th = int(SIXTEENTH_SEC * SAMPLE_RATE)
    samples_per_8th = samples_per_16th * 2

    whistle_events = []
    fiddle_events = []
    guitar_chords = []

    def add_w(start_m, notes):
        c = start_m * MEASURE_16THS
        for n, dur in notes:
            if n != '_': whistle_events.append((c, dur, n))
            c += dur

    def add_f(start_m, notes):
        c = start_m * MEASURE_16THS
        for n, dur in notes:
            if n != '_': fiddle_events.append((c, dur, n))
            c += dur

    # --- THEME A: CELTIC MEADOW BREEZE (Measures 0 - 15) ---
    theme_a_w = [
        # M0 (Intro pick-up / gallop start)
        ('_', 6), ('D5', 2), ('E5', 2), ('F#5', 2),
        # M1
        ('G5', 4), ('A5', 2), ('B5', 3), ('A5', 1), ('G5', 2),
        # M2
        ('E5', 4), ('G5', 2), ('D5', 6),
        # M3
        ('E5', 2), ('F#5', 2), ('G5', 2), ('A5', 4), ('B5', 2),
        # M4
        ('A5', 6), ('D5', 2), ('E5', 2), ('F#5', 2),
        # M5
        ('G5', 4), ('A5', 2), ('B5', 3), ('C6', 1), ('D6', 2),
        # M6
        ('E6', 4), ('D6', 2), ('B5', 6),
        # M7
        ('A5', 2), ('B5', 2), ('G5', 2), ('A5', 3), ('G5', 1), ('E5', 2),
        # M8
        ('G5', 6), ('G5', 6),

        # M9 (Variation)
        ('B5', 4), ('C6', 2), ('D6', 3), ('C6', 1), ('B5', 2),
        # M10
        ('A5', 4), ('G5', 2), ('E5', 6),
        # M11
        ('G5', 2), ('A5', 2), ('B5', 2), ('D6', 4), ('B5', 2),
        # M12
        ('A5', 6), ('D5', 2), ('E5', 2), ('F#5', 2),
        # M13
        ('G5', 4), ('A5', 2), ('B5', 3), ('C6', 1), ('D6', 2),
        # M14
        ('E6', 4), ('D6', 2), ('B5', 4), ('G5', 2),
        # M15
        ('A5', 4), ('B5', 2), ('G5', 6),
    ]
    add_w(0, theme_a_w)

    theme_a_f = [
        # M0
        ('_', 12),
        # M1
        ('B4', 4), ('C5', 2), ('D5', 4), ('B4', 2),
        # M2
        ('C5', 4), ('E5', 2), ('B4', 6),
        # M3
        ('C5', 2), ('D5', 2), ('E5', 2), ('F#5', 4), ('G5', 2),
        # M4
        ('F#5', 6), ('B4', 2), ('C5', 2), ('D5', 2),
        # M5
        ('B4', 4), ('C5', 2), ('D5', 4), ('F#5', 2),
        # M6
        ('G5', 4), ('F#5', 2), ('D5', 6),
        # M7
        ('E5', 2), ('G5', 2), ('D5', 2), ('F#5', 4), ('C5', 2),
        # M8
        ('B4', 6), ('B4', 6),

        # M9
        ('G5', 4), ('A5', 2), ('B5', 4), ('G5', 2),
        # M10
        ('F#5', 4), ('E5', 2), ('C5', 6),
        # M11
        ('E5', 2), ('F#5', 2), ('G5', 2), ('B5', 4), ('G5', 2),
        # M12
        ('F#5', 6), ('B4', 2), ('C5', 2), ('D5', 2),
        # M13
        ('B4', 4), ('C5', 2), ('D5', 4), ('F#5', 2),
        # M14
        ('G5', 4), ('F#5', 2), ('D5', 4), ('B4', 2),
        # M15
        ('C5', 4), ('D5', 2), ('B4', 6),
    ]
    add_f(0, theme_a_f)

    # --- THEME B: SOARING HILLS & GALLOPING HORIZON (Measures 16 - 31) ---
    theme_b_w = [
        # M16
        ('D6', 4), ('E6', 2), ('D6', 3), ('C6', 1), ('B5', 2),
        # M17
        ('C6', 4), ('D6', 2), ('C6', 3), ('B5', 1), ('A5', 2),
        # M18
        ('B5', 4), ('C6', 2), ('B5', 3), ('A5', 1), ('G5', 2),
        # M19
        ('A5', 6), ('D5', 6),
        # M20
        ('G5', 4), ('A5', 2), ('B5', 4), ('D6', 2),
        # M21
        ('E6', 4), ('F#6', 2), ('G6', 4), ('E6', 2),
        # M22
        ('D6', 4), ('B5', 2), ('A5', 3), ('B5', 1), ('A5', 2),
        # M23
        ('G5', 6), ('G5', 6),

        # M24
        ('D6', 4), ('E6', 2), ('D6', 3), ('C6', 1), ('B5', 2),
        # M25
        ('C6', 4), ('D6', 2), ('C6', 3), ('B5', 1), ('A5', 2),
        # M26
        ('B5', 4), ('C6', 2), ('B5', 3), ('A5', 1), ('G5', 2),
        # M27
        ('A5', 4), ('B5', 2), ('A5', 6),
        # M28
        ('G5', 2), ('A5', 2), ('B5', 2), ('C6', 2), ('D6', 2), ('E6', 2),
        # M29
        ('F#6', 4), ('G6', 2), ('E6', 4), ('D6', 2),
        # M30
        ('B5', 4), ('D6', 2), ('A5', 4), ('B5', 2),
        # M31
        ('G5', 6), ('G5', 6),
    ]
    add_w(16, theme_b_w)

    theme_b_f = [
        # M16
        ('B5', 4), ('C6', 2), ('B5', 4), ('G5', 2),
        # M17
        ('A5', 4), ('B5', 2), ('A5', 4), ('F#5', 2),
        # M18
        ('G5', 4), ('A5', 2), ('G5', 4), ('E5', 2),
        # M19
        ('F#5', 6), ('B4', 6),
        # M20
        ('B4', 4), ('C5', 2), ('D5', 4), ('B5', 2),
        # M21
        ('C6', 4), ('D6', 2), ('E6', 4), ('C6', 2),
        # M22
        ('B5', 4), ('G5', 2), ('F#5', 4), ('D5', 2),
        # M23
        ('B4', 6), ('B4', 6),

        # M24
        ('B5', 4), ('C6', 2), ('B5', 4), ('G5', 2),
        # M25
        ('A5', 4), ('B5', 2), ('A5', 4), ('F#5', 2),
        # M26
        ('G5', 4), ('A5', 2), ('G5', 4), ('E5', 2),
        # M27
        ('F#5', 4), ('G5', 2), ('F#5', 6),
        # M28
        ('E5', 2), ('F#5', 2), ('G5', 2), ('A5', 2), ('B5', 2), ('C6', 2),
        # M29
        ('D6', 4), ('E6', 2), ('C6', 4), ('B5', 2),
        # M30
        ('G5', 4), ('B5', 2), ('F#5', 4), ('D5', 2),
        # M31
        ('B4', 6), ('B4', 6),
    ]
    add_f(16, theme_b_f)

    # --- THEME C: HIGH JIG CLIMAX & CELEBRATION (Measures 32 - 47) ---
    theme_c_w = [
        # M32
        ('G6', 4), ('F#6', 2), ('G6', 4), ('D6', 2),
        # M33
        ('E6', 4), ('D6', 2), ('E6', 4), ('B5', 2),
        # M34
        ('C6', 3), ('D6', 1), ('E6', 2), ('D6', 3), ('C6', 1), ('B5', 2),
        # M35
        ('A5', 6), ('D5', 6),
        # M36
        ('G6', 4), ('F#6', 2), ('G6', 4), ('D6', 2),
        # M37
        ('E6', 4), ('D6', 2), ('E6', 4), ('B5', 2),
        # M38
        ('C6', 2), ('D6', 2), ('E6', 2), ('D6', 2), ('B5', 2), ('A5', 2),
        # M39
        ('G5', 6), ('G5', 6),

        # M40 (Grand Reprise of Theme A in High Octave)
        ('G5', 4), ('A5', 2), ('B5', 3), ('C6', 1), ('D6', 2),
        # M41
        ('E6', 4), ('G6', 2), ('D6', 6),
        # M42
        ('E6', 2), ('F#6', 2), ('G6', 2), ('A6', 4), ('B6', 2),
        # M43
        ('A6', 6), ('D6', 6),
        # M44
        ('B6', 4), ('A6', 2), ('G6', 3), ('F#6', 1), ('E6', 2),
        # M45
        ('D6', 4), ('E6', 2), ('B5', 6),
        # M46
        ('A5', 2), ('B5', 2), ('D6', 2), ('A5', 4), ('F#5', 2),
        # M47
        ('G5', 6), ('G5', 6),
    ]
    add_w(32, theme_c_w)
    add_f(32, theme_c_w)

    # 1. EQUESTRIAN GALLOP PERCUSSION (Bodhrán Thump + Coconut / Wooden Hoof-Clopping)
    for m in range(NUM_MEASURES):
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        # 6/8: 2 main beats (Beat 1 at 0, Beat 2 at 6 sixteenths)
        for compound_beat in range(2):
            b_start = m_start + compound_beat * (samples_per_8th * 3)
            # Resonant Bodhrán Bass Thump
            blen = int(0.28 * SAMPLE_RATE)
            bt = np.linspace(0, 0.28, blen, endpoint=False)
            bodhran = np.sin(2 * np.pi * (75.0 * np.exp(-bt * 18.0) + 42.0) * bt) * np.exp(-bt * 7.5) * 1.25
            eb = min(TOTAL_SAMPLES, b_start + blen)
            ab = eb - b_start
            if ab > 0:
                left[b_start:eb] += bodhran[:ab] * 0.65
                right[b_start:eb] += bodhran[:ab] * 0.65

        # 6 Eighth-Note Hoof-Clops per measure: 1-2-3, 4-5-6 galloping cadence
        for eighth in range(6):
            h_start = m_start + eighth * samples_per_8th
            # Coconut / Wood block hoof strike
            wlen = int(0.06 * SAMPLE_RATE)
            wt = np.linspace(0, 0.06, wlen, endpoint=False)
            # Resonant hollow wooden pitch (higher on 2, 3, 5, 6, deep thud on 1, 4)
            is_accent = (eighth == 0 or eighth == 3)
            w_pitch = 460.0 if is_accent else (580.0 if eighth % 2 == 1 else 520.0)
            wood = np.sin(2 * np.pi * w_pitch * wt) * np.exp(-wt * 65.0)
            click = np.random.uniform(-1, 1, wlen) * np.exp(-wt * 120.0) * 0.5
            clop = (wood * 0.75 + click * 0.25) * (0.85 if is_accent else 0.50)
            ew = min(TOTAL_SAMPLES, h_start + wlen)
            aw = ew - h_start
            if aw > 0:
                # Panning alternating slightly left/right like left/right horse hooves!
                pan_l = 0.60 if (eighth % 2 == 0) else 0.40
                pan_r = 0.40 if (eighth % 2 == 0) else 0.60
                left[h_start:ew] += clop[:aw] * pan_l * 0.45
                right[h_start:ew] += clop[:aw] * pan_r * 0.45

        # Tambourine / Jingle shimmer on upbeat eighths (eighth 2, 5)
        for eighth in [2, 5]:
            t_start = m_start + eighth * samples_per_8th
            tlen = int(0.14 * SAMPLE_RATE)
            tt = np.linspace(0, 0.14, tlen, endpoint=False)
            tamb = np.random.uniform(-1, 1, tlen) * np.exp(-tt * 24.0) * 0.35
            et = min(TOTAL_SAMPLES, t_start + tlen)
            at = et - t_start
            if at > 0:
                left[t_start:et] += tamb[:at] * 0.30
                right[t_start:et] += tamb[:at] * 0.30

    # 2. CELTIC ACOUSTIC GUITAR & HARP ARPEGGIOS (Rolling 6/8 Arpeggio Strumming)
    # Chord progression:
    # M0-7: G - Em - C - D - G - Em - C - G
    # M8-15: G - Em - C - D - G - Em - D - G
    # M16-23: Em - C - G - D - Em - C - D - G
    # M24-31: Em - C - G - D - Em - C - D - G
    # M32-39: C - G - Em - D - C - G - D - G
    # M40-47: G - Em - C - D - Em - C - D - G
    chords_map = [
        # M0-7
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['C3', 'D3', 'F#3', 'A3', 'D4', 'F#3'],

        # M8-15
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['D3', 'F#3', 'A3', 'D4', 'B3', 'G3'],

        # M16-23
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],

        # M24-31
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],

        # M32-39
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],

        # M40-47
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['E3', 'G3', 'B3', 'E4', 'B3', 'G3'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
        ['D3', 'F#3', 'A3', 'D4', 'A3', 'F#3'],
        ['G3', 'B3', 'D4', 'G4', 'D4', 'B3'],
    ]

    for m in range(NUM_MEASURES):
        chord_notes = chords_map[m]
        m_start = int(m * MEASURE_16THS * samples_per_16th)
        for i, n_name in enumerate(chord_notes):
            fq = note_to_freq(n_name)
            p_start = m_start + i * samples_per_8th
            plen = int(0.24 * SAMPLE_RATE)
            ep = min(TOTAL_SAMPLES, p_start + plen)
            ap = ep - p_start
            if ap > 0:
                t = np.linspace(0, ap / SAMPLE_RATE, ap, endpoint=False)
                # Acoustic Pluck (Tri + Sine with fast decay)
                tri = 2.0 * np.abs(2.0 * (fq * t - np.floor(fq * t + 0.5))) - 1.0
                sin = np.sin(2 * np.pi * fq * t)
                env = np.exp(-t * 14.0) * np.minimum(1.0, t / 0.004)
                pluck = (tri * 0.60 + sin * 0.40) * env * 0.45
                left[p_start:ep] += pluck * 0.55
                right[p_start:ep] += pluck * 0.45

    # 3. ACOUSTIC BASS (Jumping Celtic Bass on beats 1 & 4)
    for m in range(NUM_MEASURES):
        chord_notes = chords_map[m]
        root_name = chord_notes[0][:-1] + '2'
        fifth_name = chord_notes[2][:-1] + '2'
        m_start = int(m * MEASURE_16THS * samples_per_16th)

        for beat, b_note in enumerate([root_name, fifth_name]):
            fq = note_to_freq(b_note)
            b_start = m_start + beat * (samples_per_8th * 3)
            blen = int(0.35 * SAMPLE_RATE)
            eb = min(TOTAL_SAMPLES, b_start + blen)
            ab = eb - b_start
            if ab > 0:
                t = np.linspace(0, ab / SAMPLE_RATE, ab, endpoint=False)
                saw = 2.0 * (fq * t - np.floor(0.5 + fq * t))
                sin = np.sin(2 * np.pi * fq * t)
                env = np.exp(-t * 8.0) * np.minimum(1.0, t / 0.008)
                bass = (sin * 0.65 + saw * 0.35) * env * 0.65
                left[b_start:eb] += bass * 0.50
                right[b_start:eb] += bass * 0.50

    # 4. CELTIC TIN WHISTLE & WOODEN FLUTE (Airy, Light & Joyful Lead)
    for s16, dur, n_name in whistle_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.16) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.012) * np.exp(-t * (2.0 if dur >= 4 else 4.5))
            # Celtic breathy vibrato
            vib = 1.0 + (0.012 if dur >= 3 else 0.004) * np.sin(2 * np.pi * 6.2 * t)
            f_vib = fq * vib
            # Pure wooden whistle tone with breath noise
            breath = np.random.uniform(-1, 1, as_) * 0.06 * np.exp(-t * 12.0)
            whistle = (np.sin(2 * np.pi * f_vib * t) * 0.75 +
                       np.sin(4 * np.pi * f_vib * t) * 0.20 +
                       np.sin(6 * np.pi * f_vib * t) * 0.05 + breath) * env * 0.52
            left[n_start:es] += whistle * 0.53
            right[n_start:es] += whistle * 0.47

    # 5. CELTIC FIDDLE / STRINGS (Warm Meadow Harmony)
    for s16, dur, n_name in fiddle_events:
        fq = note_to_freq(n_name)
        if fq <= 0: continue
        n_start = int(s16 * samples_per_16th)
        dur_s = int((dur * SIXTEENTH_SEC + 0.18) * SAMPLE_RATE)
        es = min(TOTAL_SAMPLES, n_start + dur_s)
        as_ = es - n_start
        if as_ > 0:
            t = np.linspace(0, as_ / SAMPLE_RATE, as_, endpoint=False)
            env = np.minimum(1.0, t / 0.018) * np.exp(-t * (2.2 if dur >= 4 else 5.0))
            vib = 1.0 + 0.008 * np.sin(2 * np.pi * 5.6 * t)
            f_vib = fq * vib
            saw = 2.0 * (f_vib * t - np.floor(0.5 + f_vib * t))
            sin = np.sin(2 * np.pi * f_vib * t)
            fiddle = (saw * 0.45 + sin * 0.55) * env * 0.38
            left[n_start:es] += fiddle * 0.44
            right[n_start:es] += fiddle * 0.56

    save_wav('audio/bgm_green_pasture.wav', left, right)

def generate_banners_in_the_gale():
    print("Generating: Banners in the Gale (Arranged Seamless Loop)...")
    mp3_path = 'Banners_in_the_Gale.mp3'
    if not os.path.exists(mp3_path):
        print("MP3 file not found:", mp3_path)
        return
    
    try:
        import miniaudio
    except ImportError:
        print("miniaudio not installed. Skipping Banners in the Gale.")
        return

    f = miniaudio.decode_file(mp3_path)
    samples = np.frombuffer(f.samples, dtype=np.int16).reshape(-1, 2).astype(np.float32) / 32768.0
    sr = f.sample_rate # 44100
    
    b1 = 11400 # beat 1 downbeat sample (0.2585s)
    bar = 88200 # 2.000s per 4-beat bar at 120BPM
    
    # Extract pickup upbeat
    upbeat = samples[:b1]
    up_len = len(upbeat)
    
    # 1. First 14 bars (Bars 1-14)
    part1_14 = samples[b1 : b1 + 14*bar].copy()
    
    # 2. Bar 15 and Bar 16
    bar15 = samples[b1 + 14*bar : b1 + 15*bar].copy()
    # Bar 8 turnaround used as the base for Bar 16 turnaround
    bar16_base = samples[b1 + 7*bar : b1 + 8*bar].copy()
    
    # Crossfade the upbeat pickup seamlessly into the end of Bar 16
    w_up = np.sin(np.linspace(0, np.pi/2, up_len))[:, None]
    bar16_base[-up_len:] = bar16_base[-up_len:] * (1 - w_up) + upbeat * w_up
    
    # Base 16-bar pass (32.0s)
    pass1 = np.concatenate([part1_14, bar15, bar16_base], axis=0)
    
    # Create Pass 2 (Arranged Variation with extra percussion, brass swells, and Celtic accents)
    pass2 = pass1.copy()
    
    # Add equestrian bodhran & galloping percussion layer to Pass 2
    n_samples = len(pass2)
    sixteenth_samples = bar // 16
    for s_idx in range(0, n_samples // sixteenth_samples):
        pos = s_idx * sixteenth_samples
        sub_beat = s_idx % 16
        is_downbeat = (sub_beat % 4 == 0)
        is_gallop = (sub_beat % 4 == 2 or sub_beat % 4 == 3)
        
        # Snare / rimshot tap on gallop
        if is_gallop and pos + int(0.08*sr) < n_samples:
            env = np.exp(-np.linspace(0, 0.08, int(0.08*sr)) * 45.0)
            noise = (np.random.rand(len(env)) * 2 - 1) * env * 0.075
            pass2[pos : pos + len(env), 0] += noise * 0.45
            pass2[pos : pos + len(env), 1] += noise * 0.55
            
        # Timpani / low tom hit on bar downbeats
        if is_downbeat and pos + int(0.25*sr) < n_samples:
            env = np.exp(-np.linspace(0, 0.25, int(0.25*sr)) * 12.0)
            f_timp = 82.41 * (1.0 + 0.5 * env) # E2
            timp = np.sin(2 * np.pi * f_timp * np.linspace(0, 0.25, int(0.25*sr))) * env * 0.11
            pass2[pos : pos + len(env), 0] += timp * 0.5
            pass2[pos : pos + len(env), 1] += timp * 0.5
            
        # Cymbal / brass accent on Bar 1, 5, 9, 13
        bar_idx = s_idx // 16
        if sub_beat == 0 and (bar_idx in [0, 4, 8, 12]) and pos + int(0.6*sr) < n_samples:
            env_cym = np.exp(-np.linspace(0, 0.6, int(0.6*sr)) * 6.0)
            cym = (np.random.rand(len(env_cym)) * 2 - 1) * env_cym * 0.065
            pass2[pos : pos + len(env_cym), 0] += cym * 0.4
            pass2[pos : pos + len(env_cym), 1] += cym * 0.6
    
    # Combine Pass 1 (Exposition) + Pass 2 (Arranged Gallop) = 64.0s full loop
    full_loop = np.concatenate([pass1, pass2], axis=0)
    
    # Master limiter / normalization to -0.6 dB
    max_val = np.max(np.abs(full_loop))
    if max_val > 0.01:
        full_loop = (full_loop / max_val) * 0.93
        
    save_wav('audio/bgm_banners_gale.wav', full_loop[:, 0], full_loop[:, 1])

if __name__ == '__main__':
    print("=== Generating FORCE OF THE HORSE Music Suite ===")
    generate_turkish_march()
    generate_william_tell()
    generate_cyber_turf()
    generate_grand_prix()
    generate_rydeen()
    generate_yugioh_arena()
    generate_dq_overture()
    generate_green_pasture_gallop()
    generate_banners_in_the_gale()
    print("=== All BGM Tracks Generated Successfully ===")




