import {
  playCountdownBeep,
  playShutterSound,
  _resetAudioContextForTesting,
} from "../audio-effects";

describe("Audio Effects Synthesizer", () => {
  beforeEach(() => {
    _resetAudioContextForTesting();
    delete (global as unknown as { window?: unknown }).window;
  });

  afterEach(() => {
    _resetAudioContextForTesting();
    delete (global as unknown as { window?: unknown }).window;
  });

  it("does not throw in non-browser / SSR environment", () => {
    expect(() => playCountdownBeep(false)).not.toThrow();
    expect(() => playCountdownBeep(true)).not.toThrow();
    expect(() => playShutterSound()).not.toThrow();
  });

  describe("Browser AudioContext Execution", () => {
    let mockOscillator: {
      type: string;
      frequency: { setValueAtTime: jest.Mock };
      connect: jest.Mock;
      start: jest.Mock;
      stop: jest.Mock;
    };
    let mockGain: {
      gain: { setValueAtTime: jest.Mock; exponentialRampToValueAtTime: jest.Mock };
      connect: jest.Mock;
    };
    let mockBufferSource: {
      buffer: unknown;
      connect: jest.Mock;
      start: jest.Mock;
    };
    let mockFilter: {
      type: string;
      frequency: { setValueAtTime: jest.Mock };
      Q: { setValueAtTime: jest.Mock };
      connect: jest.Mock;
    };

    beforeEach(() => {
      _resetAudioContextForTesting();

      mockOscillator = {
        type: "sine",
        frequency: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      };

      mockGain = {
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
        connect: jest.fn(),
      };

      mockBufferSource = {
        buffer: null,
        connect: jest.fn(),
        start: jest.fn(),
      };

      mockFilter = {
        type: "bandpass",
        frequency: { setValueAtTime: jest.fn() },
        Q: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
      };

      const mockAudioContext = jest.fn().mockImplementation(() => ({
        currentTime: 0,
        sampleRate: 44100,
        destination: {},
        createOscillator: jest.fn().mockReturnValue(mockOscillator),
        createGain: jest.fn().mockReturnValue(mockGain),
        createBuffer: jest.fn().mockReturnValue({
          getChannelData: jest.fn().mockReturnValue(new Float32Array(100)),
        }),
        createBufferSource: jest.fn().mockReturnValue(mockBufferSource),
        createBiquadFilter: jest.fn().mockReturnValue(mockFilter),
        resume: jest.fn().mockResolvedValue(undefined),
      }));

      (global as unknown as { window: { AudioContext: unknown } }).window = {
        AudioContext: mockAudioContext,
      };
    });

    it("synthesizes countdown beep with 800Hz for standard tick and 1200Hz for final tick", () => {
      playCountdownBeep(false);
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        800,
        expect.any(Number)
      );

      playCountdownBeep(true);
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        1200,
        expect.any(Number)
      );
    });

    it("synthesizes dual-click mechanical camera shutter bursts", () => {
      expect(() => playShutterSound()).not.toThrow();
      expect(mockFilter.frequency.setValueAtTime).toHaveBeenCalledWith(
        3200,
        expect.any(Number)
      );
      expect(mockFilter.frequency.setValueAtTime).toHaveBeenCalledWith(
        2400,
        expect.any(Number)
      );
    });
  });
});
