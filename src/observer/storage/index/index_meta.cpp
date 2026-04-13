/* Copyright (c) 2021 OceanBase and/or its affiliates. All rights reserved.
miniob is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of the Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */

//
// Created by Wangyunlai.wyl on 2021/5/18.
//

#include "storage/index/index_meta.h"
#include "common/lang/string.h"
#include "common/log/log.h"
#include "storage/field/field_meta.h"
#include "storage/table/table_meta.h"
#include "json/json.h"

const static Json::StaticString FIELD_NAME("name");
const static Json::StaticString FIELD_FIELD_NAME("field_name");
const static Json::StaticString FIELD_FIELD_NAMES("field_names");  // 多列索引

RC IndexMeta::init(const char *name, const FieldMeta &field)
{
  if (common::is_blank(name)) {
    LOG_ERROR("Failed to init index, name is empty.");
    return RC::INVALID_ARGUMENT;
  }

  name_ = name;
  fields_.clear();
  fields_.push_back(field.name());
  return RC::SUCCESS;
}

RC IndexMeta::init(const char *name, const vector<const FieldMeta *> &field_metas)
{
  if (common::is_blank(name)) {
    LOG_ERROR("Failed to init index, name is empty.");
    return RC::INVALID_ARGUMENT;
  }

  if (field_metas.empty()) {
    LOG_ERROR("Failed to init index, field_metas is empty.");
    return RC::INVALID_ARGUMENT;
  }

  name_ = name;
  fields_.clear();
  for (const FieldMeta *field : field_metas) {
    fields_.push_back(field->name());
  }
  return RC::SUCCESS;
}

void IndexMeta::to_json(Json::Value &json_value) const
{
  json_value[FIELD_NAME] = name_;

  // 为了向后兼容，如果只有一个字段，使用 field_name
  if (fields_.size() == 1) {
    json_value[FIELD_FIELD_NAME] = fields_[0];
  } else {
    // 多字段使用 field_names 数组
    Json::Value field_names(Json::arrayValue);
    for (const string &field : fields_) {
      field_names.append(field);
    }
    json_value[FIELD_FIELD_NAMES] = field_names;
  }
}

RC IndexMeta::from_json(const TableMeta &table, const Json::Value &json_value, IndexMeta &index)
{
  const Json::Value &name_value = json_value[FIELD_NAME];
  if (!name_value.isString()) {
    LOG_ERROR("Index name is not a string. json value=%s", name_value.toStyledString().c_str());
    return RC::INTERNAL;
  }

  vector<string> field_names;

  // 尝试读取 field_names 数组（多列索引）
  if (json_value.isMember(FIELD_FIELD_NAMES)) {
    const Json::Value &field_names_value = json_value[FIELD_FIELD_NAMES];
    if (!field_names_value.isArray()) {
      LOG_ERROR("Field names of index [%s] is not an array. json value=%s",
          name_value.asCString(), field_names_value.toStyledString().c_str());
      return RC::INTERNAL;
    }
    for (unsigned int i = 0; i < field_names_value.size(); i++) {
      if (!field_names_value[i].isString()) {
        LOG_ERROR("Field name of index [%s] at position %d is not a string", name_value.asCString(), i);
        return RC::INTERNAL;
      }
      field_names.push_back(field_names_value[i].asString());
    }
  } else {
    // 兼容旧格式：读取单个 field_name
    const Json::Value &field_value = json_value[FIELD_FIELD_NAME];
    if (!field_value.isString()) {
      LOG_ERROR("Field name of index [%s] is not a string. json value=%s",
          name_value.asCString(), field_value.toStyledString().c_str());
      return RC::INTERNAL;
    }
    field_names.push_back(field_value.asString());
  }

  // 验证所有字段存在
  vector<const FieldMeta *> field_metas;
  for (const string &field_name : field_names) {
    const FieldMeta *field = table.field(field_name.c_str());
    if (nullptr == field) {
      LOG_ERROR("Deserialize index [%s]: no such field: %s", name_value.asCString(), field_name.c_str());
      return RC::SCHEMA_FIELD_MISSING;
    }
    field_metas.push_back(field);
  }

  return index.init(name_value.asCString(), field_metas);
}

const char *IndexMeta::name() const { return name_.c_str(); }

const char *IndexMeta::field() const
{
  // 兼容单列索引
  return fields_.empty() ? "" : fields_[0].c_str();
}

const vector<string> &IndexMeta::fields() const { return fields_; }

int IndexMeta::field_num() const { return static_cast<int>(fields_.size()); }

void IndexMeta::desc(ostream &os) const
{
  os << "index name=" << name_ << ", fields=";
  for (size_t i = 0; i < fields_.size(); i++) {
    if (i > 0) os << ",";
    os << fields_[i];
  }
}