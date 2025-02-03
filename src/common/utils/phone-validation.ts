// 手机号码验证规则
export const PHONE_RULES = {
  // 中国大陆手机号码规则：1开头的11位数字
  CN: {
    pattern: /^1[3-9]\d{9}$/,
    length: 11,
    example: '13812345678',
    countryCode: '+86',
  },
  // 科特迪瓦手机号码规则：
  // Moov: 01开头 + 8位数字
  // MTN: 05开头 + 8位数字
  // Orange: 07开头 + 8位数字
  CI: {
    pattern: /^(0[157])\d{8}$/,
    length: 10,
    example: '0585732160',
    countryCode: '+225',
    operators: {
      moov: /^01\d{8}$/,
      mtn: /^05\d{8}$/,
      orange: /^07\d{8}$/,
    },
  },
};

export type CountryCode = keyof typeof PHONE_RULES;

// 验证手机号码
export const validatePhone = (phone: string, country: CountryCode = 'CN'): boolean => {
  const rule = PHONE_RULES[country];
  if (!rule) {
    return false;
  }
  return rule.pattern.test(phone);
};

// 获取运营商信息（仅科特迪瓦可用）
export const getOperator = (phone: string): string | null => {
  if (!validatePhone(phone, 'CI')) {
    return null;
  }

  const { operators } = PHONE_RULES.CI;
  if (operators.moov.test(phone)) return 'Moov';
  if (operators.mtn.test(phone)) return 'MTN';
  if (operators.orange.test(phone)) return 'Orange';
  return null;
};

// 格式化手机号码（添加空格使其更易读）
export const formatPhone = (phone: string, country: CountryCode = 'CN'): string => {
  if (!validatePhone(phone, country)) {
    return phone;
  }

  switch (country) {
    case 'CN':
      // 3-3-4格式：138 123 4567
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    case 'CI':
      // 2-4-4格式：01 2345 6789
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
    default:
      return phone;
  }
};

// 获取手机号码示例
export const getPhoneExample = (country: CountryCode = 'CN'): string => {
  return PHONE_RULES[country]?.example || '';
};

// 获取国家区号
export const getCountryCode = (country: CountryCode = 'CN'): string => {
  return PHONE_RULES[country]?.countryCode || '';
};

// 获取手机号码长度要求
export const getPhoneLength = (country: CountryCode = 'CN'): number => {
  return PHONE_RULES[country]?.length || 0;
};

// 获取所有支持的国家列表
export const getSupportedCountries = (): Array<{ code: CountryCode; countryCode: string }> => {
  return Object.entries(PHONE_RULES).map(([code, rule]) => ({
    code: code as CountryCode,
    countryCode: rule.countryCode,
  }));
}; 