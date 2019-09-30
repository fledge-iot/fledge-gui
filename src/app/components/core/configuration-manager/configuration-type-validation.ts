export default class ConfigTypeValidation {
  public static getValueType(configType) {
    let valueType: string;
    switch (configType.toUpperCase()) {
      case 'IPV4':
      case 'IPV6':
      case 'STRING':
        valueType = 'TEXT';
        break;
      case 'CODE':
        valueType = 'RAW_TEXT';
        break;
      case 'PASSWORD':
        valueType = 'PASSWORD';
        break;
      case 'INTEGER':
        valueType = 'INTEGER';
        break;
      case 'FLOAT':
        valueType = 'FLOAT';
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
      case 'SCRIPT':
        valueType = 'SCRIPT';
        break;
      default:
        break;
    }
    return valueType;
  }
}
