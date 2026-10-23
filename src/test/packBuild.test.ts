import { describe, expect, it } from "vitest";
import { centerOf, featureToPlace, originalId } from "../lib/packBuild";

const line = (feature: object) => `\u001e${JSON.stringify(feature)}`;

describe("featureToPlace", () => {
  it("turns a point into a place, keeping only the tags the app reads", () => {
    const place = featureToPlace(
      line({
        id: "n367141203",
        geometry: { type: "Point", coordinates: [-77.0217, 38.9103] },
        properties: {
          name: "Bread for the City",
          social_facility: "food_bank",
          opening_hours: "Mo-Th 09:00-17:00",
          "building:levels": "3", // not something the app uses
        },
      }),
    );
    expect(place).toEqual({
      type: "n",
      id: 367141203,
      lat: 38.9103,
      lon: -77.0217,
      tags: {
        name: "Bread for the City",
        social_facility: "food_bank",
        opening_hours: "Mo-Th 09:00-17:00",
      },
    });
  });

  it("puts a building's pin in the middle of its outline", () => {
    const place = featureToPlace(
      line({
        id: "w66816884",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-77.0, 38.0],
              [-76.998, 38.0],
              [-76.998, 38.002],
              [-77.0, 38.002],
              [-77.0, 38.0],
            ],
          ],
        },
        properties: { amenity: "library", name: "Branch Library" },
      }),
    );
    expect(place?.type).toBe("w");
    expect(place?.lat).toBeCloseTo(38.001, 5);
    expect(place?.lon).toBeCloseTo(-76.999, 5);
  });

  it("handles big buildings made of several pieces (multipolygons)", () => {
    const geometry = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [-77, 38],
            [-76.99, 38],
            [-76.99, 38.01],
            [-77, 38],
          ],
        ],
      ],
    };
    expect(centerOf(geometry)?.lon).toBeCloseTo(-76.995, 5);
  });

  it("skips things the app doesn't show, using the app's own rules", () => {
    const point = { type: "Point", coordinates: [-77, 38.9] };
    // A bus-stop roof (not a place to sleep) and a private toilet.
    expect(
      featureToPlace(line({ id: "n1", geometry: point, properties: { amenity: "shelter" } })),
    ).toBeNull();
    expect(
      featureToPlace(
        line({ id: "n2", geometry: point, properties: { amenity: "toilets", access: "private" } }),
      ),
    ).toBeNull();
    // A cafe that isn't marked as having free internet.
    expect(
      featureToPlace(line({ id: "n3", geometry: point, properties: { amenity: "cafe" } })),
    ).toBeNull();
  });

  it("skips lines and empty lines", () => {
    const properties = { amenity: "drinking_water" };
    expect(
      featureToPlace(
        line({
          id: "w5",
          geometry: {
            type: "LineString",
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          properties,
        }),
      ),
    ).toBeNull();
    expect(featureToPlace("")).toBeNull();
    expect(featureToPlace("\u001e\n")).toBeNull();
  });

  it("finds the same free-food and shelter places the app would", () => {
    const point = { type: "Point", coordinates: [-77, 38.9] };
    const category = (properties: Record<string, string>) =>
      featureToPlace(line({ id: "n9", geometry: point, properties }))?.tags;
    expect(category({ social_facility: "soup_kitchen", name: "Meals" })).toBeDefined();
    expect(
      category({ social_facility: "shelter", "social_facility:for": "homeless;women" }),
    ).toBeDefined();
    expect(category({ amenity: "drinking_water" })).toEqual({ amenity: "drinking_water" });
  });
});

describe("buildings come out of osmium as areas", () => {
  it("turns an area id back into the way or relation it came from", () => {
    expect(originalId("a", 96081758)).toEqual({ type: "w", id: 48040879 }); // even: a way
    expect(originalId("a", 96081759)).toEqual({ type: "r", id: 48040879 }); // odd: a relation
    expect(originalId("n", 5)).toEqual({ type: "n", id: 5 });
  });

  it("keeps a library building mapped as an area", () => {
    const place = featureToPlace(
      line({
        id: "a96083002",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-77.0, 38.9],
              [-76.99, 38.9],
              [-76.99, 38.91],
              [-77.0, 38.9],
            ],
          ],
        },
        properties: { amenity: "library", name: "Main Library" },
      }),
    );
    expect(place).toMatchObject({ type: "w", id: 48041501, tags: { name: "Main Library" } });
  });
});
