import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, RefreshCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Captura obrigatória da foto de rosto: câmera frontal do aparelho ou galeria.
 * Devolve a imagem como data URL.
 */
export function AvatarCapture({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError("Não conseguimos abrir a câmera. Escolha uma foto da galeria.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      size,
      size,
    );
    onChange(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Escolha uma foto de até 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium">Foto do rosto (obrigatória)</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Uma foto nítida do seu rosto dá confiança para as empresas aprovarem o seu cadastro.
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
          {cameraOn ? (
            <video ref={videoRef} playsInline muted className="size-full object-cover" />
          ) : value ? (
            <img src={value} alt="Sua foto de perfil" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Sem foto
            </span>
          )}
        </div>

        <div className="flex w-full flex-wrap gap-2">
          {cameraOn ? (
            <>
              <Button type="button" onClick={takePhoto}>
                <Camera className="size-4" /> Tirar foto
              </Button>
              <Button type="button" variant="outline" onClick={stopCamera}>
                <X className="size-4" /> Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={startCamera}>
                <Camera className="size-4" /> Tirar foto agora
              </Button>
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <ImageUp className="size-4" /> Escolher da galeria
              </Button>
              {value ? (
                <Button type="button" variant="ghost" onClick={() => onChange(null)}>
                  <RefreshCcw className="size-4" /> Trocar
                </Button>
              ) : null}
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={pickFile}
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
