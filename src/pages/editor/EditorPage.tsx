import { useState } from "react"
import SideBar from "../../components/SideBar"
import { Preview } from "../../components/Preview";

import { useEditorState } from "../../hooks/useEditorState";
import { CHARSETS } from "../../constants/charsets";
import { useAsciiPipeline } from "../../hooks/useAsciiPipeline";

const EditorPage = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const editorStates = useEditorState();

  const { canvasRef, handleExport } = useAsciiPipeline({
    file: uploadedFile,
    charSets: CHARSETS,
    editor: editorStates,
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SideBar
        uploadedFile={uploadedFile}
        setUploadedFile={setUploadedFile}
        charSets={CHARSETS}
        editor={editorStates}
        onExport={handleExport}
      />
      <Preview
        file={uploadedFile}
        canvasRef={canvasRef}
      />
    </div>
  )
}

export default EditorPage