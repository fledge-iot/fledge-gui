export const CONFIG_ITEM_TYPES = ['boolean', 'integer', 'string', 'IPv4', 'IPv6', 'X509 certificate', 'password', 'JSON'];

export default class ConfigTypeValidation {
  public static getValueType(configType) {
    let valueType;
    switch (configType.toUpperCase()) {
      case 'IPV4':
      case 'IPV6':
      case 'STRING':
      case 'PASSWORD':
        valueType = 'TEXT';
        break;
      case 'INTEGER':
        valueType = 'NUMBER';
        break;
      case 'BOOLEAN':
        valueType = 'BOOLEAN';
        break;
      case 'JSON':
      case 'X509 CERTIFICATE':
        valueType = 'LONG_TEXT';
        break;
      default:
        break;
    }
    return valueType;
  }

  public static isValidJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
