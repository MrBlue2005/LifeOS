import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuthForm } from "./auth-form";

describe("AuthForm return paths", () => {
  it("preserves a safe intake path when switching from sign in to sign up", () => {
    const nextPath = "/buy-later/import?url=https%3A%2F%2Fexample.com%2Fproduct";
    const html = renderToStaticMarkup(
      <AuthForm mode="sign-in" nextPath={nextPath} />,
    );

    expect(html).toContain(`name="next" value="${nextPath}"`);
    expect(html).toContain(
      `href="/auth/sign-up?next=${encodeURIComponent(nextPath)}"`,
    );
  });

  it("preserves a safe Find It path when switching from sign up to sign in", () => {
    const nextPath = "/find-it/items/abc";
    const html = renderToStaticMarkup(
      <AuthForm mode="sign-up" nextPath={nextPath} />,
    );

    expect(html).toContain(
      `href="/auth/sign-in?next=${encodeURIComponent(nextPath)}"`,
    );
  });

  it("keeps direct auth navigation free of a return-path parameter", () => {
    const html = renderToStaticMarkup(<AuthForm mode="sign-in" />);

    expect(html).toContain('href="/auth/sign-up"');
    expect(html).not.toContain("?next=");
  });
});
