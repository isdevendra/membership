
'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/icons';
import { type Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import Image from 'next/image';
import { Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface MembershipCardProps {
  member: Member;
}

const toDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue.toDate) { // Firestore Timestamp
      return dateValue.toDate();
    }
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
     if (dateValue instanceof Date) {
        return dateValue;
    }
    return null;
};

function ShareDialog({ member, profileUrl }: { member: Member, profileUrl: string }) {
    const qrCodeRef = React.useRef<HTMLDivElement>(null);

    const getQrCodeAsBlob = async (): Promise<Blob | null> => {
        const svgElement = qrCodeRef.current?.querySelector('svg');
        if (!svgElement) return null;

        const svgText = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;

        const img = document.createElement('img');
        await new Promise<void>(resolve => {
            img.onload = () => resolve();
            img.src = `data:image/svg+xml;base64,${btoa(svgText)}`;
        });
        
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        
        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/png');
        });
    }

    const handleDownload = async () => {
        const blob = await getQrCodeAsBlob();
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${member.fullName.replace(/\s+/g, '_')}_QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleShare = async () => {
        const blob = await getQrCodeAsBlob();
        if (!blob) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate QR code for sharing.' });
            return;
        }

        const file = new File([blob], `${member.fullName.replace(/\s+/g, '_')}_QR.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Membership QR Code',
                    text: `Here is the membership QR code for ${member.fullName}.`,
                });
            } catch (error) {
                // This can happen if the user cancels the share dialog
                console.info('Share action was cancelled or failed.', error);
            }
        } else {
            toast({
                title: "Sharing Not Supported",
                description: "Your browser doesn't support sharing files directly. Please download the QR code instead.",
            });
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" className="w-full">
                    <Share2 className="mr-2 h-4 w-4" /> Share Card
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share Membership QR Code</DialogTitle>
                    <DialogDescription>
                        Share or download the QR code for {member.fullName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center p-4">
                     <div ref={qrCodeRef} className="bg-white p-4 rounded-lg border">
                        <QRCode value={profileUrl} size={256} />
                    </div>
                </div>
                <DialogFooter className="sm:justify-center flex-col sm:flex-col sm:space-x-0 gap-2">
                    <Button onClick={handleDownload}>Download QR</Button>
                    {navigator.share && <Button onClick={handleShare} variant="outline">Share</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function MembershipCard({ member }: MembershipCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/members/${member.id}` : '';

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow && cardRef.current) {
        printWindow.document.write('<html><head><title>Print Membership Card</title>');

        // Link all stylesheets from the parent document to the new window
        Array.from(document.styleSheets).forEach(styleSheet => {
            if (styleSheet.href) {
                const link = printWindow.document.createElement('link');
                link.rel = 'stylesheet';
                link.href = styleSheet.href;
                printWindow.document.head.appendChild(link);
            }
        });
        
        // Inject inline styles for any dynamic styling not in external sheets
        const inlineStyles = Array.from(document.querySelectorAll('style'))
            .map(style => style.innerHTML)
            .join('');
        const styleElement = printWindow.document.createElement('style');
        styleElement.innerHTML = inlineStyles;
        
        // Add specific print styles to enforce size
        styleElement.innerHTML += `
            @media print {
                @page {
                    size: auto;
                    margin: 0;
                }
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    margin: 0;
                    padding: 0;
                }
                .no-print {
                    display: none !important;
                }
                #printable-card {
                    width: 3.375in !important;
                    height: 2.125in !important;
                    margin: 0;
                    padding: 0;
                    transform: scale(1) !important;
                    box-shadow: none !important;
                    border: none !important;
                    page-break-inside: avoid;
                }
            }
        `;
        printWindow.document.head.appendChild(styleElement);
        
        printWindow.document.write('</head><body>');

        const printableCard = cardRef.current.cloneNode(true) as HTMLDivElement;
        printableCard.id = "printable-card";
        
        printWindow.document.body.innerHTML = printableCard.outerHTML;
        
        // Use a timeout to ensure all styles and images are loaded before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1000);
    }
  };

  const expiryDate = toDate(member.expiryDate);
  const joinDate = toDate(member.joinDate);

  return (
    <div>
        <div ref={cardRef} className={cn(
            "aspect-[85.6/54] w-full max-w-sm rounded-xl p-4 flex flex-col justify-between text-white",
            "bg-gradient-to-br from-primary via-primary/80 to-black shadow-2xl"
        )}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {settings.logoUrl ? (
                        <Image src={settings.logoUrl} alt={settings.casinoName} width={32} height={32} className="rounded-sm"/>
                    ) : (
                        <Logo className="size-8" />
                    )}
                    <span className="text-lg font-bold font-headline">{settings.casinoName}</span>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg leading-tight">{member.tier}</p>
                    <p className="text-xs uppercase tracking-widest">Member</p>
                </div>
            </div>

            <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 border-2 border-white">
                    <AvatarImage src={member.photo} alt={member.fullName} />
                    <AvatarFallback className="text-3xl text-black">{member.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-mono text-xs opacity-80">Name</p>
                    <p className="font-semibold text-lg leading-tight">{member.fullName}</p>
                    <p className="font-mono text-xs opacity-80">{member.id}</p>
                </div>
                 {profileUrl && (
                    <div className="bg-white p-1 rounded-sm">
                        <QRCode value={profileUrl} size={48} />
                    </div>
                )}
            </div>

            <div className="flex justify-between items-end text-xs font-mono">
                <div>
                    <p>Member Since</p>
                    <p>{joinDate ? format(joinDate, "MM/yy") : 'N/A'}</p>
                </div>
                <div className="text-right">
                    <p>Expires</p>
                    <p>{expiryDate ? format(expiryDate, "MM/yy") : 'N/A'}</p>
                </div>
            </div>
        </div>
        <div className="flex flex-col items-center mt-4 space-y-2 no-print">
            <Button onClick={handlePrint} className="w-full">Print Card</Button>
            <ShareDialog member={member} profileUrl={profileUrl} />
        </div>
    </div>
  );
}
