export const CONFIG_ITEM_TYPES = [
  { 'key': 'boolean', 'value': 'Boolean' },
  { 'key': 'string', 'value': 'String' },
  { 'key': 'integer', 'value': 'Integer' },
  { 'key': 'password', 'value': 'Password' },
  { 'key': 'IPv4', 'value': 'IPv4' },
  { 'key': 'IPv6', 'value': 'IPv6' },
  { 'key': 'X509 certificate', 'value': 'X509 certificate' },
  { 'key': 'enumeration', 'value': 'ENUMERATION' },
  { 'key': 'url', 'value': 'URL' },
  { 'key': 'JSON', 'value': 'JSON' }];

export default class ConfigTypeValidation {
  public static getValueType(configType) {
    let valueType: string;
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
      case 'ENUMERATION':
        valueType = 'ENUMERATION';
        break;
      case 'URL':
        valueType = 'URL';
        break;
      default:
        break;
    }
    return valueType;
  }
}
