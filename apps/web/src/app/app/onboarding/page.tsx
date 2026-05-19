'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toaster';
import { STATE_CODES } from '@bharat/gst';

interface OnboardingForm {
  fullName: string;
  orgName: string;
  billingStateCode: string;
  gstin?: string;
  legalName?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { push } = useToast();
  const { register, handleSubmit } = useForm<OnboardingForm>({
    defaultValues: { billingStateCode: '29' },
  });
  const updateProfile = trpc.auth.updateProfile.useMutation();
  const updateBilling = trpc.billing.updateBillingDetails.useMutation();

  const onSubmit = async (d: OnboardingForm) => {
    try {
      await updateProfile.mutateAsync({ fullName: d.fullName });
      await updateBilling.mutateAsync({
        billingStateCode: d.billingStateCode,
        legalName: d.legalName,
        gstin: d.gstin,
      });
      router.push('/app/map');
    } catch (err) {
      push({ title: 'Could not save', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="container max-w-xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Welcome! Quick setup</CardTitle>
          <CardDescription>Three details to make sure your invoices are correct.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Your name</Label>
              <Input id="fullName" required {...register('fullName', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orgName">Business name</Label>
              <Input id="orgName" required {...register('orgName', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legalName">Legal name (as on GSTIN, optional)</Label>
              <Input id="legalName" {...register('legalName')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN (optional)</Label>
              <Input id="gstin" placeholder="29AAAPL1234C1Z5" {...register('gstin')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">Billing state</Label>
              <select
                id="state"
                {...register('billingStateCode', { required: true })}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                {Object.entries(STATE_CODES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              className="w-full"
              loading={updateProfile.isPending || updateBilling.isPending}
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
