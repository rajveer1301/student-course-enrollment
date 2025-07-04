/* eslint-disable @typescript-eslint/no-var-requires */
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 25);
const randomstring = require('randomstring');

export class IdGenerator {
  static generateUniqueId(): string {
    return nanoid();
  }
  static generateRandomKey(length = 6, charset = 'numeric') {
    return randomstring.generate({
      length: length,
      charset: charset,
    });
  }
}
