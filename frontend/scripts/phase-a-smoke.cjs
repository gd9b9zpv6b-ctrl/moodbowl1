#!/usr/bin/env node
/**
 * Free Phase A live smoke · uses demo accounts against Supabase.
 *
 *   cd frontend && yarn smoke:phase-a
 *
 * Needs frontend/.env with EXPO_PUBLIC_SUPABASE_URL + ANON_KEY.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / ANON_KEY in frontend/.env');
  process.exit(1);
}

const sb = createClient(url, key);
const PASSWORD = 'demo1234';

let fails = 0;
function mark(name, pass, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' · ' + detail : ''}`);
  if (!pass) fails += 1;
}

async function columnExists(table, col) {
  const { error } = await sb.from(table).select(col).limit(1);
  if (!error) return true;
  const msg = (error.message || '').toLowerCase();
  if (
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('schema cache') ||
    msg.includes('column')
  ) {
    return false;
  }
  return true;
}

async function main() {
  console.log('Phase A live smoke (free)\n');

  const roles = [
    ['student@demo.moodful.app', 'student'],
    ['student2@demo.moodful.app', 'student'],
    ['teacher@demo.moodful.app', 'teacher'],
    ['counsellor@demo.moodful.app', 'counsellor'],
    ['parent@demo.moodful.app', 'parent'],
    ['school@demo.moodful.app', 'school_admin'],
  ];

  for (const [email, role] of roles) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: PASSWORD });
    mark(`${role} login (${email})`, !error && !!data.user, error?.message);
    if (data?.user) {
      const { data: prof } = await sb
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      mark(`${role} profile.role`, prof?.role === role, `got=${prof?.role}`);
    }
    await sb.auth.signOut();
  }

  console.log('');
  mark('col diaries.notify_teacher (009)', await columnExists('diaries', 'notify_teacher'));
  mark('col diaries.bowl_release (007)', await columnExists('diaries', 'bowl_release'));
  mark('col diaries.school_id (010)', await columnExists('diaries', 'school_id'));
  mark('col memberships.is_primary (010)', await columnExists('school_memberships', 'is_primary'));
  mark('table school_policies (010)', await columnExists('school_policies', 'community_enabled'));

  const { data: auth, error: le } = await sb.auth.signInWithPassword({
    email: 'student@demo.moodful.app',
    password: PASSWORD,
  });
  mark('student session for write/read', !le && !!auth.user, le?.message);
  const uid = auth?.user?.id;

  if (uid) {
    const { data: mem, error: me } = await sb
      .from('school_memberships')
      .select('school_id, role')
      .eq('user_id', uid);
    mark('student has school membership', !me && (mem || []).length > 0, me?.message);

    const { data: rows, error: re } = await sb
      .from('diaries')
      .select('id, bowl_size, is_public, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(5);
    mark('student read own diaries', !re, re?.message || `rows=${(rows || []).length}`);

    const stamp = `phase-a-smoke ${Date.now()}`;
    const payload = {
      user_id: uid,
      diary_text: stamp,
      check_in_type: 'quick_diary',
      bowl_emotion_key: 'calm',
      bowl_size: 'M',
      is_public: false,
      shared_with_class: false,
      emotions: ['calm'],
      entry_date: new Date().toISOString().slice(0, 10),
      energy_level: 55,
    };
    if (await columnExists('diaries', 'notify_teacher')) payload.notify_teacher = false;

    const { data: created, error: ie } = await sb
      .from('diaries')
      .insert(payload)
      .select('id')
      .single();
    mark('student write diary', !ie && !!created?.id, ie?.message);
    if (created?.id) {
      const { error: de } = await sb.from('diaries').delete().eq('id', created.id);
      mark('student delete smoke diary', !de, de?.message);
    }

    const soupProbe = {
      user_id: uid,
      check_in_type: 'quick_diary',
      soup: 'strawberry_milk',
      diary_text: `soup-probe ${Date.now()}`,
      is_public: false,
    };
    const { data: soupRow, error: se } = await sb
      .from('diaries')
      .insert(soupProbe)
      .select('id')
      .single();
    mark('migration 006 soup key strawberry_milk', !se, se?.message?.slice(0, 120));
    if (soupRow?.id) await sb.from('diaries').delete().eq('id', soupRow.id);
  }

  await sb.auth.signOut();

  console.log('\n---');
  if (fails === 0) {
    console.log('RESULT: ALL PASSED · demo path OK for Phase A tech gate');
  } else {
    console.log(
      `RESULT: ${fails} FAIL(s)\n` +
        'Before Phase A friends: run missing migrations in Supabase SQL Editor\n' +
        '(006 → 007 → 008 → 009 → 010) · see memory/PILOT_20_FRIENDS.md',
    );
  }
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
