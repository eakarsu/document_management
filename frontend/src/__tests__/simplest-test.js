// SIMPLEST MERGE TEST

test('Text replacement works', () => {
  const before = "Hello sdlgsdfgsdfgsdfgsdf world";
  const after = before.replace("sdlgsdfgsdfgsdfgsdf", "beautiful");
  
  expect(after).toBe("Hello beautiful world");
});