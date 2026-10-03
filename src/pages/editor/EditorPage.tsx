import { useState } from "react"
import SideBar from "../../components/layout/SideBar"
import { Preview } from "../../components/Preview";

import { useEditorState } from "../../hooks/useEditorState";
import { CHARSETS } from "../../constants/charsets";

const EditorPage = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const editorStates = useEditorState();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SideBar
        uploadedFile={uploadedFile}
        setUploadedFile={setUploadedFile}
        charSets={CHARSETS}
        editor={editorStates}
      />
      <Preview
        file={uploadedFile}
        charSets={CHARSETS}
        editor={editorStates}
      />
    </div>
  )
}

export default EditorPage