const fs = require('fs-extra');
const path = require('path');
const { DATA_DIR } = require('../config');

// 确保数据目录存在
const dataDirPath = path.resolve(__dirname, DATA_DIR);
fs.ensureDirSync(dataDirPath);

/**
 * 读取JSON文件
 * @param {string} filename 文件名
 * @returns {Promise<any>} 文件内容
 */
const readJsonFile = async (filename) => {
  const filePath = path.join(dataDirPath, filename);
  try {
    if (!await fs.exists(filePath)) {
      // 如果文件不存在，返回空结构
      const emptyData = filename === 'treeData.json' ? [] : {};
      await writeJsonFile(filename, emptyData);
      return emptyData;
    }
    return await fs.readJson(filePath);
  } catch (error) {
    throw new Error(`读取数据失败: ${error.message}`);
  }
};

/**
 * 写入JSON文件
 * @param {string} filename 文件名
 * @param {any} data 要写入的数据
 * @returns {Promise<void>}
 */
const writeJsonFile = async (filename, data) => {
  const filePath = path.join(dataDirPath, filename);
  try {
    await fs.writeJson(filePath, data, { spaces: 2 });
  } catch (error) {
    throw new Error(`保存数据失败: ${error.message}`);
  }
};

module.exports = {
  readJsonFile,
  writeJsonFile,
  dataDirPath
};
