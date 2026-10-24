import { describe, expect, it } from "vitest";
import { helpText } from "../lib/helpText";

describe("helpText", () => {
  it("numbers the places and puts address and phone under each", () => {
    const text = helpText(
      "NearAid: free help near you",
      [
        {
          name: "Bread for the City",
          kind: "Food",
          status: "Open · Closes 5:00 PM",
          distance: "0.4 mi",
          address: "1525 7th Street Northwest, Washington, DC",
          phone: "+1-202-265-2400",
        },
        {
          name: "Drinking water",
          kind: "Water",
          status: "Hours unknown, call ahead",
          distance: "500 ft",
        },
      ],
      ["Local help: 211", "https://example.org/nearaid/"],
    );
    expect(text).toBe(
      [
        "NearAid: free help near you",
        "",
        "1. Bread for the City (Food) · Open · Closes 5:00 PM · 0.4 mi",
        "   1525 7th Street Northwest, Washington, DC",
        "   +1-202-265-2400",
        "2. Drinking water (Water) · Hours unknown, call ahead · 500 ft",
        "",
        "Local help: 211",
        "https://example.org/nearaid/",
      ].join("\n"),
    );
  });

  it("still works with no places", () => {
    expect(helpText("Title", [], ["Footer"])).toBe("Title\n\n\nFooter");
  });
});
