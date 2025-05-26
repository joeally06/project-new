// filepath: supabase/functions/admin-hof-settings/index.ts
import express, { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

app.post('/', async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { id, name, start_date, end_date, description, nomination_instructions, eligibility_criteria, is_active, updated_at } = req.body;
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const { error } = await supabase
    .from('hall_of_fame_settings')
    .upsert([
      { id, name, start_date, end_date, description, nomination_instructions, eligibility_criteria, is_active, updated_at }
    ]);
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(200).json({ success: true });
});

app.delete('/', async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { clear } = req.body;
  if (!clear) {
    return res.status(400).json({ message: 'Missing clear flag' });
  }
  const { error } = await supabase
    .from('hall_of_fame_settings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(200).json({ success: true });
});

app.all('*', (req, res) => {
  res.status(405).json({ message: 'Method not allowed' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
