-- Add missing DELETE RLS policies for series and bets

create policy "Users can delete their own series"
  on public.series for delete
  using (auth.uid() = user_id);

create policy "Users can delete bets of their own series"
  on public.bets for delete
  using (
    exists (
      select 1 from public.series
      where series.id = bets.series_id
        and series.user_id = auth.uid()
    )
  );
