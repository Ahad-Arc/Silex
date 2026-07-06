-- Recreate supabase_realtime publication to enable realtime replication on selected tables
drop publication if exists supabase_realtime;

create publication supabase_realtime for table 
  public.invoices, 
  public.invoice_items, 
  public.clients, 
  public.workspaces, 
  public.users;
