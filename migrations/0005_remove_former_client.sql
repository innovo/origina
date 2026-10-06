-- Removes every trace of the former single client from databases that already
-- ran an earlier version of 0003. Safe to run on any database (no-ops if clean).

insert into organizations (id, name, short_name, join_code, email_domains, admin_emails, created_by, created_at)
select 'legacy', 'Existing users', 'Existing', upper(substr(md5(random()::text), 1, 8)),
       '', '', created_by, created_at
from organizations where id = 'legacy-wccn'
on conflict (id) do nothing;

update profiles set org_id = 'legacy', campus = null where org_id = 'legacy-wccn';
update courses set org_id = 'legacy', campus = null where org_id = 'legacy-wccn';
update submissions set org_id = 'legacy' where org_id = 'legacy-wccn';
update audit_log set org_id = 'legacy' where org_id = 'legacy-wccn';
update api_clients set org_id = 'legacy' where org_id = 'legacy-wccn';
update corpus set org_id = 'legacy' where org_id = 'legacy-wccn';
update judgements set org_id = 'legacy' where org_id = 'legacy-wccn';
delete from organizations where id = 'legacy-wccn';

-- Old seeded demo courses of the former client.
update submissions set assignment_id = null
  where assignment_id in (select a.id from assignments a join courses c on c.id = a.course_id
                          where c.owner_user_id = 'institution');
delete from courses where owner_user_id = 'institution';

-- Shared sample library: neutral reference instead of the former client's site.
update corpus set source_ref = 'Clinical practice reading (sample)'
  where source_ref like '%wccn%';
