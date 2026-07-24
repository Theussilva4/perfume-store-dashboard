import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (decodedText: string) => void;
}

export function BarcodeScannerModal({ open, onOpenChange, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let isStarted = false;

    if (open) {
      setCameraError("");
      
      const timer = setTimeout(() => {
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode("barcode-reader", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        });
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            if (isMounted) {
              // Pausa a câmera instantaneamente pra não ler 2x
              if (html5QrCode.getState() === 2) { // 2 = SCANNING
                html5QrCode.pause();
              }
              onScan(decodedText);
              onOpenChange(false);
            }
          },
          () => {
            // Ignora erros de leitura quadro a quadro
          }
        ).then(() => {
          isStarted = true;
        }).catch((err) => {
          if (isMounted) {
            setCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
            console.error(err);
          }
        });

      }, 150);

      // Limpeza segura ao fechar o modal
      return () => {
        isMounted = false;
        clearTimeout(timer);
        
        const stopCamera = async () => {
          if (scannerRef.current) {
            try {
              if (isStarted) {
                await scannerRef.current.stop();
              }
              scannerRef.current.clear();
            } catch (e) {
              console.warn("Erro no cleanup da câmera:", e);
            } finally {
              scannerRef.current = null;
            }
          }
        };

        stopCamera();
      };
    }
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Código de Barras</DialogTitle>
          <DialogDescription>Aponte a câmera traseira para o código de barras.</DialogDescription>
        </DialogHeader>
        
        {cameraError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mt-2">
            {cameraError}
          </div>
        )}
        
        <div id="barcode-reader" className="w-full mt-2 min-h-[300px] bg-black/5 rounded-md overflow-hidden flex flex-col items-center justify-center relative">
          {!cameraError && <span className="text-muted-foreground text-sm absolute z-0">Iniciando câmera...</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
