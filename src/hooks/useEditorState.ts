import { useState } from 'react';

export const useEditorState = () => {
  const [format, setFormat] = useState("png");
  const [bgColor, setBgColor] = useState("#0A0A0A");

  const [asciiSettings, setAsciiSettings] = useState({
    scale: 2,
    spacing: -2,
    charSet: "STANDARD",
    customChar: " .:-=+*#%@"
  });

  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hueRotation: 0,
    gamma: 1.0
  });

  const [postProcess, setPostProcess] = useState({
    bloom: false,
    grain: false,
    chromatic: false,
    vignette: false,
    crt: false
  });

  return {
    format, setFormat,
    bgColor, setBgColor,
    asciiSettings, setAsciiSettings,
    adjustments, setAdjustments,
    postProcess, setPostProcess,
  };
};