'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/intl';

export default function TeamPage() {
  const { push } = useToast();
  const members = trpc.team.list.useQuery();
  const invite = trpc.team.invite.useMutation({
    onSuccess: () => {
      push({ title: 'Invite sent' });
      members.refetch();
    },
    onError: (e) => push({ title: 'Invite failed', description: e.message, variant: 'destructive' }),
  });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'rep'>('member');

  return (
    <div className="container max-w-3xl space-y-8 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">Invite teammates. Assign territories. Manage roles.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Invite</CardTitle></CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_160px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate({ email, role });
              setEmail('');
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'rep')}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="rep">Sales rep</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={invite.isPending}>Send</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Name / Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.data?.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No members yet.</td></tr>
              )}
              {members.data?.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="p-3">
                    <p className="font-medium">{m.fullName ?? m.email}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </td>
                  <td className="p-3"><Badge variant="secondary">{m.role}</Badge></td>
                  <td className="p-3 text-xs">{m.acceptedAt ? formatDate(m.acceptedAt) : 'pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
