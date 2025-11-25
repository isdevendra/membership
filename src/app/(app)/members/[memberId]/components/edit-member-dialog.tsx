
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Pencil, Upload, Scan, Crop } from 'lucide-react';
import { type Member, MemberTier } from '@/lib/types';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// For now, we'll assume the current user is an Admin for demonstration purposes.
const currentUserRole = 'Admin';


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

const formSchema = z.object({
  id: z.string().min(1, "Membership ID is required."),
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(1, "Phone number is required."),
  address: z.string().min(1, "Address is required."),
  dob: z.date(),
  gender: z.string(),
  nationality: z.string(),
  governmentId: z.string(),
  tier: z.enum(['Regular', 'VIP', 'Staff', 'Blacklist', 'Bronze', 'Silver', 'Gold', 'Platinum']),
  expiryDate: z.date(),
  photo: z.string().optional(),
  idFront: z.string().optional(),
  idBack: z.string().optional(),
});

interface EditMemberDialogProps {
  member: Member;
  onUpdate: (updatedData: Partial<Member>) => void;
}

// Helper function to remove undefined properties from an object
const removeUndefined = (obj: any) => {
    const newObj: any = {};
    for (const key in obj) {
        if (obj[key] !== undefined) {
            newObj[key] = obj[key];
        }
    }
    return newObj;
};

export function EditMemberDialog({ member, onUpdate }: EditMemberDialogProps) {
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const [photo, setPhoto] = useState<string | null | undefined>(null);
  const [idFront, setIdFront] = useState<string | null | undefined>(null);
  const [idBack, setIdBack] = useState<string | null | undefined>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (member && isOpen) {
      form.reset({
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        address: member.address,
        dob: toDate(member.dob) || new Date(),
        gender: member.gender,
        nationality: member.nationality,
        governmentId: member.governmentId,
        tier: member.tier,
        expiryDate: toDate(member.expiryDate) || new Date(),
        photo: member.photo,
        idFront: member.idFront,
        idBack: member.idBack,
      });
      setPhoto(member.photo);
      setIdFront(member.idFront);
      setIdBack(member.idBack);
    }
  }, [member, isOpen, form]);

  useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
        }
      };
      getCameraPermission();
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [showCamera]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setter: (value: string | null) => void, fieldName: "photo" | "idFront" | "idBack") => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setter(result);
        form.setValue(fieldName, result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setPhoto(dataUrl);
        form.setValue('photo', dataUrl);
        setShowCamera(false);
      }
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore service not available.' });
      return;
    }

    if (values.id !== member.id) {
        // NOTE: Changing a document ID is a destructive operation that requires
        // creating a new document and deleting the old one, including migrating subcollections.
        // This should be handled by a secure backend Cloud Function.
        toast({
            title: "ID Change (Simulated)",
            description: `ID change from ${member.id} to ${values.id} requires a backend function. For now, only other fields will be updated.`,
        });
    }

    const memberDocRef = doc(firestore, 'memberships', member.id);
    
    // Create a clean object for the update, excluding the 'id'
    const { id, ...formValues } = values;
    const updatedData: Partial<Member> = {
      ...formValues,
      dob: Timestamp.fromDate(values.dob),
      expiryDate: Timestamp.fromDate(values.expiryDate),
      photo: photo || member.photo,
      idFront: idFront || member.idFront,
      idBack: idBack || member.idBack,
    };
    
    const cleanData = removeUndefined(updatedData);
    
    updateDocumentNonBlocking(memberDocRef, cleanData);

    onUpdate({ ...cleanData, id: member.id }); // Pass original ID back

    toast({
      title: 'Member Updated',
      description: `${values.fullName}'s details have been saved.`,
    });

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member Details</DialogTitle>
          <DialogDescription>
            Make changes to {member.fullName}'s profile. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
          <FormField
            control={form.control}
            name="photo"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Member Photo</FormLabel>
                <FormControl>
                    <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-auto h-40 border aspect-[3/4] object-cover">
                        <AvatarImage src={photo || undefined} alt="Member photo" />
                        <AvatarFallback className="text-3xl">?</AvatarFallback>
                    </Avatar>
                        {showCamera ? (
                            <div className="w-full space-y-2">
                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
                            {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access to use this feature.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="flex gap-2">
                                <Button type="button" onClick={takePicture} className="w-full" disabled={!hasCameraPermission}>Take Picture</Button>
                                <Button type="button" variant="outline" onClick={() => setShowCamera(false)}>Close Camera</Button>
                            </div>
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            </div>
                        ) : (
                            <div className="flex gap-2 w-full">
                                <Button type="button" className="flex-1" onClick={() => document.getElementById('photo-upload-edit')?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Upload
                                </Button>
                                <Input id="photo-upload-edit" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={(e) => handleFileChange(e, setPhoto, 'photo')} />
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCamera(true)}>
                                <Camera className="mr-2 h-4 w-4" /> Camera
                                </Button>
                            </div>
                        )}
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership ID</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={currentUserRole !== 'Admin'} />
                  </FormControl>
                   {currentUserRole !== 'Admin' && (
                        <p className="text-xs text-muted-foreground">Only Admins can edit the Membership ID.</p>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date of birth</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={new Date().getFullYear() - 100}
                            toYear={new Date().getFullYear()}
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select member tier" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Blacklist">Blacklist</SelectItem>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">ID Document</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="idFront"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ID Front Side</FormLabel>
                                <FormControl>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-full aspect-video border rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                            {idFront ? <Image src={idFront} alt="ID Front" width={200} height={126} className="object-contain"/> : <span className="text-muted-foreground text-sm">Preview</span>}
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <Button type="button" className="flex-1" onClick={() => document.getElementById('id-front-upload-edit')?.click()}>
                                                <Upload className="mr-2 h-4 w-4" /> Upload
                                            </Button>
                                            <Button type="button" variant="outline" className="flex-1" disabled>
                                                <Scan className="mr-2 h-4 w-4" /> Scan
                                            </Button>
                                        </div>
                                        <Button type="button" variant="secondary" className="w-full" disabled={!idFront}>
                                            <Crop className="mr-2 h-4 w-4" /> Crop Image
                                        </Button>
                                        <Input id="id-front-upload-edit" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={(e) => handleFileChange(e, setIdFront, 'idFront')} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="idBack"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ID Back Side</FormLabel>
                                <FormControl>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-full aspect-video border rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                            {idBack ? <Image src={idBack} alt="ID Back" width={200} height={126} className="object-contain" /> : <span className="text-muted-foreground text-sm">Preview</span>}
                                        </div>
                                        <div className="flex gap-2 w-full">
                                           <Button type="button" className="flex-1" onClick={() => document.getElementById('id-back-upload-edit')?.click()}>
                                               <Upload className="mr-2 h-4 w-4" /> Upload
                                           </Button>
                                           <Button type="button" variant="outline" className="flex-1" disabled>
                                                <Scan className="mr-2 h-4 w-4" /> Scan
                                            </Button>
                                        </div>
                                        <Button type="button" variant="secondary" className="w-full" disabled={!idBack}>
                                            <Crop className="mr-2 h-4 w-4" /> Crop Image
                                        </Button>
                                        <Input id="id-back-upload-edit" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={(e) => handleFileChange(e, setIdBack, 'idBack')} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    