import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OWNER_EMAIL = 'mciverernest1@gmail.com';
const cfg = window.FRUITDEX_SUPABASE_CONFIG || {};
const data = window.FruitDexData;
const $ = (id) => document.getElementById(id);
const panel = $('adminPanel');
const signedOut = $('adminSignedOut');
const denied = $('adminDenied');
const tools = $('adminTools');
const signInButton = $('adminSignIn');
const status = $('adminStatus');
const seedButton = $('seedData');
const slug = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const client = cfg.url && cfg.publishableKey ? createClient(cfg.url, cfg.publishableKey) : null;
let signedInOwner = false;
let publishedRecords = 0;
let publishedTrades = 0;
let creatingNewGuide = false;

function setStatus(id, message) {
  const node = $(id);
  if (node) node.textContent = message;
}

function showAdminRoute() {
  const open = location.hash === '#adminPanel' || location.hash === '#admin';
  panel.hidden = !open;
  if (open) requestAnimationFrame(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
window.addEventListener('hashchange', showAdminRoute);
showAdminRoute();

function populateEditors() {
  const guideSelect = $('guideSelect');
  const selectedGuide = guideSelect.value;
  guideSelect.replaceChildren();
  data.db.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = `${entry.c}: ${entry.n}`;
    guideSelect.append(option);
  });
  if (data.db.some((entry) => entry.id === selectedGuide)) guideSelect.value = selectedGuide;
  if (!creatingNewGuide && guideSelect.value) fillGuideFields();

  const tradeSelect = $('tradeSelect');
  const selectedTrade = tradeSelect.value;
  tradeSelect.replaceChildren();
  data.tradeItems.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = `${item.name}${item.kind === 'skin' ? ' · Skin' : ''}`;
    tradeSelect.append(option);
  });
  if (data.tradeItems.some((item) => item.name === selectedTrade)) tradeSelect.value = selectedTrade;
  fillTradeFields();
}

function fillGuideFields() {
  creatingNewGuide = false;
  const record = data.db.find((entry) => entry.id === $('guideSelect').value);
  if (!record) return;
  $('guideCategory').value = record.c;
  $('guideName').value = record.n;
  $('guideDescription').value = record.d;
  $('guideNotes').value = record.e || '';
  $('guideUrl').value = record.u || '';
}

function fillTradeFields() {
  const item = data.tradeItems.find((entry) => entry.name === $('tradeSelect').value);
  if (!item) return;
  $('marketValue').value = item.market ?? 0;
  $('dealerValue').value = item.beli ?? '';
}

function showSession(session) {
  const email = session?.user?.email?.trim().toLowerCase() || '';
  signedInOwner = email === OWNER_EMAIL;
  signedOut.hidden = Boolean(email);
  denied.hidden = !email || signedInOwner;
  tools.hidden = !signedInOwner;
  if (signedInOwner) {
    $('adminIdentity').textContent = `Signed in as ${email}`;
    setStatus('backendStatus', client ? 'Connected to FruitDex data storage.' : 'Add your Supabase project URL and publishable key to fruitdex-config.js.');
    seedButton.hidden = !client || (publishedRecords > 0 && publishedTrades > 0);
    populateEditors();
  } else if (email) {
    setStatus('adminStatus', 'This account is not on the FruitDex owner allowlist.');
  }
}

async function loadPublishedData() {
  if (!client) return;
  const [recordsResult, tradesResult] = await Promise.all([
    client.from('fruitdex_records').select('id,category,name,description,notes,source_url').order('name'),
    client.from('fruitdex_trade_items').select('id,name,market,beli,image,kind').order('name')
  ]);
  if (recordsResult.error || tradesResult.error) {
    const error = recordsResult.error || tradesResult.error;
    if (signedInOwner) setStatus('backendStatus', `Database setup needed: ${error.message}`);
    return;
  }
  publishedRecords = recordsResult.data.length;
  publishedTrades = tradesResult.data.length;
  if (publishedRecords) {
    data.db.splice(0, data.db.length, ...recordsResult.data.map((row) => ({
      id: row.id, c: row.category, n: row.name, d: row.description, e: row.notes || '', u: row.source_url || ''
    })));
  }
  if (publishedTrades) {
    data.tradeItems.splice(0, data.tradeItems.length, ...tradesResult.data.map((row) => ({
      name: row.name, market: Number(row.market || 0), beli: row.beli == null ? null : Number(row.beli), image: row.image, kind: row.kind
    })));
  }
  data.refresh();
  if (signedInOwner) {
    setStatus('backendStatus', publishedRecords && publishedTrades
      ? `Loaded ${publishedRecords} guide entries and ${publishedTrades} trade items.`
      : 'Database is ready. Publish the starter guide and trade list to begin editing.');
    seedButton.hidden = publishedRecords > 0 && publishedTrades > 0;
    populateEditors();
  }
}

if (client) {
  client.auth.onAuthStateChange((_event, session) => {
    showSession(session);
    if (session) void loadPublishedData();
  });
  client.auth.getSession().then(({ data: sessionData }) => {
    showSession(sessionData.session);
    void loadPublishedData();
  });
} else {
  setStatus('adminStatus', 'Admin sign-in is not configured yet. Finish the steps in SETUP.md.');
  setStatus('backendStatus', 'Add your Supabase project URL and publishable key to fruitdex-config.js.');
}

signInButton.addEventListener('click', async () => {
  if (!client) {
    setStatus('adminStatus', 'Admin sign-in is not configured yet. Finish the steps in SETUP.md.');
    return;
  }
  signInButton.disabled = true;
  setStatus('adminStatus', 'Sending a secure sign-in link to the owner email…');
  const { error } = await client.auth.signInWithOtp({
    email: OWNER_EMAIL,
    options: {
      emailRedirectTo: `${location.origin}${location.pathname}#adminPanel`,
      shouldCreateUser: true
    }
  });
  signInButton.disabled = false;
  setStatus('adminStatus', error ? `Could not send sign-in link: ${error.message}` : `Check ${OWNER_EMAIL} for the sign-in link.`);
});

async function signOut() {
  if (client) await client.auth.signOut();
  showSession(null);
}
$('adminSignOut').addEventListener('click', signOut);
$('adminSignOutDenied').addEventListener('click', signOut);

$('guideSelect').addEventListener('change', fillGuideFields);
$('tradeSelect').addEventListener('change', fillTradeFields);
$('newGuide').addEventListener('click', () => {
  creatingNewGuide = true;
  $('guideSelect').value = '';
  $('guideCategory').value = 'fruit';
  $('guideName').value = '';
  $('guideDescription').value = '';
  $('guideNotes').value = '';
  $('guideUrl').value = '';
  $('guideName').focus();
});

$('guideForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!signedInOwner || !client) return;
  const category = $('guideCategory').value;
  const name = $('guideName').value.trim();
  const id = creatingNewGuide ? `${category}-${slug(name)}-${Date.now()}` : $('guideSelect').value;
  const row = {
    id, category, name,
    description: $('guideDescription').value.trim(),
    notes: $('guideNotes').value.trim(),
    source_url: $('guideUrl').value.trim() || null
  };
  const { error } = await client.from('fruitdex_records').upsert(row);
  if (error) {
    setStatus('guideStatus', `Could not save: ${error.message}`);
    return;
  }
  const entry = { id, c: category, n: name, d: row.description, e: row.notes, u: row.source_url || '' };
  const index = data.db.findIndex((item) => item.id === id);
  if (index < 0) data.db.push(entry); else data.db.splice(index, 1, entry);
  creatingNewGuide = false;
  data.refresh();
  populateEditors();
  $('guideSelect').value = id;
  fillGuideFields();
  publishedRecords = Math.max(publishedRecords, data.db.length);
  setStatus('guideStatus', 'Guide entry saved and published.');
});

$('tradeForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!signedInOwner || !client) return;
  const item = data.tradeItems.find((entry) => entry.name === $('tradeSelect').value);
  if (!item) return;
  const updated = {
    id: `trade-${slug(item.name)}`,
    name: item.name,
    market: Number($('marketValue').value),
    beli: $('dealerValue').value === '' ? null : Number($('dealerValue').value),
    image: item.image,
    kind: item.kind
  };
  const { error } = await client.from('fruitdex_trade_items').upsert(updated);
  if (error) {
    setStatus('tradeStatus', `Could not save: ${error.message}`);
    return;
  }
  Object.assign(item, { market: updated.market, beli: updated.beli });
  data.refresh();
  publishedTrades = Math.max(publishedTrades, data.tradeItems.length);
  setStatus('tradeStatus', 'Trade values saved and published.');
});

seedButton.addEventListener('click', async () => {
  if (!signedInOwner || !client) return;
  seedButton.disabled = true;
  setStatus('backendStatus', 'Publishing the starter data…');
  const records = data.defaultRecords.map((row) => ({
    id: row.id, category: row.c, name: row.n, description: row.d, notes: row.e || '', source_url: row.u || null
  }));
  const trades = data.defaultTradeItems.map((row) => ({
    id: `trade-${slug(row.name)}`, name: row.name, market: row.market, beli: row.beli, image: row.image, kind: row.kind
  }));
  const [recordResult, tradeResult] = await Promise.all([
    client.from('fruitdex_records').upsert(records),
    client.from('fruitdex_trade_items').upsert(trades)
  ]);
  seedButton.disabled = false;
  if (recordResult.error || tradeResult.error) {
    setStatus('backendStatus', `Could not publish starter data: ${(recordResult.error || tradeResult.error).message}`);
    return;
  }
  await loadPublishedData();
});

if (client) void loadPublishedData();
