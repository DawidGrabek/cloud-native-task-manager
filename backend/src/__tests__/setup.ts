
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'info').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

// Provide a dummy test so Jest doesn't complain about an empty test file
describe('Setup', () => {
  it('initializes test environment', () => {
    expect(true).toBe(true)
  })
})
