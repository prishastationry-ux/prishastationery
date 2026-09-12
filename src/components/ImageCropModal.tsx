import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Crop, RefreshCw } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  title?: string;
  aspectPreset?: 'square' | 'banner' | 'standard' | 'free';
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
}

export function ImageCropModal({
  imageSrc,
  title = 'ફોટો ક્રોપ અને ઝૂમ કરો (Photo Crop & Zoom)',
  aspectPreset = 'square',
  onCropComplete,
  onClose
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Crop & Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedAspect, setSelectedAspect] = useState<'square' | 'banner' | 'standard' | 'free'>(aspectPreset);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setRotation(0);
      setPanOffset({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Target aspect ratio
  const getAspectDimensions = useCallback(() => {
    switch (selectedAspect) {
      case 'square':
        return { width: 500, height: 500 };
      case 'banner':
        return { width: 900, height: 350 };
      case 'standard':
        return { width: 600, height: 450 };
      case 'free':
      default:
        return { width: 600, height: 500 };
    }
  }, [selectedAspect]);

  // Render on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: targetW, height: targetH } = getAspectDimensions();
    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.save();

    // Fill clean white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    // Center transform
    ctx.translate(targetW / 2 + panOffset.x, targetH / 2 + panOffset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate base draw dimensions to cover or fit
    const imgAspect = imgElement.width / imgElement.height;
    const targetAspect = targetW / targetH;
    let drawW: number;
    let drawH: number;

    if (imgAspect > targetAspect) {
      drawH = targetH;
      drawW = targetH * imgAspect;
    } else {
      drawW = targetW;
      drawH = targetW / imgAspect;
    }

    ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [imgElement, zoom, rotation, panOffset, getAspectDimensions]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse / Touch handlers for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Perform crop & return base64
  const handleSaveCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedDataUrl);
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-4 sm:p-5 max-w-xl w-full border-2 border-neutral-800 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-neutral-900">{title}</h3>
              <p className="text-[11px] text-neutral-500 font-bold">ફોટોને ઝૂમ, રોટેટ કે ડ્રેગ કરી સેટ કરો</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-black">
          <span className="text-neutral-500 text-[11px] shrink-0">સાઇઝ:</span>
          <button
            type="button"
            onClick={() => setSelectedAspect('square')}
            className={`px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
              selectedAspect === 'square'
                ? 'bg-orange-500 text-black border-orange-600'
                : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
            }`}
          >
            ૧:૧ ચોરસ (પ્રોડક્ટ / લોગો)
          </button>
          <button
            type="button"
            onClick={() => setSelectedAspect('banner')}
            className={`px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
              selectedAspect === 'banner'
                ? 'bg-orange-500 text-black border-orange-600'
                : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
            }`}
          >
            ૧૬:૯ લંબચોરસ (બેનર)
          </button>
          <button
            type="button"
            onClick={() => setSelectedAspect('standard')}
            className={`px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
              selectedAspect === 'standard'
                ? 'bg-orange-500 text-black border-orange-600'
                : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
            }`}
          >
            ૪:૩ સ્ટાન્ડર્ડ
          </button>
        </div>

        {/* Interactive Canvas Canvas Viewer */}
        <div
          className="relative w-full h-72 sm:h-80 bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-neutral-400 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain shadow-lg pointer-events-none rounded-lg"
          />

          {/* Helper Hint */}
          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs pointer-events-none">
            🖱️ ફોટો ખસેડવા માટે ડ્રેગ કરો
          </div>
        </div>

        {/* Zoom & Rotate Controls */}
        <div className="space-y-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-neutral-500 shrink-0" />
            <span className="font-bold text-neutral-700 w-12 text-[11px]">ઝૂમ: {Math.round(zoom * 100)}%</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-orange-500 cursor-pointer h-2 bg-neutral-200 rounded-lg"
            />
            <ZoomIn className="w-4 h-4 text-neutral-500 shrink-0" />
          </div>

          {/* Quick Buttons: Rotate, Reset */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="bg-white hover:bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-700" />
                <span>ફેરવો (+૯૦°)</span>
              </button>

              <button
                type="button"
                onClick={resetTransform}
                className="bg-white hover:bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-600" />
                <span>રીસેટ</span>
              </button>
            </div>

            <span className="text-[10px] text-neutral-500 font-semibold hidden sm:inline">
              HD ક્વોલિટી ક્રોપ
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
          >
            રદ કરો (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            className="bg-orange-500 hover:bg-orange-600 text-black px-5 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
          >
            <Check className="w-4 h-4 text-black" />
            <span>ક્રોપ અને ફોટો સેવ કરો (Crop & Apply)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
