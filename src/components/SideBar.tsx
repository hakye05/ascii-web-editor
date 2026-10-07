import { FORMAT_OPTIONS } from "../constants/formats";
import type { useEditorState } from "../hooks/useEditorState";
import Accordion from "./ui/Accordion";
import ButtonFull from "./ui/ButtonFull";
import ColorSelect from "./ui/ColorSelect";
import Input from "./ui/Input";
import ItemSelect from "./ui/ItemSelect";
import Select from "./ui/Select";
import Slider from "./ui/Slider";
import Upload from "./ui/Upload";

import { Link } from "react-router-dom";


type EditorStatesType = ReturnType<typeof useEditorState>;

interface SideBarProps {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  charSets: Record<string, string>;
  editor: EditorStatesType;
  onExport: () => void;
}

const SideBar = ({ uploadedFile, setUploadedFile, charSets, editor, onExport }: SideBarProps) => {
  const charSetList = [...Object.keys(charSets), "CUSTOM"];
  const {
    format, setFormat,
    bgColor, setBgColor,
    asciiSettings, setAsciiSettings,
    adjustments, setAdjustments
  } = editor;


  return (
    <aside className="h-full w-85 text-text-grey flex flex-col border-r border-border bg-bg-light shrink-0">
      <div className="h-11 border-b border-border flex items-center px-4 text-text-light">
        <h1 className="text-l">ASCII</h1>
      </div>

      <div className="flex-1 space-y-2 pt-2.5 overflow-y-auto custom-scrollbar">
        <Accordion title="Input File" defaultOpen={true}>
          <Upload file={uploadedFile} onFileSelect={setUploadedFile} />
        </Accordion>

        <Accordion title="ASCII Settings" defaultOpen={true}>
          <Slider
            label="Scale"
            value={asciiSettings.scale}
            min={0.1}
            max={2}
            defaultValue={1}
            step={0.1}
            decimals={1}
            onChange={(val) => setAsciiSettings({ ...asciiSettings, scale: val })}
          />
          {/* <Slider
            label="Spacing"
            value={asciiSettings.spacing}
            min={-10}
            max={10}
            defaultValue={0}
            step={0.1}
            decimals={1}
            onChange={(val) => setAsciiSettings({ ...asciiSettings, spacing: val })}
          /> */}
          <Select
            label="Character Set"
            value={asciiSettings.charSet}
            options={charSetList}
            onChange={(val) => setAsciiSettings({ ...asciiSettings, charSet: val })}
          />
          {asciiSettings.charSet === "CUSTOM" && (
            <Input
              label="Custom Chars"
              value={asciiSettings.customChar}
              placeholder="Enter characters..."
              onChange={(val) => setAsciiSettings({ ...asciiSettings, customChar: val })}
            />
          )}
        </Accordion>

        <Accordion title="Adjustments" defaultOpen={true}>
          <Slider
            label="Brightness"
            value={adjustments.brightness}
            min={-100}
            max={100}
            defaultValue={0}
            onChange={(val) => setAdjustments({ ...adjustments, brightness: val })}
          />
          <Slider
            label="Contrast"
            value={adjustments.contrast}
            min={-100}
            max={100}
            defaultValue={0}
            onChange={(val) => setAdjustments({ ...adjustments, contrast: val })}
          />
          <Slider
            label="Saturation"
            value={adjustments.saturation}
            min={-100}
            max={100}
            defaultValue={0}
            onChange={(val) => setAdjustments({ ...adjustments, saturation: val })}
          />
          <Slider
            label="Hue"
            value={adjustments.hueRotation}
            min={0}
            max={360}
            defaultValue={0}
            unit="°"
            onChange={(val) => setAdjustments({ ...adjustments, hueRotation: val })}
          />
          <Slider
            label="Gamma"
            value={adjustments.gamma}
            min={0.1}
            max={3}
            defaultValue={1}
            step={0.1}
            decimals={1}
            onChange={(val) => setAdjustments({ ...adjustments, gamma: val })}
          />
          <ColorSelect
            label="Background"
            value={bgColor}
            onChange={setBgColor}
          />
        </Accordion>

        <Accordion title="Export" defaultOpen={true}>
          <ItemSelect
            label="Format"
            value={format}
            options={FORMAT_OPTIONS}
            onChange={setFormat}
          />
          <ButtonFull onClick={onExport} disabled={!uploadedFile}>
            Export {format.toUpperCase()}
          </ButtonFull>
        </Accordion>
      </div>

      {/* Footer Section */}
      <div className="pt-2 pb-2 px-4 text-xs text-text-grey border-t border-border flex items-center justify-start">
        <Link to="/about" className="px-2 hover:text-text-light transition-colors py-1 flex items-center gap-1">
          <span>About</span>
        </Link>

        <a href="https://github.com/hakye05" target="_blank" rel="noreferrer" className="px-2 hover:text-text-light transition-colors py-1 flex items-center gap-1">
          <span>GitHub</span>
        </a>
      </div>
    </aside>
  )
}

export default SideBar