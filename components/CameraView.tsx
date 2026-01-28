
import React, { useEffect, useRef } from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isObserving: boolean;
  onMotionDetected?: (intensity: number) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ videoRef, isObserving, onMotionDetected }) => {
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera Error:", err);
      }
    };

    if (isObserving) {
      startCamera();
    } else if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isObserving, videoRef]);

  // Motion detection loop
  useEffect(() => {
    if (!isObserving || !onMotionDetected) return;

    if (!motionCanvasRef.current) {
      motionCanvasRef.current = document.createElement('canvas');
      motionCanvasRef.current.width = 48; // Low res for performance
      motionCanvasRef.current.height = 48;
    }

    const detectMotion = () => {
      const video = videoRef.current;
      const canvas = motionCanvasRef.current;
      if (!video || !canvas || video.paused || video.ended) {
        requestRef.current = requestAnimationFrame(detectMotion);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      if (prevFrameRef.current) {
        let diff = 0;
        for (let i = 0; i < currentFrame.length; i += 4) {
          // Compare luminance (simple diff)
          const rDiff = Math.abs(currentFrame[i] - prevFrameRef.current[i]);
          const gDiff = Math.abs(currentFrame[i + 1] - prevFrameRef.current[i + 1]);
          const bDiff = Math.abs(currentFrame[i + 2] - prevFrameRef.current[i + 2]);
          if (rDiff + gDiff + bDiff > 80) {
            diff++;
          }
        }
        
        const motionIntensity = diff / (canvas.width * canvas.height);
        onMotionDetected(motionIntensity);
      }

      prevFrameRef.current = currentFrame;
      requestRef.current = requestAnimationFrame(detectMotion);
    };

    requestRef.current = requestAnimationFrame(detectMotion);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isObserving, onMotionDetected, videoRef]);

  return (
    <div className="w-full h-full relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-all duration-1000 ${isObserving ? 'opacity-100 blur-0 grayscale-0' : 'opacity-30 blur-xl grayscale'}`}
      />
      {isObserving && <div className="scanline" />}
    </div>
  );
};

export default CameraView;
