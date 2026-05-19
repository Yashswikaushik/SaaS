'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toaster';

interface ProfileForm {
  fullName?: string;
  locale?: 'en-IN' | 'hi-IN' | 'ta-IN' | 'te-IN' | 'mr-IN' | 'bn-IN' | 'kn-IN';
}

export default function SettingsPage() {
  const { push } = useToast();
  const me = trpc.auth.me.useQuery();
  const update = trpc.auth.updateProfile.useMutation({
    onSuccess: () => push({ title: 'Profile updated' }),
    onError: (e) => push({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });
  const { register, handleSubmit } = useForm<ProfileForm>({
    values: { fullName: me.data?.fullName ?? '', locale: (me.data?.locale as ProfileForm['locale']) ?? 'en-IN' },
  });

  return (
    <div className="container max-w-2xl space-y-8 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How we address you and which language you read in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...register('fullName')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="locale">Locale</Label>
              <select
                id="locale"
                {...register('locale')}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">हिन्दी</option>
                <option value="ta-IN">தமிழ்</option>
                <option value="te-IN">తెలుగు</option>
                <option value="mr-IN">मराठी</option>
                <option value="bn-IN">বাংলা</option>
                <option value="kn-IN">ಕನ್ನಡ</option>
              </select>
            </div>
            <Button type="submit" loading={update.isPending}>Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
