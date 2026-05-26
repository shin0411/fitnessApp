-- ============================================================================
-- Storage Buckets
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('photo-analyses', 'photo-analyses', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('meal-photos', 'meal-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('share-cards', 'share-cards', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Storage RLS: Users can only access their own files (path prefix = user_id)
create policy "users_upload_own_photos" on storage.objects for insert
  with check (
    bucket_id in ('photo-analyses', 'meal-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users_read_own_photos" on storage.objects for select
  using (
    bucket_id in ('photo-analyses', 'meal-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users_delete_own_photos" on storage.objects for delete
  using (
    bucket_id in ('photo-analyses', 'meal-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "share_cards_public_read" on storage.objects for select
  using (bucket_id = 'share-cards');

create policy "users_upload_own_share_cards" on storage.objects for insert
  with check (
    bucket_id = 'share-cards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Triggers: Auto-create profile & 4-axis levels on signup
-- ============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_code text;
begin
  generated_code := upper(substring(md5(random()::text) from 1 for 8));

  insert into public.profiles (id, username, invite_code, theme, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substring(new.id::text from 1 for 8)),
    generated_code,
    'simple',
    false
  )
  on conflict (id) do nothing;

  insert into public.user_levels (user_id, level_type, level, total_xp, current_title) values
    (new.id, 'physical', 1, 0, '見習いトレーニー'),
    (new.id, 'beauty', 1, 0, '美容初心者'),
    (new.id, 'knowledge', 1, 0, '知識の芽生え'),
    (new.id, 'comprehensive', 1, 0, '成長の始まり')
  on conflict (user_id, level_type) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- Helper: Compute comprehensive XP from other 3 axes
-- ============================================================================

create or replace function recompute_comprehensive_xp(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  physical_xp bigint;
  beauty_xp bigint;
  knowledge_xp bigint;
  comp_xp bigint;
begin
  select coalesce(total_xp, 0) into physical_xp from user_levels where user_id = target_user_id and level_type = 'physical';
  select coalesce(total_xp, 0) into beauty_xp from user_levels where user_id = target_user_id and level_type = 'beauty';
  select coalesce(total_xp, 0) into knowledge_xp from user_levels where user_id = target_user_id and level_type = 'knowledge';

  comp_xp := (physical_xp * 0.4 + beauty_xp * 0.3 + knowledge_xp * 0.3)::bigint;

  update user_levels set total_xp = comp_xp, updated_at = now()
    where user_id = target_user_id and level_type = 'comprehensive';
end;
$$;
