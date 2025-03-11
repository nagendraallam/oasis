"use client";

import React, { useState } from 'react';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Predefined colors for quick selection
  const colorOptions = [
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ff8800', // Orange
    '#8800ff', // Purple
    '#ffffff', // White
  ];
  
  return (
    <div className="relative">
      {/* Color display and toggle */}
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="w-6 h-6 rounded border border-gray-300"
          style={{ backgroundColor: currentColor }}
        />
        <div className="text-white text-sm">{currentColor}</div>
      </div>
      
      {/* Color picker dropdown */}
      {isOpen && (
        <div className="absolute top-8 left-0 bg-gray-800 p-2 rounded shadow-lg z-50">
          {/* Color grid */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {colorOptions.map((color) => (
              <div
                key={color}
                className="w-6 h-6 rounded cursor-pointer border border-gray-600 hover:border-white"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onColorChange(color);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
          
          {/* Custom color input */}
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-8 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export default ColorPicker; 