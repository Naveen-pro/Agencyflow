'use client';
import { useEffect, useState } from 'react';

export default function WhatsAppQRModal({ onConnected }: { onConnected: () => void }) {
    const [qr, setQr] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('checking');
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const check = async () => {
            try {
                const resp = await fetch('/api/proxy/whatsapp/status');
                const data = await resp.json();

                if (data.connected) {
                    setConnected(true);
                    setStatus('connected');
                    onConnected();
                    return;
                }

                if (data.qr_available) {
                    const qrResp = await fetch('/api/proxy/whatsapp/qr');
                    const qrData = await qrResp.json();
                    setQr(qrData.qr);
                    setStatus('qr_ready');
                } else {
                    setStatus('initializing');
                }
            } catch (err) {
                console.error('Error checking WhatsApp status:', err);
                setStatus('error');
            }
        };

        check();
        const interval = setInterval(check, 8000);
        return () => clearInterval(interval);
    }, [onConnected]);

    if (connected) return (
        <div className="flex items-center gap-2 text-[#00C9B1] bg-[#00C9B1]/10 px-4 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#00C9B1] animate-pulse" />
            WhatsApp Connected
        </div>
    );

    return (
        <div className="bg-[#0F1117] border border-[#1E2433] rounded-xl p-6 text-center">
            <h3 className="font-syne font-bold text-white text-lg mb-2">
                📱 Connect Your WhatsApp
            </h3>
            <p className="text-[#8B93A8] text-sm mb-4">
                Open WhatsApp → ⋮ Menu → Linked Devices → Link a Device
            </p>

            {status === 'initializing' && (
                <div className="text-[#8B93A8] animate-pulse">Starting WhatsApp...</div>
            )}

            {status === 'qr_ready' && qr && (
                <img
                    src={qr}
                    alt="WhatsApp QR Code"
                    className="w-52 h-52 rounded-xl mx-auto border-4 border-white"
                />
            )}

            {status === 'error' && (
                <div className="text-red-500 text-sm">Connection failed. Retrying...</div>
            )}

            <p className="text-[#8B93A8] text-xs mt-3">
                QR refreshes automatically every 8 seconds
            </p>
        </div>
    );
}
