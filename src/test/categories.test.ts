import { describe, expect, it } from "vitest";
import { buildAddress, categorize, freeStatus, wheelchairStatus } from "../lib/categories";

describe("categorize", () => {
  it.each([
    // [tags, expected category]
    [{ amenity: "social_facility", social_facility: "food_bank" }, "food"],
    [{ amenity: "social_facility", social_facility: "soup_kitchen" }, "food"],
    [{ amenity: "food_bank" }, "food"],
    [{ amenity: "food_sharing" }, "food"],
    [{ amenity: "social_facility", social_facility: "shelter" }, "shelter"],
    [{ amenity: "social_facility", "social_facility:for": "homeless" }, "shelter"],
    [{ amenity: "social_facility", "social_facility:for": "homeless;women" }, "shelter"],
    [{ amenity: "social_facility", "social_facility:for": "homeless_woman" }, "shelter"],
    [{ amenity: "shower" }, "shower"],
    [{ amenity: "drinking_water" }, "water"],
    [{ amenity: "toilets", fee: "no" }, "restroom"],
    [{ amenity: "clinic" }, "health"],
    [{ healthcare: "clinic" }, "health"],
    [{ amenity: "pharmacy", healthcare: "pharmacy" }, "health"],
    [{ healthcare: "counselling", fee: "no" }, "health"],
    [{ amenity: "dentist", fee: "no" }, "health"],
    [{ amenity: "library" }, "internet"],
    [{ amenity: "community_centre" }, "internet"],
    [{ amenity: "cafe", internet_access: "wlan", "internet_access:fee": "no" }, "internet"],
  ] as const)("%o is %s", (tags, expected) => {
    expect(categorize(tags)).toBe(expected);
  });

  it("puts a food bank for homeless people in Food, not Shelter", () => {
    expect(categorize({ social_facility: "food_bank", "social_facility:for": "homeless" })).toBe(
      "food",
    );
  });

  it.each([
    // Weather shelters are not places to sleep.
    [{ amenity: "shelter", shelter_type: "public_transport" }],
    // Give boxes hold non-food items.
    [{ amenity: "give_box" }],
    // Private or closed to the public.
    [{ amenity: "toilets", access: "private" }],
    [{ amenity: "drinking_water", access: "no" }],
    // Paid health care without fee=no would flood a city with private offices.
    [{ healthcare: "dentist" }],
    [{ amenity: "doctors" }],
    // Wi-Fi that isn't free, or not marked free.
    [{ amenity: "cafe", internet_access: "wlan", "internet_access:fee": "customers" }],
    [{ amenity: "cafe", internet_access: "wlan" }],
    [{ amenity: "cafe", internet_access: "no", "internet_access:fee": "no" }],
    [{}],
  ])("%o is not shown", (tags) => {
    expect(categorize(tags)).toBeNull();
  });
});

describe("freeStatus", () => {
  it("trusts fee tags first", () => {
    expect(freeStatus({ amenity: "toilets", fee: "no" }, "restroom")).toBe("yes");
    expect(freeStatus({ amenity: "toilets", fee: "yes" }, "restroom")).toBe("no");
    expect(freeStatus({ amenity: "pharmacy", fee: "no" }, "health")).toBe("yes");
  });

  it("treats customers-only as not free", () => {
    expect(freeStatus({ amenity: "toilets", access: "customers" }, "restroom")).toBe("no");
  });

  it("knows food and drinking water are free", () => {
    expect(freeStatus({ social_facility: "food_bank" }, "food")).toBe("yes");
    expect(freeStatus({ amenity: "drinking_water" }, "water")).toBe("yes");
  });

  it("marks pharmacies as may cost money", () => {
    expect(freeStatus({ amenity: "pharmacy" }, "health")).toBe("no");
  });

  it("says unknown when the map doesn't say", () => {
    expect(freeStatus({ amenity: "toilets" }, "restroom")).toBe("unknown");
    expect(freeStatus({ amenity: "library" }, "internet")).toBe("unknown");
  });
});

describe("wheelchairStatus", () => {
  it("simplifies OSM values", () => {
    expect(wheelchairStatus({ wheelchair: "yes" })).toBe("yes");
    expect(wheelchairStatus({ wheelchair: "designated" })).toBe("yes");
    expect(wheelchairStatus({ wheelchair: "limited" })).toBe("limited");
    expect(wheelchairStatus({ wheelchair: "no" })).toBe("no");
    expect(wheelchairStatus({})).toBeUndefined();
  });
});

describe("buildAddress", () => {
  it("builds a full U.S. address", () => {
    expect(
      buildAddress({
        "addr:housenumber": "1525",
        "addr:street": "7th Street Northwest",
        "addr:city": "Washington",
        "addr:state": "DC",
        "addr:postcode": "20001",
      }),
    ).toBe("1525 7th Street Northwest, Washington, DC 20001");
  });

  it("works with only a street and number", () => {
    expect(buildAddress({ "addr:housenumber": "71", "addr:street": "O Street Northwest" })).toBe(
      "71 O Street Northwest",
    );
  });

  it("uses addr:full when there is one", () => {
    expect(buildAddress({ "addr:full": "Calle 5 #10-20", "addr:city": "Bogotá" })).toBe(
      "Calle 5 #10-20, Bogotá",
    );
  });

  it("returns nothing without a street", () => {
    expect(buildAddress({ "addr:city": "Washington", "addr:state": "DC" })).toBeUndefined();
    expect(buildAddress({})).toBeUndefined();
  });
});
