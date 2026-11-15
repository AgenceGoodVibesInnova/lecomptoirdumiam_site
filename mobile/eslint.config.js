const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // Les apostrophes françaises dans le texte affiché sont normales en React Native.
      "react/no-unescaped-entities": "off",
    },
  },
]);
