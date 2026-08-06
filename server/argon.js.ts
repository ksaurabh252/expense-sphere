const argon2 = require("argon2");

(async () => {
  const hash = await argon2.hash("password123");
  console.log(hash);

  const ok = await argon2.verify(hash, "password123");
  console.log(ok);
})();
