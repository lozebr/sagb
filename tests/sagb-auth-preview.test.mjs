import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const shim = readFileSync(new URL('../services/supabase.ts', import.meta.url), 'utf8');
const login = readFileSync(new URL('../components/Auth.tsx', import.meta.url), 'utf8');

test('Supabase Auth oferece diagnóstico quando configuração ou rede falha', () => {
  assert.match(shim, /code: 'auth\/configuration-not-found'/);
  assert.match(shim, /code: 'auth\/network-request-failed'/);
  assert.match(shim, /try\s*\{\s*res = await fetch\(/);
  assert.match(login, /code === 'auth\/network-request-failed'/);
  assert.match(login, /code === 'auth\/configuration-not-found'/);
});

test('O login não imprime sessão, credenciais ou perfil do usuário no console', () => {
  assert.doesNotMatch(login, /console\.log\('Login bem-sucedido:'/);
  assert.doesNotMatch(login, /console\.log\('Tentando autenticação com:'/);
  assert.doesNotMatch(login, /console\.log\('Criando perfil no banco de dados:'/);
  assert.match(login, /console\.error\('Falha na autenticação do SagB:', \{ code, status:/);
});

test('O diagnóstico não desativa o controle de autenticação para acessar o NAGI', () => {
  assert.match(login, /await signInWithEmailAndPassword\(auth, email, password\)/);
  assert.match(login, /onAuthSuccess\(\)/);
});
