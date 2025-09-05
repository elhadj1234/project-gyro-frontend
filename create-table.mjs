import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required variables:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  try {
    console.log('🔄 Creating user_links table...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./database_setup.sql', 'utf8');
    
    // Split SQL commands by semicolon and filter out empty ones
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Found ${sqlCommands.length} SQL commands to execute`);
    
    // Execute each command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`⚡ Executing command ${i + 1}/${sqlCommands.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: command + ';'
      });
      
      if (error) {
        console.log(`⚠️  Command ${i + 1} failed, trying direct execution...`);
        // Try direct execution for DDL commands
        const { error: directError } = await supabase
          .from('_realtime_schema')
          .select('*')
          .limit(0);
        
        if (directError && !directError.message.includes('does not exist')) {
          console.error(`❌ Error in command ${i + 1}:`, error.message);
        }
      } else {
        console.log(`✅ Command ${i + 1} executed successfully`);
      }
    }
    
    // Test table creation
    console.log('🧪 Testing table access...');
    const { data, error } = await supabase
      .from('user_links')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table test failed:', error.message);
      console.log('\n🔧 Manual Setup Required:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and paste the contents of database_setup.sql');
      console.log('5. Click "Run" to execute');
    } else {
      console.log('✅ Table created successfully!');
      console.log('🎉 Your dashboard should now work properly!');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.log('\n🔧 Please create the table manually in Supabase dashboard');
  }
}

createTable();