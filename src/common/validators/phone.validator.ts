import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { validatePhone } from '../utils/phone-validation';
import { Injectable, Logger } from '@nestjs/common';

@ValidatorConstraint({ name: 'phoneNumber', async: false })
@Injectable()
export class PhoneNumberValidator implements ValidatorConstraintInterface {
  private readonly logger = new Logger(PhoneNumberValidator.name);

  validate(phoneNumber: string, args: ValidationArguments) {
    this.logger.debug(`Validating phone number: ${phoneNumber}`);
    this.logger.debug(`Validation arguments: ${JSON.stringify(args)}`);
    this.logger.debug(`Object being validated: ${JSON.stringify(args.object)}`);

    // 从被验证的对象中直接获取 country
    const country = (args.object as any).country;
    this.logger.debug(`Country from object: ${country}`);

    const isValid = validatePhone(phoneNumber, country);
    this.logger.debug(`Validation result: ${isValid}`);
    return isValid;
  }

  defaultMessage(args: ValidationArguments) {
    const country = (args.object as any).country;
    return `手机号码格式不正确，请输入正确的${country === 'CN' ? '中国' : '科特迪瓦'}手机号码`;
  }
} 