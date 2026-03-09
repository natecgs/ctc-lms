import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://jskcfbrzoeobxordvlfr.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjFkOWE2YjEwLWFkM2QtNDA1Yy05NGJkLWU0YTllMjg4NzJkOSJ9.eyJwcm9qZWN0SWQiOiJqc2tjZmJyem9lb2J4b3JkdmxmciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzcyMjIxNDA4LCJleHAiOjIwODc1ODE0MDgsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Opi5XqGO6aIKc-N5XGiJMyMtuNzhSJXWB-zBUFVbgKM';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };