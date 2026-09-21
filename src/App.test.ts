import { describe, expect, it } from "vitest";
import { mount, unmount } from "svelte";
import App from "./components/App.svelte";

describe("App", () => {
  it("renders a submit button", () => {
    const component = mount(App, { target: document.body });
    expect(document.body.querySelector("button[type='submit']")).not.toBeNull();
    unmount(component);
  });
});
