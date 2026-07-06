import { createClient } from './client';
import type { Database } from './database.types';

type ClientRow = Database['public']['Tables']['clients']['Insert'];
type InvoiceRow = Database['public']['Tables']['invoices']['Insert'];
type ItemRow = Database['public']['Tables']['invoice_items']['Insert'];

// Helper to parse local text dates (e.g. "May 20, 2026") into YYYY-MM-DD
function parseToISODate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const parsed = Date.parse(dateStr);
  if (isNaN(parsed)) {
    // If it's a relative offset or custom format, try checking standard formats or fallback
    return new Date().toISOString().split('T')[0];
  }
  return new Date(parsed).toISOString().split('T')[0];
}

export async function migrateLocalStorageToSupabase(workspaceId: string) {
  if (typeof window === 'undefined') return;

  const log = (msg: string, data?: any) => {
    console.log(`[Migration] ${msg}`, data ? JSON.stringify(data) : '');
  };

  const status = localStorage.getItem('sx_migration_status');
  if (status === 'success') {
    log('Migration already marked as successful. Skipping.');
    return;
  }

  // Read raw local storage data
  const localClientsRaw = localStorage.getItem('sx_clients');
  const localInvoicesRaw = localStorage.getItem('sx_invoices');

  const localClients = localClientsRaw ? JSON.parse(localClientsRaw) : [];
  const localInvoices = localInvoicesRaw ? JSON.parse(localInvoicesRaw) : [];

  // If there's nothing to migrate, mark success and stop
  if (localClients.length === 0 && localInvoices.length === 0) {
    log('No clients or invoices found in localStorage. Marking migration as complete.');
    localStorage.setItem('sx_migration_status', 'success');
    return;
  }

  log(`Beginning migration for workspace ${workspaceId}. Clients: ${localClients.length}, Invoices: ${localInvoices.length}`);
  localStorage.setItem('sx_migration_status', 'running');

  // Load existing progress mapping to support resuming failed migrations idempotently
  let clientMap: Record<string, string> = {};
  let invoiceMap: Record<string, string> = {};

  try {
    clientMap = JSON.parse(localStorage.getItem('sx_migration_client_map') || '{}');
    invoiceMap = JSON.parse(localStorage.getItem('sx_migration_invoice_map') || '{}');
  } catch (e) {
    log('Error reading previous migration maps. Starting fresh.', e);
  }

  const supabase = createClient() as any;

  try {
    // ─── 1. Migrate Workspace Settings ──────────────────────────────────────────
    log('Syncing workspace settings...');
    const brandKit = {
      accent: localStorage.getItem('sx_def_accent') || 'Indigo',
      font: localStorage.getItem('sx_def_font') || 'Sans',
      template: localStorage.getItem('sx_def_template') || 'Modern',
      taxRate: parseFloat(localStorage.getItem('sx_def_taxrate') || '0'),
      taxName: localStorage.getItem('sx_def_taxname') || 'Tax',
      currency: localStorage.getItem('sx_def_currency') || 'USD',
      payTerms: localStorage.getItem('sx_def_payterms') || 'Net 30',
      logoDataUrl: localStorage.getItem('sx_brand_logo'),
      stampDataUrl: localStorage.getItem('sx_brand_stamp'),
      signatureDataUrl: localStorage.getItem('sx_brand_sig'),
    };

    const { error: wsError } = await supabase
      .from('workspaces')
      .update({
        billing_email: localStorage.getItem('sx_biz_email') || 'billing@silex.com',
        phone: localStorage.getItem('sx_biz_phone') || '',
        website: localStorage.getItem('sx_biz_website') || '',
        address: [
          localStorage.getItem('sx_biz_addr'),
          localStorage.getItem('sx_biz_city'),
          localStorage.getItem('sx_biz_state'),
          localStorage.getItem('sx_biz_postal'),
          localStorage.getItem('sx_biz_country')
        ].filter(Boolean).join(', ') || '100 Pine Street',
        tax_id: localStorage.getItem('sx_biz_gstin') || '',
        brand_kit: brandKit,
      })
      .eq('id', workspaceId);

    if (wsError) throw new Error(`Workspace update failed: ${wsError.message}`);
    log('Workspace settings synced.');

    // ─── 2. Migrate Clients ──────────────────────────────────────────────────────
    log('Syncing clients...');
    for (const cli of localClients) {
      if (clientMap[cli.id]) {
        log(`Client "${cli.displayName}" (${cli.id}) already mapped to DB client ${clientMap[cli.id]}. Skipping.`);
        continue;
      }

      // Check if client display name already exists in DB to prevent duplicates
      const { data: existingClients, error: checkErr } = await supabase
        .from('clients')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('display_name', cli.displayName)
        .limit(1);

      if (checkErr) throw new Error(`Client duplicate check failed: ${checkErr.message}`);

      if (existingClients && existingClients.length > 0) {
        const dbId = existingClients[0].id;
        clientMap[cli.id] = dbId;
        localStorage.setItem('sx_migration_client_map', JSON.stringify(clientMap));
        log(`Client "${cli.displayName}" already exists in database with ID ${dbId}. Mapped.`);
        continue;
      }

      // Insert new client
      const newClient: ClientRow = {
        workspace_id: workspaceId,
        display_name: cli.displayName,
        company_name: cli.companyName || null,
        contact_person: cli.contactPerson || null,
        email: cli.email || null,
        phone: cli.phone || null,
        website: cli.website || null,
        billing_address: [
          cli.billingAddress,
          cli.billingCity,
          cli.billingState,
          cli.billingPostal,
          cli.billingCountry
        ].filter(Boolean).join(', ') || null,
        tax_id: cli.gstin || null,
        currency: cli.currency || 'USD',
        payment_terms: cli.paymentTerms || 'Net 30',
      };

      const { data: insertedCli, error: insErr } = await supabase
        .from('clients')
        .insert(newClient)
        .select('id')
        .single();

      if (insErr) throw new Error(`Failed to insert client "${cli.displayName}": ${insErr.message}`);

      const dbId = insertedCli.id;
      clientMap[cli.id] = dbId;
      localStorage.setItem('sx_migration_client_map', JSON.stringify(clientMap));
      log(`Inserted new client "${cli.displayName}" as DB client ${dbId}.`);
    }

    // ─── 3. Migrate Invoices ─────────────────────────────────────────────────────
    log('Syncing invoices...');
    for (const inv of localInvoices) {
      if (invoiceMap[inv.id]) {
        log(`Invoice ${inv.id} already mapped to DB invoice ${invoiceMap[inv.id]}. Skipping.`);
        continue;
      }

      const invNumber = inv.id.replace('#', ''); // strip '#' symbol if any

      // Check if invoice number already exists in DB to prevent duplicates
      const { data: existingInvoices, error: checkErr } = await supabase
        .from('invoices')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('invoice_number', invNumber)
        .limit(1);

      if (checkErr) throw new Error(`Invoice duplicate check failed: ${checkErr.message}`);

      if (existingInvoices && existingInvoices.length > 0) {
        const dbId = existingInvoices[0].id;
        invoiceMap[inv.id] = dbId;
        localStorage.setItem('sx_migration_invoice_map', JSON.stringify(invoiceMap));
        log(`Invoice ${inv.id} already exists in database with ID ${dbId}. Mapped.`);
        continue;
      }

      const mappedClientUuid = inv.clientId ? clientMap[inv.clientId] : null;

      // Prepare billing metadata snapshot
      const clientSnapshot = {
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        clientAddress: inv.clientAddress,
        clientTaxId: inv.clientTaxId,
        companyName: inv.companyName,
        companyAddress: inv.companyAddress,
        companyTaxId: inv.companyTaxId,
      };

      // Insert parent invoice
      const newInvoice: InvoiceRow = {
        workspace_id: workspaceId,
        client_id: mappedClientUuid || null,
        invoice_number: invNumber,
        date: parseToISODate(inv.date),
        due_date: parseToISODate(inv.dueDate),
        currency: inv.currency || 'USD',
        status: inv.status || 'Pending',
        tax_rate: inv.taxRate || 0,
        discount_rate: inv.discountRate || 0,
        notes: inv.notes || null,
        client_snapshot: clientSnapshot,
      };

      const { data: insertedInv, error: insErr } = await supabase
        .from('invoices')
        .insert(newInvoice)
        .select('id')
        .single();

      if (insErr) throw new Error(`Failed to insert invoice ${inv.id}: ${insErr.message}`);

      const dbInvoiceId = insertedInv.id;

      // Insert child invoice items
      if (inv.items && inv.items.length > 0) {
        const itemRows: ItemRow[] = inv.items.map((item: any, index: number) => ({
          invoice_id: dbInvoiceId,
          description: item.description,
          qty: item.qty || 1,
          rate: item.rate || 0,
          sort_order: index,
        }));

        const { error: itemsErr } = await supabase
          .from('invoice_items')
          .insert(itemRows);

        if (itemsErr) throw new Error(`Failed to insert items for invoice ${inv.id}: ${itemsErr.message}`);
      }

      invoiceMap[inv.id] = dbInvoiceId;
      localStorage.setItem('sx_migration_invoice_map', JSON.stringify(invoiceMap));
      log(`Inserted invoice ${inv.id} as DB invoice ${dbInvoiceId} with ${inv.items?.length || 0} items.`);
    }

    // ─── 4. Verification & Browser Cleanup ────────────────────────────────────
    log('Verifying uploaded database counts...');
    
    // Check clients count in DB
    const { count: dbCliCount, error: countCliErr } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // Check invoices count in DB
    const { count: dbInvCount, error: countInvErr } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    if (countCliErr || countInvErr) {
      throw new Error('Database upload verification failed during count check.');
    }

    log(`Verification counts: DB Clients = ${dbCliCount}, DB Invoices = ${dbInvCount}`);

    // Mark migration successful
    log('Migration completed successfully. Cleaning up browser storage...');
    localStorage.setItem('sx_migration_status', 'success');

    // Remove legacy local storage keys
    localStorage.removeItem('sx_clients');
    localStorage.removeItem('sx_invoices');
    
    // Clear temporary maps as they are no longer needed
    localStorage.removeItem('sx_migration_client_map');
    localStorage.removeItem('sx_migration_invoice_map');

  } catch (err: any) {
    log('Migration failed mid-execution. Safe state preserved.', err.message || err);
    localStorage.setItem('sx_migration_status', 'failed');
    throw err;
  }
}
