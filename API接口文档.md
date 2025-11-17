# 医疗影像软件帮助文档管理系统 API 接口文档

## 系统概述

本系统是一个基于 Node.js + Express 的树形结构帮助文档管理系统，主要用于管理医疗影像软件的帮助文档。系统采用树形结构组织内容，支持多层级嵌套，提供完整的 CRUD 操作。

### 技术栈
- **后端框架**: Node.js + Express
- **数据存储**: JSON 文件
- **跨域处理**: CORS
- **日志记录**: 自定义日志工具
- **数据验证**: 自定义验证中间件

### 基础信息
- **API 基础路径**: `/api/v1`
- **服务端口**: 见配置文件
- **响应格式**: JSON
- **字符编码**: UTF-8

---

## 接口列表

### 1. 获取完整树形结构

#### 接口信息
- **URL**: `GET /api/v1/tree`
- **描述**: 获取完整的树形结构数据，包含所有节点及其内容
- **权限**: 无需特殊权限

#### 请求参数
无需参数

#### 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "obj": {
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 100,
    "totalPages": 10,
    "records": [
      {
        "id": "1",
        "parentId": 0,
        "name": "1 软件简介",
        "type": "menu",
        "path": "",
        "icon": "",
        "showType": 1,
        "weight": 1,
        "createUserId": 0,
        "createTime": 1700000000000,
        "updateUserId": 0,
        "updateTime": 1700000000000,
        "permissionListJson": [],
        "subList": [
          {
            "id": "1.1",
            "parentId": "1",
            "name": "1.1 功能概览",
            "type": "button",
            "content": "功能详细说明内容...",
            "subList": []
          }
        ]
      }
    ],
    "extMap": {
      "typeMap": {
        "menu": "目录",
        "button": "页面"
      },
      "showTypeList": [
        {"code": 0, "name": "隐藏"},
        {"code": 1, "name": "显示"},
        {"code": 9, "name": "仅超管显示"}
      ],
      "showTypeMap": {
        "0": "隐藏",
        "1": "显示",
        "9": "仅超管显示"
      },
      "typeList": [
        {"code": "menu", "name": "目录"},
        {"code": "button", "name": "页面"}
      ]
    }
  }
}
```

#### 响应字段说明

**节点对象字段**:
- `id` (string): 节点唯一标识符
- `parentId` (string/number): 父节点ID，0表示根节点
- `name` (string): 节点名称/标题
- `type` (string): 节点类型，"menu"=目录，"button"=页面
- `path` (string): 路径信息
- `icon` (string): 图标信息
- `showType` (number): 显示类型，0=隐藏，1=显示，9=仅超管显示
- `weight` (number): 排序权重，数值越小越靠前
- `createUserId` (number): 创建用户ID
- `createTime` (number): 创建时间戳
- `updateUserId` (number): 更新用户ID
- `updateTime` (number): 更新时间戳
- `permissionListJson` (array): 权限列表
- `subList` (array): 子节点列表
- `content` (string): 内容详情（仅button类型有）

**extMap字段说明**:
- `typeMap`: 类型映射表
- `showTypeList`: 显示类型列表
- `showTypeMap`: 显示类型映射表
- `typeList`: 类型列表

---

### 2. 获取指定节点

#### 接口信息
- **URL**: `GET /api/v1/tree/:id`
- **描述**: 根据节点ID获取指定节点的详细信息
- **权限**: 无需特殊权限

#### 请求参数
- **路径参数**:
  - `id` (string, 必需): 节点ID

#### 请求示例
```
GET /api/v1/tree/1.1
```

#### 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "obj": {
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 1,
    "totalPages": 1,
    "records": [
      {
        "id": "1.1",
        "parentId": "1",
        "name": "1.1 功能概览",
        "type": "button",
        "path": "",
        "icon": "",
        "showType": 1,
        "weight": 1,
        "createUserId": 0,
        "createTime": 1700000000000,
        "updateUserId": 0,
        "updateTime": 1700000000000,
        "permissionListJson": [],
        "subList": [],
        "content": "# 功能概览\n\n这是软件功能的总体概览说明..."
      }
    ],
    "extMap": {
      // ... 同上
    }
  }
}
```

#### 错误响应
```json
{
  "message": "节点ID 1.1 不存在"
}
```

---

### 3. 添加节点

#### 接口信息
- **URL**: `POST /api/v1/tree`
- **描述**: 添加新节点到树形结构中
- **权限**: 需要创建权限

#### 请求参数
- **查询参数**:
  - `parentId` (string, 可选): 父节点ID，不传或传0表示添加为根节点

- **请求体** (JSON):
```json
{
  "id": "1.6",
  "name": "新节点名称",
  "type": "button",
  "path": "/path/to/page",
  "icon": "icon-name",
  "showType": 1,
  "weight": 10,
  "content": "节点内容详情",
  "permissionListJson": ["permission1", "permission2"]
}
```

#### 请求体字段说明
- `id` (string, 可选): 节点ID，不传则自动生成
- `name` (string, 必需): 节点名称
- `type` (string, 可选): 节点类型，默认"menu"
- `path` (string, 可选): 路径信息
- `icon` (string, 可选): 图标信息
- `showType` (number, 可选): 显示类型，默认1
- `weight` (number, 可选): 排序权重，默认0
- `content` (string, 可选): 内容详情
- `description` (string, 可选): 描述信息（会转换为content）
- `permissionListJson` (array, 可选): 权限列表
- `subList` (array, 可选): 子节点列表

#### 请求示例
```bash
POST /api/v1/tree?parentId=1
Content-Type: application/json

{
  "name": "1.6 新功能介绍",
  "type": "button",
  "content": "这是新功能的详细介绍..."
}
```

#### 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "obj": {
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 1,
    "totalPages": 1,
    "records": [
      {
        "id": "175497884942325",
        "parentId": "1",
        "name": "1.6 新功能介绍",
        "type": "button",
        "path": "",
        "icon": "",
        "showType": 1,
        "weight": 6,
        "createUserId": 0,
        "createTime": 1754978849423,
        "updateUserId": 0,
        "updateTime": 1754978849423,
        "permissionListJson": [],
        "subList": [],
        "content": "这是新功能的详细介绍..."
      }
    ],
    "extMap": {
      // ... 扩展信息
    }
  }
}
```

#### 错误响应
- 父节点不存在:
```json
{
  "message": "父节点ID 999 不存在"
}
```

- 参数验证失败:
```json
{
  "message": "name（目录名称）不能为空且必须是字符串"
}
```

---

### 4. 更新节点

#### 接口信息
- **URL**: `PUT /api/v1/tree/:id`
- **描述**: 更新指定节点的信息
- **权限**: 需要更新权限

#### 请求参数
- **路径参数**:
  - `id` (string, 必需): 要更新的节点ID

- **请求体** (JSON):
```json
{
  "name": "更新后的节点名称",
  "type": "button",
  "content": "更新后的内容",
  "showType": 1,
  "weight": 5,
  "parentId": "2"
}
```

#### 请求体字段说明
支持部分更新，传入需要更新的字段即可：
- `name` (string): 节点名称
- `type` (string): 节点类型
- `path` (string): 路径信息
- `icon` (string): 图标信息
- `showType` (number): 显示类型
- `weight` (number): 排序权重
- `content` (string): 内容详情
- `description` (string): 描述信息（会转换为content）
- `parentId` (string/number): 父节点ID（移动节点）
- `permissionListJson` (array): 权限列表

#### 请求示例
```bash
PUT /api/v1/tree/1.1
Content-Type: application/json

{
  "name": "1.1 功能概览（已更新）",
  "content": "更新后的功能概览内容..."
}
```

#### 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "obj": {
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 1,
    "totalPages": 1,
    "records": [
      {
        "id": "1.1",
        "parentId": "1",
        "name": "1.1 功能概览（已更新）",
        "type": "button",
        "path": "",
        "icon": "",
        "showType": 1,
        "weight": 1,
        "createUserId": 0,
        "createTime": 1700000000000,
        "updateUserId": 0,
        "updateTime": 1754901614087,
        "permissionListJson": [],
        "subList": [],
        "content": "更新后的功能概览内容..."
      }
    ],
    "extMap": {
      // ... 扩展信息
    }
  }
}
```

#### 特殊功能

**节点移动**：
通过更新 `parentId` 可以移动节点到其他父节点下：
```json
{
  "parentId": "2"
}
```

**节点ID修改**：
```json
{
  "id": "new-node-id"
}
```
注意：修改节点ID会级联更新所有子节点的parentId。

**权重自动排序**：
系统会自动处理权重冲突，确保同级节点权重从1开始连续递增。

#### 错误响应
- 节点不存在:
```json
{
  "message": "节点ID 999 不存在"
}
```

- 移动到自己的子节点:
```json
{
  "message": "不可将父节点设置为自己的子孙节点"
}
```

- 参数验证失败:
```json
{
  "message": "weight（排序/权重）必须是大于等于0的整数"
}
```

---

### 5. 删除节点

#### 接口信息
- **URL**: `DELETE /api/v1/tree/:id`
- **描述**: 删除指定节点及其所有子节点
- **权限**: 需要删除权限

#### 请求参数
- **路径参数**:
  - `id` (string, 必需): 要删除的节点ID

#### 请求示例
```bash
DELETE /api/v1/tree/1.1
```

#### 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "obj": {
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 1,
    "totalPages": 1,
    "records": [
      {
        "success": true,
        "message": "节点ID 1.1 已删除"
      }
    ],
    "extMap": {
      // ... 扩展信息
    }
  }
}
```

#### 错误响应
- 节点不存在:
```json
{
  "code": 404,
  "msg": "节点不存在",
  "obj": {
    "message": "节点ID 999 不存在"
  }
}
```

- 删除超时:
```json
{
  "code": 408,
  "msg": "请求超时",
  "obj": {
    "message": "删除操作超时，请稍后重试"
  }
}
```

- 服务器错误:
```json
{
  "code": 500,
  "msg": "删除失败",
  "obj": {
    "message": "删除节点失败的具体原因"
  }
}
```

#### 特殊说明
- 删除操作会递归删除所有子节点
- 删除操作设有60秒超时限制
- 删除大量内容时可能需要较长时间
- 删除操作不可逆，请谨慎操作

---

## 数据验证规则

### 节点数据验证

#### validateTreeNode 中间件
应用于 POST 和 PUT 请求，验证规则如下：

1. **name（节点名称）**
   - 类型：string
   - 必需：POST时必需，PUT时可选
   - 验证：非空字符串
   - 兼容：支持label字段，会自动转换为name

2. **id（节点ID）**
   - 类型：string | number
   - 必需：可选
   - 验证：有效的字符串或数字

3. **parentId（父节点ID）**
   - 类型：string | number
   - 必需：可选
   - 验证：有效的字符串或数字

4. **type（节点类型）**
   - 类型：string
   - 必需：可选
   - 验证：非空字符串
   - 默认值：'menu'

5. **path（路径）**
   - 类型：string
   - 必需：可选
   - 验证：字符串类型

6. **icon（图标）**
   - 类型：string
   - 必需：可选
   - 验证：字符串类型

7. **showType（显示类型）**
   - 类型：number
   - 必需：可选
   - 验证：整数
   - 取值：0=隐藏，1=显示，9=仅超管显示

8. **weight（权重）**
   - 类型：number
   - 必需：可选
   - 验证：大于等于0的整数

9. **permissionListJson（权限列表）**
   - 类型：array
   - 必需：可选
   - 验证：字符串数组

10. **subList（子节点列表）**
    - 类型：array
    - 必需：可选
    - 验证：数组类型

---

## 错误处理

### HTTP 状态码

- **200**: 请求成功
- **201**: 创建成功
- **400**: 请求参数错误
- **404**: 资源不存在
- **408**: 请求超时
- **500**: 服务器内部错误

### 统一错误响应格式

#### 成功响应（2xx）
```json
{
  "code": 200,
  "msg": "操作成功",
  "obj": {
    // 具体数据
  }
}
```

#### 错误响应（4xx/5xx）
```json
{
  "message": "具体错误信息"
}
```

或者

```json
{
  "code": 404,
  "msg": "资源不存在",
  "obj": {
    "message": "具体错误信息"
  }
}
```

### 常见错误类型

1. **参数验证错误**
   - 状态码：400
   - 错误信息：具体的验证失败原因

2. **资源不存在**
   - 状态码：404
   - 错误信息：节点ID xxx 不存在

3. **业务逻辑错误**
   - 状态码：400/500
   - 错误信息：不可将父节点设置为自己的子孙节点

4. **系统错误**
   - 状态码：500
   - 错误信息：服务器内部错误

---

## 系统特性

### 1. 数据存储
- 使用JSON文件存储数据
- 支持数据备份和恢复
- 文件位置：`server/data/treeData.json`

### 2. 权重排序系统
- 自动处理权重冲突
- 同级节点权重从1开始连续递增
- 支持手动指定权重进行排序

### 3. 级联操作
- 删除节点时级联删除所有子节点
- 修改节点ID时级联更新子节点的parentId
- 移动节点时自动更新层级关系

### 4. 数据格式化
- 统一的响应格式
- 扩展信息映射（extMap）
- 分页信息（虽然当前未实现真正分页）

### 5. 日志记录
- 请求日志记录
- 错误日志记录
- 日志文件位置：`server/logs/`

### 6. 安全特性
- CORS跨域支持
- 参数验证中间件
- 请求大小限制（10MB）

---

## 使用示例

### 1. 创建帮助文档结构

```javascript
// 1. 创建一级目录
const response1 = await fetch('/api/v1/tree', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '用户指南',
    type: 'menu',
    weight: 1
  })
});

// 2. 在一级目录下创建二级页面
const parentId = response1.data.obj.records[0].id;
const response2 = await fetch(`/api/v1/tree?parentId=${parentId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '快速入门',
    type: 'button',
    content: '# 快速入门\n\n这里是快速入门的内容...'
  })
});
```

### 2. 更新内容

```javascript
// 更新节点内容
await fetch('/api/v1/tree/1.1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '# 更新后的内容\n\n这是更新后的帮助内容...'
  })
});
```

### 3. 移动节点

```javascript
// 将节点移动到其他父节点下
await fetch('/api/v1/tree/1.1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    parentId: '2'
  })
});
```

### 4. 删除节点

```javascript
// 删除节点及其所有子节点
await fetch('/api/v1/tree/1.1', {
  method: 'DELETE'
});
```

---

## 开发注意事项

### 1. ID生成规则
- 自动生成的ID基于时间戳和父节点ID
- 手动指定ID时需确保唯一性

### 2. 权重处理
- 权重值会自动标准化，确保连续性
- 插入节点时系统会自动处理权重冲突

### 3. 内容字段兼容性
- `description` 字段会自动转换为 `content`
- 支持Markdown格式内容

### 4. 性能考虑
- 大数据量时删除操作可能较慢
- 建议定期备份数据文件

### 5. 并发安全
- 当前版本基于文件系统，不支持高并发
- 生产环境建议考虑数据库存储

---

## 版本信息

- **当前版本**: 1.0.0
- **最后更新**: 2025年1月
- **兼容性**: Node.js 14+
- **依赖框架**: Express 4.x

---

## 联系支持

如有问题或建议，请联系技术支持团队。 