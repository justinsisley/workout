'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Pause, Maximize, Minimize, RotateCcw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExerciseVideoProps {
  videoUrl?: string;
  exerciseTitle?: string;
  className?: string;
}

interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy?(): void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string;
          width: string;
          videoId: string;
          events: {
            onReady: (event: { target: YouTubePlayer }) => void;
            onStateChange: (event: { data: number; target: YouTubePlayer }) => void;
            onError: (event: { data: number }) => void;
          };
          playerVars: {
            autoplay: number;
            controls: number;
            modestbranding: number;
            rel: number;
            fs: number;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/user\/[^\/]+#p\/u\/\d+\/([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

export function ExerciseVideo({ videoUrl, exerciseTitle, className }: ExerciseVideoProps) {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const videoId = extractYouTubeVideoId(videoUrl || '');

  // Load YouTube iframe API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiLoaded(true);
      return;
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="youtube"]')) {
      const checkAPI = () => {
        if (window.YT && window.YT.Player) {
          setApiLoaded(true);
        } else {
          setTimeout(checkAPI, 100);
        }
      };
      checkAPI();
      return;
    }

    // Load the YouTube iframe API
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      setApiLoaded(true);
    };

    return () => {
      if (window.onYouTubeIframeAPIReady) {
        delete (window as any).onYouTubeIframeAPIReady;
      }
    };
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    if (!apiLoaded || !videoId || !playerRef.current) return;

    const initPlayer = () => {
      try {
        new window.YT.Player('youtube-player', {
          height: '315',
          width: '560',
          videoId,
          events: {
            onReady: (event) => {
              setPlayer(event.target);
              setIsLoading(false);
              setHasError(false);
            },
            onStateChange: (event) => {
              const { YT } = window;
              setIsPlaying(event.data === YT.PlayerState.PLAYING);
              
              if (event.data === YT.PlayerState.BUFFERING) {
                setIsLoading(true);
              } else {
                setIsLoading(false);
              }
            },
            onError: () => {
              setHasError(true);
              setIsLoading(false);
            }
          },
          playerVars: {
            autoplay: 0,
            controls: 0, // Hide default controls to use custom ones
            modestbranding: 1,
            rel: 0,
            fs: 1
          }
        });
      } catch (error) {
        console.error('Failed to initialize YouTube player:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (player && player.destroy) {
        try {
          player.destroy();
        } catch (error) {
          console.error('Error destroying YouTube player:', error);
        }
      }
    };
  }, [apiLoaded, videoId, player]);

  const handlePlayPause = () => {
    if (!player) return;
    
    try {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch (error) {
      console.error('Error controlling video playback:', error);
      setHasError(true);
    }
  };

  const handleSeekTo = (seconds: number) => {
    if (!player) return;
    
    try {
      player.seekTo(seconds);
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        } else if ('webkitRequestFullscreen' in containerRef.current) {
          (containerRef.current as HTMLElement & { webkitRequestFullscreen(): void }).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ('webkitExitFullscreen' in document) {
          (document as Document & { webkitExitFullscreen(): void }).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Show error state if no video URL or invalid video ID
  if (!videoUrl || !videoId) {
    return (
      <div className={cn('w-full', className)}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No video demonstration available for this exercise.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error state for video loading failures
  if (hasError) {
    return (
      <div className={cn('w-full', className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load exercise video. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-2 w-full sm:w-auto"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative w-full bg-black rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Video Player Container */}
      <div className={cn(
        'relative w-full aspect-video',
        isFullscreen && 'h-full aspect-auto'
      )}>
        <div
          ref={playerRef}
          id="youtube-player"
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}
      </div>

      {/* Custom Video Controls */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4',
        'opacity-0 hover:opacity-100 transition-opacity duration-200',
        'touch-manipulation' // Optimize for touch
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Play/Pause Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePlayPause}
              disabled={!player}
              className={cn(
                'text-white hover:text-white hover:bg-white/20',
                'h-11 w-11 p-0', // 44px touch target
                'rounded-full'
              )}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </Button>

            {/* Restart Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSeekTo(0)}
              disabled={!player}
              className={cn(
                'text-white hover:text-white hover:bg-white/20',
                'h-11 w-11 p-0', // 44px touch target
                'rounded-full'
              )}
              aria-label="Restart video"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Exercise Title */}
          {exerciseTitle && (
            <div className="flex-1 px-4">
              <p className="text-white text-sm font-medium truncate">
                {exerciseTitle}
              </p>
            </div>
          )}

          {/* Fullscreen Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleFullscreen}
            className={cn(
              'text-white hover:text-white hover:bg-white/20',
              'h-11 w-11 p-0', // 44px touch target
              'rounded-full'
            )}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}