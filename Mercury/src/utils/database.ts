import { createClient } from '@clickhouse/client';
import { v4 as uuidv4 } from 'uuid';

// ClickHouse connection configuration
const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

export interface User {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export async function insertUser(user: Omit<User, 'created_at' | 'updated_at'>): Promise<void> {
  await clickhouse.insert({
    table: 'default.users',
    values: [{
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      is_active: user.is_active
    }],
    format: 'JSONEachRow'
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await clickhouse.query({
    query: `
      SELECT user_id, username, email, password_hash, created_at, updated_at, is_active
      FROM default.users
      WHERE email = {email:String}
      LIMIT 1
    `,
    query_params: { email }
  });
  
  const resultData = await result.json();
  const rows = resultData.data || [];
  return rows.length > 0 ? rows[0] : null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const result = await clickhouse.query({
    query: `
      SELECT user_id, username, email, password_hash, created_at, updated_at, is_active
      FROM default.users
      WHERE username = {username:String}
      LIMIT 1
    `,
    query_params: { username }
  });
  
  const resultData = await result.json();
  const rows = resultData.data || [];
  return rows.length > 0 ? rows[0] : null;
}

export async function findUserById(userId: string): Promise<User | null> {
  const result = await clickhouse.query({
    query: `
      SELECT user_id, username, email, password_hash, created_at, updated_at, is_active
      FROM default.users
      WHERE user_id = {userId:String}
      LIMIT 1
    `,
    query_params: { userId }
  });
  
  const resultData = await result.json();
  const rows = resultData.data || [];
  return rows.length > 0 ? rows[0] : null;
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
  const updateFields = [];
  const queryParams: any = { userId };
  
  if (updates.username !== undefined) {
    updateFields.push('username = {username:String}');
    queryParams.username = updates.username;
  }
  
  if (updates.email !== undefined) {
    updateFields.push('email = {email:String}');
    queryParams.email = updates.email;
  }
  
  if (updates.password_hash !== undefined) {
    updateFields.push('password_hash = {password_hash:String}');
    queryParams.password_hash = updates.password_hash;
  }
  
  if (updates.is_active !== undefined) {
    updateFields.push('is_active = {is_active:Boolean}');
    queryParams.is_active = updates.is_active;
  }
  
  if (updateFields.length === 0) {
    return; // No updates to make
  }
  
  updateFields.push('updated_at = now()');
  
  await clickhouse.query({
    query: `
      ALTER TABLE default.users
      UPDATE ${updateFields.join(', ')}
      WHERE user_id = {userId:String}
    `,
    query_params: queryParams
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await clickhouse.query({
    query: `
      ALTER TABLE default.users
      DELETE WHERE user_id = {userId:String}
    `,
    query_params: { userId }
  });
}

export default clickhouse; 