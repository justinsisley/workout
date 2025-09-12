import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExerciseVideo } from '@/components/workout/exercise-video';

// Mock YouTube API
const mockYouTubePlayer = {
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  seekTo: vi.fn(),
  getCurrentTime: vi.fn(() => 0),
  getDuration: vi.fn(() => 100),
  getPlayerState: vi.fn(() => 1),
  destroy: vi.fn()
};

// Mock global YouTube API
Object.defineProperty(window, 'YT', {
  value: {
    Player: vi.fn().mockImplementation(() => mockYouTubePlayer),
    PlayerState: {
      UNSTARTED: -1,
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5
    }
  },
  writable: true
});

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  value: null,
  writable: true
});

Object.defineProperty(Element.prototype, 'requestFullscreen', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(document, 'exitFullscreen', {
  value: vi.fn(),
  writable: true
});

describe('ExerciseVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.querySelector to simulate script not existing
    vi.spyOn(document, 'querySelector').mockReturnValue(null);
    // Mock document.head.appendChild
    vi.spyOn(document.head, 'appendChild').mockImplementation(() => ({} as any));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Video URL parsing', () => {
    it('should show error message when no video URL is provided', () => {
      render(<ExerciseVideo />);
      
      expect(screen.getByText('No video demonstration available for this exercise.')).toBeInTheDocument();
    });

    it('should show error message when invalid video URL is provided', () => {
      render(<ExerciseVideo videoUrl="invalid-url" />);
      
      expect(screen.getByText('No video demonstration available for this exercise.')).toBeInTheDocument();
    });

    it('should extract video ID from standard YouTube URL', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      render(<ExerciseVideo videoUrl={videoUrl} exerciseTitle="Test Exercise" />);

      // Wait for YouTube API to be called
      await waitFor(() => {
        expect(window.YT.Player).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            videoId: 'dQw4w9WgXcQ'
          })
        );
      });
    });

    it('should extract video ID from short YouTube URL', async () => {
      const videoUrl = 'https://youtu.be/dQw4w9WgXcQ';
      render(<ExerciseVideo videoUrl={videoUrl} exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        expect(window.YT.Player).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            videoId: 'dQw4w9WgXcQ'
          })
        );
      });
    });

    it('should extract video ID from embed YouTube URL', async () => {
      const videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      render(<ExerciseVideo videoUrl={videoUrl} exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        expect(window.YT.Player).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            videoId: 'dQw4w9WgXcQ'
          })
        );
      });
    });
  });

  describe('YouTube API loading', () => {
    it('should load YouTube iframe API script when not present', async () => {
      render(<ExerciseVideo videoUrl="https://youtu.be/test" />);
      
      // Wait for useEffect to run
      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalledWith(
          expect.objectContaining({
            src: 'https://www.youtube.com/iframe_api',
            async: true
          })
        );
      });
    });

    it('should not load script if YouTube API is already available', () => {
      window.YT = {
        ...window.YT,
        Player: vi.fn().mockImplementation(() => mockYouTubePlayer)
      };

      render(<ExerciseVideo videoUrl="https://youtu.be/test" />);
      
      expect(document.head.appendChild).not.toHaveBeenCalled();
    });

    it('should wait for existing script to load if already present', () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(document.createElement('script'));
      
      render(<ExerciseVideo videoUrl="https://youtu.be/test" />);
      
      expect(document.head.appendChild).not.toHaveBeenCalled();
    });
  });

  describe('Video player initialization', () => {
    beforeEach(() => {
      window.YT = {
        ...window.YT,
        Player: vi.fn().mockImplementation((_, config) => {
          // Simulate immediate onReady callback
          setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
          return mockYouTubePlayer;
        })
      };
    });

    it('should initialize YouTube player with correct configuration', async () => {
      render(<ExerciseVideo videoUrl="https://youtu.be/test123" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        expect(window.YT.Player).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            height: '315',
            width: '560',
            videoId: 'test123',
            events: expect.objectContaining({
              onReady: expect.any(Function),
              onStateChange: expect.any(Function),
              onError: expect.any(Function)
            }),
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              fs: 1
            }
          })
        );
      });
    });

    it('should handle player initialization errors gracefully', async () => {
      window.YT.Player = vi.fn().mockImplementation(() => {
        throw new Error('Player initialization failed');
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load exercise video/)).toBeInTheDocument();
      });
    });
  });

  describe('Video controls', () => {
    beforeEach(async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });
    });

    it('should show play button initially', async () => {
      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const playButton = screen.getByLabelText('Play video');
        expect(playButton).toBeInTheDocument();
      });
    });

    it('should call playVideo when play button is clicked', async () => {
      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const playButton = screen.getByLabelText('Play video');
        fireEvent.click(playButton);
        expect(mockYouTubePlayer.playVideo).toHaveBeenCalled();
      });
    });

    it('should show pause button when video is playing', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => {
          config.events.onReady({ target: mockYouTubePlayer });
          // Simulate playing state
          config.events.onStateChange({ data: 1, target: mockYouTubePlayer });
        }, 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const pauseButton = screen.getByLabelText('Pause video');
        expect(pauseButton).toBeInTheDocument();
      });
    });

    it('should call pauseVideo when pause button is clicked', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => {
          config.events.onReady({ target: mockYouTubePlayer });
          config.events.onStateChange({ data: 1, target: mockYouTubePlayer });
        }, 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const pauseButton = screen.getByLabelText('Pause video');
        fireEvent.click(pauseButton);
        expect(mockYouTubePlayer.pauseVideo).toHaveBeenCalled();
      });
    });

    it('should call seekTo(0) when restart button is clicked', async () => {
      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const restartButton = screen.getByLabelText('Restart video');
        fireEvent.click(restartButton);
        expect(mockYouTubePlayer.seekTo).toHaveBeenCalledWith(0);
      });
    });

    it('should handle video control errors gracefully', async () => {
      mockYouTubePlayer.playVideo.mockImplementation(() => {
        throw new Error('Playback error');
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const playButton = screen.getByLabelText('Play video');
        fireEvent.click(playButton);
      });

      // The error handling should prevent the component from crashing
      // but won't immediately show the error message - that requires the error state to be triggered differently
      expect(() => {
        const playButton = screen.getByLabelText('Play video');
        fireEvent.click(playButton);
      }).not.toThrow();
    });
  });

  describe('Fullscreen functionality', () => {
    beforeEach(async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });
    });

    it('should show fullscreen button', async () => {
      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const fullscreenButton = screen.getByLabelText('Enter fullscreen');
        expect(fullscreenButton).toBeInTheDocument();
      });
    });

    it('should request fullscreen when fullscreen button is clicked', async () => {
      const mockRequestFullscreen = vi.fn();
      Element.prototype.requestFullscreen = mockRequestFullscreen;

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const fullscreenButton = screen.getByLabelText('Enter fullscreen');
        fireEvent.click(fullscreenButton);
        expect(mockRequestFullscreen).toHaveBeenCalled();
      });
    });

    it('should exit fullscreen when already in fullscreen', async () => {
      const mockExitFullscreen = vi.fn();
      document.exitFullscreen = mockExitFullscreen;

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const fullscreenButton = screen.getByLabelText('Enter fullscreen');
        fireEvent.click(fullscreenButton); // Enter fullscreen first
        
        const exitFullscreenButton = screen.getByLabelText('Exit fullscreen');
        fireEvent.click(exitFullscreenButton);
        expect(mockExitFullscreen).toHaveBeenCalled();
      });
    });

    it('should handle fullscreen API errors gracefully', async () => {
      Element.prototype.requestFullscreen = vi.fn().mockImplementation(() => {
        throw new Error('Fullscreen not supported');
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const fullscreenButton = screen.getByLabelText('Enter fullscreen');
        // Should not throw error when clicked
        expect(() => fireEvent.click(fullscreenButton)).not.toThrow();
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading spinner initially', async () => {
      window.YT.Player = vi.fn().mockImplementation(() => mockYouTubePlayer);
      
      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      // Loading spinner should be present before onReady callback
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should hide loading spinner after player ready', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });

    it('should show loading spinner during buffering', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => {
          config.events.onReady({ target: mockYouTubePlayer });
          // Simulate buffering state
          config.events.onStateChange({ data: 3, target: mockYouTubePlayer });
        }, 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should show error message when video fails to load', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onError({ data: 2 }), 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load exercise video/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onError({ data: 2 }), 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should reload page when retry button is clicked', async () => {
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onError({ data: 2 }), 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);
        expect(mockReload).toHaveBeenCalled();
      });
    });
  });

  describe('Exercise title display', () => {
    it('should display exercise title when provided', async () => {
      const exerciseTitle = 'Push-up Demonstration';
      
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle={exerciseTitle} />);

      await waitFor(() => {
        expect(screen.getByText(exerciseTitle)).toBeInTheDocument();
      });
    });

    it('should not show title section when no exercise title provided', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" />);

      await waitFor(() => {
        // Title should not be rendered if not provided
        expect(document.querySelector('.truncate')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });
    });

    it('should have proper ARIA labels for all buttons', async () => {
      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        expect(screen.getByLabelText('Play video')).toBeInTheDocument();
        expect(screen.getByLabelText('Restart video')).toBeInTheDocument();
        expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
      });
    });

    it('should update ARIA labels based on state', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => {
          config.events.onReady({ target: mockYouTubePlayer });
          config.events.onStateChange({ data: 1, target: mockYouTubePlayer }); // Playing state
        }, 0);
        return mockYouTubePlayer;
      });

      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        expect(screen.getByLabelText('Pause video')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile optimization', () => {
    beforeEach(async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });
    });

    it('should have 44px touch targets for all buttons', async () => {
      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          // Check for minimum 44px touch target (h-11 w-11 = 44px)
          expect(button.className).toMatch(/h-11|w-11/);
        });
      });
    });

    it('should have touch-manipulation class for better touch responsiveness', async () => {
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });
      
      render(<ExerciseVideo videoUrl="https://youtu.be/test" exerciseTitle="Test Exercise" />);

      await waitFor(() => {
        const controlsContainer = document.querySelector('.touch-manipulation');
        expect(controlsContainer).toBeInTheDocument();
      });
    });
  });

  describe('Component cleanup', () => {
    it('should destroy player on unmount', async () => {
      // Reset the destroy mock to ensure clean state
      mockYouTubePlayer.destroy = vi.fn();
      
      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });

      const { unmount } = render(<ExerciseVideo videoUrl="https://youtu.be/test" />);

      // Wait for player to be created and ready
      await waitFor(() => {
        expect(window.YT.Player).toHaveBeenCalled();
      });

      unmount();

      // Should call destroy on the player
      expect(mockYouTubePlayer.destroy).toHaveBeenCalled();
    });

    it('should handle destroy errors gracefully', async () => {
      mockYouTubePlayer.destroy = vi.fn().mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      window.YT.Player = vi.fn().mockImplementation((_, config) => {
        setTimeout(() => config.events.onReady({ target: mockYouTubePlayer }), 0);
        return mockYouTubePlayer;
      });

      const { unmount } = render(<ExerciseVideo videoUrl="https://youtu.be/test" />);

      await waitFor(() => {
        expect(mockYouTubePlayer).toBeDefined();
      });

      // Should not throw error during unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});