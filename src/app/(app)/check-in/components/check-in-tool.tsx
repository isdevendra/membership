
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, LogIn, LogOut, History, UserCheck, UserX, ScanLine } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, limit, orderBy } from 'firebase/firestore';
import { type Member, type CheckIn } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const toDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue.toDate) return dateValue.toDate(); // Firestore Timestamp
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return !isNaN(date.getTime()) ? date : null;
    }
    if (dateValue instanceof Date) return dateValue;
    return null;
};

export function CheckInTool() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedMemberId, setScannedMemberId] = useState<string | null>(null);
  const [searchedMember, setSearchedMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const memberSearchQuery = useMemoFirebase(() => {
    if (!firestore || !searchTerm || !searchedMember) return null;
    return query(collection(firestore, 'memberships'), where('fullName', '==', searchTerm), limit(1));
  }, [firestore, searchTerm, searchedMember]);

  const { data: foundMembers, isLoading: isLoadingMembers } = useCollection<Member>(memberSearchQuery);
  
  const scannedMemberDocRef = useMemoFirebase(() => {
    if (!firestore || !scannedMemberId) return null;
    return doc(firestore, 'memberships', scannedMemberId);
  }, [firestore, scannedMemberId]);

  const { data: scannedMember, isLoading: isLoadingScannedMember } = useDoc<Member>(scannedMemberDocRef);


  const checkInsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedMember) return null;
    return query(collection(firestore, 'memberships', selectedMember.id, 'checkins'), orderBy('checkInTime', 'desc'), limit(10));
  }, [firestore, selectedMember]);

  const { data: checkIns, isLoading: isLoadingCheckIns } = useCollection<CheckIn>(checkInsQuery);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchedMember(true);
      setScannedMemberId(null);
    }
  };

  useEffect(() => {
    if (isScannerOpen) {
      const qrCodeRegionId = "qr-code-scanner";
      scannerRef.current = new Html5Qrcode(qrCodeRegionId);
      const startScanner = async () => {
        try {
          await scannerRef.current?.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText, decodedResult) => {
              // On success
              handleQrCodeSuccess(decodedText);
              setIsScannerOpen(false); // Close dialog on successful scan
            },
            (errorMessage) => {
              // On error, we can ignore it for continuous scanning
            }
          );
        } catch (err) {
          console.error("QR Scanner Error:", err);
          toast({
              variant: 'destructive',
              title: "Scanner Error",
              description: "Could not start the camera. Please check permissions."
          });
        }
      };
      startScanner();
    } else {
        const stopScanner = async () => {
            if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
                try {
                    await scannerRef.current.stop();
                } catch (err) {
                    console.error("Error stopping scanner:", err);
                }
            }
        }
        stopScanner();
    }

    return () => {
        const stopScanner = async () => {
             if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
                try {
                    await scannerRef.current.stop();
                } catch(e) {
                    // Ignore errors on cleanup
                }
            }
        }
        stopScanner();
    };
  }, [isScannerOpen]);

  const handleQrCodeSuccess = (decodedText: string) => {
    try {
      // Assuming QR code contains the URL to the member's profile
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      const memberId = pathParts[pathParts.length - 1];

      if (memberId) {
        setScannedMemberId(memberId);
        setSearchTerm(''); // Clear manual search
      } else {
        throw new Error("No member ID found in QR code.");
      }
    } catch (error) {
      console.error("Error parsing QR code:", error);
      toast({
        variant: "destructive",
        title: "Invalid QR Code",
        description: "The scanned QR code does not contain a valid member profile link.",
      });
    }
  };


  React.useEffect(() => {
    if (searchedMember && !isLoadingMembers) {
      if (foundMembers && foundMembers.length > 0) {
        setSelectedMember(foundMembers[0]);
      } else {
        setSelectedMember(null);
        toast({
          variant: 'destructive',
          title: "Member not found",
          description: "No member found with that name. Please try again.",
        });
      }
      setSearchedMember(false);
    }
  }, [foundMembers, isLoadingMembers, searchedMember]);
  
  useEffect(() => {
    if (scannedMember && scannedMemberId) {
        setSelectedMember(scannedMember);
        handleCheckIn(scannedMember); // Automatically check in on scan
        setScannedMemberId(null); // Reset for next scan
    }
  }, [scannedMember, scannedMemberId]);

  const handleCheckIn = (memberToCheckIn: Member) => {
    if (!firestore || !memberToCheckIn || memberToCheckIn.status === 'Checked In') return;

    const memberDocRef = doc(firestore, 'memberships', memberToCheckIn.id);
    const checkinColRef = collection(firestore, 'memberships', memberToCheckIn.id, 'checkins');
    const newStatus = 'Checked In';
    
    updateDocumentNonBlocking(memberDocRef, { status: newStatus });
    addDocumentNonBlocking(checkinColRef, {
        memberId: memberToCheckIn.id,
        checkInTime: new Date().toISOString(),
    });

    setSelectedMember(prev => prev && prev.id === memberToCheckIn.id ? { ...prev, status: newStatus } : memberToCheckIn);
    toast({ title: 'Check-in Successful', description: `${memberToCheckIn.fullName} has been checked in.` });
  };
  
  const handleCheckOut = async () => {
    if (!firestore || !selectedMember || !checkIns || checkIns.length === 0) return;

    const memberDocRef = doc(firestore, 'memberships', selectedMember.id);
    const newStatus = 'Checked Out';
    
    // Find the latest check-in to update
    const latestCheckIn = checkIns.find(ci => !ci.checkOutTime);
    
    if (latestCheckIn) {
        const checkinDocRef = doc(firestore, 'memberships', selectedMember.id, 'checkins', latestCheckIn.id);
        updateDocumentNonBlocking(checkinDocRef, { checkOutTime: new Date().toISOString() });
    }

    updateDocumentNonBlocking(memberDocRef, { status: newStatus });

    setSelectedMember(prev => prev ? { ...prev, status: newStatus } : null);
    toast({ title: 'Check-out Successful', description: `${selectedMember.fullName} has been checked out.` });
  };

  const isLoading = isLoadingMembers || isLoadingScannedMember;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Member Search</CardTitle>
            <CardDescription>Find a member to check them in or out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by full name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? '...' : <Search className="h-4 w-4" />}
              </Button>
              <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <ScanLine className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Scan Member QR Code</DialogTitle>
                           <DialogDescription>
                            Position the member's QR code within the frame to automatically check them in.
                        </DialogDescription>
                      </DialogHeader>
                      <div id="qr-code-scanner" className="w-full rounded-md overflow-hidden aspect-square"></div>
                      <DialogFooter>
                          <Button variant="outline" onClick={() => setIsScannerOpen(false)}>Cancel</Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
            </div>
            {selectedMember && (
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border">
                      <AvatarImage src={selectedMember.photo} />
                      <AvatarFallback>{selectedMember.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle>{selectedMember.fullName}</CardTitle>
                      <CardDescription>{selectedMember.id}</CardDescription>
                      <Badge className="mt-2">{selectedMember.tier}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <span className="font-medium">Status</span>
                        <Badge variant={selectedMember.status === 'Checked In' ? 'default' : 'secondary'} className={selectedMember.status === 'Checked In' ? 'bg-green-500' : ''}>
                            {selectedMember.status === 'Checked In' ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                            {selectedMember.status || 'Checked Out'}
                        </Badge>
                   </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => handleCheckIn(selectedMember)} disabled={selectedMember.status === 'Checked In'}>
                      <LogIn className="mr-2 h-4 w-4" /> Check In
                    </Button>
                    <Button className="flex-1" variant="outline" onClick={handleCheckOut} disabled={selectedMember.status !== 'Checked In'}>
                      <LogOut className="mr-2 h-4 w-4" /> Check Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Recent Activity
            </CardTitle>
            <CardDescription>
              Check-in and check-out history for {selectedMember ? selectedMember.fullName : 'the selected member'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCheckIns && <TableRow><TableCell colSpan={3} className="text-center">Loading activity...</TableCell></TableRow>}
                {!isLoadingCheckIns && !selectedMember && <TableRow><TableCell colSpan={3} className="text-center">Search or scan for a member to see their activity.</TableCell></TableRow>}
                {!isLoadingCheckIns && selectedMember && checkIns?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No recent activity found.</TableCell></TableRow>}
                {!isLoadingCheckIns && checkIns?.map(activity => {
                    const checkInDate = toDate(activity.checkInTime);
                    const checkOutDate = toDate(activity.checkOutTime);
                    const events = [];
                    if (checkOutDate) {
                        events.push({ status: 'Checked Out', date: checkOutDate, key: `${activity.id}-out` });
                    }
                    if (checkInDate) {
                        events.push({ status: 'Checked In', date: checkInDate, key: `${activity.id}-in` });
                    }
                    return events.map(event => (
                         <TableRow key={event.key}>
                            <TableCell>
                                <Badge variant={event.status === 'Checked In' ? 'default' : 'secondary'} className={event.status === 'Checked In' ? 'bg-green-600 text-white' : ''}>
                                    {event.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDistanceToNow(event.date, { addSuffix: true })}</TableCell>
                            <TableCell>{format(event.date, 'PPP p')}</TableCell>
                        </TableRow>
                    ));
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
