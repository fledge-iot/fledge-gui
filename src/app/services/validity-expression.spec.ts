import { buildValidityContext, isValidityExpressionSatisfied } from './validity-expression';

describe('validity expression', () => {
  const corpus: { expression: string; values: Record<string, string>; expected: boolean }[] = [
    { expression: 'protocol == "TCP"', values: { protocol: 'TCP' }, expected: true },
    { expression: 'protocol == "TCP"', values: { protocol: 'RTU' }, expected: false },
    { expression: 'protocol == "RTU"', values: { protocol: 'RTU' }, expected: true },
    { expression: 'protocol == "RTU"', values: { protocol: 'TCP' }, expected: false },
    { expression: 'enableHttp=="false"', values: { enableHttp: 'false' }, expected: true },
    { expression: 'enableHttp=="false"', values: { enableHttp: 'true' }, expected: false },
    { expression: 'enableTLS == "true"', values: { enableTLS: 'true' }, expected: true },
    { expression: 'enableTLS == "true"', values: { enableTLS: 'false' }, expected: false },
    { expression: ' dcfEnabled == "true" ', values: { dcfEnabled: 'true' }, expected: true },
    { expression: 'user != ""', values: { user: '' }, expected: false },
    { expression: 'user != ""', values: { user: 'admin' }, expected: true },
    { expression: 'outputFormat != "JSON"', values: { outputFormat: 'JSON' }, expected: false },
    { expression: 'outputFormat != "JSON"', values: { outputFormat: 'CSV' }, expected: true },
    { expression: 'securityMode == "Sign" || securityMode == "SignAndEncrypt"', values: { securityMode: 'SignAndEncrypt' }, expected: true },
    { expression: 'securityMode == "Sign" || securityMode == "SignAndEncrypt"', values: { securityMode: 'None' }, expected: false },
    { expression: 'security_mode != "None" && security_policy != "None"', values: { security_mode: 'Sign', security_policy: 'None' }, expected: false },
    { expression: 'security_mode != "None" && security_policy != "None"', values: { security_mode: 'Sign', security_policy: 'Basic256' }, expected: true },
    { expression: 'PIServerEndpoint == "PI Web API" && PIWebAPIAuthenticationMethod == "basic"', values: { PIServerEndpoint: 'PI Web API', PIWebAPIAuthenticationMethod: 'basic' }, expected: true },
    { expression: 'PIServerEndpoint == "PI Web API" && PIWebAPIAuthenticationMethod == "basic"', values: { PIServerEndpoint: 'PI Web API', PIWebAPIAuthenticationMethod: 'kerberos' }, expected: false },
    { expression: 'PIServerEndpoint != "Edge Data Store" && PIServerEndpoint != "OSIsoft Cloud Services" && PIServerEndpoint != "AVEVA Data Hub"', values: { PIServerEndpoint: 'PI Web API' }, expected: true },
    { expression: 'PIServerEndpoint != "Edge Data Store" && PIServerEndpoint != "OSIsoft Cloud Services" && PIServerEndpoint != "AVEVA Data Hub"', values: { PIServerEndpoint: 'AVEVA Data Hub' }, expected: false },
    { expression: 'PIServerEndpoint == "OSIsoft Cloud Services" || PIServerEndpoint == "AVEVA Data Hub"', values: { PIServerEndpoint: 'AVEVA Data Hub' }, expected: true },
    { expression: 'PIServerEndpoint == "Connector Relay"', values: { PIServerEndpoint: 'PI Web API' }, expected: false },
    { expression: 'KafkaSecurityProtocol == "SSL" || KafkaSecurityProtocol == "SASL_SSL"', values: { KafkaSecurityProtocol: 'SASL_SSL' }, expected: true },
    { expression: 'KafkaSecurityProtocol == "SSL" || KafkaSecurityProtocol == "SASL_SSL"', values: { KafkaSecurityProtocol: 'PLAINTEXT' }, expected: false },
    { expression: 'serviceBuffering == "Limited"', values: { serviceBuffering: 'Limited' }, expected: true },
    { expression: 'columnMethod == "explicit" && variableCols == "false"', values: { columnMethod: 'explicit', variableCols: 'false' }, expected: true },
    { expression: 'columnMethod == "explicit" && variableCols == "false"', values: { columnMethod: 'explicit', variableCols: 'true' }, expected: false },
    { expression: 'headerMethod == "skip_rows" || headerMethod == "pass_in_datapoint"', values: { headerMethod: 'none' }, expected: false },
    { expression: 'user_authentication_mode == "Username And Password"', values: { user_authentication_mode: 'Username And Password' }, expected: true },
    { expression: 'evaluation_data != "Single Item"', values: { evaluation_data: 'Single Item' }, expected: false },
  ];

  corpus.forEach(({ expression, values, expected }) => {
    it(`${expression} with ${JSON.stringify(values)} is ${expected}`, () => {
      expect(isValidityExpressionSatisfied(expression, values)).toBe(expected);
    });
  });

  it('keeps the control enabled when the expression does not evaluate to a boolean', () => {
    expect(isValidityExpressionSatisfied('protocol', { protocol: 'TCP' })).toBe(true);
  });

  it('keeps the control enabled when the expression fails to parse', () => {
    expect(isValidityExpressionSatisfied('protocol ==', { protocol: 'TCP' })).toBe(true);
  });

  it('keeps the control enabled when the expression names a key outside the configuration', () => {
    expect(isValidityExpressionSatisfied('missing == "x"', { protocol: 'TCP' })).toBe(true);
  });

  it('keeps the control enabled when the expression names an inherited object property', () => {
    expect(isValidityExpressionSatisfied('constructor == "x"', { protocol: 'TCP' })).toBe(true);
  });

  it('builds a context of string values keyed by config item', () => {
    expect(buildValidityContext({ a: { value: 'x' }, b: { value: undefined } })).toEqual({ a: 'x', b: 'undefined' });
  });

  describe('hostile config values', () => {
    const globals = window as unknown as Record<string, unknown>;

    beforeEach(() => {
      globals['injected'] = 0;
      globals['alert'] = () => { globals['injected'] = 1; };
    });

    it('does not execute a value that closes the string literal', () => {
      const context = buildValidityContext({ protocol: { value: '" || alert(1) || "' } });
      expect(isValidityExpressionSatisfied('protocol == "TCP"', context)).toBe(false);
      expect(globals['injected']).toBe(0);
    });

    it('does not execute a value shaped like a constructor escape', () => {
      const context = buildValidityContext({ protocol: { value: 'constructor.constructor("alert(1)")()' } });
      expect(isValidityExpressionSatisfied('protocol == "TCP"', context)).toBe(false);
      expect(globals['injected']).toBe(0);
    });

    it('does not reach the Function constructor from an expression', () => {
      isValidityExpressionSatisfied('protocol.constructor.constructor("alert(1)")()', { protocol: 'TCP' });
      expect(globals['injected']).toBe(0);
    });
  });
});
