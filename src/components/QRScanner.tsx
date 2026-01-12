import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, XCircle } from 'lucide-react';

interface QRScannerProps {
    onScan: (result: string) => void;
    onError?: (error: string) => void;
}

export const QRScanner = ({ onScan, onError }: QRScannerProps) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const startScanning = async () => {
        if (!containerRef.current) return;

        try {
            setError(null);
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    onScan(decodedText);
                    stopScanning();
                },
                () => {
                    // QR not detected, ignore
                }
            );

            setIsScanning(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Camera access denied';
            setError(message);
            onError?.(message);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                // Ignore stop errors
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, []);

    return (
        <div className="space-y-4">
            <div
                id="qr-reader"
                ref={containerRef}
                className="w-full max-w-md mx-auto bg-secondary/20 rounded-lg overflow-hidden"
                style={{ minHeight: isScanning ? '300px' : '0' }}
            />

            {error && (
                <div className="text-center text-destructive font-mono text-sm p-4 bg-destructive/10 rounded">
                    {error}
                </div>
            )}

            <div className="flex justify-center gap-3">
                {!isScanning ? (
                    <button
                        onClick={startScanning}
                        className="flex items-center gap-2 bg-primary text-background px-6 py-3 font-display font-bold rounded hover:scale-105 transition-transform"
                    >
                        <Camera className="w-5 h-5" />
                        Start Camera
                    </button>
                ) : (
                    <button
                        onClick={stopScanning}
                        className="flex items-center gap-2 bg-destructive text-white px-6 py-3 font-display font-bold rounded hover:scale-105 transition-transform"
                    >
                        <XCircle className="w-5 h-5" />
                        Stop Camera
                    </button>
                )}
            </div>

            {!isScanning && !error && (
                <p className="text-center text-muted-foreground font-mono text-sm">
                    Click "Start Camera" to scan a participant's QR code
                </p>
            )}
        </div>
    );
};
