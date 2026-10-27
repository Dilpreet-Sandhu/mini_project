import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deadline, isOverdue } from '../src/lib/format.ts';

test('closed requests never show as overdue, even when their deadline has passed', () => {
  const past = new Date(Date.now() - 3600000).toISOString();
  assert.equal(isOverdue({ status: 'pending', due_at: past }), true);
  assert.equal(isOverdue({ status: 'in_progress', due_at: past }), true);
  assert.equal(isOverdue({ status: 'resolved', due_at: past }), false);
  assert.equal(isOverdue({ status: 'cancelled', due_at: past }), false);
});
test('resolution exactly at deadline is on time; a later fix is late', () => {
  const due = '2026-01-02T12:00:00Z';
  assert.equal(deadline({ status: 'resolved', due_at: due, resolved_at: due }), 'Fixed on time');
  assert.equal(
    deadline({ status: 'resolved', due_at: due, resolved_at: '2026-01-02T12:00:01Z' }),
    'Fixed after target',
  );
});
test('future deadlines are active; cancellation closes the target label', () => {
  const future = new Date(Date.now() + 7200000).toISOString();
  assert.equal(isOverdue({ status: 'pending', due_at: future }), false);
  assert.match(deadline({ status: 'pending', due_at: future }), /^Target: /);
  assert.equal(deadline({ status: 'cancelled', due_at: future }), 'Closed by student');
});
