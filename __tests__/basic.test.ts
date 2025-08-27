describe('Basic Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should mock fetch', () => {
    expect(typeof global.fetch).toBe('function');
  });

  it('should have jest environment set up', () => {
    expect(jest).toBeDefined();
  });
});