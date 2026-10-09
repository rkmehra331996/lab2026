import os

with open('scripts/seed_inserts.sql', 'r', encoding='utf-8') as f:
    seed_sql = f.read()

with open('public/api/schema.sql', 'r', encoding='utf-8') as f:
    schema_sql = f.read()

if '19. Initial Seed Data: 6 Certified Diagnostic Laboratories' not in schema_sql:
    schema_sql = schema_sql.replace('SET FOREIGN_KEY_CHECKS = 1;', seed_sql + '\nSET FOREIGN_KEY_CHECKS = 1;')
    with open('public/api/schema.sql', 'w', encoding='utf-8') as f:
        f.write(schema_sql)
    print('✅ Updated public/api/schema.sql')

# Create src/lib/hostingerSql.ts
escaped = schema_sql.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
with open('src/lib/hostingerSql.ts', 'w', encoding='utf-8') as f:
    f.write('export const HOSTINGER_SQL_SCHEMA = `' + escaped + '`;\n')
print('✅ Updated src/lib/hostingerSql.ts')
