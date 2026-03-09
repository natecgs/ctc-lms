import { query } from '../src/db.js';

async function checkDatabase() {
  try {
    console.log('\n========== USERS IN DATABASE ==========\n');
    const usersResult = await query('SELECT id, email, role, auth_id, created_at FROM users ORDER BY id DESC;');
    console.log(usersResult.rows);

    console.log('\n========== PROFILES IN DATABASE ==========\n');
    const profilesResult = await query(
      'SELECT u.id, u.email, u.role, p.full_name, p.avatar_url FROM users u LEFT JOIN profiles p ON u.id = p.user_id ORDER BY u.id DESC;'
    );
    console.log(profilesResult.rows);

    console.log('\n========== INSTRUCTORS IN DATABASE ==========\n');
    const instructorsResult = await query(
      'SELECT u.id, u.email, u.role, i.title, i.bio FROM users u LEFT JOIN instructors i ON u.id = i.user_id WHERE u.role = \'instructor\';'
    );
    console.log(instructorsResult.rows);

    console.log('\n========== ENROLLMENT INFO ==========\n');
    const enrollmentsResult = await query(
      'SELECT u.id, u.email, u.role, COUNT(e.id) as enrollment_count FROM users u LEFT JOIN enrollments e ON u.id = e.user_id GROUP BY u.id, u.email, u.role ORDER BY u.id DESC;'
    );
    console.log(enrollmentsResult.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
