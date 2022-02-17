export class LocalStorage {
  static localStorageTestKey = 'iqb-tc-t';

  static setTestId(testId: string): void {
    localStorage.setItem(LocalStorage.localStorageTestKey, testId);
  }

  static removeTestId(): void {
    localStorage.removeItem(LocalStorage.localStorageTestKey);
  }

  static getTestId(): string {
    return localStorage.getItem(LocalStorage.localStorageTestKey);
  }
}
