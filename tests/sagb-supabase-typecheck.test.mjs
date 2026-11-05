import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const pathFor = (relative) => fileURLToPath(new URL('../' + relative, import.meta.url));

test('Registro de incubadoras passa no typecheck TypeScript isolado', () => {
  const path = pathFor('src/modules/monitoramento/services/supabaseEcosystemRegistry.ts');
  const program = ts.createProgram([path], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    types: []
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
});

test('Tela Observatory passa na checagem sintática TSX isolada', () => {
  const path = pathFor('src/modules/monitoramento/pages/MonitoramentoSupabasePage.tsx');
  const code = ts.sys.readFile(path);
  assert.ok(code);
  const result = ts.transpileModule(code, {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext
    }
  });
  assert.equal((result.diagnostics || []).length, 0, (result.diagnostics || []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
});
