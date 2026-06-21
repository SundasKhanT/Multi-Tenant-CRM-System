'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess: () => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(customer);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone ?? '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
    }
    setError('');
  }, [customer, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditing && customer) {
        await api.patch(`/customers/${customer.id}`, { name, email, phone });
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', { name, email, phone });
        toast.success('Customer created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Customer' : 'New Customer'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}