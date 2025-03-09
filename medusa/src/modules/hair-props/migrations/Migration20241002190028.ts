import { Migration } from '@mikro-orm/migrations'

export class Migration20241002190028 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "product_length" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_length_pkey" primary key ("id"));'
    )

    this.addSql(
      'create table if not exists "cap_size" ("id" text not null, "name" text not null, "hex_code" text not null, "product_length_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cap_size_pkey" primary key ("id"));'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_cap_size_product_length_id" ON "cap_size" (product_length_id) WHERE deleted_at IS NULL;'
    )

    this.addSql(
      'alter table if exists "cap_size" add constraint "cap_size_product_length_id_foreign" foreign key ("product_length_id") references "product_length" ("id") on update cascade;'
    )
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "cap_size" drop constraint if exists "cap_size_product_length_id_foreign";'
    )

    this.addSql('drop table if exists "product_length" cascade;')

    this.addSql('drop table if exists "cap_size" cascade;')
  }
}
