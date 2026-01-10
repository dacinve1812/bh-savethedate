import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

export default function MusicPlayer({ audioSrc = "/music.m4a", autoPlay = false }) {
  const [isMuted, setIsMuted] = useState(true); // Start muted, will be unmuted by autoPlay if needed
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const hasInitialized = useRef(false);
  const fadeIntervalRef = useRef(null);
  const hasAutoPlayed = useRef(false); // Track if autoPlay has been handled

  // Fade in/out function
  const fadeAudio = useCallback((targetVolume, targetMuted, duration = 500) => {
    if (!audioRef.current || !hasInitialized.current) return;

    // Clear any existing fade interval
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const currentVolume = audioRef.current.volume;
    const startVolume = currentVolume;
    const startTime = Date.now();
    const isFadingIn = !targetMuted;

    if (isFadingIn) {
      // Fade in: increase volume
      // Check if audio is paused, if so, play it first
      if (audioRef.current.paused) {
        // Reset volume to 0 for smooth fade in
        audioRef.current.volume = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              // Fade from 0 to target volume
              fadeIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                audioRef.current.volume = progress * targetVolume;
                
                if (progress >= 1) {
                  if (fadeIntervalRef.current) {
                    clearInterval(fadeIntervalRef.current);
                    fadeIntervalRef.current = null;
                  }
                  audioRef.current.volume = targetVolume;
                }
              }, 16); // ~60fps
            })
            .catch((error) => {
              console.log("Audio play failed:", error);
              setIsMuted(true);
              setIsPlaying(false);
            });
        } else {
          // Play promise is undefined, try direct fade
          setIsPlaying(true);
          audioRef.current.volume = 0;
          fadeIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            audioRef.current.volume = progress * targetVolume;
            
            if (progress >= 1) {
              if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
              }
              audioRef.current.volume = targetVolume;
            }
          }, 16);
        }
      } else {
        // Audio is already playing, fade from current volume to target
        setIsPlaying(true);
        fadeIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          audioRef.current.volume = startVolume + (targetVolume - startVolume) * progress;
          
          if (progress >= 1) {
            if (fadeIntervalRef.current) {
              clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
            }
            audioRef.current.volume = targetVolume;
          }
        }, 16); // ~60fps
      }
    } else {
      // Fade out: decrease volume then pause
      fadeIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        audioRef.current.volume = startVolume * (1 - progress);
        
        if (progress >= 1) {
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
          audioRef.current.volume = 0;
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }, 16); // ~60fps
    }
  }, []);

  // Initialize audio
  useEffect(() => {
    if (audioRef.current && !hasInitialized.current) {
      hasInitialized.current = true;
      audioRef.current.volume = 0;
      audioRef.current.loop = true;
      
      // If autoPlay is true (user has clicked envelope), play with fade in
      if (autoPlay) {
        hasAutoPlayed.current = true;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsMuted(false); // This will trigger the mute effect below
            })
            .catch((error) => {
              console.log("Audio play failed:", error);
              setIsMuted(true);
              setIsPlaying(false);
            });
        }
      }
    }
  }, [autoPlay]);

  // Handle mute state changes with fade effect
  useEffect(() => {
    if (!audioRef.current || !hasInitialized.current) return;
    
    // If this is the autoPlay initialization, fade in
    if (hasAutoPlayed.current && !isMuted) {
      hasAutoPlayed.current = false; // Only handle once
      fadeAudio(0.5, false, 800);
      return;
    }
    
    // Handle normal mute/unmute after initialization
    if (!hasAutoPlayed.current) {
      const targetVolume = 0.5;
      fadeAudio(targetVolume, isMuted, 500);
    }
  }, [isMuted, fadeAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      <audio ref={audioRef} src={audioSrc} preload="auto" />
      <div className="music-player-wrapper">
        <motion.button
          className={`music-player ${isPlaying && !isMuted ? 'music-player--playing' : ''}`}
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute music" : "Mute music"}
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: 1, 
            x: 0
          }}
          transition={{ 
            duration: 0.5, 
            delay: 1
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Ripple effect khi đang phát - positioned relative to button */}
          {isPlaying && !isMuted && (
            <>
              <motion.div
                className="music-player__ripple music-player__ripple--1"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{
                  scale: [1.1, 1.3, 1.5],
                  opacity: [0.6, 0.1, 0.4, 0.2, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              <motion.div
                className="music-player__ripple music-player__ripple--2"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{
                  scale: [1, 1.2, 1.4],
                  opacity: [0.6, 0.3, 0.5, 0.3, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5
                }}
              />
            </>
          )}
          {isMuted ? (
            <VolumeX size={24} className="music-player__icon" />
          ) : (
            <motion.div
              animate={isPlaying && !isMuted ? {
                scale: [1, 1, 1],
              } : {}}
              transition={{
                duration: 1.2,
                repeat: isPlaying && !isMuted ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <Volume2 size={24} className="music-player__icon" />
            </motion.div>
          )}
        </motion.button>
      </div>
    </>
  );
}


