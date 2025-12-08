
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/context/settings-context';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';

const settingsSchema = z.object({
  casinoName: z.string().min(1, "Casino name is required"),
  logoUrl: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm() {
  const { settings, setSettings } = useSettings();
  const [previewLogo, setPreviewLogo] = React.useState<string | null>(settings.logoUrl);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      casinoName: settings.casinoName,
      logoUrl: settings.logoUrl,
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewLogo(dataUrl);
        form.setValue('logoUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: SettingsFormValues) => {
    setSettings({
        ...data,
        logoUrl: previewLogo || '',
    });
    toast({
      title: "Settings Saved",
      description: "Your casino settings have been updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Casino Customization</CardTitle>
        <CardDescription>Update the casino name and logo displayed on membership cards.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="casinoName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Casino Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Casino Logo</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={previewLogo || ''} alt="Casino Logo" />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <Button type="button" onClick={() => document.getElementById('logo-upload')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
               <FormMessage />
            </FormItem>
            <Button type="submit">Save Settings</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
