alter table public.integrations add constraint integrations_name_key unique (name);

insert into public.integrations (name, category, status) values
  ('Claude (MCP)','AI Provider','connected'),
  ('ChatGPT / OpenAI','AI Provider','connected'),
  ('GitHub Copilot','AI Provider','connected'),
  ('Gemini','AI Provider','connected'),
  ('Azure DevOps','Pipeline','connected'),
  ('GitHub','Repo','connected'),
  ('Slack','Comms','available'),
  ('Linear','Issues','available'),
  ('Jira','Issues','available'),
  ('Notion','Docs','error')
on conflict (name) do nothing;
