import { FORMAT_OPTIONS } from "../../constants/formats";
import Accordion from "../ui/Accordion";
import ColorSelect from "../ui/ColorSelect";
import Input from "../ui/Input";
import ItemSelect from "../ui/ItemSelect";
import Select from "../ui/Select";
import Slider from "../ui/Slider";
import Upload from "../ui/Upload"

interface SideBarProps {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  format: string;
  setFormat: (format: string) => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  charSets: Record<string, string>;
  asciiSettings: {
    scale: number;
    spacing: number;
    charSet: string;
    customChar: string;
  };
  setAsciiSettings: React.Dispatch<React.SetStateAction<any>>;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    hueRotation: number;
    gamma: number;
  };
  setAdjustments: React.Dispatch<React.SetStateAction<any>>;
}

const SideBar = ({ uploadedFile, setUploadedFile, charSets, format, setFormat, bgColor, setBgColor, asciiSettings, setAsciiSettings, adjustments, setAdjustments }: SideBarProps) => {
  const charSetList = [...Object.keys(charSets), "CUSTOM"];

  return (
    <aside className="fixed top-0 left-0 h-screen w-85 text-text-grey flex flex-col border-r border-border bg-bg-light">
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
            min={1}
            max={20}
            defaultValue={4}
            onChange={(val) => setAsciiSettings({ ...asciiSettings, scale: val })}
          />
          <Slider
            label="Spacing"
            value={asciiSettings.spacing}
            min={-2}
            max={2}
            defaultValue={0}
            step={0.1}
            decimals={1}
            onChange={(val) => setAsciiSettings({ ...asciiSettings, spacing: val })}
          />
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
        </Accordion>
      </div>
    </aside>
  )
}

export default SideBar