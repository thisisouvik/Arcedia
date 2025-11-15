'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Share2, Copy, Check } from 'lucide-react';

interface QRCodeModalProps {
    open: boolean;
    onClose: () => void;
    tokenId: string;
    credentialType?: string;
}

export default function QRCodeModal({ open, onClose, tokenId, credentialType }: QRCodeModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [copied, setCopied] = useState(false);
    const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?token=${tokenId}`;

    useEffect(() => {
        if (open && canvasRef.current && tokenId) {
            // Generate QR code
            QRCode.toCanvas(
                canvasRef.current,
                verificationUrl,
                {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#0F766E', // Teal color
                        light: '#FFFFFF',
                    },
                },
                (error) => {
                    if (error) console.error('Error generating QR code:', error);
                }
            );
        }
    }, [open, tokenId, verificationUrl]);

    const handleDownload = () => {
        if (!canvasRef.current) return;

        // Convert canvas to image and download
        canvasRef.current.toBlob((blob) => {
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `credential-${tokenId}-qr.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(verificationUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Verify My ${credentialType || 'Credential'}`,
                    text: 'Scan this QR code or visit the link to verify my credential',
                    url: verificationUrl,
                });
            } catch (err) {
                console.log('Share canceled or failed:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Your Credential</DialogTitle>
                    <DialogDescription>
                        Share this QR code or link to allow others to verify your credential on the blockchain
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* QR Code */}
                    <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-gray-200">
                        <canvas ref={canvasRef} />
                    </div>

                    {/* Verification Link */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Verification Link</label>
                        <div className="flex space-x-2">
                            <Input
                                value={verificationUrl}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="border-teal-600 text-teal-600 hover:bg-teal-50"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download QR
                        </Button>
                        <Button
                            onClick={handleShare}
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                    </div>

                    {/* Instructions */}
                    <div className="bg-teal-50 p-4 rounded-lg">
                        <p className="text-sm text-teal-900">
                            <strong>How to use:</strong>
                        </p>
                        <ul className="text-sm text-teal-800 mt-2 space-y-1 list-disc list-inside">
                            <li>Share the QR code for quick mobile scanning</li>
                            <li>Copy the link to share via email or messaging</li>
                            <li>Anyone can verify your credential without creating an account</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
