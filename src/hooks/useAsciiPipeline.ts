import { useEffect, useRef, useState } from "react";
import { AsciiPipelineManager, exportImage } from "../utils/asciiPipelineManager";
import { useEditorState } from "../hooks/useEditorState";

interface UseAsciiPipelineProps {
    file: File | null;
    charSets: Record<string, string>;
    editor: ReturnType<typeof useEditorState>;
}

export function useAsciiPipeline({ file, charSets, editor }: UseAsciiPipelineProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const managerRef = useRef<AsciiPipelineManager | null>(null);
    const [isReady, setIsReady] = useState(false);

    // References to manage frame scheduling without cancellation loops
    const isScheduledRef = useRef(false);
    const animFrameId = useRef<number | null>(null);

    // Keep a ref to the latest values so rAF always reads current state without re-registering
    const latestStateRef = useRef({ editor, charSets, file, isReady });
    useEffect(() => {
        latestStateRef.current = { editor, charSets, file, isReady };
    });

    // Render scheduler: Throttle to max 1 render per animation frame
    const scheduleRender = () => {
        const { file, isReady } = latestStateRef.current;
        if (!file || !managerRef.current || !isReady) return;

        // If a frame is already scheduled, don't schedule another.
        if (isScheduledRef.current) return;

        isScheduledRef.current = true;

        animFrameId.current = requestAnimationFrame(() => {
            isScheduledRef.current = false;

            const { editor, charSets } = latestStateRef.current;
            const activeCharSet =
                editor.asciiSettings.charSet === "CUSTOM"
                    ? editor.asciiSettings.customChar
                    : charSets[editor.asciiSettings.charSet] || charSets.STANDARD;

            managerRef.current?.renderFrame(
                activeCharSet,
                editor.asciiSettings.scale,
                editor.bgColor,
                editor.adjustments
            );
        });
    };

    // Initialize WebGPU Pipeline Manager
    useEffect(() => {
        if (!canvasRef.current) return;
        const manager = new AsciiPipelineManager();

        manager
            .init(canvasRef.current)
            .then(() => {
                managerRef.current = manager;
                setIsReady(true);
            })
            .catch((err) => {
                console.error("WebGPU Initialization Failed:", err);
            });
    }, []);

    // Handle File Loading & Source Texture Uploading
    useEffect(() => {
        if (!file || !managerRef.current || !isReady) return;

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;

        img.onload = () => {
            managerRef.current?.setSourceImage(img);
            URL.revokeObjectURL(url);

            // Trigger immediate render on initial image load
            scheduleRender();
        };
    }, [file, isReady]);

    // Schedule a frame whenever slider changes
    useEffect(() => {
        scheduleRender();
    }, [editor.adjustments, editor.asciiSettings, editor.bgColor, charSets]);

    // Clean up animation frame on unmount
    useEffect(() => {
        return () => {
            if (animFrameId.current !== null) {
                cancelAnimationFrame(animFrameId.current);
            }
            managerRef.current?.destroy();
        };
    }, []);

    // Export Handler Method
    const handleExport = async () => {
        if (!canvasRef.current || !managerRef.current) return;

        const format = editor.format.replace(/^\./, "").toLowerCase();

        if (format === "png" || format === "jpg") {
            // Render a fresh frame and capture blob
            scheduleRender();
            requestAnimationFrame(async () => {
                if (canvasRef.current) {
                    await exportImage(canvasRef.current, format);
                }
            });
        } else if (format === "txt") {
            const activeCharSet =
                editor.asciiSettings.charSet === "CUSTOM"
                    ? editor.asciiSettings.customChar
                    : charSets[editor.asciiSettings.charSet] || charSets.STANDARD;

            const textData = await managerRef.current.exportAsText(activeCharSet);
            if (!textData) return;

            const blob = new Blob([textData], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = "ascii-art.txt";
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    return { canvasRef, isReady, handleExport };
}