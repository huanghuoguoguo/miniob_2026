/* Copyright (c) OceanBase and/or its affiliates. All rights reserved.
miniob is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */

#include "sql/operator/update_physical_operator.h"
#include <cstdlib>
#include "common/log/log.h"
#include "storage/table/table.h"
#include "storage/trx/trx.h"
#include "storage/field/field_meta.h"
#include "storage/table/table_meta.h"

UpdatePhysicalOperator::UpdatePhysicalOperator(Table *table, FieldMeta *field_meta, Value *value)
    : table_(table), field_meta_(field_meta), value_(value)
{}

UpdatePhysicalOperator::~UpdatePhysicalOperator()
{
  if (field_meta_ != nullptr) {
    delete field_meta_;
    field_meta_ = nullptr;
  }
  if (value_ != nullptr) {
    delete value_;
    value_ = nullptr;
  }
}

RC UpdatePhysicalOperator::open(Trx *trx)
{
  trx_ = trx;

  if (children_.empty()) {
    return RC::SUCCESS;
  }

  unique_ptr<PhysicalOperator> &child = children_[0];

  RC rc = child->open(trx);
  if (rc != RC::SUCCESS) {
    LOG_WARN("failed to open child operator: %s", strrc(rc));
    return rc;
  }

  // Collect all records that match the condition
  while (OB_SUCC(rc = child->next())) {
    Tuple *tuple = child->current_tuple();
    if (nullptr == tuple) {
      LOG_WARN("failed to get current record: %s", strrc(rc));
      return rc;
    }

    RowTuple *row_tuple = static_cast<RowTuple *>(tuple);
    Record   &record    = row_tuple->record();
    records_.emplace_back(std::move(record));
  }

  child->close();

  // Now update all collected records
  const TableMeta &table_meta = table_->table_meta();
  int record_size = table_meta.record_size();

  for (Record &old_record : records_) {
    // Create new record with updated value
    // Use malloc instead of new[] because Record destructor uses free()
    char *new_data = (char *)malloc(record_size);
    if (nullptr == new_data) {
      LOG_WARN("failed to allocate memory for new record. size=%d", record_size);
      return RC::NOMEM;
    }
    memcpy(new_data, old_record.data(), record_size);

    // Update the field value
    size_t copy_len = field_meta_->len();
    const size_t data_len = value_->length();
    if (field_meta_->type() == AttrType::CHARS || field_meta_->type() == AttrType::TEXTS) {
      if (copy_len > data_len) {
        copy_len = data_len + 1;
      }
    }
    memcpy(new_data + field_meta_->offset(), value_->data(), copy_len);

    Record new_record;
    new_record.set_data_owner(new_data, record_size);
    // Note: set_data_owner takes ownership, don't delete new_data here

    // Delete old record and insert new one
    rc = trx_->delete_record(table_, old_record);
    if (rc != RC::SUCCESS) {
      LOG_WARN("failed to delete old record: %s", strrc(rc));
      return rc;
    }

    rc = trx_->insert_record(table_, new_record);
    if (rc != RC::SUCCESS) {
      LOG_WARN("failed to insert new record: %s", strrc(rc));
      // Try to rollback by re-inserting old record
      trx_->insert_record(table_, old_record);
      return rc;
    }
  }

  return RC::SUCCESS;
}

RC UpdatePhysicalOperator::next()
{
  return RC::RECORD_EOF;
}

RC UpdatePhysicalOperator::close()
{
  return RC::SUCCESS;
}