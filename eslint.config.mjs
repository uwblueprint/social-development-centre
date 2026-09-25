import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Guardrails for humans and AI agents; the why behind each rule lives in AGENTS.md.
const rawColor = {
  selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b|rgba?\\(|hsla?\\(/]",
  message: "Use a color token from src/components/ui/tokens.ts instead of a raw color.",
};

const nativeControl = (tag, instead) => ({
  selector: `JSXOpeningElement[name.name='${tag}']`,
  message: `Use ${instead} from @/components/ui instead of a native <${tag}>.`,
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-noninteractive-tabindex": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/tokens.ts"],
    rules: {
      "no-restricted-syntax": ["error", rawColor],
    },
  },
  {
    files: ["src/app/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "radix-ui", message: "Import from @/components/ui; primitives stay inside the kit." },
            { name: "cmdk", message: "Use Select from @/components/ui." },
            { name: "react-day-picker", message: "Use DatePicker from @/components/ui." },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        rawColor,
        nativeControl("button", "Button"),
        nativeControl("input", "Input or a form control"),
        nativeControl("select", "Select"),
        nativeControl("textarea", "Textarea"),
      ],
    },
  },
  {
    files: ["src/components/ui/tokens.ts"],
    rules: { "@typescript-eslint/no-unused-expressions": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
