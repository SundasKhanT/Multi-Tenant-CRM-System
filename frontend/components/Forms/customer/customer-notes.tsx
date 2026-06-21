'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Customer } from '@/types/customer';
import { Note } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function CustomerNotesDialog({
  open,
  onOpenChange,
  customer,
}: CustomerNotesDialogProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && customer) {
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer]);

  async function fetchNotes() {
    if (!customer) return;
    setLoading(true);
    try {
      const res = await api.get<Note[]>(`/customers/${customer.id}/notes`);
      setNotes(res);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !content.trim()) return;
    setSubmitting(true);

    try {
      await api.post(`/customers/${customer.id}/notes`, { content });
      toast.success('Note added successfully');
      setContent('');
      fetchNotes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add note';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notes for {customer?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddNote} className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <Button type="submit" disabled={submitting || !content.trim()}>
            {submitting ? 'Adding...' : 'Add Note'}
          </Button>
        </form>

        <div className="mt-4 space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-md border p-3 text-sm">
                <p>{note.content}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {note.createdBy?.name ?? 'Unknown'} ·{' '}
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}