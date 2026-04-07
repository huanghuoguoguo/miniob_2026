/* Copyright (c) 2021 OceanBase and/or its affiliates. All rights reserved.
miniob is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */

//
// Created by Wangyunlai on 2022/5/22.
//

#include "sql/stmt/update_stmt.h"
#include "common/log/log.h"
#include "sql/stmt/filter_stmt.h"
#include "storage/db/db.h"
#include "storage/table/table.h"
#include "storage/field/field_meta.h"

UpdateStmt::UpdateStmt(Table *table, FieldMeta *field_meta, Value *value, FilterStmt *filter_stmt)
    : table_(table), field_meta_(field_meta), value_(value), filter_stmt_(filter_stmt)
{}

UpdateStmt::~UpdateStmt()
{
  if (nullptr != filter_stmt_) {
    delete filter_stmt_;
    filter_stmt_ = nullptr;
  }
  if (nullptr != field_meta_) {
    delete field_meta_;
    field_meta_ = nullptr;
  }
  if (nullptr != value_) {
    delete value_;
    value_ = nullptr;
  }
}

RC UpdateStmt::create(Db *db, const UpdateSqlNode &update_sql, Stmt *&stmt)
{
  const char *table_name = update_sql.relation_name.c_str();
  if (nullptr == db || nullptr == table_name) {
    LOG_WARN("invalid argument. db=%p, table_name=%p", db, table_name);
    return RC::INVALID_ARGUMENT;
  }

  // check whether the table exists
  Table *table = db->find_table(table_name);
  if (nullptr == table) {
    LOG_WARN("no such table. db=%s, table_name=%s", db->name(), table_name);
    return RC::SCHEMA_TABLE_NOT_EXIST;
  }

  // check whether the field exists
  const TableMeta &table_meta = table->table_meta();
  const FieldMeta *field_meta = table_meta.field(update_sql.attribute_name.c_str());
  if (nullptr == field_meta) {
    LOG_WARN("no such field in table. db=%s, table_name=%s, field_name=%s",
        db->name(), table_name, update_sql.attribute_name.c_str());
    return RC::SCHEMA_FIELD_NOT_EXIST;
  }

  // check field type
  Value value_to_use = update_sql.value;  // copy the value
  if (field_meta->type() != value_to_use.attr_type()) {
    // try to cast value type
    Value real_value;
    RC rc = Value::cast_to(value_to_use, field_meta->type(), real_value);
    if (OB_FAIL(rc)) {
      LOG_WARN("cannot convert value type. table_name=%s, field_name=%s, value_type=%s, field_type=%s",
          table_name, field_meta->name(), attr_type_to_string(value_to_use.attr_type()), attr_type_to_string(field_meta->type()));
      return RC::SCHEMA_FIELD_TYPE_MISMATCH;
    }
    value_to_use = real_value;  // use the converted value
  }

  // create filter statement
  unordered_map<string, Table *> table_map;
  table_map.insert(pair<string, Table *>(string(table_name), table));

  FilterStmt *filter_stmt = nullptr;
  RC rc = FilterStmt::create(
      db, table, &table_map, update_sql.conditions.data(), static_cast<int>(update_sql.conditions.size()), filter_stmt);
  if (rc != RC::SUCCESS) {
    LOG_WARN("failed to create filter statement. rc=%d:%s", rc, strrc(rc));
    return rc;
  }

  // create update statement
  FieldMeta *field_meta_copy = new FieldMeta(*field_meta);
  Value *value_copy = new Value(value_to_use);
  stmt = new UpdateStmt(table, field_meta_copy, value_copy, filter_stmt);
  return RC::SUCCESS;
}