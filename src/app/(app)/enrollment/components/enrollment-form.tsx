
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, UserPlus, Camera, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import React, { useState, useRef, useEffect } from 'react';
import QRCode from "react-qr-code";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFirestore } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";


const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(1, "Phone number is required."),
  address: z.string().min(1, "Address is required."),
  dob: z.date({
    required_error: "A date of birth is required.",
  }),
  gender: z.string().min(1, "Gender is required."),
  nationality: z.string().min(1, "Nationality is required."),
  governmentId: z.string().min(1, "Government ID is required."),
  memberType: z.enum(['Regular', 'VIP', 'Staff', 'Blacklist', 'Bronze', 'Silver', 'Gold', 'Platinum']),
  expiryDate: z.date({
    required_error: "An expiry date is required.",
  }),
  photo: z.string().optional(),
});

export function EnrollmentForm() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firestore = useFirestore();
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [newMember, setNewMember] = useState<{id: string, name: string} | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      gender: "",
      nationality: "",
      governmentId: "",
      memberType: 'Regular',
      photo: "",
    },
  });
  
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const finalValues = { ...values, photo, joinDate: new Date().toISOString(), tier: values.memberType, points: 0 };
    
    if (firestore) {
      const membersCollection = collection(firestore, 'memberships');
      const docRef = await addDocumentNonBlocking(membersCollection, finalValues);
      if (docRef) {
        setNewMember({ id: docRef.id, name: values.fullName });
        setEnrollmentSuccess(true);
        toast({
          title: "Enrollment Successful",
          description: `${values.fullName} has been enrolled as a new member.`,
        });
        form.reset();
        setPhoto(null);
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
        form.setValue('photo', e.target?.result as string);
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
  
  const profileUrl = newMember ? `${window.location.origin}/members/${newMember.id}` : '';


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">New Member Enrollment</CardTitle>
          <CardDescription>Fill out the form below to add a new member to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4 md:col-span-1">
                  <FormField
                    control={form.control}
                    name="photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member Photo</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center gap-4">
                            <Avatar className="w-40 h-40 border">
                              <AvatarImage src={photo || ''} alt="Member photo" />
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
                                      <Button type="button" className="flex-1" onClick={() => document.getElementById('photo-upload')?.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload
                                      </Button>
                                      <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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
                </div>

                <div className="space-y-4 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          name="gender"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. American" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="governmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Government ID / Passport / License</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                              <Input placeholder="member@example.com" {...field} />
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                              <Input type="tel" placeholder="(123) 456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>

              <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                          <Textarea placeholder="123 Casino Ave, Las Vegas, NV 89109" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormItem>
                      <FormLabel>Registration Date</FormLabel>
                      <Input value={format(new Date(), "PPP")} disabled />
                      <FormDescription>Auto-generated</FormDescription>
                  </FormItem>
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
                                  captionLayout="dropdown-buttons"
                                  fromYear={new Date().getFullYear()}
                                  toYear={new Date().getFullYear() + 10}
                              />
                              </PopoverContent>
                          </Popover>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="memberType"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Member Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select member type" />
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
              </div>
              
              <p className="text-sm text-muted-foreground pt-4">A unique Membership ID with a barcode/QR code will be generated upon successful enrollment.</p>

              <Button type="submit">
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll Member
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Dialog open={enrollmentSuccess} onOpenChange={setEnrollmentSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enrollment Successful!</DialogTitle>
            <DialogDescription>
              {newMember?.name} has been added to the system.
            </DialogDescription>
          </DialogHeader>
          {newMember && (
            <div className="flex flex-col items-center justify-center p-4 space-y-4">
              <p className="font-mono text-center text-lg bg-muted p-2 rounded-md">{newMember.id}</p>
              <div className="bg-white p-4 rounded-md">
                <QRCode value={profileUrl} size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center">This QR code links to the member's new profile page.</p>
            </div>
          )}
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="secondary" onClick={() => setEnrollmentSuccess(false)}>Close</Button>
            {newMember && (
                <Button asChild>
                    <Link href={`/members/${newMember.id}`}>View Profile</Link>
                </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
