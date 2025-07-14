
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (photo: string) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        const startStream = async () => {
            if (isOpen && !stream && !photo) {
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                    alert("Could not access camera. Please check permissions.");
                    onClose();
                }
            }
        };
        startStream();

        // Cleanup on close
        return () => {
           if (!isOpen) {
               stopStream();
               setPhoto(null);
           }
        };
    }, [isOpen, stream, photo, onClose, stopStream]);

    const handleTakePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setPhoto(dataUrl);
                stopStream();
            }
        }
    };
    
    const handleRetake = () => {
        setPhoto(null);
    };

    const handleConfirm = () => {
        if (photo) {
            onCapture(photo);
        }
    };

    const handleClose = () => {
        stopStream();
        setPhoto(null);
        onClose();
    }


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
            <div className="relative bg-black w-full max-w-md aspect-video">
                {photo ? (
                    <img src={photo} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                )}
                 <button onClick={handleClose} className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 text-2xl leading-none">&times;</button>
            </div>
            <div className="mt-4 flex space-x-4">
                {photo ? (
                    <>
                        <button onClick={handleRetake} className="px-6 py-3 rounded-md bg-gray-300 font-semibold">Retake</button>
                        <button onClick={handleConfirm} className="px-6 py-3 rounded-md bg-wells-red text-white font-semibold">Use Photo</button>
                    </>
                ) : (
                    <button onClick={handleTakePhoto} className="px-8 py-4 rounded-full bg-white font-semibold">Take Photo</button>
                )}
            </div>
        </div>
    );
};

export default CameraCaptureModal;